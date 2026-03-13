import type { ProductDetailTab } from './types';

export const PRODUCT_DETAIL_TABS: Array<{ id: ProductDetailTab; label: string }> = [
  { id: 'details', label: '商品详情' },
  { id: 'params', label: '规格参数' },
  { id: 'guarantee', label: '售后保障' },
];
