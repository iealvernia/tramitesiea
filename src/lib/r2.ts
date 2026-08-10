import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
 * Uploads a file to Cloudflare R2 using a presigned URL and XMLHttpRequest
 * to support progress tracking without encountering CORS ETag issues.
 * @param file The File object from the browser.
 * @param prefix Optional string prefix (e.g. 'anexo2' or 'signatures') to organize files.
 * @param onProgress Optional callback for upload progress (0 to 100).
 * @returns The public URL of the uploaded file.
 */
export const uploadFileToR2 = async (
  file: File, 
  prefix: string = 'uploads',
  onProgress?: (percentage: number) => void
): Promise<string> => {
  if (!import.meta.env.VITE_R2_BUCKET_NAME) {
    throw new Error('R2_BUCKET_NAME is not defined in environment variables.');
  }

  // Generate a unique filename using timestamp and a random string to prevent collisions
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const objectKey = `${prefix}/${timestamp}-${randomStr}-${cleanName}`;

  try {
    // 1. Create a presigned URL for the PUT operation
    const command = new PutObjectCommand({
      Bucket: import.meta.env.VITE_R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: file.type,
    });
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // 2. Upload the file using XMLHttpRequest to track progress
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress(percentage);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(true);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload to R2'));
      };

      xhr.open('PUT', presignedUrl, true);
      // We must explicitly set the content type to match the presigned URL
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

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
