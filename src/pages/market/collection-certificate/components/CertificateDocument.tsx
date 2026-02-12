import React from 'react';
import { Shield } from 'lucide-react';
import CertificateAssetAnchorSection from './CertificateAssetAnchorSection';
import CertificateCoreInfoSection from './CertificateCoreInfoSection';
import CertificateOnChainSection from './CertificateOnChainSection';
import CertificateSessionSection from './CertificateSessionSection';

interface CertificateDocumentProps {
  assetCode?: string;
  displayTitle: string;
  artist?: string;
  description?: string;
  sessionName?: string;
  sessionTime?: string;
  priceZone?: string;
  coreEnterprise?: string;
  farmerInfo?: string;
  assetStatus?: string;
  txHash?: string;
  supplierName?: string;
  onCopyTxHash: (hash: string) => void;
}

const CertificateDocument: React.FC<CertificateDocumentProps> = ({
  assetCode,
  displayTitle,
  artist,
  description,
  sessionName,
  sessionTime,
  priceZone,
  coreEnterprise,
  farmerInfo,
  assetStatus,
  txHash,
  supplierName,
  onCopyTxHash,
}) => (
  <div className="p-5">
    <div className="bg-white relative shadow-2xl shadow-gray-200/50 rounded-sm overflow-hidden border-[6px] border-double border-amber-900/10 p-6 md:p-8">
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <Shield size={200} />
      </div>

      <div className="space-y-6 relative z-10 font-sans">
        <CertificateCoreInfoSection
          assetCode={assetCode}
          displayTitle={displayTitle}
          artist={artist}
        />

        {description && (
          <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-100">
            <div className="text-xs font-bold text-amber-700 uppercase mb-1 tracking-wider">
              Description / 商品描述
            </div>
            <div className="text-sm text-amber-900 leading-relaxed">{description}</div>
          </div>
        )}

        <CertificateSessionSection
          sessionName={sessionName}
          sessionTime={sessionTime}
          priceZone={priceZone}
        />

        <CertificateAssetAnchorSection
          coreEnterprise={coreEnterprise}
          farmerInfo={farmerInfo}
          assetStatus={assetStatus}
        />

        <CertificateOnChainSection
          txHash={txHash}
          supplierName={supplierName}
          onCopyTxHash={onCopyTxHash}
        />
      </div>
    </div>
  </div>
);

export default CertificateDocument;
