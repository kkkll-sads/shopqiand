import type { Sku, SkuSpec } from '@/services/shop';

interface FindMatchedSkuParams {
  useSkuMode: boolean;
  skuSpecs: SkuSpec[];
  normalizedSkus: Sku[];
  selections: Record<number, number>;
}

interface IsSkuValueSelectableParams {
  useSkuMode: boolean;
  skuSpecs: SkuSpec[];
  normalizedSkus: Sku[];
  selectedValueIds: Record<number, number>;
  specId: number;
  valueId: number;
}

interface BuildSelectedSpecsMapParams {
  skuSpecs: SkuSpec[];
  selectedValueIds: Record<number, number>;
}

interface BuildSkuSpecsTextParams {
  matchedSku: Sku | null;
  skuSpecs: SkuSpec[];
  selectedValueIds: Record<number, number>;
}

interface GetSpecValueInfoParams {
  normalizedSkus: Sku[];
  spec: SkuSpec;
  specIndex: number;
  valueId: number;
}

export interface SpecValueInfo {
  minPrice: number | null;
  maxPrice: number | null;
  image: string | null;
  isScorePrice: boolean;
}

const parseSkuValueIds = (sku: Sku): number[] => String(sku.spec_value_ids).split(',').map(Number);

/**
 * 标准化 spec_value_ids 格式
 * 兼容后端返回数组或字符串两种格式
 */
export const normalizeSpecValueIds = (sku: Sku): Sku => {
  if (Array.isArray(sku.spec_value_ids)) {
    return {
      ...sku,
      spec_value_ids: sku.spec_value_ids.join(','),
    };
  }
  return sku;
};

/**
 * 根据已选规格值ID查找匹配的 SKU
 */
export const findMatchedSku = ({
  useSkuMode,
  skuSpecs,
  normalizedSkus,
  selections,
}: FindMatchedSkuParams): Sku | null => {
  if (!useSkuMode) return null;

  const selectedIds = skuSpecs.map((spec) => selections[spec.id]).filter((id) => id !== undefined);
  if (selectedIds.length !== skuSpecs.length) return null;

  const targetIds = selectedIds.join(',');
  return normalizedSkus.find((sku) => String(sku.spec_value_ids) === targetIds && sku.stock > 0) || null;
};

/**
 * 检查某个规格值是否可选（有库存）
 */
export const isSkuValueSelectable = ({
  useSkuMode,
  skuSpecs,
  normalizedSkus,
  selectedValueIds,
  specId,
  valueId,
}: IsSkuValueSelectableParams): boolean => {
  if (!useSkuMode) return true;

  const testSelections = { ...selectedValueIds, [specId]: valueId };
  const specIndex = skuSpecs.findIndex((spec) => spec.id === specId);
  if (specIndex === -1) return false;

  return normalizedSkus.some((sku) => {
    if (sku.stock <= 0) return false;

    const skuValueIds = parseSkuValueIds(sku);

    for (let i = 0; i < skuSpecs.length; i += 1) {
      const spec = skuSpecs[i];
      const selectedId = testSelections[spec.id];
      if (selectedId !== undefined && skuValueIds[i] !== selectedId) {
        return false;
      }
    }

    return true;
  });
};

export const buildSelectedSpecsMap = ({
  skuSpecs,
  selectedValueIds,
}: BuildSelectedSpecsMapParams): Record<string, string> => {
  const specsText: Record<string, string> = {};

  skuSpecs.forEach((spec) => {
    const valueId = selectedValueIds[spec.id];
    if (!valueId) return;

    const value = spec.values.find((item) => item.id === valueId);
    if (value) {
      specsText[spec.name] = value.value;
    }
  });

  return specsText;
};

export const buildSkuSpecsText = ({
  matchedSku,
  skuSpecs,
  selectedValueIds,
}: BuildSkuSpecsTextParams): string => {
  if (matchedSku) {
    return matchedSku.spec_value_names;
  }

  const parts: string[] = [];
  skuSpecs.forEach((spec) => {
    const valueId = selectedValueIds[spec.id];
    if (!valueId) return;

    const value = spec.values.find((item) => item.id === valueId);
    if (value) {
      parts.push(value.value);
    }
  });

  return parts.length > 0 ? parts.join(' / ') : '';
};

export const getSpecValueInfo = ({
  normalizedSkus,
  spec,
  specIndex,
  valueId,
}: GetSpecValueInfoParams): SpecValueInfo => {
  const relatedSkus = normalizedSkus.filter((sku) => {
    const ids = parseSkuValueIds(sku);
    return ids[specIndex] === valueId;
  });

  if (relatedSkus.length === 0) {
    return { minPrice: null, maxPrice: null, image: null, isScorePrice: false };
  }

  const prices = relatedSkus.map((item) => item.score_price || item.price || 0).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

  const skuWithImage = relatedSkus.find((item) => item.image);
  const valueWithImage = spec.values.find((item) => item.id === valueId);

  return {
    minPrice,
    maxPrice,
    image: skuWithImage?.image || valueWithImage?.image || null,
    isScorePrice: relatedSkus.some((item) => (item.score_price || 0) > 0),
  };
};
