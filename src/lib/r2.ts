import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize the S3 client configured for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a file to Cloudflare R2.
 * @param file The File object from the browser.
 * @param prefix Optional string prefix (e.g. 'anexo2' or 'signatures') to organize files.
 * @returns The public URL of the uploaded file.
 */
export const uploadFileToR2 = async (file: File, prefix: string = 'uploads'): Promise<string> => {
  if (!import.meta.env.VITE_R2_BUCKET_NAME) {
    throw new Error('R2_BUCKET_NAME is not defined in environment variables.');
  }

  // Generate a unique filename using timestamp and a random string to prevent collisions
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const objectKey = `${prefix}/${timestamp}-${randomStr}-${cleanName}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: import.meta.env.VITE_R2_BUCKET_NAME,
      Key: objectKey,
      Body: uint8Array,
      ContentType: file.type,
      // Cloudflare R2 doesn't always support ACLs depending on bucket config, 
      // but usually public buckets rely on bucket policies rather than object ACLs.
    });

    await s3Client.send(command);

    const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL;
    if (!publicUrl) {
      throw new Error('VITE_R2_PUBLIC_URL is not defined.');
    }

    // Return the full public URL for the newly uploaded file
    return `${publicUrl.replace(/\/$/, '')}/${objectKey}`;
  } catch (error) {
    console.error('Error uploading file to R2:', error);
    throw error;
  }
};
