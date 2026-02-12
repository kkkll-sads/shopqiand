import React from 'react';
import { XCircle } from 'lucide-react';

interface ReservationDetailErrorStateProps {
  error: string;
  onBack: () => void;
}

const ReservationDetailErrorState: React.FC<ReservationDetailErrorStateProps> = ({
  error,
  onBack,
}) => {
  return (
    <div className="p-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <XCircle size={32} className="text-red-400" />
      </div>
      <p className="text-gray-500 text-sm">{error}</p>
      <button
        onClick={onBack}
        className="mt-6 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-medium shadow-lg active:scale-95 transition-transform"
      >
        返回
      </button>
    </div>
  );
};

export default ReservationDetailErrorState;
