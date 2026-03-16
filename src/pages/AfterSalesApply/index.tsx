import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertCircle,
  Camera,
  ChevronRight,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { shopOrderApi, type ShopOrderDetailResponse } from '../../api/modules/shopOrder';
import { getErrorMessage } from '../../api/core/errors';
import { resolveUploadUrl, uploadApi, type UploadedFile } from '../../api/modules/upload';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { isAfterSaleEligibleOrderStatus } from '../../features/order/status';
import { resolveShopProductImageUrl } from '../../features/shop-product/utils';
import { useAppNavigate } from '../../lib/navigation';

const REFUND_TYPES = [
  { key: 'refund_only', title: '仅退款', desc: '未拆封、发货延迟或与描述不符时提交' },
  { key: 'refund_return', title: '退货退款', desc: '已收货但商品破损、错发或质量异常' },
] as const;

const REASON_OPTIONS = [
  '商品破损/瑕疵',
  '错发/漏发',
  '商品与描述不符',
  '物流迟迟未送达',
  '不想要了',
  '其他原因',
] as const;

type UploadStatus = 'uploading' | 'success' | 'error';

interface UploadImage {
  id: string;
  file: File;
  url: string;
  status: UploadStatus;
  errorMessage?: string;
  uploaded?: UploadedFile;
}

function formatPrice(order: ShopOrderDetailResponse) {
  if (order.pay_type === 'score') return `${order.total_score} 消费金`;
  if (order.pay_type === 'combined') {
    const parts: string[] = [];
    if (Number(order.total_amount) > 0) parts.push(`¥${Number(order.total_amount).toFixed(2)}`);
    if (Number(order.total_score) > 0) parts.push(`${order.total_score} 消费金`);
    return parts.join(' + ') || '--';
  }
  return Number(order.total_amount) > 0 ? `¥${Number(order.total_amount).toFixed(2)}` : '--';
}

export const AfterSalesApplyPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const numericOrderId = orderId ? Number(orderId) : 0;
  const { goBackOr, navigate } = useAppNavigate();
  const { showToast, showLoading, hideLoading } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [order, setOrder] = useState<ShopOrderDetailResponse | null>(null);
  const [refundType, setRefundType] = useState<(typeof REFUND_TYPES)[number]['key']>('refund_return');
  const [reason, setReason] = useState<string>(REASON_OPTIONS[0]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<UploadImage[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<UploadImage[]>([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        if (image.url.startsWith('blob:')) URL.revokeObjectURL(image.url);
      });
    };
  }, []);

  const loadOrder = useCallback(async () => {
    if (!numericOrderId) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const data = await shopOrderApi.detail({ id: numericOrderId });
      setOrder(data);
      if (data.after_sale_status) {
        showToast({ message: '该订单已有售后申请', type: 'warning' });
        navigate(`/order/detail/${numericOrderId}`, { replace: true });
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [navigate, numericOrderId, showToast]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const revokePreviewUrl = (url: string) => {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  };

  const uploadSingleImage = useCallback(async (image: UploadImage) => {
    try {
      const uploaded = await uploadApi.upload({ file: image.file, topic: 'after_sale' });
      const nextUrl = uploaded.url ? resolveUploadUrl(uploaded.url) : image.url;
      setImages((prev) =>
        prev.map((item) =>
          item.id === image.id
            ? { ...item, errorMessage: undefined, status: 'success', uploaded, url: nextUrl }
            : item,
        ),
      );
      if (nextUrl !== image.url) revokePreviewUrl(image.url);
    } catch (uploadError) {
      setImages((prev) =>
        prev.map((item) =>
          item.id === image.id
            ? { ...item, errorMessage: getErrorMessage(uploadError), status: 'error' }
            : item,
        ),
      );
    }
  }, []);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    const nextImages = Array.from<File>(files)
      .slice(0, 6 - images.length)
      .map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        status: 'uploading' as UploadStatus,
        url: URL.createObjectURL(file),
      }));

    setImages((prev) => [...prev, ...nextImages]);
    nextImages.forEach((image) => void uploadSingleImage(image));

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const current = prev.find((item) => item.id === id);
      if (current) revokePreviewUrl(current.url);
      return prev.filter((item) => item.id !== id);
    });
  };

  const retryUpload = (id: string) => {
    const current = images.find((item) => item.id === id);
    if (!current) return;
    setImages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'uploading', errorMessage: undefined } : item,
      ),
    );
    void uploadSingleImage({ ...current, status: 'uploading', errorMessage: undefined });
  };

  const handleSubmit = async () => {
    if (!order || !numericOrderId) return;
    if (description.trim().length < 5) {
      showToast({ message: '请至少填写 5 个字的问题描述', type: 'warning' });
      return;
    }
    if (images.some((item) => item.status === 'uploading')) {
      showToast({ message: '图片仍在上传，请稍候', type: 'warning' });
      return;
    }

    const successImages = images
      .filter((item) => item.status === 'success' && item.uploaded?.url)
      .map((item) => item.uploaded!.url);

    setSubmitting(true);
    showLoading('提交售后申请中...');
    try {
      await shopOrderApi.applyAfterSale({
        order_id: numericOrderId,
        reason: `${refundType === 'refund_only' ? '仅退款' : '退货退款'} - ${reason}`,
        description: description.trim(),
        images: successImages,
      });
      showToast({ message: '售后申请已提交', type: 'success' });
      navigate('/after-sales', { replace: true });
    } catch (submitError) {
      showToast({ message: getErrorMessage(submitError) || '提交售后申请失败', type: 'error' });
    } finally {
      hideLoading();
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4 p-4">
          <div className="rounded-[28px] bg-[#101826] p-5">
            <Skeleton className="h-6 w-24 bg-white/10" />
            <Skeleton className="mt-3 h-8 w-36 bg-white/10" />
            <Skeleton className="mt-2 h-4 w-48 bg-white/10" />
          </div>
          <Card className="space-y-4 p-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </Card>
          <Card className="space-y-4 p-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </Card>
        </div>
      );
    }

    if (error || !order) {
      return (
        <div className="p-4">
          <Card className="p-4">
            <ErrorState onRetry={() => void loadOrder()} />
          </Card>
        </div>
      );
    }

    const canApplyAfterSale =
      (order.product_type === 'physical' || order.product_type === 'mixed') &&
      isAfterSaleEligibleOrderStatus(order.status) &&
      !order.after_sale_status;

    if (!canApplyAfterSale) {
      return (
        <div className="p-4">
          <Card className="overflow-hidden rounded-[28px] border border-border-light p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-info/10 text-info">
                <ShieldCheck size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-text-main">当前订单暂不可申请售后</h2>
                <p className="mt-2 text-sm leading-6 text-text-sub">
                  仅实物类且处于待发货、待收货或已完成状态的订单支持在线申请售后。你可以先回到订单详情查看当前状态。
                </p>
              </div>
            </div>
            <Button className="mt-5" onClick={() => navigate(`/order/detail/${numericOrderId}`)}>
              返回订单详情
            </Button>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4 pb-28">
        <section className="relative overflow-hidden rounded-[30px] bg-[#101826] p-5 text-white shadow-[0_18px_50px_rgba(9,17,33,0.24)]">
          <div className="absolute -right-12 top-4 h-28 w-28 rounded-full bg-white/8 blur-2xl" />
          <div className="absolute left-10 top-16 h-24 w-24 rounded-full bg-[#f7b955]/12 blur-2xl" />
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-white/55">
            <Sparkles size={14} />
            After Sales Request
          </div>
          <h2 className="mt-3 text-5_5xl font-semibold leading-tight">提交售后说明，平台将优先审核处理</h2>
          <p className="mt-2 max-w-[280px] text-sm leading-6 text-white/72">
            补充原因、问题描述和凭证图片后，客服会根据订单状态继续流转。
          </p>
          <div className="mt-5 flex items-center justify-between rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
            <div>
              <div className="text-xs text-white/55">订单编号</div>
              <div className="mt-1 text-sm font-medium">{order.order_no}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/55">订单金额</div>
              <div className="mt-1 text-sm font-medium">{formatPrice(order)}</div>
            </div>
          </div>
        </section>

        <Card className="overflow-hidden rounded-[28px] border border-border-light p-4 shadow-[0_14px_36px_rgba(16,24,40,0.06)] dark:shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-text-main">订单商品</div>
              <div className="mt-1 text-xs text-text-aux">本次申请将关联该订单全部商品</div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/order/detail/${numericOrderId}`)}
              className="inline-flex items-center gap-1 text-sm font-medium text-info"
            >
              订单详情
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="rounded-[24px] border border-border-light bg-bg-base p-3">
            {order.items.map((item) => {
              const imageUrl = item.product_thumbnail ? resolveShopProductImageUrl(item.product_thumbnail) : '';
              return (
                <div key={item.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-bg-card">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.product_name}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm text-text-main">{item.product_name}</div>
                    <div className="mt-1 text-xs text-text-aux">数量 x{item.quantity}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-[28px] border border-border-light p-4 shadow-[0_14px_36px_rgba(16,24,40,0.06)] dark:shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
          <div className="text-sm font-semibold text-text-main">售后类型</div>
          <div className="mt-3 grid gap-3">
            {REFUND_TYPES.map((item) => {
              const active = item.key === refundType;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setRefundType(item.key)}
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${
                    active
                      ? 'border-primary-start bg-primary-start text-white shadow-[0_10px_26px_rgba(233,59,59,0.18)]'
                      : 'border-border-light bg-bg-base text-text-main'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{item.title}</div>
                      <div className={`mt-1 text-sm leading-6 ${active ? 'text-white/72' : 'text-text-sub'}`}>
                        {item.desc}
                      </div>
                    </div>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        active ? 'border-white bg-white' : 'border-border-main bg-bg-card'
                      }`}
                    >
                      {active ? <div className="h-2.5 w-2.5 rounded-full bg-primary-start" /> : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-[28px] border border-border-light p-4 shadow-[0_14px_36px_rgba(16,24,40,0.06)] dark:shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
          <div className="text-sm font-semibold text-text-main">售后原因</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {REASON_OPTIONS.map((item) => {
              const active = item === reason;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setReason(item)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? 'bg-primary-start text-white shadow-[0_8px_20px_rgba(233,59,59,0.16)]'
                      : 'bg-bg-base text-text-sub'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-text-main">问题描述</div>
              <div className="text-xs text-text-aux">{description.length}/200</div>
            </div>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value.slice(0, 200))}
              placeholder="请详细说明商品问题、期望处理方式、收到货的状态等，方便平台更快审核。"
                    className="h-32 w-full resize-none rounded-[24px] border border-border-light bg-bg-base px-4 py-4 text-lg leading-6 text-text-main outline-none placeholder:text-text-aux"
            />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-text-main">凭证图片</div>
              <div className="text-xs text-text-aux">{images.length}/6</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-[22px] border border-border-light bg-bg-base"
                >
                  <img src={image.url} alt="售后凭证" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                  >
                    <X size={14} />
                  </button>
                  {image.status === 'uploading' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-white">
                      <Loader2 size={18} className="animate-spin" />
                      <span className="mt-2 text-xs">上传中</span>
                    </div>
                  ) : null}
                  {image.status === 'error' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 px-2 text-white">
                      <AlertCircle size={18} className="text-[#ff8f8f]" />
                      <span className="mt-1 line-clamp-2 text-center text-xs">
                        {image.errorMessage || '上传失败'}
                      </span>
                      <button
                        type="button"
                        onClick={() => retryUpload(image.id)}
                        className="mt-2 rounded-full bg-bg-card px-3 py-1 text-xs text-text-main"
                      >
                        重试
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}

              {images.length < 6 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center rounded-[22px] border border-dashed border-border-main bg-bg-base text-text-sub"
                >
                  <ImagePlus size={22} />
                  <span className="mt-2 text-xs">上传图片</span>
                  <span className="mt-1 text-xs text-text-aux">破损、面单、聊天截图</span>
                </button>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </Card>

        <section className="rounded-[28px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/12 dark:text-amber-200">
          <div className="mb-2 flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
            <Camera size={16} />
            提交前建议
          </div>
          <div>请尽量上传清晰的商品问题图片、外包装或物流面单，描述里写明收货时间和具体异常，审核会更快。</div>
        </section>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <PageHeader title="申请售后" onBack={() => goBackOr('order')} className="border-b border-border-light" />
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      <div className="fixed bottom-0 left-0 right-0 border-t border-border-light bg-bg-card px-4 py-3 backdrop-blur-md pb-safe">
        <Button loading={submitting} onClick={handleSubmit} disabled={!order}>
          提交售后申请
        </Button>
      </div>
    </div>
  );
};

export default AfterSalesApplyPage;
