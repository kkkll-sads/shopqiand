/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_REMOTE_LOG?: string;
  readonly VITE_REMOTE_LOG_ENDPOINT?: string;
  readonly VITE_REMOTE_LOG_LEVEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
