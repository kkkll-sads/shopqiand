/**
 * MatchedView - 匹配成功视图组件
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Shield, Zap } from 'lucide-react';
import { CompanyAccountItem } from '@/services';
import { LoadingSpinner } from '@/components/common';
import { useNotification } from '@/context/NotificationContext';
import AccountInfoCard from './AccountInfoCard';
import WarningSection from './WarningSection';
import PaymentScreenshotUpload from './PaymentScreenshotUpload';
import RechargeConfirmModal from './RechargeConfirmModal';

interface MatchedViewProps {
  account: CompanyAccountItem;
  amount: string;
  selectedMethod: string | null;
  imagePreview: string | null;
  uploadedImage: File | null;
  lastFourDigits: string;
  submitting: boolean;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  onLastFourDigitsChange: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}

const MatchedView: React.FC<MatchedViewProps> = ({
  account,
  amount,
  selectedMethod,
  imagePreview,
  uploadedImage,
  lastFourDigits,
  submitting,
  onImageSelect,
  onImageRemove,
  onLastFourDigitsChange,
  onSubmit,
  onReset,
}) => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleOpenConfirm = () => {
    if (!uploadedImage) {
      showToast('warning', '请上传截图', '请先上传付款截图');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleCloseConfirm = () => {
    setShowConfirmModal(false);
    onLastFourDigitsChange('');
  };

  const handleConfirmSubmit = () => {
    onSubmit();
    setShowConfirmModal(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 px-4 py-5 pt-8 text-white relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={onReset}
              className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">通道接入成功</h1>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-red-600 shadow-lg mb-3 animate-in zoom-in duration-300">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-1">已分配专属专员</h2>
            <p className="text-sm text-white/90 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
              请在 15 分钟内完成转账
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 -mt-4 rounded-t-3xl relative z-20 px-4 pt-6 pb-safe">
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Service Specialist</span>
          <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-md flex items-center gap-1">
            <Shield size={10} />
            已缴保证金
          </span>
        </div>

        <AccountInfoCard account={account} />
        <WarningSection />

        <PaymentScreenshotUpload
          imagePreview={imagePreview}
          onImageSelect={onImageSelect}
          onImageRemove={onImageRemove}
        />

        {/* Submit Button */}
        <button
          onClick={handleOpenConfirm}
          disabled={!uploadedImage || submitting}
          className={`w-full py-4 rounded-xl font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2 mb-4 ${
            uploadedImage && !submitting
              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-orange-200 active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          {submitting ? (
            <>
              <LoadingSpinner className="w-5 h-5 border-white/20 border-t-white" />
              提交处理中...
            </>
          ) : (
            <>
              <Zap size={18} fill="currentColor" />
              提交充值订单
            </>
          )}
        </button>

        <button
          onClick={onReset}
          className="w-full py-3 rounded-xl bg-white text-gray-500 font-medium text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          取消并返回
        </button>
      </div>

      {/* Confirmation Modal */}
      {selectedMethod === 'bank_card' && (
        <RechargeConfirmModal
          visible={showConfirmModal}
          onClose={handleCloseConfirm}
          lastFourDigits={lastFourDigits}
          onLastFourDigitsChange={onLastFourDigitsChange}
          onSubmit={handleConfirmSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
};

export default MatchedView;
