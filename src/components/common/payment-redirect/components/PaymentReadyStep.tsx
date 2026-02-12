import React from 'react';
import { AlertTriangle, ArrowRight, Check, Clock, Copy, CreditCard, RefreshCw, ShieldCheck } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PaymentReadyStepProps {
  amount?: string | number;
  orderNo?: string;
  copiedOrderNo?: boolean;
  timeout: number;
  isExpired: boolean;
  refreshing: boolean;
  onCopyOrderNo?: () => void;
  onRefreshUrl?: () => Promise<void>;
  onOpenPayment: () => void;
}

const PaymentReadyStep: React.FC<PaymentReadyStepProps> = ({
  amount,
  orderNo,
  copiedOrderNo = false,
  timeout,
  isExpired,
  refreshing,
  onCopyOrderNo,
  onRefreshUrl,
  onOpenPayment,
}) => (
  <div className="w-full max-w-sm text-center">
    {amount && (
      <div className="mb-6">
        <p className="text-gray-500 text-sm mb-2">支付金额</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-gray-900 text-xl font-bold">¥</span>
          <span className="text-5xl font-bold text-red-600 font-[DINAlternate-Bold]">
            {typeof amount === 'number' ? amount.toFixed(2) : amount}
          </span>
        </div>
        {orderNo && (
          <div className="text-gray-400 text-xs mt-3 font-mono flex items-center justify-center gap-1.5">
            <span>订单号：{orderNo}</span>
            {onCopyOrderNo && (
              <button
                type="button"
                className="p-0.5 rounded text-gray-400 active:bg-gray-100"
                onClick={onCopyOrderNo}
                aria-label="复制订单号"
              >
                {copiedOrderNo ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
              </button>
            )}
          </div>
        )}
      </div>
    )}

    <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
      <div className="flex items-start gap-2">
        <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700 space-y-1">
          <p className="font-bold">重要提醒：</p>
          <p>• 请勿修改支付金额，否则无法到账</p>
          <p>• 请勿保存二维码稍后支付</p>
          <p>• 支付链接 {Math.floor(timeout / 60)} 分钟内有效</p>
        </div>
      </div>
    </div>

    <button
      onClick={onOpenPayment}
      disabled={isExpired}
      className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
        isExpired
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200 active:scale-[0.98]'
      }`}
    >
      {isExpired ? (
        <>
          <Clock size={20} />
          链接已过期
        </>
      ) : (
        <>
          <CreditCard size={20} />
          去支付
          <ArrowRight size={18} />
        </>
      )}
    </button>

    {isExpired && onRefreshUrl && (
      <button
        onClick={onRefreshUrl}
        disabled={refreshing}
        className="mt-3 w-full py-3 rounded-xl font-medium bg-gray-100 text-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        {refreshing ? (
          <>
            <LoadingSpinner size="sm" />
            获取新链接...
          </>
        ) : (
          <>
            <RefreshCw size={16} />
            获取新支付链接
          </>
        )}
      </button>
    )}

    <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-xs">
      <ShieldCheck size={14} />
      <span>安全支付保障</span>
    </div>
  </div>
);

export default PaymentReadyStep;
