import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, RefObject } from 'react';
import type { ToastItem, ToastType } from '@/context/NotificationContext';
import { uploadImage, uploadVideo } from '@/services/common';
import { getStoredToken } from '@/services/client';
import { extractData, extractError } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';
import type { UploadState } from '../types';
import { MAX_IMAGE_COUNT, MAX_VIDEO_SIZE_MB } from '../constants';

export type ShowToast = (
  type: ToastType,
  title: string,
  description?: string,
  duration?: number,
  action?: ToastItem['action'],
) => void;

interface UseReviewUploadsParams {
  showToast: ShowToast;
}

interface UseReviewUploadsResult {
  imageUploadStates: UploadState[];
  videoUploadState: UploadState | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  videoInputRef: RefObject<HTMLInputElement | null>;
  handleImageSelect: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemoveImage: (index: number) => void;
  handleVideoSelect: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemoveVideo: () => void;
}

export function useReviewUploads({ showToast }: UseReviewUploadsParams): UseReviewUploadsResult {
  const [imageUploadStates, setImageUploadStates] = useState<UploadState[]>([]);
  const [videoUploadState, setVideoUploadState] = useState<UploadState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const token = getStoredToken();
      if (!token) {
        showToast('error', '登录过期', '请重新登录');
        return;
      }

      const uploadedCount = imageUploadStates.filter((state) => state.uploaded).length;
      const remainingSlots = MAX_IMAGE_COUNT - uploadedCount;

      if (remainingSlots <= 0) {
        showToast('warning', '数量限制', `最多只能上传${MAX_IMAGE_COUNT}张图片`);
        return;
      }

      const filesToAdd = Array.from(files).slice(0, remainingSlots) as File[];
      if (files.length > remainingSlots) {
        showToast('warning', '数量限制', `最多只能上传${MAX_IMAGE_COUNT}张图片`);
      }

      const newStates: UploadState[] = filesToAdd.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: true,
        uploaded: false,
      }));

      setImageUploadStates((prev) => [...prev, ...newStates]);

      await Promise.all(
        newStates.map(async (state) => {
          try {
            const response = await uploadImage(state.file!, token);
            const data = extractData(response);

            if (data?.url) {
              setImageUploadStates((prev) =>
                prev.map((item) =>
                  item.file === state.file
                    ? { ...item, uploading: false, uploaded: true, url: data.url }
                    : item,
                ),
              );
              return;
            }

            throw new Error(extractError(response, '上传失败'));
          } catch (error: any) {
            errorLog('SubmitReview', '图片上传失败', error);
            setImageUploadStates((prev) =>
              prev.map((item) =>
                item.file === state.file
                  ? { ...item, uploading: false, error: error?.message || '上传失败' }
                  : item,
              ),
            );
            showToast('error', '上传失败', state.file?.name || '图片上传失败');
          }
        }),
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [imageUploadStates, showToast],
  );

  const handleRemoveImage = useCallback((index: number) => {
    setImageUploadStates((prev) => {
      const target = prev[index];
      if (target?.preview && !target.url) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  }, []);

  const handleVideoSelect = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const token = getStoredToken();
      if (!token) {
        showToast('error', '登录过期', '请重新登录');
        return;
      }

      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        showToast('warning', '文件过大', `视频大小不能超过${MAX_VIDEO_SIZE_MB}MB`);
        return;
      }

      const newState: UploadState = {
        file,
        preview: URL.createObjectURL(file),
        uploading: true,
        uploaded: false,
      };

      setVideoUploadState(newState);

      try {
        const response = await uploadVideo(file, token);
        const data = extractData(response);

        if (data?.url) {
          setVideoUploadState((prev) =>
            prev ? { ...prev, uploading: false, uploaded: true, url: data.url } : null,
          );
        } else {
          throw new Error(extractError(response, '上传失败'));
        }
      } catch (error: any) {
        errorLog('SubmitReview', '视频上传失败', error);
        setVideoUploadState((prev) =>
          prev ? { ...prev, uploading: false, error: error?.message || '上传失败' } : null,
        );
        showToast('error', '上传失败', '视频上传失败');
      }

      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    },
    [showToast],
  );

  const handleRemoveVideo = useCallback(() => {
    setVideoUploadState((prev) => {
      if (prev?.preview && !prev.url) {
        URL.revokeObjectURL(prev.preview);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      imageUploadStates.forEach((state) => {
        if (state.preview && !state.url) {
          URL.revokeObjectURL(state.preview);
        }
      });
      if (videoUploadState?.preview && !videoUploadState.url) {
        URL.revokeObjectURL(videoUploadState.preview);
      }
    };
  }, [imageUploadStates, videoUploadState]);

  return {
    imageUploadStates,
    videoUploadState,
    fileInputRef,
    videoInputRef,
    handleImageSelect,
    handleRemoveImage,
    handleVideoSelect,
    handleRemoveVideo,
  };
}
