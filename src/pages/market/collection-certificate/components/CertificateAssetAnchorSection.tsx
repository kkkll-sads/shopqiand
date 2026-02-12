import React from 'react';
import { Shield } from 'lucide-react';

interface CertificateAssetAnchorSectionProps {
  coreEnterprise?: string;
  farmerInfo?: string;
  assetStatus?: string;
}

const CertificateAssetAnchorSection: React.FC<CertificateAssetAnchorSectionProps> = ({
  coreEnterprise,
  farmerInfo,
  assetStatus,
}) => (
  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2">
    <div className="flex items-start gap-3">
      <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <label className="block text-xs font-bold text-gray-400 uppercase mb-0.5">
          Asset Anchor / 资产锚定
        </label>
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-600 flex items-start gap-2">
            <span className="whitespace-nowrap">核心企业：</span>
            <span className="text-gray-700 break-words">{coreEnterprise || '—'}</span>
          </div>
          <div className="text-sm font-medium text-gray-600 flex items-start gap-2">
            <span className="whitespace-nowrap">关联农户：</span>
            <span className="text-gray-700 break-words">{farmerInfo || '—'}</span>
          </div>
          <div className="text-sm font-medium text-gray-600 flex items-start gap-2">
            <span className="whitespace-nowrap">资产状态：</span>
            <span className="text-gray-700 break-words">{assetStatus || '—'}</span>
          </div>
        </div>
        <div className="text-[10px] text-gray-500">数据已脱敏，持有人可申请解密查看。</div>
      </div>
    </div>
  </div>
);

export default CertificateAssetAnchorSection;
