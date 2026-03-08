import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, FileText, Info, AlertCircle, CheckCircle2, Clock, XCircle, Upload, X, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { UnlockPanel } from '../../features/rights/UnlockPanel';
import { GrowthRightsContent } from '../GrowthRights';
import { getErrorMessage } from '../../api/core/errors';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useOldAssetsUnlock } from '../../hooks/useOldAssetsUnlock';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { useFeedback } from '../../components/ui/FeedbackProvider';

// Mock Data
const MOCK_DATA = {
  pending_count: 1,
  approved_count: 5,
  history: [
    { id: '1', type: 'screenshot', amount: 5000, status: 'pending', time: '2026-03-01 10:00:00' },
    { id: '2', type: 'transfer_record', amount: 10000, status: 'approved', time: '2026-02-28 14:30:00' },
    { id: '3', type: 'other', amount: 2000, status: 'rejected', time: '2026-02-25 09:15:00' },
  ],
  unlock: {
    conditions: [
      { id: 'c1', text: '完成实名认证', met: true },
      { id: 'c2', text: '绑定有效银行卡', met: true },
      { id: 'c3', text: '历史交易达标', met: false },
    ],
    required_gold: 10000,
    current_gold: 4500,
    can_unlock: false,
    unlocked_count: 0,
    available_quota: 0,
  },
};

const VOUCHER_TYPES = {
  screenshot: '截图凭证',
  transfer_record: '转账记录',
  other: '其他'
};

const STATUS_MAP = {
  pending: { text: '审核中', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  approved: { text: '已通过', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
  rejected: { text: '已驳回', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
  cancelled: { text: '已取消', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10' },
};

export function RightsPage() {
  const { showToast } = useFeedback();
  const { goTo, goBack } = useAppNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(MOCK_DATA);
  const [activeTab, setActiveTab] = useSessionState<'apply' | 'unlock' | 'growth'>(
    'rights-page:tab',
    'apply',
  );
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Form State
  const [voucherType, setVoucherType] = useState('screenshot');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    unlockStatus,
    statusError: unlockStatusError,
    reloadStatus: reloadUnlockStatus,
    unlock: doUnlock,
  } = useOldAssetsUnlock();
  const [unlockLoading, setUnlockLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'unlock') {
      void reloadUnlockStatus().catch(() => undefined);
    }
  }, [activeTab, reloadUnlockStatus]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: `rights-page:${activeTab}`,
    restoreDeps: [activeTab, isLoading],
    restoreWhen: !isLoading,
  });

  const handleGoBack = () => {
    goBack();
  };

  const handleGoHistory = () => {
    goTo('rights_history');
  };

  const handleImageUpload = () => {
    if (images.length >= 8) return;
    // Mock upload
    setImages([...images, `https://picsum.photos/seed/${Math.random()}/200/200`]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (data.pending_count > 0 || !amount || Number(amount) <= 0 || images.length === 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setData(prev => ({ ...prev, pending_count: prev.pending_count + 1 }));
      setAmount('');
      setRemark('');
      setImages([]);
      showToast({ message: '提交成功', type: 'success' });
    }, 300);
  };

  const isFormDisabled = data.pending_count > 0;
  const isSubmitDisabled = isFormDisabled || !amount || Number(amount) <= 0 || images.length === 0;

  const handleUnlock = async () => {
    if (!unlockStatus.canUnlock || unlockLoading) return;
    setUnlockLoading(true);
    try {
      await doUnlock();
      showToast({ message: '解锁成功', type: 'success' });
    } catch (err) {
      showToast({ message: getErrorMessage(err) || '解锁失败，请稍后重试', type: 'error' });
    } finally {
      setUnlockLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-[#FDFBFB] dark:bg-bg-base flex flex-col">
        <div className="h-12 flex items-center px-4 border-b border-border-light">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          <div className="flex-1 flex justify-center">
            <div className="w-24 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="w-6 h-6" />
        </div>
        <div className="p-4 space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#FDFBFB] dark:bg-bg-base flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 bg-white dark:bg-gray-900/80 dark:bg-bg-card/80 backdrop-blur-md sticky top-0 z-20 border-b border-border-light shadow-sm">
        <button onClick={handleGoBack} className="p-2 -ml-2 text-text-main active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-semibold text-text-main">确权中心</h1>
        <div className="flex items-center gap-3">
          <button onClick={handleGoHistory} className="text-text-main active:scale-95 transition-transform">
            <FileText size={20} />
          </button>
          <button className="text-text-main active:scale-95 transition-transform">
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Global Tabs */}
      <div className="flex px-4 bg-white dark:bg-bg-card border-b border-border-light sticky top-12 z-10">
        <button
          className={`flex-1 pb-3 text-lg font-bold relative transition-colors ${activeTab === 'apply' ? 'text-text-main' : 'text-text-sub'}`}
          onClick={() => setActiveTab('apply')}
        >
          确权申请
          {activeTab === 'apply' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-red-500 rounded-full" />
          )}
        </button>
        <button
          className={`flex-1 pb-3 text-lg font-bold relative transition-colors ${activeTab === 'unlock' ? 'text-text-main' : 'text-text-sub'}`}
          onClick={() => setActiveTab('unlock')}
        >
          旧资产解锁
          {activeTab === 'unlock' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-red-500 rounded-full" />
          )}
        </button>
        <button
          className={`flex-1 pb-3 text-lg font-bold relative transition-colors ${activeTab === 'growth' ? 'text-text-main' : 'text-text-sub'}`}
          onClick={() => setActiveTab('growth')}
        >
          成长权益
          {activeTab === 'growth' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-red-500 rounded-full" />
          )}
        </button>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">
        {activeTab === 'apply' && (
          <div className="animate-in fade-in duration-300 space-y-4">
            {/* ReviewStatsSummary + ClaimSteps */}
        <Card className="p-4 bg-white dark:bg-bg-card border border-border-light shadow-sm rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center flex-1 border-r border-border-light">
              <div className="text-5xl font-bold text-text-main leading-none mb-1">{data.pending_count}</div>
              <div className="text-sm text-text-sub">审核中</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-5xl font-bold text-text-main leading-none mb-1">{data.approved_count}</div>
              <div className="text-sm text-text-sub">已通过</div>
            </div>
          </div>

          <div className="relative">
            {/* Steps */}
            <div className="flex justify-between items-center relative z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm">1</div>
                <span className="text-sm text-text-main font-medium">提交申请</span>
              </div>
              <div className="flex-1 h-[2px] bg-red-100 dark:bg-red-900/30 mx-2" />
              <div className="flex flex-col items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${data.pending_count > 0 ? 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-gray-100 dark:bg-gray-800 text-text-sub'}`}>2</div>
                <span className={`text-sm font-medium ${data.pending_count > 0 ? 'text-red-500' : 'text-text-sub'}`}>审核中</span>
              </div>
              <div className="flex-1 h-[2px] bg-gray-100 dark:bg-gray-800 mx-2" />
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-text-sub flex items-center justify-center text-sm">3</div>
                <span className="text-sm text-text-sub font-medium">审核完成</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-start gap-2">
            <AlertCircle size={14} className={data.pending_count > 0 ? "text-orange-500 mt-[2px]" : "text-blue-500 mt-[2px]"} />
            <p className={`text-sm leading-relaxed ${data.pending_count > 0 ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"}`}>
              {data.pending_count > 0 ? '当前有待审核记录，暂不可重复提交' : '可提交新的确权申请'}
            </p>
          </div>
        </Card>

        {/* ClaimFormSection */}
        <Card className={`p-4 bg-white dark:bg-bg-card border border-border-light shadow-sm rounded-2xl transition-opacity ${isFormDisabled ? 'opacity-60 pointer-events-none' : ''}`}>
          <h2 className="text-xl font-bold text-text-main mb-4">确权申请</h2>
          
          {isFormDisabled && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-base text-red-600 dark:text-red-400">存在待审核记录，禁止重复提交</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Voucher Type */}
            <div>
              <label className="block text-base text-text-sub mb-2">凭证类型</label>
              <div className="flex gap-2">
                {Object.entries(VOUCHER_TYPES).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setVoucherType(key)}
                    className={`flex-1 py-2 px-3 rounded-xl text-base font-medium transition-colors border ${
                      voucherType === key 
                        ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400' 
                        : 'bg-gray-50 dark:bg-gray-800 border-transparent text-text-main'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-base text-text-sub mb-2">确权金额</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="请输入确权金额"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-10 h-12 text-xl font-medium bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-bg-card focus:border-red-500 rounded-xl outline-none transition-colors text-text-main placeholder:text-gray-400 dark:text-gray-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-main font-medium">¥</span>
                {amount && (
                  <button 
                    onClick={() => setAmount('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 p-1"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
              {!isFormDisabled && amount && Number(amount) <= 0 && (
                <p className="text-sm text-red-500 mt-1">请输入正确金额</p>
              )}
            </div>

            {/* Remark */}
            <div>
              <label className="block text-base text-text-sub mb-2">备注说明</label>
              <div className="relative">
                <textarea
                  placeholder="请输入备注信息（选填）"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value.slice(0, 200))}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-bg-card focus:border-red-500 rounded-xl text-md text-text-main resize-none h-24 outline-none transition-colors"
                />
                <span className="absolute bottom-3 right-3 text-sm text-gray-400 dark:text-gray-500">
                  {remark.length}/200
                </span>
              </div>
            </div>

            {/* Images */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-base text-text-sub">凭证图片</label>
                <span className="text-sm text-gray-400 dark:text-gray-500">{images.length}/8 张</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-border-light group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {images.length < 8 && (
                  <button 
                    onClick={handleImageUpload}
                    className="aspect-square rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Upload size={20} />
                    <span className="text-xs">上传图片</span>
                  </button>
                )}
              </div>
              {!isFormDisabled && images.length === 0 && (
                <p className="text-sm text-red-500 mt-2">请上传至少1张凭证图</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              className={`w-full h-12 rounded-xl text-xl font-medium mt-6 ${
                isSubmitDisabled 
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-lg shadow-red-500/30 active:scale-[0.98]'
              }`}
              disabled={isSubmitDisabled || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>提交中...</span>
                </div>
              ) : (
                '提交审核'
              )}
            </Button>
          </div>
        </Card>

        {/* ClaimHistoryList */}
        <Card className="p-4 bg-white dark:bg-bg-card border border-border-light shadow-sm rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-text-main">历史记录</h2>
            <button onClick={handleGoHistory} className="text-base text-text-sub flex items-center">
              查看全部 <ChevronRight size={14} />
            </button>
          </div>
          
          {data.history.length > 0 ? (
            <div className="space-y-3">
              {data.history.map((record) => {
                const statusInfo = STATUS_MAP[record.status as keyof typeof STATUS_MAP];
                return (
                  <div key={record.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex justify-between items-center active:bg-gray-100 dark:active:bg-gray-800 transition-colors cursor-pointer">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-md font-medium text-text-main">
                          {VOUCHER_TYPES[record.type as keyof typeof VOUCHER_TYPES]}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                      <div className="text-sm text-text-sub">{record.time}</div>
                    </div>
                    <div className="text-xl font-bold text-red-500">
                      ¥{record.amount.toLocaleString('zh-CN', { useGrouping: false })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <FileText size={32} className="mb-2 opacity-50" />
              <p className="text-base">暂无历史记录</p>
            </div>
          )}
        </Card>
          </div>
        )}

        {activeTab === 'unlock' && (
          <div className="animate-in fade-in duration-300">
            {unlockStatusError ? (
              <ErrorState
                message={getErrorMessage(unlockStatusError)}
                onRetry={() => void reloadUnlockStatus().catch(() => undefined)}
              />
            ) : (
              <UnlockPanel
                unlockStatus={unlockStatus}
                unlockLoading={unlockLoading}
                onUnlock={handleUnlock}
              />
            )}
          </div>
        )}

        {activeTab === 'growth' && (
          <div className="animate-in fade-in duration-300 -m-4">
            <GrowthRightsContent />
          </div>
        )}

        </div>
    </div>
  );
}
