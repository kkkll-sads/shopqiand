import React from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PaymentCheckingStepProps {
  refreshing: boolean;
  onComplete: () => void;
  onRefreshUrl?: () => Promise<void>;
}

const PaymentCheckingStep: React.FC<PaymentCheckingStepProps> = ({
  refreshing,
  onComplete,
  onRefreshUrl,
}) => (
  <div className="w-full max-w-sm text-center">
    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
      <CheckCircle size={40} className="text-green-500" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">请确认支付结果</h3>
    <p className="text-gray-500 text-sm mb-8">如果您已在支付页面完成付款，请点击下方按钮</p>

    <div className="space-y-3">
      <button
        onClick={onComplete}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-200 active:scale-[0.98] transition-all"
      >
        ✓ 已完成支付
      </button>

      {onRefreshUrl && (
        <button
          onClick={onRefreshUrl}
          disabled={refreshing}
          className="w-full bg-gray-100 text-gray-600 font-medium py-4 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {refreshing ? (
            <>
              <LoadingSpinner size="sm" />
              获取新链接...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              支付遇到问题，获取新链接
            </>
          )}
        </button>
      )}
    </div>
  </div>
);

export default PaymentCheckingStep;
