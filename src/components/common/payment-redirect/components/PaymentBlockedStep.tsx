import React from 'react';
import { AlertCircle, CheckCircle, Copy, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PaymentBlockedStepProps {
  currentUrl: string;
  copied: boolean;
  refreshing: boolean;
  onCopyLink: () => void;
  onRefreshUrl?: () => Promise<void>;
  onDone: () => void;
}

const PaymentBlockedStep: React.FC<PaymentBlockedStepProps> = ({
  currentUrl,
  copied,
  refreshing,
  onCopyLink,
  onRefreshUrl,
  onDone,
}) => (
  <div className="w-full max-w-sm text-center">
    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
      <AlertCircle size={40} className="text-amber-500" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">浏览器拦截了弹窗</h3>
    <p className="text-gray-500 text-sm mb-6">请手动复制链接到浏览器打开</p>

    <div className="bg-gray-100 rounded-xl p-3 mb-4 text-left">
      <p className="text-xs text-gray-500 mb-1">支付链接</p>
      <p className="text-sm text-gray-700 break-all line-clamp-2">{currentUrl}</p>
    </div>

    <div className="space-y-3">
      <button
        onClick={onCopyLink}
        className={`w-full py-3 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
          copied
            ? 'bg-green-500 text-white'
            : 'bg-gradient-to-r from-red-500 to-red-600 text-white active:scale-[0.98]'
        }`}
      >
        {copied ? (
          <>
            <CheckCircle size={18} />
            已复制
          </>
        ) : (
          <>
            <Copy size={18} />
            复制链接
          </>
        )}
      </button>

      {onRefreshUrl && (
        <button
          onClick={onRefreshUrl}
          disabled={refreshing}
          className="w-full py-3 rounded-xl font-medium text-base bg-gray-100 text-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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

      <button onClick={onDone} className="text-gray-500 text-sm font-medium">
        我已完成支付
      </button>
    </div>
  </div>
);

export default PaymentBlockedStep;
