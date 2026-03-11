/**
 * @file AddReview/index.tsx - 发表评价页面
 * @description 用户对已购商品进行评价，支持星级评分、快捷标签、文字输入、图片上传（最多9张）、匿名评价。
 */

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'; // React 核心 Hook & 类型
import { useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Camera,
  Loader2,
  Star,
  X,
} from 'lucide-react';
import { getErrorMessage } from '../../api/core/errors';
import { shopProductApi } from '../../api/modules/shopProduct';
import { shopOrderApi, type ShopOrderDetailResponse } from '../../api/modules/shopOrder';
import { resolveUploadUrl, uploadApi, type UploadedFile } from '../../api/modules/upload';
import { resolveShopProductImageUrl } from '../../features/shop-product/utils';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAppNavigate } from '../../lib/navigation';

/** 快捷评价标签列表 */
const QUICK_TAGS = ['质量好', '物流快', '服务好', '包装扎实', '正品', '性价比高', '外观不错'];

/** 图片上传状态枚举 */
type ImageStatus = 'uploading' | 'success' | 'error';

/** 上传图片对象 */
interface UploadImage {
  errorMessage?: string; // 上传失败时的错误信息
  file: File; // 原始文件对象
  id: string; // 唯一标识
  status: ImageStatus; // 当前上传状态
  uploaded?: UploadedFile; // 上传成功后的服务端响应
  url: string; // 预览 URL（blob 或服务端 URL）
}

/**
 * AddReviewPage - 发表评价页面
 * 支持：星级评分、快捷标签、文字评价(500字)、图片上传(9张)、匿名评价
 */
export default function AddReviewPage() {
  const { goBack } = useAppNavigate();
  const { showToast } = useFeedback();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const productIdParam = searchParams.get('product_id');

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState<UploadImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [orderDetail, setOrderDetail] = useState<ShopOrderDetailResponse | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<UploadImage[]>([]);

  const numOrderId = orderId ? parseInt(orderId, 10) : 0;
  const numProductId = productIdParam ? parseInt(productIdParam, 10) : 0;

  /** 监听网络在线/离线事件 */
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /** 根据订单 ID 加载订单详情 */
  useEffect(() => {
    if (!numOrderId) {
      setLoadingOrder(false);
      return;
    }
    let cancelled = false;
    setLoadingOrder(true);
    shopOrderApi.detail(numOrderId).then((data) => {
      if (!cancelled) setOrderDetail(data);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoadingOrder(false);
    });
    return () => { cancelled = true; };
  }, [numOrderId]);

  /** 同步 images 到 ref（供卸载清理时使用） */
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  /** 组件卸载时释放所有 blob 预览 URL */
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        if (image.url.startsWith('blob:')) URL.revokeObjectURL(image.url);
      });
    };
  }, []);

  const targetItem = orderDetail?.items?.find((i) => i.product_id === numProductId) ?? orderDetail?.items?.[0];
  const thumbnail = targetItem?.product_thumbnail
    ? resolveShopProductImageUrl(targetItem.product_thumbnail)
    : '';
  const productName = targetItem?.product_name || '待评价商品';
  const finalProductId = targetItem?.product_id ?? numProductId;

  const revokePreviewUrl = (url: string) => {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  };

  /** 上传单张图片，成功则更新 URL，失败则标记错误 */
  const uploadSingleImage = useCallback(async (image: UploadImage) => {
    try {
      const uploaded = await uploadApi.upload({ file: image.file, topic: 'review' });
      const nextUrl = uploaded.url ? resolveUploadUrl(uploaded.url) : image.url;
      setImages((prev) =>
        prev.map((item) =>
          item.id === image.id
            ? { ...item, errorMessage: undefined, status: 'success', uploaded, url: nextUrl }
            : item,
        ),
      );
      if (nextUrl !== image.url) revokePreviewUrl(image.url);
    } catch (error) {
      setImages((prev) =>
        prev.map((item) =>
          item.id === image.id
            ? { ...item, errorMessage: getErrorMessage(error), status: 'error' }
            : item,
        ),
      );
    }
  }, []);

  /** 切换快捷标签选中状态 */
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  /** 处理图片选择：创建 blob 预览并触发上传（限制最多9张） */
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const nextImages = Array.from<File>(files)
      .slice(0, 9 - images.length)
      .map((file) => ({
        file,
        id: Math.random().toString(36).slice(2),
        status: 'uploading' as ImageStatus,
        url: URL.createObjectURL(file),
      }));
    setImages((prev) => [...prev, ...nextImages]);
    nextImages.forEach((image) => { void uploadSingleImage(image); });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /** 删除已添加的图片并释放 blob URL */
  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) revokePreviewUrl(target.url);
      return prev.filter((item) => item.id !== id);
    });
  };

  /** 重试上传失败的图片 */
  const retryUpload = (id: string) => {
    const target = images.find((item) => item.id === id);
    if (!target) return;
    setImages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, errorMessage: undefined, status: 'uploading' } : item,
      ),
    );
    void uploadSingleImage({ ...target, errorMessage: undefined, status: 'uploading' });
  };

  /** 提交评价：验证必填项 → 收集上传成功的图片 → 拼接内容 → 调用 API */
  const handleSubmit = async () => {
    if (rating === 0) {
      showToast({ message: '请先选择星级评分', type: 'warning' });
      return;
    }
    if (!numOrderId || !finalProductId) {
      showToast({ message: '缺少订单或商品信息', type: 'error' });
      return;
    }
    const hasUploading = images.some((img) => img.status === 'uploading');
    if (hasUploading) {
      showToast({ message: '图片上传中，请稍候', type: 'warning' });
      return;
    }

    const successImages = images
      .filter((img) => img.status === 'success' && img.uploaded?.url)
      .map((img) => img.uploaded!.url);

    const tagText = selectedTags.length > 0 ? selectedTags.join('，') : '';
    const fullContent = [tagText, content].filter(Boolean).join('\n');

    setSubmitting(true);
    try {
      await shopProductApi.submitReview({
        order_id: numOrderId,
        product_id: finalProductId,
        rating,
        content: fullContent || undefined,
        images: successImages.length > 0 ? JSON.stringify(successImages) : undefined,
        is_anonymous: isAnonymous ? 1 : 0,
      });
      showToast({ message: '评价提交成功！感谢您的评价', type: 'success' });
      goBack();
    } catch (error) {
      showToast({ message: getErrorMessage(error) || '评价提交失败，请重试', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-sub flex flex-col pb-24">
      <PageHeader title="发表评价" onBack={goBack} offline={isOffline} />

      <div className="space-y-3 p-4">
        {/* 商品信息卡片 */}
        <Card className="flex items-center space-x-3 p-3">
          {loadingOrder ? (
            <>
              <Skeleton className="w-12 h-12 rounded shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-1/2 h-3" />
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 shrink-0 rounded bg-bg-sub overflow-hidden border border-border-light">
                {thumbnail ? (
                  <img src={thumbnail} alt={productName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-aux text-xs">商品</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-md text-text-main">{productName}</h3>
                <p className="mt-0.5 text-sm text-text-sub">
                  订单号 {orderDetail?.order_no || orderId}
                </p>
              </div>
            </>
          )}
        </Card>

        {/* 评分 */}
        <Card className="flex flex-col items-center p-5">
          <div className="mb-4 flex items-center space-x-4">
            <span className="text-lg font-medium text-text-main">商品评分</span>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform active:scale-110"
                >
                  <Star
                    size={28}
                    className={star <= rating ? 'fill-primary-start text-primary-start' : 'text-border-main'}
                  />
                </button>
              ))}
            </div>
            <span className="w-10 text-base text-text-sub">
              {rating === 1 && '很差'}
              {rating === 2 && '较差'}
              {rating === 3 && '一般'}
              {rating === 4 && '不错'}
              {rating === 5 && '很好'}
            </span>
          </div>

          {rating > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'border border-primary-start/30 bg-primary-start/10 text-primary-start'
                      : 'border border-transparent bg-bg-sub text-text-main'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* 评价内容 + 图片 */}
        <Card className="p-4">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, 500))}
            placeholder="说说你的使用感受，帮助其他用户了解商品情况"
            className="h-32 w-full resize-none bg-transparent text-md text-text-main outline-none placeholder:text-text-aux"
          />
          <div className="mb-4 text-right text-sm text-text-aux">{content.length}/500</div>

          <div className="grid grid-cols-3 gap-2">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative aspect-square overflow-hidden rounded-lg border border-border-light bg-bg-sub"
              >
                <img src={image.url} alt="Upload" className="h-full w-full object-cover" />
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white"
                >
                  <X size={12} />
                </button>
                {image.status === 'uploading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
                    <Loader2 size={20} className="mb-1 animate-spin" />
                    <span className="text-xs">上传中</span>
                  </div>
                )}
                {image.status === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                    <AlertCircle size={20} className="mb-1 text-red-400" />
                    <span className="mb-1 px-2 text-center text-xs">{image.errorMessage || '上传失败'}</span>
                    <button
                      onClick={() => retryUpload(image.id)}
                      className="rounded bg-white px-2 py-0.5 text-xs text-gray-900"
                    >
                      重试
                    </button>
                  </div>
                )}
              </div>
            ))}
            {images.length < 9 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border border-dashed border-border-main text-text-sub transition-colors active:bg-bg-sub"
              >
                <Camera size={24} className="mb-1" />
                <span className="text-xs">添加图片</span>
                <span className="text-xs text-text-aux">{images.length}/9</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />

          <div className="mt-6 flex items-center justify-between border-t border-border-light pt-4">
            <button
              onClick={() => setIsAnonymous((current) => !current)}
              className="flex items-center space-x-2"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-border-main">
                {isAnonymous ? <span className="h-2.5 w-2.5 rounded-full bg-text-main" /> : null}
              </span>
              <span className="text-md text-text-main">匿名评价</span>
            </button>
            <span className="text-sm text-text-aux">你的评价将以匿名形式展示</span>
          </div>
        </Card>
      </div>

      {/* 底部提交按钮 */}
      <div className="fixed right-0 bottom-0 left-0 border-t border-border-light bg-white p-2 pb-safe dark:bg-gray-900">
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className={`flex h-10 w-full items-center justify-center rounded-full text-lg font-medium transition-all ${
            rating === 0 || submitting
              ? 'cursor-not-allowed bg-bg-sub text-text-sub'
              : 'bg-gradient-to-r from-primary-start to-primary-end text-white active:opacity-90'
          }`}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              提交中...
            </>
          ) : (
            '提交评价'
          )}
        </button>
      </div>
    </div>
  );
}
