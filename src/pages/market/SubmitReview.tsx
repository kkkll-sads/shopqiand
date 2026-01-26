/**
 * SubmitReview - 提交商品评价页面
 * 
 * 用于用户对已完成的订单进行评价
 * 支持评分、文字评价、图片上传、匿名评价
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, X, Camera, Loader2, Video as VideoIcon } from 'lucide-react';
import { LoadingSpinner, LazyImage } from '@/components/common';
import { useNotification } from '@/context/NotificationContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useStateMachine } from '@/hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '@/types/states';
import { submitReview, SubmitReviewParams } from '@/services/shop';
import { uploadImage, uploadVideo } from '@/services/common';
import { getStoredToken } from '@/services/client';
import { isSuccess, extractData, extractError } from '@/utils/apiHelpers';
import { errorLog, warnLog } from '@/utils/logger';

interface ImageUploadState {
  file?: File;
  preview?: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

const SubmitReview: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast, showDialog } = useNotification();

  // 从 URL 参数获取订单和商品信息
  const orderId = searchParams.get('order_id');
  const productId = searchParams.get('product_id');
  const productName = searchParams.get('name') || '商品';
  const productImage = searchParams.get('image') || '';

  // 表单状态
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageUploadStates, setImageUploadStates] = useState<ImageUploadState[]>([]);
  const [videoUploadState, setVideoUploadState] = useState<ImageUploadState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const {
    errorMessage,
    hasError,
    handleError,
    clearError,
  } = useErrorHandler();

  const { handleError: handleSubmitError } = useErrorHandler({ showToast: true, persist: false });

  // 状态机
  const submitMachine = useStateMachine<FormState, FormEvent>({
    initial: FormState.IDLE,
    transitions: {
      [FormState.IDLE]: { [FormEvent.SUBMIT]: FormState.SUBMITTING },
      [FormState.VALIDATING]: {
        [FormEvent.VALIDATION_SUCCESS]: FormState.SUBMITTING,
        [FormEvent.VALIDATION_ERROR]: FormState.ERROR,
      },
      [FormState.SUBMITTING]: {
        [FormEvent.SUBMIT_SUCCESS]: FormState.SUCCESS,
        [FormEvent.SUBMIT_ERROR]: FormState.ERROR,
      },
      [FormState.SUCCESS]: {
        [FormEvent.RESET]: FormState.IDLE,
      },
      [FormState.ERROR]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
    },
  });

  const submitting = submitMachine.state === FormState.SUBMITTING;

  // 验证必填参数
  useEffect(() => {
    if (!orderId || !productId) {
      showToast('error', '参数错误', '缺少必要的订单或商品信息');
      setTimeout(() => navigate(-1), 1500);
    }
  }, [orderId, productId, navigate, showToast]);

  // 处理图片上传
  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const token = getStoredToken();
    if (!token) {
      showToast('error', '登录过期', '请重新登录');
      return;
    }

    const maxCount = 9;
    const uploadedCount = imageUploadStates.filter(s => s.uploaded).length;
    const remainingSlots = maxCount - uploadedCount;

    if (remainingSlots <= 0) {
      showToast('warning', '数量限制', `最多只能上传${maxCount}张图片`);
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots) as File[];
    if (files.length > remainingSlots) {
      showToast('warning', '数量限制', `最多只能上传${maxCount}张图片`);
    }

    const newStates: ImageUploadState[] = filesToAdd.map((file: File) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      uploaded: false,
    }));

    setImageUploadStates((prev) => [...prev, ...newStates]);

    // 并发上传
    await Promise.all(newStates.map(async (state) => {
      try {
        const res = await uploadImage(state.file!, token);
        const data = extractData(res);
        if (data?.url) {
          setImageUploadStates((prev) =>
            prev.map((s) =>
              s.file === state.file ? { ...s, uploading: false, uploaded: true, url: data.url } : s
            )
          );
        } else {
          throw new Error(extractError(res, '上传失败'));
        }
      } catch (error: any) {
        errorLog('SubmitReview', '图片上传失败', error);
        setImageUploadStates((prev) =>
          prev.map((s) =>
            s.file === state.file ? { ...s, uploading: false, error: error?.message || '上传失败' } : s
          )
        );
        showToast('error', '上传失败', state.file?.name || '图片上传失败');
      }
    }));

    // 清空input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imageUploadStates, showToast]);

  // 移除图片
  const handleRemoveImage = useCallback((index: number) => {
    setImageUploadStates((prev) => {
      const target = prev[index];
      if (target?.preview && !target.url) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // 处理视频上传
  const handleVideoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getStoredToken();
    if (!token) {
      showToast('error', '登录过期', '请重新登录');
      return;
    }

    // 检查文件大小 (例如 50MB)
    if (file.size > 50 * 1024 * 1024) {
      showToast('warning', '文件过大', '视频大小不能超过50MB');
      return;
    }

    const newState: ImageUploadState = {
      file,
      preview: URL.createObjectURL(file), // 创建预览URL
      uploading: true,
      uploaded: false,
    };

    setVideoUploadState(newState);

    try {
      const res = await uploadVideo(file, token);
      const data = extractData(res);
      if (data?.url) {
        setVideoUploadState(prev => prev ? { ...prev, uploading: false, uploaded: true, url: data.url } : null);
      } else {
        throw new Error(extractError(res, '上传失败'));
      }
    } catch (error: any) {
      errorLog('SubmitReview', '视频上传失败', error);
      setVideoUploadState(prev => prev ? { ...prev, uploading: false, error: error?.message || '上传失败' } : null);
      showToast('error', '上传失败', '视频上传失败');
    }

    // 清空input
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  }, [showToast]);

  // 移除视频
  const handleRemoveVideo = useCallback(() => {
    setVideoUploadState((prev) => {
      if (prev?.preview && !prev.url) {
        URL.revokeObjectURL(prev.preview);
      }
      return null;
    });
  }, []);

  // 清理预览 URL
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

  // 提交评价
  const handleSubmit = async () => {
    if (!orderId || !productId) {
      showToast('error', '参数错误', '缺少必要的订单或商品信息');
      return;
    }

    // 验证评分
    if (rating < 1 || rating > 5) {
      showToast('warning', '请选择评分', '请选择1-5星的评分');
      return;
    }

    // 验证内容
    if (!content.trim()) {
      showToast('warning', '请输入评价内容', '评价内容不能为空');
      return;
    }

    if (content.trim().length > 500) {
      showToast('warning', '内容过长', '评价内容不能超过500字');
      return;
    }

    // 检查是否有正在上传的图片
    const hasUploading = imageUploadStates.some(s => s.uploading) || videoUploadState?.uploading;
    if (hasUploading) {
      showToast('warning', '请稍候', '图片或视频正在上传中，请稍候再提交');
      return;
    }

    // 检查是否有上传失败的图片
    const hasFailed = imageUploadStates.some(s => s.error) || videoUploadState?.error;
    if (hasFailed) {
      showDialog({
        title: '上传失败',
        description: '部分文件上传失败，是否继续提交评价？',
        confirmText: '继续提交',
        cancelText: '取消',
        onConfirm: () => {
          doSubmit();
        },
      });
      return;
    }

    doSubmit();
  };

  const doSubmit = async () => {
    if (!orderId || !productId) return;

    try {
      submitMachine.send(FormEvent.SUBMIT);
      clearError();

      const uploadedImages = imageUploadStates
        .filter(s => s.uploaded && s.url)
        .map(s => s.url!);

      const params: SubmitReviewParams = {
        order_id: Number(orderId),
        product_id: Number(productId),
        rating,
        content: content.trim(),
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        video: videoUploadState?.uploaded && videoUploadState.url ? videoUploadState.url : undefined,
        is_anonymous: isAnonymous,
      };

      const response = await submitReview(params);

      if (isSuccess(response)) {
        submitMachine.send(FormEvent.SUBMIT_SUCCESS);
        showToast('success', '评价提交成功', '感谢您的评价！');
        setTimeout(() => {
          // 返回订单详情页
          navigate(`/order/${orderId}`);
        }, 1500);
      } else {
        handleSubmitError(response, {
          toastTitle: '提交失败',
          customMessage: extractError(response, '评价提交失败'),
          context: { orderId, productId },
        });
        submitMachine.send(FormEvent.SUBMIT_ERROR);
      }
    } catch (err: any) {
      errorLog('SubmitReview', '提交评价失败', err);
      handleSubmitError(err, {
        toastTitle: '提交失败',
        customMessage: '网络错误，请重试',
        context: { orderId, productId },
      });
      submitMachine.send(FormEvent.SUBMIT_ERROR);
    }
  };

  if (!orderId || !productId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 mb-4">参数错误</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full active:bg-gray-100 transition-colors"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="flex-1 text-center pr-9 font-bold text-gray-900 text-lg">商品评价</h1>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* 商品信息卡片 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
              <LazyImage
                src={productImage}
                alt={productName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm text-gray-900 font-medium line-clamp-2 leading-snug">
                {productName}
              </h3>
              <p className="text-xs text-gray-500 mt-1">订单号: {orderId}</p>
            </div>
          </div>
        </div>

        {/* 评分区域 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">评分</h3>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1 active:scale-95 transition-transform"
                disabled={submitting}
              >
                <Star
                  size={40}
                  className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                  strokeWidth={1.5}
                />
              </button>
            ))}
            <span className="ml-2 text-base text-gray-600 font-medium">
              {rating === 5 ? '非常满意' : rating === 4 ? '满意' : rating === 3 ? '一般' : rating === 2 ? '不满意' : '非常不满意'}
            </span>
          </div>
        </div>

        {/* 评价内容 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-3">评价内容</h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的使用体验，帮助其他买家做出购买决策..."
            className="w-full min-h-[120px] p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
            maxLength={500}
            disabled={submitting}
          />
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                disabled={submitting}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span>匿名评价</span>
            </label>
            <span className={`text-xs ${content.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
              {content.length}/500
            </span>
          </div>
        </div>

        {/* 图片上传区域 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-3">上传图片（选填）</h3>
          <div className="grid grid-cols-3 gap-3">
            {/* 已上传的图片 */}
            {imageUploadStates.map((state, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                {state.uploading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                ) : state.error ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2">
                    <p className="text-xs text-red-500 text-center mb-1">上传失败</p>
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="text-xs text-red-500 underline"
                      disabled={submitting}
                    >
                      删除
                    </button>
                  </div>
                ) : (
                  <>
                    <img
                      src={state.url || state.preview}
                      alt={`评价图片${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={submitting}
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </>
                )}
              </div>
            ))}

            {/* 上传按钮 */}
            {imageUploadStates.length < 9 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 active:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Camera size={24} className="text-gray-400" />
                <span className="text-xs text-gray-400">添加图片</span>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">最多上传9张图片</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
            disabled={submitting}
          />
        </div>

        {/* 视频上传区域 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-3">上传视频（选填）</h3>
          <div className="flex gap-3">
            {videoUploadState ? (
              <div className="relative w-32 aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                {videoUploadState.uploading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                ) : videoUploadState.error ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2">
                    <p className="text-xs text-red-500 text-center mb-1">上传失败</p>
                    <button
                      onClick={handleRemoveVideo}
                      className="text-xs text-red-500 underline"
                      disabled={submitting}
                    >
                      删除
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      src={videoUploadState.url || videoUploadState.preview}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleRemoveVideo}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={submitting}
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={submitting}
                className="w-32 aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 active:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <VideoIcon size={24} className="text-gray-400" />
                <span className="text-xs text-gray-400">添加视频</span>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">支持上传1个视频，大小不超过50MB</p>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
            disabled={submitting}
          />
        </div>

        {/* 错误提示 */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* 底部提交按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe max-w-[480px] mx-auto">
        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-base shadow-lg shadow-red-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>提交中...</span>
            </>
          ) : (
            '提交评价'
          )}
        </button>
      </div>
    </div>
  );
};

export default SubmitReview;
