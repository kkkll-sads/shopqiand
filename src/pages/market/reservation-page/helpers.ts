/**
 * 从价格分区字符串中提取价格数字
 * @param priceZone - 价格分区字符串，如 "500元区" 或 "1K区"
 * @returns 提取的价格数字，如果提取失败返回 0
 */
export const extractPriceFromZone = (priceZone?: string): number => {
  if (!priceZone) return 0;

  const upperZone = priceZone.toUpperCase();
  if (upperZone.includes('K')) {
    const match = upperZone.match(/(\d+)\s*K/i);
    if (match) {
      return Number(match[1]) * 1000;
    }
  }

  const match = priceZone.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};
