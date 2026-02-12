import React from 'react';
import { Shield } from 'lucide-react';

interface ReservationConfirmModalProps {
  visible: boolean;
  loading: boolean;
  baseHashrate: number;
  extraHashrate: number;
  totalRequiredHashrate: number;
  quantity: number;
  frozenAmount: number;
  onClose: () => void;
  onConfirm: () => void;
}

const ReservationConfirmModal: React.FC<ReservationConfirmModalProps> = ({
  visible,
  loading,
  baseHashrate,
  extraHashrate,
  totalRequiredHashrate,
  quantity,
  frozenAmount,
  onClose,
  onConfirm,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative z-10 shadow-2xl">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
            <Shield size={32} className="text-red-600" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-center mb-6 text-gray-900">确认提交预约</h3>

        <div className="space-y-3 mb-8">
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl border border-orange-100">
            <span className="text-gray-700 text-sm font-medium">消耗算力</span>
            <div className="text-right">
              <div className="font-bold text-gray-900 font-mono text-lg">{totalRequiredHashrate.toFixed(0)}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">基础 {baseHashrate} + 加注 {extraHashrate}</div>
            </div>
          </div>
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl border border-green-100">
            <span className="text-gray-700 text-sm font-medium">申购数量</span>
            <div className="font-bold text-gray-900 font-mono text-lg">{quantity} 份</div>
          </div>
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-100">
            <span className="text-gray-700 text-sm font-medium">冻结金额</span>
            <div className="font-bold text-red-600 font-mono text-lg">¥{frozenAmount.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 active:scale-95 transition-all"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-lg shadow-red-200 active:scale-95 transition-all flex justify-center items-center"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '确认提交'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationConfirmModal;
