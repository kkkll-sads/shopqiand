import React from 'react';
import { Gavel, TrendingUp } from 'lucide-react';

interface CertificateBottomActionProps {
  displayPriceNum: number;
  hasReservation: boolean;
  onApplyConfirmation: () => void;
}

const CertificateBottomAction: React.FC<CertificateBottomActionProps> = ({
  displayPriceNum,
  hasReservation,
  onApplyConfirmation,
}) => (
  <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-white/90 backdrop-blur-md border-t border-gray-100 z-50">
    <div className="flex justify-end mb-2">
      <span className="text-[10px] text-gray-900 bg-white px-1 py-0.5">
        本次申购需冻结：¥{displayPriceNum.toFixed(2)} | 消耗算力：5
      </span>
    </div>

    <div className="flex items-center justify-between gap-4">
      <div className="text-left">
        <div className="flex flex-col">
          <div className="text-xl font-bold text-gray-900 font-mono flex items-baseline leading-none">
            ¥{displayPriceNum.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp size={10} className="text-red-500" />
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1 py-0.5 rounded border border-red-100/50">
              预期增值 +4%~+6%
            </span>
          </div>
        </div>
      </div>

      {hasReservation ? (
        <button
          disabled
          className="flex-1 bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed py-3.5 rounded-lg font-bold flex items-center justify-center gap-2"
        >
          <Gavel size={18} />
          确权中
        </button>
      ) : (
        <button
          onClick={onApplyConfirmation}
          className="flex-1 bg-[#8B0000] text-amber-100 hover:bg-[#A00000] transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-[0.98]"
        >
          <Gavel size={18} />
          申请确权
        </button>
      )}
    </div>
  </div>
);

export default CertificateBottomAction;
