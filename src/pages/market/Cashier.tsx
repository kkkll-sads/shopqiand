/**
 * Cashier - 收银台页面（状态机重构版）
 *
 * ✅ 已重构：使用状态机模式管理复杂状态
 * ✅ 现代化UI设计
 *
 * @author 树交所前端团队
 * @version 3.0.0（现代化UI版）
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingSpinner } from '../../../components/common';
import { Coins, CreditCard, ChevronLeft, ShieldCheck, Wallet, Sparkles } from 'lucide-react';
import { useCashier } from '../../../hooks/useCashier';
import { sum, toNumber } from '../../../utils/currency';

const Cashier: React.FC = () => {
  const navigate = useNavigate();
  const { orderId = '' } = useParams<{ orderId?: string }>();

  const {
    state,
    context,
    isLoading,
    isReady,
    isPaying,
    isSuccess,
    hasError,
    handlePay,
    handleRetry,
  } = useCashier(orderId);

  const { order, error, payType, userBalance } = context;

  // 支付成功后跳转
  React.useEffect(() => {
    if (isSuccess) {
      const category = payType === 'score' ? 'points' : 'product';
      navigate(`/orders/${category}/1`, { replace: true });
    }
  }, [isSuccess, payType, navigate]);

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 text-sm">正在加载订单信息...</p>
      </div>
    );
  }

  // 错误状态
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <span className="text-4xl">😔</span>
        </div>
        <p className="text-gray-900 text-center mb-2 font-medium">加载失败</p>
        <p className="text-gray-500 text-sm text-center mb-6">{error}</p>
        <button
          onClick={handleRetry}
          className="px-8 py-3 bg-red-600 text-white rounded-full font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-transform"
        >
          重试
        </button>
      </div>
    );
  }

  // 订单不存在
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Wallet className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-500">订单不存在</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 px-6 py-2.5 bg-gray-200 text-gray-600 rounded-full text-sm active:scale-95 transition-transform"
        >
          返回
        </button>
      </div>
    );
  }

  const isScore = payType === 'score';
  const isCombined = payType === 'combined';

  // 使用精确的金额计算工具（避免浮点数精度问题）
  const totalAmount = toNumber(
    sum(order.items?.map(item => item.price || 0) || [])
  );
  const totalScoreAmount = toNumber(
    sum(order.items?.map(item => item.score_price || 0) || [])
  );

  // 主题色 - 统一使用红/金/蓝配色，背景保持白色
  const themeColor = isScore
    ? 'text-red-600'
    : isCombined
      ? 'text-red-600'
      : 'text-blue-600';

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      {/* Header - 简约白底 */}
      <header className="bg-white sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full active:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">收银台</h1>
        <div className="w-10" />
      </header>

      <div className="p-6 pt-10">
        {/* 金额展示区 */}
        <div className="text-center mb-10">
          <p className="text-gray-500 text-sm mb-2 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-green-500" />
            安全支付
          </p>
          <div className="flex items-baseline justify-center gap-1">
            {totalAmount > 0 ? (
              <>
                <span className="text-gray-900 text-lg font-bold">¥</span>
                <span className={`text-5xl font-bold ${themeColor} font-[DINAlternate-Bold] tracking-tight`}>
                  {totalAmount.toFixed(2)}
                </span>
                {totalScoreAmount > 0 && (
                  <span className="text-xl font-bold text-red-600 ml-2">
                    +{totalScoreAmount}消费金
                  </span>
                )}
              </>
            ) : (
              totalScoreAmount > 0 && (
                <span className="text-5xl font-bold text-red-600 font-[DINAlternate-Bold]">
                  {totalScoreAmount}<span className="text-2xl ml-1 text-gray-900">消费金</span>
                </span>
              )
            )}
          </div>
          <p className="text-gray-400 text-xs mt-3 font-mono">订单号：{order.order_no}</p>
        </div>

        {/* 支付方式卡片 */}
        <div className="space-y-3 mb-10">
          {isCombined ? (
            <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                    <Sparkles size={24} className="text-red-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base">组合支付</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      ¥{totalAmount} + {totalScoreAmount}消费金
                    </p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs">
                <span className="text-gray-500">余额：¥{userBalance.balance_available}</span>
                <span className="text-gray-500">消费金：{Math.floor(Number(userBalance.score))}</span>
              </div>
            </div>
          ) : (
            <>
              {totalScoreAmount > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                        <Coins size={24} className="text-red-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-base">消费金支付</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          余额：{userBalance.score} 消费金
                        </p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              )}
              {totalAmount > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <CreditCard size={24} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-base">余额支付</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          余额：¥{userBalance.balance_available}
                        </p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 支付按钮 */}
        <button
          onClick={handlePay}
          disabled={isPaying}
          className={`w-full py-4 rounded-full font-bold text-lg text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${isScore || isCombined
            ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/30'
            : 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-500/30'
            }`}
        >
          <span className="flex items-center justify-center gap-2">
            {isPaying ? (
              <>
                <LoadingSpinner size={20} color="white" />
                <span>支付中...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={20} />
                确认支付
              </>
            )}
          </span>
        </button>

        {isPaying && (
          <p className="text-center text-gray-400 text-xs mt-4">
            正在处理支付，请稍候...
          </p>
        )}

        {/* 安全提示 */}
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-300 text-xs">
          <ShieldCheck size={12} />
          <span>树交所安全支付保障</span>
        </div>
      </div>
    </div>
  );
};

export default Cashier;
