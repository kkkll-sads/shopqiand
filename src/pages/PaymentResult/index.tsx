import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, WifiOff, CheckCircle2, AlertCircle, Copy, HeadphonesIcon } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { copyToClipboard } from '../../lib/clipboard';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { openCustomerServiceLink } from '../../lib/customerService';

export const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const { goTo, goBack } = useAppNavigate();
  const { showToast } = useFeedback();
  const handleOpenSupport = () => {
    void openCustomerServiceLink(({ duration, message, type }) => {
      showToast({ duration, message, type });
    });
  };

  const [offline, setOffline] = useState(false);

  const orderInfo = useMemo(() => {
    const statusParam = searchParams.get('status');
    const orderNo = searchParams.get('order_no') ?? '';
    const amountParam = searchParams.get('amount');
    const totalScoreParam = searchParams.get('total_score');
    const errorMsg = searchParams.get('error') ?? '';

    const status: 'success' | 'failure' =
      statusParam === 'success' ? 'success' : statusParam === 'failure' ? 'failure' : 'success';

    const amount = amountParam ? Number(amountParam) : 0;
    const totalScore = totalScoreParam ? Number(totalScoreParam) : 0;
    const payType = searchParams.get('pay_type') ?? '';

    return {
      status,
      orderNo,
      amount: Number.isFinite(amount) ? amount : 0,
      totalScore: Number.isFinite(totalScore) ? totalScore : 0,
      payType,
      errorMessage: errorMsg || '支付失败，请稍后重试或联系客服。',
    };
  }, [searchParams]);

  const handleBack = () => {
    // Usually goes back to home or order list
    goTo('home');
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    copyToClipboard(text).then((ok) => {
      showToast({ message: ok ? '已复制' : '复制失败，请长按手动复制', type: ok ? 'success' : 'error' });
    });
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-border-light">
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}
      <div className="h-12 flex items-center justify-between px-3 pt-safe">
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-xl font-bold text-text-main text-center w-1/3">支付结果</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center pt-12 px-6">
      <div className="w-20 h-20 rounded-full bg-[#00C853]/10 flex items-center justify-center mb-4">
        <CheckCircle2 size={48} className="text-success" />
      </div>
      <h2 className="text-4xl font-bold text-text-main mb-2">支付成功</h2>
      {(orderInfo.payType === 'combined' || orderInfo.payType === 'both') && orderInfo.totalScore > 0 ? (
        <div className="mb-4 flex flex-col items-center gap-1">
          <div className="text-primary-start font-bold flex items-baseline">
            <span className="text-2xl mr-0.5">¥</span>
            <span className="text-5xl leading-none">{(orderInfo.amount || 0).toFixed(2).split('.')[0]}</span>
            <span className="text-2xl">.{(orderInfo.amount || 0).toFixed(2).split('.')[1]}</span>
          </div>
          <div className="text-orange-500 font-bold flex items-baseline">
            <span className="text-3xl leading-none">+{orderInfo.totalScore}</span>
            <span className="text-lg ml-1">消费金</span>
          </div>
        </div>
      ) : orderInfo.payType === 'score' ? (
        <div className="text-6xl font-bold text-text-main mb-1 flex items-baseline">
          <span>{orderInfo.amount > 0 ? orderInfo.amount : 0}</span>
          <span className="text-2xl ml-1">消费金</span>
        </div>
      ) : (
        <div className="text-6xl font-bold text-text-main mb-1 flex items-baseline">
          <span className="text-3xl mr-1">¥</span>
          {orderInfo.amount > 0 ? orderInfo.amount.toFixed(2) : '0.00'}
        </div>
      )}
      <div className="flex items-center text-base text-text-sub mb-10">
        <span className="mr-2">订单号：{orderInfo.orderNo || '--'}</span>
        {orderInfo.orderNo ? (
          <button onClick={() => handleCopy(orderInfo.orderNo)} className="active:opacity-70">
            <Copy size={14} />
          </button>
        ) : null}
      </div>

      <div className="w-full flex space-x-4">
        <button 
          onClick={() => goTo('home')}
          className="flex-1 h-11 rounded-full border border-primary-start text-primary-start text-lg font-medium active:bg-primary-start/5"
        >
          继续逛逛
        </button>
        <button 
          onClick={() => goTo('order')}
          className="flex-1 h-11 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white text-lg font-medium shadow-sm active:opacity-80"
        >
          查看订单
        </button>
      </div>
    </div>
  );

  const renderFailure = () => (
    <div className="flex flex-col items-center pt-12 px-6">
      <div className="w-20 h-20 rounded-full bg-primary-start/10 flex items-center justify-center mb-4">
        <AlertCircle size={48} className="text-primary-start" />
      </div>
      <h2 className="text-4xl font-bold text-text-main mb-6">支付失败</h2>
      
      <div className="w-full bg-bg-base rounded-xl p-4 mb-10 relative">
        <div className="text-base text-text-sub leading-relaxed pr-8">
          {orderInfo.errorMessage}
        </div>
        <button 
          onClick={() => handleCopy(orderInfo.errorMessage)} 
          className="absolute top-4 right-4 text-text-aux active:text-text-main"
          title="复制错误信息"
        >
          <Copy size={16} />
        </button>
      </div>

      <div className="w-full flex space-x-4 mb-6">
        <button 
          onClick={() => goTo('cashier')}
          className="flex-1 h-11 rounded-full border border-primary-start text-primary-start text-lg font-medium active:bg-primary-start/5"
        >
          更换方式
        </button>
        <button 
          onClick={() => goTo('cashier')}
          className="flex-1 h-11 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white text-lg font-medium shadow-sm active:opacity-80"
        >
          重新支付
        </button>
      </div>

      <button 
        className="flex items-center text-base text-text-sub active:opacity-70"
        onClick={handleOpenSupport}
      >
        <HeadphonesIcon size={14} className="mr-1" />
        联系客服
      </button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative h-full overflow-hidden">
      {renderHeader()}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {orderInfo.status === 'success' ? renderSuccess() : renderFailure()}
      </div>
    </div>
  );
};
