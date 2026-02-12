import React from 'react';
import { Gift, X } from 'lucide-react';

interface SignInRewardModalProps {
  open: boolean;
  amount: number;
  onClose: () => void;
}

const SignInRewardModal: React.FC<SignInRewardModalProps> = ({ open, amount, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-red-500 w-72 rounded-2xl p-6 text-center relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-2 right-2 text-white/60 hover:text-white">
          <X size={24} />
        </button>
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Gift size={32} className="text-red-500" />
        </div>
        <h3 className="text-yellow-100 text-lg font-bold mb-1">恭喜获得</h3>
        <div className="text-4xl font-bold text-white mb-2">
          {amount.toFixed(2)} <span className="text-lg">元</span>
        </div>
        <p className="text-white/80 text-sm mb-6">已存入您的活动账户</p>
        <button
          onClick={onClose}
          className="w-full bg-yellow-400 text-red-600 font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          开心收下
        </button>
      </div>
    </div>
  );
};

export default SignInRewardModal;
