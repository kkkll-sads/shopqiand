import React from 'react';
import { X, Gift } from 'lucide-react';

interface SignInRewardModalProps {
  open: boolean;
  amount: number;
  onClose: () => void;
}

const SignInRewardModal: React.FC<SignInRewardModalProps> = ({
  open,
  amount,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
      <div className="bg-white w-full max-w-xs rounded-2xl relative shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 pt-8 pb-6 text-center text-white">
          <Gift size={48} className="mx-auto mb-3 drop-shadow-lg" />
          <div className="text-sm opacity-90 mb-1">签到成功！获得</div>
          <div className="text-4xl font-bold tracking-tight">
            +{amount.toFixed(2)}
            <span className="text-base font-normal ml-1">元</span>
          </div>
        </div>
        <div className="px-6 py-5 text-center">
          <p className="text-gray-500 text-xs mb-4">奖励已发放到您的账户</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-sm active:scale-95 transition-transform"
          >
            好的
          </button>
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white/70 hover:text-white"
        >
          <X size={22} />
        </button>
      </div>
    </div>
  );
};

export default SignInRewardModal;
