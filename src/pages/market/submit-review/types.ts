export interface UploadState {
  file?: File;
  preview?: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}
