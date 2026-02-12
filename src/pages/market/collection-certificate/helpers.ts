import { CollectionItemDetailData } from '@/services';

const parseNumberFromText = (text?: string): number => {
  if (!text) return 0;
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

export const extractPriceFromZone = (priceZone?: string): number => {
  if (!priceZone) return 0;

  const upperZone = priceZone.toUpperCase();
  if (upperZone.includes('K')) {
    const match = upperZone.match(/(\d+)\s*K/i);
    if (match) return Number(match[1]) * 1000;
  }

  return parseNumberFromText(priceZone);
};

export const getSessionInfo = (detailData: CollectionItemDetailData | null) => {
  const sessionName =
    detailData?.session_name ||
    detailData?.sessionName ||
    detailData?.session_title ||
    detailData?.session?.name ||
    '';

  const sessionStartTime =
    detailData?.session_start_time ||
    detailData?.sessionStartTime ||
    detailData?.session?.start_time ||
    '';

  const sessionEndTime =
    detailData?.session_end_time ||
    detailData?.sessionEndTime ||
    detailData?.session?.end_time ||
    '';

  const sessionTime =
    sessionStartTime || sessionEndTime
      ? `${sessionStartTime}${sessionStartTime && sessionEndTime ? ' - ' : ''}${sessionEndTime}`
      : '';

  return {
    sessionName,
    sessionTime,
  };
};

export const getAssetAnchorInfo = (
  detailData: CollectionItemDetailData | null,
  supplierName?: string
) => ({
  coreEnterprise: detailData?.core_enterprise || detailData?.coreEnterprise || supplierName || '',
  farmerInfo: detailData?.farmer_info || detailData?.farmerInfo || detailData?.farmer_count_text || '',
  assetStatus:
    detailData?.asset_status || detailData?.assetStatus || detailData?.status_text || detailData?.status || '',
});

export const getDisplayPrice = (
  detailData: CollectionItemDetailData | null,
  fallbackPrice: number
) => {
  const actualPrice = Number(detailData?.price ?? fallbackPrice);
  const pZone = detailData?.price_zone || (detailData as any)?.priceZone;

  if (!pZone) return actualPrice;

  const zonePriceNum = extractPriceFromZone(pZone);
  return zonePriceNum > 0 ? zonePriceNum : actualPrice;
};
