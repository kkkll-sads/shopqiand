import type { PriceRange, Sku, SkuSpec } from '@/services/shop';

// 兼容旧版规格接口
export interface ProductSpec {
  id: string;
  name: string;
  values: string[];
}

export interface BuySpecSheetProps {
  visible: boolean;
  onClose: () => void;
  productName: string;
  productImage: string;
  price: number;
  scorePrice?: number;
  greenPowerAmount?: number;
  balanceAvailableAmount?: number;
  stock: number;
  maxPurchase?: number;
  // 旧版规格（向后兼容）
  specs?: ProductSpec[];
  // 新版 SKU 规格（优先使用）
  hasSku?: boolean;
  skuSpecs?: SkuSpec[];
  skus?: Sku[];
  priceRange?: PriceRange | null;
  // 预选规格值（从SKU切换器传入）
  preSelectedValueIds?: Record<number, number>;
  // 回调
  onConfirm: (
    quantity: number,
    selectedSpecs?: Record<string, string>,
    skuId?: number
  ) => void;
}

export interface ScorePriceRange {
  min: number;
  max: number;
}
