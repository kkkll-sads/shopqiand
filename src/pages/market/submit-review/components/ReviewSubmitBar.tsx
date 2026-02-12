import React from 'react';
import { Loader2 } from 'lucide-react';

interface ReviewSubmitBarProps {
  submitting: boolean;
  disabled: boolean;
  onSubmit: () => void;
}

const ReviewSubmitBar: React.FC<ReviewSubmitBarProps> = ({ submitting, disabled, onSubmit }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe max-w-[480px] mx-auto">
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-base shadow-lg shadow-red-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>提交中...</span>
          </>
        ) : (
          '提交评价'
        )}
      </button>
    </div>
  );
};

export default ReviewSubmitBar;
