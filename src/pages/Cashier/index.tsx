import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  WifiOff,
  RefreshCcw,
  Copy,
  CheckCircle2,
  Circle,
  Wallet,
  Coins,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { shopOrderApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Skeleton } from '../../components/ui/Skeleton';
import { copyToClipboard } from '../../lib/clipboard';
import { useAppNavigate } from '../../lib/navigation';

/**
 * 支付方式定义
 * 根据订单的 pay_type 动态决定可选的支付方式
 */
interface PaymentMethod {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

export const CashierPage = () => {
  const [searchParams] = useSearchParams();
  const { goBack, navigate } = useAppNavigate();
  const { showToast, showLoading, hideLoading } = useFeedback();

  /* ---- 从 URL 参数获取订单信息 ---- */
  const orderId = Number(searchParams.get('order_id')) || 0;
  const orderNoParam = searchParams.get('order_no') ?? '';
  const amountParam = Number(searchParams.get('amount')) || 0;
  const scoreParam = Number(searchParams.get('total_score')) || 0;
  const payTypeParam = searchParams.get('pay_type') ?? '';
  const balanceParam = searchParams.get('balance') ?? '0';
  const scoreBalanceParam = searchParams.get('score_balance') ?? '0';

  const displayOrderNo = orderNoParam || '--';

  /* ---- 判断支付类型 ---- */
  /** 是否为纯消费金支付 */
  const isScoreOnly = payTypeParam === 'score' || (scoreParam > 0 && amountParam <= 0);
  /** 是否为纯人民币支付 */
  const isMoneyOnly = payTypeParam === 'money' || (amountParam > 0 && scoreParam <= 0);

  /* ---- 状态 ---- */
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(isScoreOnly ? 'score' : 'balance');
  const [timeLeft, setTimeLeft] = useState(29 * 60 + 59);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [paying, setPaying] = useState(false);

  /* ---- 根据 pay_type 动态生成支付方式列表 ---- */
  const paymentMethods = useMemo<PaymentMethod[]>(() => {
    if (isScoreOnly) {
      return [
        {
          id: 'score',
          name: '消费金支付',
          desc: `可用消费金 ${Number(scoreBalanceParam).toLocaleString('zh-CN')}`,
          icon: Coins,
          color: 'text-orange-500',
          bg: 'bg-orange-50',
        },
      ];
    }
    if (isMoneyOnly) {
      return [
        {
          id: 'balance',
          name: '余额支付',
          desc: `可用余额 ¥${Number(balanceParam).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
          icon: Wallet,
          color: 'text-primary-start',
          bg: 'bg-primary-start/10',
        },
      ];
    }
    // combined 混合支付
    return [
      {
        id: 'balance',
        name: '余额支付',
        desc: `可用余额 ¥${Number(balanceParam).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
        icon: Wallet,
        color: 'text-primary-start',
        bg: 'bg-primary-start/10',
      },
      {
        id: 'score',
        name: '消费金支付',
        desc: `可用消费金 ${Number(scoreBalanceParam).toLocaleString('zh-CN')}`,
        icon: Coins,
        color: 'text-orange-500',
        bg: 'bg-orange-50',
      },
    ];
  }, [isScoreOnly, isMoneyOnly, balanceParam, scoreBalanceParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 || loading || moduleError) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, moduleError]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleBack = () => {
    goBack();
  };

  const handleCopy = () => {
    if (!displayOrderNo || displayOrderNo === '--') return;
    copyToClipboard(displayOrderNo).then((ok) => {
      showToast({ message: ok ? '已复制订单号' : '复制失败，请长按手动复制', type: ok ? 'success' : 'error' });
    });
  };

  const handlePay = async () => {
    if (paying) return;

    if (orderId <= 0) {
      showToast({ message: '订单信息无效，请返回重新下单', type: 'error' });
      return;
    }

    setPaying(true);
    showLoading('支付中...');
    try {
      const payParams: { order_id: number; pay_money?: number; pay_score?: number } = {
        order_id: orderId,
      };

      if (isScoreOnly) {
        payParams.pay_score = scoreParam;
        payParams.pay_money = 0;
      } else if (isMoneyOnly) {
        payParams.pay_money = amountParam;
        payParams.pay_score = 0;
      } else {
        // 混合支付
        payParams.pay_money = amountParam;
        payParams.pay_score = scoreParam;
      }

      const result = await shopOrderApi.pay(payParams);

      const params = new URLSearchParams({
        status: 'success',
        order_no: result.order_no,
        pay_type: payTypeParam,
      });
      if (isScoreOnly) {
        params.set('amount', String(result.pay_score ?? 0));
      } else if (isMoneyOnly) {
        params.set('amount', String(result.pay_money ?? 0));
      } else {
        params.set('amount', String(result.pay_money ?? 0));
        params.set('total_score', String(result.pay_score ?? 0));
      }
      navigate(`/payment/result?${params.toString()}`, { replace: true });
    } catch (error) {
      const msg = getErrorMessage(error);
      showToast({ message: msg, type: 'error', duration: 3000 });
      setShowFailureModal(true);
    } finally {
      hideLoading();
      setPaying(false);
    }
  };

  /* ---- 渲染应付金额显示 ---- */
  const renderAmountDisplay = () => {
    if (isScoreOnly) {
      return (
        <div className="text-primary-start font-bold mb-4 flex items-baseline">
          <span className="text-7xl leading-none">{scoreParam}</span>
          <span className="text-2xl ml-1">消费金</span>
        </div>
      );
    }
    if (isMoneyOnly) {
      return (
        <div className="text-primary-start font-bold mb-4 flex items-baseline">
          <span className="text-3xl mr-0.5">¥</span>
          <span className="text-7xl leading-none">{amountParam.toFixed(2).split('.')[0]}</span>
          <span className="text-3xl">.{amountParam.toFixed(2).split('.')[1]}</span>
        </div>
      );
    }
    // 混合支付：显示两行
    return (
      <div className="mb-4 flex flex-col items-center gap-1">
        <div className="text-primary-start font-bold flex items-baseline">
          <span className="text-2xl mr-0.5">¥</span>
          <span className="text-5xl leading-none">{amountParam.toFixed(2).split('.')[0]}</span>
          <span className="text-2xl">.{amountParam.toFixed(2).split('.')[1]}</span>
        </div>
        <div className="text-orange-500 font-bold flex items-baseline">
          <span className="text-3xl leading-none">+{scoreParam}</span>
          <span className="text-lg ml-1">消费金</span>
        </div>
      </div>
    );
  };

  /* ---- 底部按钮文字 ---- */
  const payButtonText = () => {
    if (isScoreOnly) return `确认支付 ${scoreParam}消费金`;
    if (isMoneyOnly) return `确认支付 ¥${amountParam.toFixed(2)}`;
    return `确认支付 ¥${amountParam.toFixed(2)} + ${scoreParam}消费金`;
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-border-light">
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button
            onClick={() => setOffline(false)}
            className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm"
          >
            刷新
          </button>
        </div>
      )}
      <div className="h-12 flex items-center justify-between px-3 pt-safe">
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-xl font-bold text-text-main text-center w-1/3">收银台</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-3">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-3 shadow-sm flex flex-col items-center">
        <Skeleton className="w-16 h-4 mb-3" />
        <Skeleton className="w-32 h-10 mb-4" />
        <Skeleton className="w-48 h-6 rounded-full" />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-2 mb-3 shadow-sm">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center p-3">
            <Skeleton className="w-6 h-6 rounded-full mr-3 shrink-0" />
            <div className="flex-1">
              <Skeleton className="w-24 h-4 mb-1" />
              <Skeleton className="w-32 h-3" />
            </div>
            <Skeleton className="w-5 h-5 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (moduleError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <RefreshCcw size={32} className="text-text-aux mb-3" />
          <p className="text-md text-text-sub mb-4">加载失败，请检查网络</p>
          <button
            onClick={() => {
              setLoading(true);
              setModuleError(false);
            }}
            className="px-6 py-2 border border-border-light rounded-full text-base text-text-main bg-white dark:bg-gray-900 shadow-sm active:bg-bg-base"
          >
            重试
          </button>
        </div>
      );
    }

    if (loading) {
      return renderSkeleton();
    }

    return (
      <div className="p-3 pb-24">
        {/* Countdown */}
        <div className="flex justify-center mb-3">
          <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            支付剩余时间 {formatTime(timeLeft)}
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 p-6 flex flex-col items-center">
          <span className="text-base text-text-sub mb-2">应付金额</span>
          {renderAmountDisplay()}
          <div className="flex items-center text-sm text-text-sub bg-bg-base px-3 py-1.5 rounded-full max-w-full cursor-pointer" onClick={handleCopy}>
            <span className="truncate mr-2">订单号：{displayOrderNo}</span>
            <span className="flex items-center text-text-main font-medium shrink-0 whitespace-nowrap">
              <Copy size={12} className="mr-1" />
              复制
            </span>
          </div>
        </div>

        {/* Payment Methods Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-4 overflow-hidden">
          {paymentMethods.map((method, index) => (
            <div
              key={method.id}
              className={`flex items-center p-4 active:bg-bg-base transition-colors cursor-pointer ${
                index !== paymentMethods.length - 1 ? 'border-b border-border-light/50' : ''
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div
                className={`w-6 h-6 rounded-full ${method.bg} flex items-center justify-center shrink-0`}
              >
                <method.icon size={14} className={method.color} />
              </div>

              <div className="flex-1 ml-3 min-w-0">
                <div className="text-md text-text-main font-medium truncate">{method.name}</div>
                <div className="text-sm text-text-sub truncate mt-0.5">{method.desc}</div>
              </div>

              <div className="ml-3 shrink-0">
                {selectedMethod === method.id ? (
                  <CheckCircle2 size={20} className="text-primary-start fill-primary-start/10" />
                ) : (
                  <Circle size={20} className="text-text-aux" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Security Hint */}
        <div className="flex items-center justify-center text-text-sub text-s">
          <ShieldCheck size={12} className="mr-1" />
          <span>支付安全由树交所及合作机构保障</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative h-full overflow-hidden">
      {renderHeader()}

      <div className="flex-1 overflow-y-auto no-scrollbar relative">{renderContent()}</div>

      {/* Bottom Fixed Bar */}
      {!moduleError && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border-light px-4 py-3 z-40 pb-safe">
          <button
            onClick={handlePay}
            disabled={paying || orderId <= 0}
            className="w-full h-11 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white text-lg font-medium shadow-sm active:opacity-80 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {paying ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                支付中...
              </>
            ) : (
              payButtonText()
            )}
          </button>
        </div>
      )}

      {/* Payment Failure Modal */}
      {showFailureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-10">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full overflow-hidden flex flex-col items-center pt-6 pb-5 px-5 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <AlertCircle size={24} className="text-primary-start" />
            </div>
            <h3 className="text-xl font-bold text-text-main mb-2">支付失败</h3>
            <p className="text-base text-text-sub text-center mb-6 leading-relaxed">
              余额不足或支付异常，请稍后重试。
            </p>
            <div className="w-full flex space-x-3">
              <button
                onClick={() => setShowFailureModal(false)}
                className="flex-1 h-10 rounded-full border border-border-light text-md font-medium text-text-main active:bg-bg-base"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowFailureModal(false);
                  handlePay();
                }}
                className="flex-1 h-10 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-md font-medium text-white active:opacity-80 shadow-sm"
              >
                重新支付
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
