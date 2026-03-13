/**
 * @file Rights/index.tsx - 确权中心页面
 * @description 资产确权中心，展示寄售、藏品管理、成长权益等功能。
 */

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'; // React 核心 Hook
import {
  AlertCircle,
  ChevronRight,
  FileText,
  Info,
  Loader2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import {
  rightsDeclarationApi,
  type RightsDeclarationStatus,
  type RightsDeclarationVoucherType,
} from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { uploadApi, type UploadedFile } from '../../api/modules/upload';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageHeader } from '../../components/layout/PageHeader';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { UnlockPanel } from '../../features/rights/UnlockPanel';
import { GrowthRightsContent } from '../GrowthRights';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useOldAssetsUnlock } from '../../hooks/useOldAssetsUnlock';
import { useAppNavigate } from '../../lib/navigation';

const VOUCHER_TYPES: Record<RightsDeclarationVoucherType, string> = {
  other: '其他',
  screenshot: '截图凭证',
  transfer_record: '转账记录',
};

const STATUS_MAP: Record<
  RightsDeclarationStatus,
  { bg: string; color: string; text: string }
> = {
  approved: { text: '已通过', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
  cancelled: { text: '已取消', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10' },
  pending: { text: '审核中', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  rejected: { text: '已驳回', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
};

type UploadStatus = 'uploading' | 'success' | 'error';

interface UploadImage {
  errorMessage?: string;
  file: File;
  id: string;
  status: UploadStatus;
  uploaded?: UploadedFile;
  url: string;
}

function ApplySkeleton() {
  return (
    <div className="space-y-4">
      <Card className="h-32 animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
      <Card className="h-[420px] animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
      <Card className="h-48 animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
    </div>
  );
}

export function RightsPage() {
  const { showToast } = useFeedback();
  const { goTo, goBack } = useAppNavigate();
  const [activeTab, setActiveTab] = useSessionState<'apply' | 'unlock' | 'growth'>(
    'rights-page:tab',
    'apply',
  );
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<UploadImage[]>([]);

  const [voucherType, setVoucherType] = useState<RightsDeclarationVoucherType>('screenshot');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [images, setImages] = useState<UploadImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: reviewStatusData,
    error: reviewStatusError,
    loading: reviewStatusLoading,
    reload: reloadReviewStatus,
  } = useRequest(
    (signal) => rightsDeclarationApi.getReviewStatus({ limit: 3 }, { signal }),
    {
      cacheKey: 'rights-declaration:review-status',
    },
  );

  const {
    unlockStatus,
    statusError: unlockStatusError,
    reloadStatus: reloadUnlockStatus,
    unlock: doUnlock,
  } = useOldAssetsUnlock();
  const [unlockLoading, setUnlockLoading] = useState(false);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        if (image.url.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'unlock') {
      void reloadUnlockStatus().catch(() => undefined);
    }
  }, [activeTab, reloadUnlockStatus]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: `rights-page:${activeTab}`,
    restoreDeps: [activeTab, reviewStatusLoading, unlockStatus.isLoading],
    restoreWhen:
      activeTab === 'apply'
        ? !reviewStatusLoading
        : activeTab === 'unlock'
          ? !unlockStatus.isLoading
          : true,
  });

  const pendingCount = reviewStatusData?.pendingCount ?? 0;
  const approvedCount = reviewStatusData?.approvedCount ?? 0;
  const history = reviewStatusData?.list ?? [];
  const numericAmount = Number(amount);
  const isFormDisabled = pendingCount > 0;
  const successfulImages = images
    .filter((image) => image.status === 'success' && image.uploaded?.url)
    .map((image) => image.uploaded!.url);
  const hasUploadingImages = images.some((image) => image.status === 'uploading');
  const isSubmitDisabled =
    isFormDisabled ||
    numericAmount <= 0 ||
    successfulImages.length === 0 ||
    hasUploadingImages ||
    isSubmitting;

  const revokePreviewUrl = (url: string) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const uploadSingleImage = useCallback(async (image: UploadImage) => {
    try {
      const uploaded = await uploadApi.upload({ file: image.file, topic: 'rights_declaration' });
      setImages((prev) =>
        prev.map((item) =>
          item.id === image.id
            ? { ...item, errorMessage: undefined, status: 'success', uploaded, url: uploaded.url }
            : item,
        ),
      );
      if (uploaded.url !== image.url) {
        revokePreviewUrl(image.url);
      }
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

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    const nextImages = Array.from<File>(files)
      .slice(0, Math.max(0, 8 - images.length))
      .map((file) => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        status: 'uploading' as UploadStatus,
        url: URL.createObjectURL(file),
      }));

    setImages((prev) => [...prev, ...nextImages]);
    nextImages.forEach((image) => {
      void uploadSingleImage(image);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        revokePreviewUrl(target.url);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const retryUpload = (id: string) => {
    const target = images.find((item) => item.id === id);
    if (!target) {
      return;
    }

    setImages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, errorMessage: undefined, status: 'uploading' } : item,
      ),
    );

    void uploadSingleImage({ ...target, errorMessage: undefined, status: 'uploading' });
  };

  const resetForm = () => {
    imagesRef.current.forEach((image) => {
      revokePreviewUrl(image.url);
    });
    setAmount('');
    setRemark('');
    setImages([]);
  };

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      return;
    }

    setIsSubmitting(true);
    try {
      await rightsDeclarationApi.submit({
        amount: numericAmount,
        images: successfulImages,
        remark: remark.trim() || undefined,
        voucherType,
      });
      resetForm();
      await reloadReviewStatus();
      showToast({ message: '提交成功，请等待管理员审核', type: 'success' });
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error', duration: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockStatus.canUnlock || unlockLoading) {
      return;
    }

    setUnlockLoading(true);
    try {
      await doUnlock();
      showToast({ message: '解锁成功', type: 'success' });
    } catch (error) {
      showToast({ message: getErrorMessage(error) || '解锁失败，请稍后重试', type: 'error' });
    } finally {
      setUnlockLoading(false);
    }
  };

  const renderApplyContent = () => {
    if (reviewStatusLoading && !reviewStatusData) {
      return <ApplySkeleton />;
    }

    if (reviewStatusError && !reviewStatusData) {
      return (
        <ErrorState
          message={getErrorMessage(reviewStatusError)}
          onRetry={() => {
            void reloadReviewStatus().catch(() => undefined);
          }}
        />
      );
    }

    return (
      <div className="animate-in fade-in duration-300 space-y-4">
        <Card className="rounded-2xl border border-border-light bg-white p-4 shadow-sm dark:bg-bg-card">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex-1 border-r border-border-light text-center">
              <div className="mb-1 text-5xl font-bold leading-none text-text-main">{pendingCount}</div>
              <div className="text-sm text-text-sub">审核中</div>
            </div>
            <div className="flex-1 text-center">
              <div className="mb-1 text-5xl font-bold leading-none text-text-main">{approvedCount}</div>
              <div className="text-sm text-text-sub">已通过</div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white">1</div>
                <span className="text-sm font-medium text-text-main">提交申请</span>
              </div>
              <div className="mx-2 h-[2px] flex-1 bg-red-100 dark:bg-red-900/30" />
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${pendingCount > 0
                    ? 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.45)]'
                    : 'bg-gray-100 text-text-sub dark:bg-gray-800'
                    }`}
                >
                  2
                </div>
                <span
                  className={`text-sm font-medium ${pendingCount > 0 ? 'text-red-500' : 'text-text-sub'}`}
                >
                  审核中
                </span>
              </div>
              <div className="mx-2 h-[2px] flex-1 bg-gray-100 dark:bg-gray-800" />
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-sm text-text-sub dark:bg-gray-800">
                  3
                </div>
                <span className="text-sm font-medium text-text-sub">审核完成</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
            <AlertCircle
              size={14}
              className={pendingCount > 0 ? 'mt-[2px] text-orange-500' : 'mt-[2px] text-blue-500'}
            />
            <p
              className={`text-sm leading-relaxed ${pendingCount > 0
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-blue-600 dark:text-blue-400'
                }`}
            >
              {pendingCount > 0 ? '当前有待审核记录，暂不可重复提交' : '可提交新的确权申请'}
            </p>
          </div>
        </Card>

        <Card
          className={`rounded-2xl border border-border-light bg-white p-4 shadow-sm transition-opacity dark:bg-bg-card ${isFormDisabled ? 'pointer-events-none opacity-60' : ''
            }`}
        >
          <h2 className="mb-4 text-xl font-bold text-text-main">确权申请</h2>

          {isFormDisabled ? (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-base text-red-600 dark:text-red-400">存在待审核记录，禁止重复提交</span>
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-base text-text-sub">凭证类型</label>
              <div className="flex gap-2">
                {Object.entries(VOUCHER_TYPES).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setVoucherType(key as RightsDeclarationVoucherType)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-base font-medium transition-colors ${voucherType === key
                      ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400'
                      : 'border-transparent bg-gray-50 text-text-main dark:bg-gray-800'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-base text-text-sub">确权金额</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="请输入确权金额"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-12 w-full rounded-xl border border-transparent bg-gray-50 pl-8 pr-10 text-xl font-medium text-text-main outline-none transition-colors placeholder:text-gray-400 focus:border-red-500 focus:bg-white dark:bg-gray-800 dark:text-text-main dark:placeholder:text-gray-500 dark:focus:bg-bg-card"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-text-main">¥</span>
                {amount ? (
                  <button
                    type="button"
                    onClick={() => setAmount('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500"
                  >
                    <XCircle size={16} />
                  </button>
                ) : null}
              </div>
              {!isFormDisabled && amount && numericAmount <= 0 ? (
                <p className="mt-1 text-sm text-red-500">请输入正确金额</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-base text-text-sub">备注说明</label>
              <div className="relative">
                <textarea
                  placeholder="请输入备注信息（选填）"
                  value={remark}
                  onChange={(event) => setRemark(event.target.value.slice(0, 200))}
                  className="h-24 w-full resize-none rounded-xl border border-transparent bg-gray-50 p-3 text-lg text-text-main outline-none transition-colors focus:border-red-500 focus:bg-white dark:bg-gray-800 dark:focus:bg-bg-card"
                />
                <span className="absolute bottom-3 right-3 text-sm text-gray-400 dark:text-gray-500">
                  {remark.length}/200
                </span>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-base text-text-sub">凭证图片</label>
                <span className="text-sm text-gray-400 dark:text-gray-500">{images.length}/8 张</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border-light bg-gray-50 dark:bg-gray-800"
                  >
                    <img src={image.url} alt="凭证图片" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                    >
                      <X size={14} />
                    </button>
                    {image.status === 'uploading' ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                        <Loader2 size={18} className="mb-1 animate-spin" />
                        <span className="text-xs">上传中</span>
                      </div>
                    ) : null}
                    {image.status === 'error' ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 px-2 text-white">
                        <AlertCircle size={18} className="mb-1 text-red-400" />
                        <span className="mb-1 line-clamp-2 text-center text-[11px]">
                          {image.errorMessage || '上传失败'}
                        </span>
                        <button
                          type="button"
                          onClick={() => retryUpload(image.id)}
                          className="rounded bg-white px-2 py-0.5 text-xs text-gray-900 dark:bg-gray-100 dark:text-gray-900"
                        >
                          重试
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
                {images.length < 8 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 text-gray-400 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-500 dark:hover:bg-gray-800"
                  >
                    <Upload size={20} />
                    <span className="text-xs">上传图片</span>
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
              {!isFormDisabled && successfulImages.length === 0 ? (
                <p className="mt-2 text-sm text-red-500">请上传至少1张成功的凭证图</p>
              ) : null}
            </div>

            <Button
              className={`mt-6 h-12 w-full rounded-xl text-xl font-medium ${isSubmitDisabled
                ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                : 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-lg shadow-red-500/30 active:scale-[0.98]'
                }`}
              disabled={isSubmitDisabled}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>提交中...</span>
                </div>
              ) : (
                '提交审核'
              )}
            </Button>
          </div>
        </Card>

        <Card className="rounded-2xl border border-border-light bg-white p-4 shadow-sm dark:bg-bg-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-main">历史记录</h2>
            <button
              type="button"
              onClick={() => goTo('rights_history')}
              className="flex items-center text-base text-text-sub"
            >
              查看全部 <ChevronRight size={14} />
            </button>
          </div>

          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((record) => {
                const statusInfo = STATUS_MAP[record.status];
                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => goTo('rights_history')}
                    className="flex w-full items-center justify-between rounded-xl bg-gray-50 p-3 text-left transition-colors active:bg-gray-100 dark:bg-gray-800/50 dark:active:bg-gray-800"
                  >
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-md font-medium text-text-main">
                          {record.voucherTypeText || VOUCHER_TYPES[record.voucherType]}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                          {record.statusText || statusInfo.text}
                        </span>
                      </div>
                      <div className="text-sm text-text-sub">{record.createTimeText}</div>
                    </div>
                    <div className="text-xl font-bold text-red-500">
                      ¥{record.amount.toLocaleString('zh-CN', { useGrouping: false })}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
              <FileText size={32} className="mb-2 opacity-50" />
              <p className="text-base">暂无历史记录</p>
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#FDFBFB] dark:bg-bg-base">
      <PageHeader
        title="确权中心"
        onBack={goBack}
        className="border-b border-border-light bg-white/95 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90"
        contentClassName="h-12 px-4"
        rightAction={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => goTo('rights_history')}
              className="text-text-main active:scale-95 transition-transform"
            >
              <FileText size={20} />
            </button>
            <button
              type="button"
              onClick={() => {
                showToast({
                  message: '提交凭证后将进入人工审核，待审核期间不可重复提交。',
                  type: 'info',
                  duration: 3000,
                });
              }}
              className="text-text-main active:scale-95 transition-transform"
            >
              <Info size={20} />
            </button>
          </div>
        }
      />

      <div className="sticky top-0 z-10 border-b border-border-light bg-white/96 px-4 py-3 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/96">

        <div className="grid grid-cols-3 gap-2 rounded-[22px] bg-[#F7F1F1] p-2 shadow-inner dark:bg-gray-800/80">
          <button
            type="button"
            className={`flex min-h-[44px] items-center justify-center rounded-[16px] px-2 py-3 text-center transition-all ${activeTab === 'apply'
              ? 'bg-gradient-to-r from-primary-start to-primary-end text-white shadow-[0_10px_24px_rgba(239,68,68,0.22)]'
              : 'bg-transparent text-text-sub'
              }`}
            onClick={() => setActiveTab('apply')}
          >
            <div className="w-full text-center text-[15px] font-bold leading-5">确权申请</div>

          </button>
          <button
            type="button"
            className={`flex min-h-[44px] items-center justify-center rounded-[16px] px-2 py-3 text-center transition-all ${activeTab === 'unlock'
              ? 'bg-gradient-to-r from-primary-start to-primary-end text-white shadow-[0_10px_24px_rgba(239,68,68,0.22)]'
              : 'bg-transparent text-text-sub'
              }`}
            onClick={() => setActiveTab('unlock')}
          >
            <div className="w-full text-center text-[15px] font-bold leading-5">旧资产解锁</div>

          </button>
          <button
            type="button"
            className={`flex min-h-[44px] items-center justify-center rounded-[16px] px-2 py-3 text-center transition-all ${activeTab === 'growth'
              ? 'bg-gradient-to-r from-primary-start to-primary-end text-white shadow-[0_10px_24px_rgba(239,68,68,0.22)]'
              : 'bg-transparent text-text-sub'
              }`}
            onClick={() => setActiveTab('growth')}
          >
            <div className="w-full text-center text-[15px] font-bold leading-5">成长权益</div>

          </button>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        {activeTab === 'apply' ? renderApplyContent() : null}

        {activeTab === 'unlock' ? (
          <div className="animate-in fade-in duration-300">
            {unlockStatusError ? (
              <ErrorState
                message={getErrorMessage(unlockStatusError)}
                onRetry={() => {
                  void reloadUnlockStatus().catch(() => undefined);
                }}
              />
            ) : (
              <UnlockPanel
                unlockStatus={unlockStatus}
                unlockLoading={unlockLoading}
                onUnlock={handleUnlock}
              />
            )}
          </div>
        ) : null}

        {activeTab === 'growth' ? (
          <div className="-m-4 animate-in fade-in duration-300">
            <GrowthRightsContent />
          </div>
        ) : null}
      </div>
    </div>
  );
}



