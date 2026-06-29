/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_R2_ENDPOINT?: string;
  readonly VITE_R2_ACCESS_KEY_ID?: string;
  readonly VITE_R2_SECRET_ACCESS_KEY?: string;
  readonly VITE_R2_BUCKET_NAME?: string;
  readonly VITE_R2_PUBLIC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
