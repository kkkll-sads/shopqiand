import React from 'react';
import { ChevronRight } from 'lucide-react';

interface HomeTradingZoneCardProps {
  onClick: () => void;
}

const HomeTradingZoneCard: React.FC<HomeTradingZoneCardProps> = ({ onClick }) => (
  <div className="px-4 mb-3 relative z-0">
    <div
      className="w-full h-20 rounded-2xl overflow-hidden relative cursor-pointer active:scale-[0.98] transition-transform bg-gradient-to-r from-red-600 via-red-500 to-rose-500 shadow-lg shadow-red-500/25"
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />

      <div className="absolute inset-0 flex items-center justify-between px-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">交易专区</h2>
          <p className="text-white/80 text-xs mt-0.5">数据资产确权交易</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          <ChevronRight size={24} className="text-white" />
        </div>
      </div>
    </div>
  </div>
);

export default HomeTradingZoneCard;
