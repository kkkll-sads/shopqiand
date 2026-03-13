import { apiConfig } from '../../api/config';
import type {
  ShopProductDetail,
  ShopProductItem,
  ShopProductReview,
  ShopProductSku,
  ShopProductSkuSpec,
} from '../../api/modules/shopProduct';

export type ShopProductPriceSource = Pick<
  ShopProductItem,
  'balance_available_amount' | 'green_power_amount' | 'price' | 'purchase_type' | 'score_price'
>;

export interface ShopProductPricePresentation {
  balanceText?: string;
  greenPowerText?: string;
  mode: 'balance' | 'green_power' | 'mixed' | 'money' | 'pending' | 'score';
  moneyText?: string;
  primaryText: string;
  scoreText?: string;
}

export interface ShopProductOptionGroup {
  name: string;
  options: string[];
}

function toFiniteNumber(value: number | null | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function formatDecimalAmount(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    useGrouping: false,
  }).format(value);
}

function formatIntegerAmount(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 0,
    useGrouping: false,
  }).format(value);
}

function withApiBase(pathname: string) {
  /* baseURL 为空时使用当前页面 origin，资源路径会通过代理访问后端 */
  const base = apiConfig.baseURL || window.location.origin;
  return new URL(pathname.replace(/^\/+/, ''), `${base}/`).toString();
}

function readStringList(source: unknown): string[] {
  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      if (item && typeof item === 'object' && 'value' in item) {
        const value = (item as { value?: unknown }).value;
        return typeof value === 'string' ? value.trim() : '';
      }

      return '';
    })
    .filter(Boolean);
}

function splitSpecValueNames(value: string | undefined): string[] {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean);
}

function readSkuSpecValues(sku: ShopProductSku): string[] {
  const directValues = readStringList(sku.spec_values);
  if (directValues.length > 0) {
    return directValues;
  }

  return splitSpecValueNames(sku.spec_value_names);
}

export function buildShopProductPath(id: number | string) {
  return `/product/${id}`;
}

export function buildShopProductReviewsPath(id: number | string) {
  return `/product/${id}/reviews`;
}

export function buildShopProductQaPath(id: number | string) {
  return `/product/${id}/qa`;
}

export function buildShopProductSearchResultPath(keyword: string) {
  return `/search/result?keyword=${encodeURIComponent(keyword.trim())}`;
}

export function resolveShopProductImageUrl(url?: string | null) {
  const nextUrl = typeof url === 'string' ? url.trim() : '';
  if (!nextUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(nextUrl)) {
    return nextUrl;
  }

  return withApiBase(nextUrl);
}

/**
 * 商城统一使用 score_price 作为余额/消费金字段；
 * 部分商品为混合支付（score_price + 可用余额 balance_available_amount）。
 */
export function getShopProductPrimaryPrice(product: ShopProductPriceSource) {
  const price = toFiniteNumber(product.price);
  const greenPowerAmount = toFiniteNumber(product.green_power_amount);
  const balanceAvailableAmount = toFiniteNumber(product.balance_available_amount);
  const scorePrice = toFiniteNumber(product.score_price);

  // 混合支付：同时展示人民币 + 消费金两个金额
  if (product.purchase_type === 'both' && price > 0 && scorePrice > 0) {
    return `¥${formatDecimalAmount(price)} + ${formatIntegerAmount(scorePrice)}`;
  }
  if (product.purchase_type === 'both' && price > 0) {
    return `¥${formatDecimalAmount(price)}`;
  }
  if (product.purchase_type === 'both' && scorePrice > 0) {
    return formatIntegerAmount(scorePrice);
  }

  // 纯消费金：仅显示金额数字
  if (product.purchase_type === 'score' && scorePrice > 0) {
    return formatIntegerAmount(scorePrice);
  }

  if (price > 0) {
    return `¥${formatDecimalAmount(price)}`;
  }

  if (greenPowerAmount > 0) {
    return `绿色算力 ${formatDecimalAmount(greenPowerAmount)}`;
  }

  if (balanceAvailableAmount > 0) {
    return `余额 ${formatDecimalAmount(balanceAvailableAmount)}`;
  }

  if (scorePrice > 0) {
    return formatIntegerAmount(scorePrice);
  }

  if (product.purchase_type === 'score') {
    return '待定';
  }

  return '价格待定';
}

/**
 * 余额统一使用 score_price；混合支付时展示 score_price + 可用余额。
 */
export function getShopProductPriceCaption(product: ShopProductPriceSource) {
  const scorePrice = toFiniteNumber(product.score_price);
  const price = toFiniteNumber(product.price);
  const greenPowerAmount = toFiniteNumber(product.green_power_amount);
  const balanceAvailableAmount = toFiniteNumber(product.balance_available_amount);
  const captions: string[] = [];

  // 消费金/余额统一使用 score_price
  if (scorePrice > 0) {
    captions.push(`消费金 ${formatIntegerAmount(scorePrice)}`);
  }

  // 混合支付：可用余额
  if (product.purchase_type === 'both' && balanceAvailableAmount > 0) {
    captions.push(`可用余额 ${formatDecimalAmount(balanceAvailableAmount)}`);
  }

  if (greenPowerAmount > 0 && (price > 0 || scorePrice > 0)) {
    captions.push(`绿色算力 ${formatDecimalAmount(greenPowerAmount)}`);
  }

  return captions.join(' + ');
}

export function getShopProductPurchaseTag(product: ShopProductPriceSource) {
  if (product.purchase_type === 'score') {
    return '消费金';
  }

  if (product.purchase_type === 'both') {
    return '混合支付';
  }

  return '现金购买';
}

export function getShopProductPricePresentation(
  product: ShopProductPriceSource,
): ShopProductPricePresentation {
  const price = toFiniteNumber(product.price);
  const greenPowerAmount = toFiniteNumber(product.green_power_amount);
  const balanceAvailableAmount = toFiniteNumber(product.balance_available_amount);
  const scorePrice = toFiniteNumber(product.score_price);

  const moneyText = price > 0 ? `¥${formatDecimalAmount(price)}` : undefined;
  const scoreText = scorePrice > 0 ? formatIntegerAmount(scorePrice) : undefined;
  const greenPowerText =
    greenPowerAmount > 0 ? `绿色算力 ${formatDecimalAmount(greenPowerAmount)}` : undefined;
  const balanceText =
    balanceAvailableAmount > 0 ? `余额 ${formatDecimalAmount(balanceAvailableAmount)}` : undefined;

  if (product.purchase_type === 'both' && moneyText && scoreText) {
    return {
      mode: 'mixed',
      moneyText,
      primaryText: `${moneyText} + ${scoreText}`,
      scoreText,
    };
  }

  if (product.purchase_type === 'score' && scoreText) {
    return {
      mode: 'score',
      primaryText: scoreText,
      scoreText,
    };
  }

  if (moneyText) {
    return {
      mode: 'money',
      moneyText,
      primaryText: moneyText,
    };
  }

  if (greenPowerText) {
    return {
      greenPowerText,
      mode: 'green_power',
      primaryText: greenPowerText,
    };
  }

  if (balanceText) {
    return {
      balanceText,
      mode: 'balance',
      primaryText: balanceText,
    };
  }

  if (scoreText) {
    return {
      mode: 'score',
      primaryText: scoreText,
      scoreText,
    };
  }

  return {
    mode: 'pending',
    primaryText: product.purchase_type === 'score' ? '待定' : '价格待定',
  };
}

export function getShopProductBadges(product: ShopProductItem) {
  const tag = getShopProductPurchaseTag(product);
  return tag ? [tag] : [];
}

export function formatShopProductSales(value?: number | null) {
  const sales = toFiniteNumber(value);
  if (sales >= 10000) {
    return `${formatDecimalAmount(sales / 10000)}万+`;
  }

  return `${formatIntegerAmount(sales)}`;
}

export function normalizeShopProductCategories(categories: string[] | undefined) {
  return (categories ?? [])
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({
      id: name,
      name,
    }));
}

export function buildShopProductOptionGroups(product: ShopProductDetail | null | undefined) {
  if (!product?.sku_specs?.length) {
    return [];
  }

  return product.sku_specs.reduce<ShopProductOptionGroup[]>((groups, item: ShopProductSkuSpec) => {
    const name = item.name?.trim();
    const options = [
      ...readStringList(item.options),
      ...readStringList(item.values),
    ].filter((option, index, source) => source.indexOf(option) === index);

    if (!name || !options.length) {
      return groups;
    }

    groups.push({
      name,
      options,
    });
    return groups;
  }, []);
}

export function buildShopProductSelectedSummary(
  optionGroups: ShopProductOptionGroup[],
  selectedOptions: Record<string, string>,
  quantity: number,
) {
  const summary = optionGroups
    .map((group) => selectedOptions[group.name])
    .filter(Boolean);

  summary.push(`x${quantity}`);
  return summary.join(' / ');
}

/**
 * 根据当前选中的规格选项解析出对应的 SKU ID，供加入购物车等接口使用。
 * 多规格商品必填 sku_id，无规格或单 SKU 时可能无 id，返回 undefined。
 */
export function getSelectedSkuId(
  product: ShopProductDetail | null | undefined,
  optionGroups: ShopProductOptionGroup[],
  selectedOptions: Record<string, string>,
): number | undefined {
  if (!product?.skus?.length || !optionGroups.length) {
    return undefined;
  }

  const selectedValues = optionGroups
    .map((g) => selectedOptions[g.name]?.trim())
    .filter(Boolean);

  if (selectedValues.length !== optionGroups.length) {
    return undefined;
  }

  const sku = product.skus.find((s) => {
    const specValues = readSkuSpecValues(s);
    if (specValues.length !== selectedValues.length) return false;
    return selectedValues.every((v, i) => specValues[i] === v);
  });

  return sku?.id != null && Number.isFinite(sku.id) ? sku.id : undefined;
}

export function buildShopProductDescription(product: ShopProductDetail | null | undefined) {
  const description = product?.description?.trim();
  if (description) {
    return description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return '';
}

export function buildShopProductSpecs(product: ShopProductDetail | null | undefined) {
  return (product?.specs ?? []).filter((item) => item.name?.trim() && item.value?.trim());
}

export function buildShopProductServiceItems(product: ShopProductDetail | null | undefined) {
  const items: string[] = [];

  if (product?.delivery_info?.free_shipping) {
    items.push('包邮');
  }

  if (product?.delivery_info?.delivery_time) {
    items.push(product.delivery_info.delivery_time);
  }

  if (product?.delivery_info?.support_same_day) {
    items.push('支持当日达');
  }

  if (product?.after_sale?.return_policy) {
    items.push(product.after_sale.return_policy);
  }

  if (product?.after_sale?.exchange_policy) {
    items.push(product.after_sale.exchange_policy);
  }

  if (product?.after_sale?.warranty) {
    items.push(product.after_sale.warranty);
  }

  if (!items.length) {
    items.push('平台发货');
    items.push('售后保障');
  }

  return items;
}

export function getShopProductReviewUser(review: ShopProductReview) {
  return review.user?.trim() || '匿名用户';
}

export function getShopProductReviewImages(review: ShopProductReview) {
  return (review.images ?? [])
    .map((image) => resolveShopProductImageUrl(image))
    .filter(Boolean);
}
