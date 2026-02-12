import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ReservationDetailHeaderProps {
  onBack: () => void;
}

const ReservationDetailHeader: React.FC<ReservationDetailHeaderProps> = ({ onBack }) => {
  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center shadow-lg">
      <button onClick={onBack} className="p-2 -ml-2 active:bg-white/20 rounded-full transition-all">
        <ArrowLeft size={22} className="text-white" />
      </button>
      <h1 className="ml-2 text-lg font-bold text-white">预约详情</h1>
    </header>
  );
};

export default ReservationDetailHeader;
