/**
 * Cashier - 收银台页面（状态机重构版）
 *
 * ✅ 已重构：使用状态机模式管理复杂状态
 * ✅ 解决：2个独立boolean (loading, paying) → 单一状态枚举
 * ✅ 解决：状态互斥问题，防止重复支付
 *
 * @author 树交所前端团队
 * @version 2.0.0（状态机版）
 * @refactored 2026-01-14
 */

import React from 'react';
import { LoadingSpinner } from '../../components/common';
import { Coins, CreditCard, ChevronLeft } from 'lucide-react';
import { Route, RoutePayload } from '../../router/routes';
import { useCashier } from '../../hooks/useCashier';

interface CashierProps {
  orderId: string;
  backRoute?: RoutePayload | null;
  onBack: () => void;
  onNavigate: (route: Route) => void;
}

const Cashier: React.FC<CashierProps> = ({ orderId, backRoute, onBack, onNavigate }) => {
  // ✅ 使用状态机Hook管理所有状态和业务逻辑
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
      onNavigate({
        name: 'order-list',
        kind: payType === 'score' ? 'points' : 'product',
        status: 1,
        back: backRoute || null,
      });
    }
  }, [isSuccess, payType, backRoute, onNavigate]);

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="正在加载订单信息..." />
      </div>
    );
  }

  // 错误状态
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-red-500 text-center mb-4">{error}</div>
        <button
          onClick={handleRetry}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg"
        >
          重试
        </button>
      </div>
    );
  }

  // 订单不存在
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        订单不存在
      </div>
    );
  }

  const isScore = payType === 'score';
  const isCombined = payType === 'combined';

  // Calculate total amounts from order items
  const totalAmount = order.items?.reduce((sum, item) => sum + (Number(item.price) || 0), 0) || 0;
  const totalScoreAmount =
    order.items?.reduce((sum, item) => sum + (Number(item.score_price) || 0), 0) || 0;

  // Dynamic Theme Colors
  const btnBgClass = isScore
    ? 'bg-orange-600 shadow-orange-200'
    : isCombined
      ? 'bg-purple-600 shadow-purple-200'
      : 'bg-blue-600 shadow-blue-200';

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-800">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">收银台</h1>
        <div className="w-8"></div>
      </header>

      <div className="p-6">
        <div className="text-center mb-8">
          <div className="text-sm text-gray-500 mb-2">订单号：{order.order_no}</div>
          <div className="flex items-baseline justify-center gap-1">
            {totalAmount > 0 ? (
              <>
                <div className="text-2xl font-bold text-orange-600 font-mono">
                  ¥{String(totalAmount)}
                </div>
                {totalScoreAmount > 0 && (
                  <span className="text-2xl font-bold text-orange-600 font-mono ml-2">
                    +{totalScoreAmount}消费金
                  </span>
                )}
              </>
            ) : (
              totalScoreAmount > 0 && (
                <div className="text-2xl font-bold text-orange-600 font-mono">
                  {totalScoreAmount}消费金
                </div>
              )
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Payment Method */}
          {isCombined ? (
            <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-purple-100 ring-1 ring-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <div className="flex gap-1">
                    <Coins size={16} />
                    <CreditCard size={16} />
                  </div>
                </div>
                <div>
                  <div className="font-bold text-gray-900">组合支付</div>
                  <div className="text-xs text-gray-500">
                    ¥{totalAmount} + {totalScoreAmount}消费金
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    余额: ¥{userBalance.balance_available} | 消费金:{' '}
                    {Math.floor(Number(userBalance.score))}
                  </div>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-[5px] border-purple-500 bg-white"></div>
            </div>
          ) : (
            <>
              {totalScoreAmount > 0 && (
                <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-orange-100 ring-1 ring-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <Coins size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">消费金支付</div>
                      <div className="text-xs text-gray-500">
                        当前余额: {userBalance.score} 消费金
                      </div>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-[5px] border-orange-500 bg-white"></div>
                </div>
              )}
              {totalAmount > 0 && (
                <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-blue-100 ring-1 ring-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">余额支付</div>
                      <div className="text-xs text-gray-500">
                        当前余额: ¥{userBalance.balance_available}
                      </div>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-[5px] border-blue-600 bg-white"></div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-12">
          <button
            onClick={handlePay}
            disabled={isPaying}
            className={`w-full text-white font-bold py-3.5 rounded-full shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${btnBgClass}`}
          >
            {isPaying ? (
              <>
                <LoadingSpinner size={20} color="white" />
                <span>支付中...</span>
              </>
            ) : (
              '确认支付'
            )}
          </button>
          {isPaying && <p className="text-center text-xs text-gray-400 mt-4">正在支付，请稍候...</p>}
        </div>
      </div>
    </div>
  );
};

export default Cashier;
