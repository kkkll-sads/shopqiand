import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadImage } from '../../../services/common';
import { getStoredToken } from '../../../services/client';

export type ImageUploadState = {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
};

type UseImageUploadsParams = {
  showToast: (type: string, title: string, message?: string) => void;
  onImagesChange: (next: string[] | ((prev: string[]) => string[])) => void;
  currentUrls?: string[];
  maxCount?: number;
};

/**
 * useImageUploads - 管理确权凭证上传（预览/上传/错误）
 */
export const useImageUploads = ({
  showToast,
  onImagesChange,
  currentUrls = [],
  maxCount = 8,
}: UseImageUploadsParams) => {
  const [imageUploadStates, setImageUploadStates] = useState<ImageUploadState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const revokePreview = useCallback((state?: ImageUploadState) => {
    if (state?.preview && !state.url) {
      URL.revokeObjectURL(state.preview);
    }
  }, []);

  useEffect(() => {
    return () => {
      imageUploadStates.forEach(revokePreview);
    };
  }, [imageUploadStates, revokePreview]);

  const handleUpload = useCallback(
    async (states: ImageUploadState[], token: string) => {
      const uploadPromises = states.map(async (state) => {
        try {
          const res = await uploadImage(state.file, token);
          if (res.code === 1 && res.data) {
            setImageUploadStates((prev) =>
              prev.map((s) =>
                s.file === state.file ? { ...s, uploading: false, uploaded: true, url: res.data.url } : s,
              ),
            );
            onImagesChange((prev) => [...prev, res.data.url]);
          } else {
            throw new Error(res.msg || '上传失败');
          }
        } catch (error: any) {
          console.error('图片上传失败:', error);
          setImageUploadStates((prev) =>
            prev.map((s) =>
              s.file === state.file ? { ...s, uploading: false, error: error?.message || '上传失败' } : s,
            ),
          );
          showToast('error', '上传失败', (state.file as File).name || '图片上传失败');
        }
      });

      await Promise.all(uploadPromises);
    },
    [onImagesChange, showToast],
  );

  const selectFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const token = getStoredToken();
      if (!token) {
        showToast('error', '登录过期', '请重新登录');
        return;
      }

      const uploadedCount = currentUrls.length;
      const remainingSlots = maxCount - uploadedCount;
      if (remainingSlots <= 0) {
        showToast('warning', '数量限制', `最多只能上传${maxCount}张凭证`);
        return;
      }

      const filesToAdd = Array.from(files).slice(0, remainingSlots);
      if (files.length > remainingSlots) {
        showToast('warning', '数量限制', `最多只能上传${maxCount}张凭证`);
      }

      const newStates: ImageUploadState[] = filesToAdd.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: true,
        uploaded: false,
      }));

      setImageUploadStates((prev) => [...prev, ...newStates]);
      await handleUpload(newStates, token);
    },
    [currentUrls.length, handleUpload, maxCount, showToast],
  );

  const removeImage = useCallback(
    (idx: number) => {
      setImageUploadStates((prev) => {
        const target = prev[idx];
        revokePreview(target);
        const next = prev.filter((_, i) => i !== idx);

        if (target?.url) {
          onImagesChange((prevUrls) => prevUrls.filter((url) => url !== target.url));
        }

        return next;
      });
    },
    [onImagesChange, revokePreview],
  );

  const resetUploads = useCallback(() => {
    imageUploadStates.forEach(revokePreview);
    setImageUploadStates([]);
    onImagesChange([]);
  }, [imageUploadStates, onImagesChange, revokePreview]);

  const triggerSelect = useCallback(() => fileInputRef.current?.click(), []);

  return {
    fileInputRef,
    imageUploadStates,
    selectFiles,
    removeImage,
    resetUploads,
    triggerSelect,
  };
};

export default useImageUploads;

