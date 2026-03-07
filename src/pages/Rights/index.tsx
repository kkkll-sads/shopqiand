import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, FileText, Info, AlertCircle, CheckCircle2, Clock, XCircle, Upload, X, ChevronRight, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

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
    unlocked_count: 2,
    available_quota: 50000,
  },
  growth: {
    growth_days: 15,
    stage: 2,
    stages: ['启航', '进阶', '卓越', '巅峰'],
    today_trade_count: 3,
    financing: { ratio: '1.5%', rules: '每日收益结算' },
    cycle: '30天/周期',
    profit_distribution: { score_percent: 30, balance_percent: 70 },
    calendar: {
      year: 2026,
      month: 2,
      records: [
        { day: 1, count: 2 }, { day: 2, count: 5 }, { day: 3, count: 1 }, 
        { day: 5, count: 3 }, { day: 8, count: 2 }, { day: 9, count: 4 }, 
        { day: 10, count: 1 }, { day: 14, count: 2 }, { day: 15, count: 6 }, 
        { day: 16, count: 1 }, { day: 20, count: 3 }, { day: 21, count: 2 }, 
        { day: 22, count: 1 }, { day: 25, count: 4 }, { day: 26, count: 2 }, 
        { day: 27, count: 1 }, { day: 28, count: 3 }
      ]
    },
    daily_growth_logs: [
      { id: 'l1', text: '完成每日签到', time: '今天 08:00' },
      { id: 'l2', text: '交易达标奖励', time: '昨天 15:30' },
      { id: 'l3', text: '解锁新阶段', time: '3天前' },
    ]
  }
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
      // Show success toast (mock)
      alert('提交成功');
    }, 300);
  };

  const isFormDisabled = data.pending_count > 0;
  const isSubmitDisabled = isFormDisabled || !amount || Number(amount) <= 0 || images.length === 0;

  const renderCalendar = () => {
    const { year, month, records } = data.growth.calendar;
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-9 h-12" />);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const record = records.find(r => r.day === i);
      const isActive = !!record;
      days.push(
        <div key={i} className="flex flex-col items-center justify-start w-9 h-12">
          <div 
            className={`w-7 h-7 rounded-full flex items-center justify-center text-base ${
              isActive 
                ? 'bg-red-500 text-white font-medium shadow-sm shadow-red-500/30' 
                : 'text-text-main hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {i}
          </div>
          <div className="h-4 flex items-center justify-center mt-0.5">
            {isActive && (
              <span className="text-2xs text-red-500 font-medium scale-90 whitespace-nowrap">
                {record.count}次
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="mb-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-medium text-text-main">成长日历</h3>
          <span className="text-sm text-text-sub">{year}年{month}月</span>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
          <div className="grid grid-cols-7 gap-y-2 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="text-center text-sm text-text-sub font-medium">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-2 place-items-center">
            {days}
          </div>
        </div>
      </div>
    );
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
      <div className="flex px-4 bg-white dark:bg-bg-card border-b border-border-light sticky top-12 z-10 pt-2">
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

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        
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
                      ¥{record.amount.toLocaleString()}
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
            <Card className="p-4 bg-white dark:bg-bg-card border border-border-light shadow-sm rounded-2xl">
              <div className="space-y-3 mb-5">
                {data.unlock.conditions.map(cond => (
                  <div key={cond.id} className="flex items-center gap-2">
                    {cond.met ? (
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                    )}
                    <span className={`text-base ${cond.met ? 'text-text-main' : 'text-text-sub'}`}>
                      {cond.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-text-sub">解锁进度</span>
                  <span className="font-medium text-text-main">
                    {data.unlock.current_gold.toLocaleString()} / {data.unlock.required_gold.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (data.unlock.current_gold / data.unlock.required_gold) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 text-sm text-text-sub bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                <div>已解锁: <span className="text-text-main font-medium">{data.unlock.unlocked_count}</span> 次</div>
                <div>可用额度: <span className="text-text-main font-medium">¥{data.unlock.available_quota.toLocaleString()}</span></div>
              </div>

              <Button
                className={`w-full h-12 rounded-xl text-xl font-medium ${
                  data.unlock.can_unlock
                    ? 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-lg shadow-red-500/30 active:scale-[0.98]'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
                disabled={!data.unlock.can_unlock}
              >
                {data.unlock.can_unlock ? '立即解锁' : '暂不满足解锁条件'}
              </Button>
            </Card>
          </div>
        )}

        {activeTab === 'growth' && (
          <div className="animate-in fade-in duration-300">
            <Card className="p-4 bg-white dark:bg-bg-card border border-border-light shadow-sm rounded-2xl">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="text-sm text-text-sub mb-1">累计成长</div>
                  <div className="text-4xl font-bold text-text-main">
                    {data.growth.growth_days} <span className="text-sm font-normal text-text-sub">天</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="text-sm text-text-sub mb-1">今日交易</div>
                  <div className="text-4xl font-bold text-text-main">
                    {data.growth.today_trade_count} <span className="text-sm font-normal text-text-sub">次</span>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-base font-medium text-text-main">当前阶段: {data.growth.stages[data.growth.stage - 1]}</span>
                  <span className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded">
                    Lv.{data.growth.stage}
                  </span>
                </div>
                <div className="flex justify-between items-center relative">
                  <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gray-100 dark:bg-gray-800 -translate-y-1/2 z-0" />
                  <div 
                    className="absolute top-1/2 left-0 h-[2px] bg-red-500 -translate-y-1/2 z-0 transition-all duration-500" 
                    style={{ width: `${((data.growth.stage - 1) / (data.growth.stages.length - 1)) * 100}%` }}
                  />
                  {data.growth.stages.map((s, i) => {
                    const isPassed = i < data.growth.stage;
                    const isCurrent = i === data.growth.stage - 1;
                    return (
                      <div key={i} className="relative z-10 flex flex-col items-center gap-1">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                          isPassed ? 'bg-red-500 border-red-500' : 
                          isCurrent ? 'bg-white dark:bg-bg-card border-red-500' : 
                          'bg-white dark:bg-bg-card border-gray-200 dark:border-gray-700'
                        }`}>
                          {isPassed && <Check size={10} className="text-white" />}
                        </div>
                        <span className={`text-xs ${isCurrent || isPassed ? 'text-text-main font-medium' : 'text-text-sub'}`}>
                          {s}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-base">
                  <span className="text-text-sub">理财比例</span>
                  <span className="font-medium text-text-main">{data.growth.financing.ratio} ({data.growth.financing.rules})</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-base">
                  <span className="text-text-sub">解锁周期</span>
                  <span className="font-medium text-text-main">{data.growth.cycle}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-base">
                  <span className="text-text-sub">收益分配</span>
                  <span className="font-medium text-text-main">
                    积分 {data.growth.profit_distribution.score_percent}% / 余额 {data.growth.profit_distribution.balance_percent}%
                  </span>
                </div>
              </div>

              {renderCalendar()}

              <div className="mb-5">
                <h3 className="text-base font-medium text-text-main mb-2">最近动态</h3>
                {data.growth.daily_growth_logs.length > 0 ? (
                  <div className="space-y-2">
                    {data.growth.daily_growth_logs.map(log => (
                      <div key={log.id} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        <span className="text-text-main flex-1 truncate">{log.text}</span>
                        <span className="text-text-sub shrink-0">{log.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-text-sub text-center py-2">暂无动态</div>
                )}
              </div>

              <Button
                className="w-full h-12 rounded-xl text-xl font-medium bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                disabled={true}
              >
                条件未满足，暂不可解锁
              </Button>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
