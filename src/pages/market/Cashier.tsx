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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
          <LoadingSpinner />
        </div>
        <p className="mt-4 text-white/70 text-sm animate-pulse">正在加载订单信息...</p>
      </div>
    );
  }

  // 错误状态
  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/50 to-slate-900 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <span className="text-4xl">😔</span>
        </div>
        <p className="text-white/90 text-center mb-2 font-medium">加载失败</p>
        <p className="text-white/50 text-sm text-center mb-6">{error}</p>
        <button
          onClick={handleRetry}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition-transform"
        >
          重试
        </button>
      </div>
    );
  }

  // 订单不存在
  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
          <Wallet className="w-10 h-10 text-white/50" />
        </div>
        <p className="text-white/70">订单不存在</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 px-6 py-2.5 bg-white/10 text-white rounded-full text-sm active:scale-95 transition-transform"
        >
          返回
        </button>
      </div>
    );
  }

  const isScore = payType === 'score';
  const isCombined = payType === 'combined';

  const totalAmount = order.items?.reduce((sum, item) => sum + (Number(item.price) || 0), 0) || 0;
  const totalScoreAmount = order.items?.reduce((sum, item) => sum + (Number(item.score_price) || 0), 0) || 0;

  // 主题色
  const themeGradient = isScore
    ? 'from-orange-500 via-amber-500 to-yellow-500'
    : isCombined
      ? 'from-purple-500 via-pink-500 to-rose-500'
      : 'from-blue-500 via-cyan-500 to-teal-500';

  const themeBg = isScore
    ? 'from-orange-950 via-amber-950 to-orange-950'
    : isCombined
      ? 'from-purple-950 via-pink-950 to-purple-950'
      : 'from-blue-950 via-cyan-950 to-blue-950';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeBg} pb-safe relative overflow-hidden`}>
      {/* 装饰背景 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-30">
        <div className={`absolute inset-0 bg-gradient-to-br ${themeGradient} rounded-full blur-3xl`} />
      </div>
      <div className="absolute top-20 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      <div className="absolute bottom-40 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
      
      {/* Header */}
      <header className="relative z-10 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2.5 -ml-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 hover:bg-white/20 transition-colors active:scale-95"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-white">收银台</h1>
        <div className="w-10" />
      </header>

      <div className="relative z-10 px-6 pt-8">
        {/* 金额展示区 */}
        <div className="text-center mb-10">
          <p className="text-white/50 text-sm mb-3 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} />
            安全支付
          </p>
          <div className="flex items-baseline justify-center gap-1">
            {totalAmount > 0 ? (
              <>
                <span className="text-white/60 text-lg">¥</span>
                <span className={`text-5xl font-black bg-gradient-to-r ${themeGradient} bg-clip-text text-transparent font-mono tracking-tight`}>
                  {totalAmount.toFixed(2)}
                </span>
                {totalScoreAmount > 0 && (
                  <span className={`text-xl font-bold bg-gradient-to-r ${themeGradient} bg-clip-text text-transparent ml-2`}>
                    +{totalScoreAmount}消费金
                  </span>
                )}
              </>
            ) : (
              totalScoreAmount > 0 && (
                <span className={`text-5xl font-black bg-gradient-to-r ${themeGradient} bg-clip-text text-transparent font-mono`}>
                  {totalScoreAmount}<span className="text-2xl ml-1">消费金</span>
                </span>
              )
            )}
          </div>
          <p className="text-white/40 text-xs mt-3 font-mono">订单号：{order.order_no}</p>
        </div>

        {/* 支付方式卡片 */}
        <div className="space-y-3 mb-10">
          {isCombined ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${themeGradient} flex items-center justify-center shadow-lg`}>
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">组合支付</p>
                    <p className="text-white/50 text-xs mt-0.5">
                      ¥{totalAmount} + {totalScoreAmount}消费金
                    </p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${themeGradient} flex items-center justify-center`}>
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs">
                <span className="text-white/40">余额：¥{userBalance.balance_available}</span>
                <span className="text-white/40">消费金：{Math.floor(Number(userBalance.score))}</span>
              </div>
            </div>
          ) : (
            <>
              {totalScoreAmount > 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-orange-500/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <Coins size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-base">消费金支付</p>
                        <p className="text-white/50 text-xs mt-0.5">
                          余额：{userBalance.score} 消费金
                        </p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              )}
              {totalAmount > 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-blue-500/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <CreditCard size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-base">余额支付</p>
                        <p className="text-white/50 text-xs mt-0.5">
                          余额：¥{userBalance.balance_available}
                        </p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
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
          className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-2xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r ${themeGradient} relative overflow-hidden group`}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative flex items-center justify-center gap-2">
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
          <p className="text-center text-white/40 text-xs mt-4 animate-pulse">
            正在处理支付，请稍候...
          </p>
        )}

        {/* 安全提示 */}
        <div className="mt-8 flex items-center justify-center gap-2 text-white/30 text-xs">
          <ShieldCheck size={12} />
          <span>树交所安全支付保障</span>
        </div>
      </div>
    </div>
  );
};

export default Cashier;
