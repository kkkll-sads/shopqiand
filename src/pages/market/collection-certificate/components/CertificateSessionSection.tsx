import React from 'react';

interface CertificateSessionSectionProps {
  sessionName?: string;
  sessionTime?: string;
  priceZone?: string;
}

const CertificateSessionSection: React.FC<CertificateSessionSectionProps> = ({
  sessionName,
  sessionTime,
  priceZone,
}) => {
  if (!sessionName && !sessionTime?.trim() && !priceZone) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">
            Session / 专场
          </label>
          <div className="text-sm font-bold text-gray-600">{sessionName || '—'}</div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">
            Trading Window / 场次时间
          </label>
          <div className="text-sm font-bold text-gray-600">{sessionTime || '—'}</div>
        </div>
      </div>

      {priceZone && (
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">
            Price Zone / 价格分区
          </label>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
              {priceZone}
            </span>
            <span className="text-xs text-gray-400">（申购价按分区统一定价）</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateSessionSection;
