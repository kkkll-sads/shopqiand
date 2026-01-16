import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadImage } from '../../../../services/common';
import { getStoredToken } from '../../../../services/client';
import { extractData, extractError } from '../../../../utils/apiHelpers';

export type ImageUploadState = {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
};

type UseClaimUploadParams = {
  showToast: (type: string, title: string, message?: string) => void;
  images: string[];
  onImagesChange: (nextImages: string[] | ((prev: string[]) => string[])) => void;
  maxCount?: number;
};

/**
 * 处理确权凭证上传与预览状态
 */
export const useClaimUpload = ({
  showToast,
  images,
  onImagesChange,
  maxCount = 8,
}: UseClaimUploadParams) => {
  const [imageUploadStates, setImageUploadStates] = useState<ImageUploadState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanupPreviews = useCallback((states: ImageUploadState[]) => {
    states.forEach((state) => {
      if (state.preview && !state.url) {
        URL.revokeObjectURL(state.preview);
      }
    });
  }, []);

  useEffect(() => {
    return () => cleanupPreviews(imageUploadStates);
  }, [cleanupPreviews, imageUploadStates]);

  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const token = getStoredToken();
      if (!token) {
        showToast('error', '登录过期', '请重新登录');
        return;
      }

      const currentUploadedCount = images.length;
      const remainingSlots = maxCount - currentUploadedCount;
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

      const uploadPromises = newStates.map(async (state) => {
        try {
          const res = await uploadImage(state.file, token);
          const data = extractData(res);
          if (data?.url) {
            setImageUploadStates((prev) =>
              prev.map((s) =>
                s.file === state.file ? { ...s, uploading: false, uploaded: true, url: data.url } : s,
              ),
            );
            onImagesChange((prev) => [...prev, data.url]);
          } else {
            throw new Error(extractError(res, '上传失败'));
          }
        } catch (error: any) {
          console.error('图片上传失败:', error);
          setImageUploadStates((prev) =>
            prev.map((s) =>
              s.file === state.file ? { ...s, uploading: false, error: error.message || '上传失败' } : s,
            ),
          );
          const fileName = (state.file as File).name || '未知文件';
          showToast('error', '上传失败', `图片 ${fileName} 上传失败`);
        }
      });

      await Promise.all(uploadPromises);
    },
    [images.length, maxCount, onImagesChange, showToast],
  );

  const removeImage = useCallback(
    (idx: number) => {
      setImageUploadStates((prev) => {
        const target = prev[idx];
        if (target?.preview && !target.url) {
          URL.revokeObjectURL(target.preview);
        }
        return prev.filter((_, i) => i !== idx);
      });

      const targetUrl = imageUploadStates[idx]?.url;
      if (targetUrl) {
        onImagesChange((prev) => prev.filter((img) => img !== targetUrl));
      }
    },
    [imageUploadStates, onImagesChange],
  );

  const resetUploads = useCallback(() => {
    cleanupPreviews(imageUploadStates);
    setImageUploadStates([]);
    onImagesChange([]);
  }, [cleanupPreviews, imageUploadStates, onImagesChange]);

  const triggerSelect = useCallback(() => fileInputRef.current?.click(), []);

  return {
    fileInputRef,
    imageUploadStates,
    handleImageUpload,
    removeImage,
    triggerSelect,
    resetUploads,
  };
};

export default useClaimUpload;

