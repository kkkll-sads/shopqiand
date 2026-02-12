import React from 'react';
import { Award, Copy } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { copyWithToast } from '@/utils/copyWithToast';

interface CertificateCoreInfoSectionProps {
  assetCode?: string;
  displayTitle: string;
  artist?: string;
}

const getTitleSizeClass = (title: string) => {
  if (title.length > 12) return 'text-lg';
  if (title.length > 8) return 'text-xl';
  if (title.length > 5) return 'text-2xl';
  return 'text-3xl';
};

const CertificateCoreInfoSection: React.FC<CertificateCoreInfoSectionProps> = ({
  assetCode,
  displayTitle,
  artist,
}) => {
  const { showToast } = useNotification();

  const handleCopyAssetCode = async () => {
    if (!assetCode) return;
    await copyWithToast(assetCode, showToast, {
      successDescription: '确权编号已复制到剪贴板',
    });
  };

  return (
    <>
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-900 mb-3 border border-amber-100">
        <Award size={24} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 tracking-wide mb-1">数字产权登记证书</h2>
      <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">
        Digital Property Rights Certificate
      </div>
    </div>

    <div className="text-center py-6 mb-2 relative">
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none rounded-lg border border-amber-900/5"
        style={{
          backgroundImage:
            'radial-gradient(circle, #C5A572 1px, transparent 1px), radial-gradient(circle, #C5A572 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px',
        }}
      />

      {assetCode && (
        <div className="text-xs text-gray-500 font-[DINAlternate-Bold,Roboto,sans-serif] tracking-widest mb-3 relative z-10 flex items-center justify-center gap-1.5">
          <span>确权编号：{assetCode}</span>
          <button
            type="button"
            className="p-0.5 rounded text-gray-400 active:bg-gray-100"
            onClick={() => {
              void handleCopyAssetCode();
            }}
            aria-label="复制确权编号"
          >
            <Copy size={11} />
          </button>
        </div>
      )}

      <h3
        className={`${getTitleSizeClass(displayTitle)} font-extrabold text-gray-700 mb-3 font-serif tracking-tight leading-tight relative z-10 drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis px-2`}
      >
        【{displayTitle}】
      </h3>

      <div className="text-base font-bold text-[#C5A572] tracking-wide relative z-10">
        {artist || '—'}
      </div>

      <div className="absolute -right-4 -bottom-6 w-32 h-32 opacity-90 -rotate-12 mix-blend-multiply z-20 pointer-events-none">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <path id="textCircleTop" d="M 25,100 A 75,75 0 1,1 175,100" fill="none" />
            <filter id="roughPaper">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
            </filter>
          </defs>
          <g filter="url(#roughPaper)" fill="#D60000" stroke="none">
            <circle cx="100" cy="100" r="96" fill="none" stroke="#D60000" strokeWidth="3" />
            <circle cx="100" cy="100" r="92" fill="none" stroke="#D60000" strokeWidth="1" />
            <text fontSize="14" fontWeight="bold" fontFamily="SimSun, serif" fill="#D60000">
              <textPath href="#textCircleTop" startOffset="50%" textAnchor="middle" spacing="auto">
                树交所数字资产登记结算中心
              </textPath>
            </text>
            <text x="100" y="100" fontSize="40" textAnchor="middle" dominantBaseline="middle" fill="#D60000">
              ★
            </text>
            <text
              x="100"
              y="135"
              fontSize="18"
              fontWeight="bold"
              fontFamily="SimHei, sans-serif"
              textAnchor="middle"
              fill="#D60000"
            >
              确权专用章
            </text>
            <text
              x="100"
              y="155"
              fontSize="10"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              fill="#D60000"
              letterSpacing="1"
            >
              37010299821
            </text>
          </g>
        </svg>
      </div>
    </div>
  </>
  );
};

export default CertificateCoreInfoSection;
