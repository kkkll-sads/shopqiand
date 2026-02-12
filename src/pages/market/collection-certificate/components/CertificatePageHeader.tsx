import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface CertificatePageHeaderProps {
  onBack: () => void;
}

const CertificatePageHeader: React.FC<CertificatePageHeaderProps> = ({ onBack }) => (
  <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-sm px-4 py-4 flex justify-between items-center border-b border-amber-900/5">
    <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-800">
      <ChevronLeft size={24} />
    </button>
    <h1 className="text-lg font-bold text-gray-900">数字权益证书</h1>
    <div className="w-10" />
  </header>
);

export default CertificatePageHeader;
