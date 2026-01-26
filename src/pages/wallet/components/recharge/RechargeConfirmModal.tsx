/**
 * RechargeConfirmModal - 充值确认弹窗组件
 */
import React from 'react';
import { X } from 'lucide-react';

interface RechargeConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  lastFourDigits: string;
  onLastFourDigitsChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

const RechargeConfirmModal: React.FC<RechargeConfirmModalProps> = ({
  visible,
  onClose,
  lastFourDigits,
  onLastFourDigitsChange,
  onSubmit,
  submitting,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">确认提交</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              请输入付款银行卡后四位号码
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={lastFourDigits}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                onLastFourDigitsChange(value);
              }}
              placeholder="请输入4位数字"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 outline-none text-center text-2xl font-mono tracking-widest"
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              为确保资金安全，请输入您付款银行卡的后四位号码
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={onSubmit}
              disabled={lastFourDigits.length !== 4 || submitting}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                lastFourDigits.length === 4 && !submitting
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? '提交中...' : '确定'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RechargeConfirmModal;
