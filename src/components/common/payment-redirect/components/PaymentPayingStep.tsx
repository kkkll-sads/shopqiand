import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PaymentPayingStepProps {
  refreshing: boolean;
  onDone: () => void;
  onRefreshUrl?: () => Promise<void>;
}

const PaymentPayingStep: React.FC<PaymentPayingStepProps> = ({
  refreshing,
  onDone,
  onRefreshUrl,
}) => (
  <div className="w-full max-w-sm text-center">
    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
      <LoadingSpinner size="lg" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">已打开支付页面</h3>
    <p className="text-gray-500 text-sm mb-6">请在新打开的标签页中完成支付</p>

    <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
      <div className="flex items-start gap-2">
        <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700 space-y-1">
          <p className="font-bold">请注意：</p>
          <p>• 请勿修改支付金额</p>
          <p>• 请勿保存二维码稍后支付</p>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <button
        onClick={onDone}
        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white active:scale-[0.98] transition-all"
      >
        我已完成支付
      </button>

      {onRefreshUrl && (
        <button onClick={onRefreshUrl} disabled={refreshing} className="flex items-center justify-center gap-2 text-red-600 font-medium mx-auto">
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
    </div>
  </div>
);

export default PaymentPayingStep;
