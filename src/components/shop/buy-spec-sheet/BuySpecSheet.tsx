/**
 * BuySpecSheet - 商品规格选择弹窗
 *
 * 支持多规格 SKU 选择，实现：
 * - 规格值动态可选/禁用
 * - 价格和库存实时更新
 * - SKU 匹配算法
 *
 * @version 2.1.0 - 模块化拆分
 */
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { LazyImage } from '@/components/common';
import PriceDisplay from './PriceDisplay';
import SkuSpecSelector from './SkuSpecSelector';
import LegacySpecSelector from './LegacySpecSelector';
import type { BuySpecSheetProps, ScorePriceRange } from './types';
import {
  normalizeSpecValueIds,
  findMatchedSku,
  isSkuValueSelectable,
  buildSelectedSpecsMap,
  buildSkuSpecsText,
} from './utils';

const BuySpecSheet: React.FC<BuySpecSheetProps> = ({
  visible,
  onClose,
  productName,
  productImage,
  price,
  scorePrice = 0,
  greenPowerAmount = 0,
  balanceAvailableAmount = 0,
  stock,
  maxPurchase = 99,
  specs = [],
  hasSku = false,
  skuSpecs = [],
  skus = [],
  priceRange = null,
  preSelectedValueIds = {},
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState(1);
  // 旧版：记录选中的规格名称和值
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  // 新版：记录选中的规格值ID（specId -> valueId）
  const [selectedValueIds, setSelectedValueIds] = useState<Record<number, number>>({});
  // 记录上次的 visible 状态，用于检测弹窗打开时机
  const prevVisibleRef = useRef(false);

  // 重置状态（仅在弹窗打开时）
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      setQuantity(1);
      setSelectedSpecs({});
      const initialValues = Object.keys(preSelectedValueIds).length > 0 ? { ...preSelectedValueIds } : {};
      setSelectedValueIds(initialValues);
    }
    prevVisibleRef.current = visible;
  }, [visible, preSelectedValueIds]);

  // 标准化 SKU 数据格式（兼容数组和字符串）
  const normalizedSkus = useMemo(() => skus.map(normalizeSpecValueIds), [skus]);

  // 判断是否使用新版 SKU 模式（有 skuSpecs 且 skus 非空即启用，兼容后端 has_sku 为数字 1 或未返回）
  const useSkuMode =
    (hasSku || (skuSpecs.length > 0 && normalizedSkus.length > 0)) &&
    skuSpecs.length > 0 &&
    normalizedSkus.length > 0;

  // 当前匹配的 SKU
  const matchedSku = useMemo(
    () =>
      findMatchedSku({
        useSkuMode,
        skuSpecs,
        normalizedSkus,
        selections: selectedValueIds,
      }),
    [useSkuMode, skuSpecs, normalizedSkus, selectedValueIds]
  );

  // 检查某个规格值是否可选（有库存）
  const isValueSelectable = useCallback(
    (specId: number, valueId: number) =>
      isSkuValueSelectable({
        useSkuMode,
        skuSpecs,
        normalizedSkus,
        selectedValueIds,
        specId,
        valueId,
      }),
    [useSkuMode, skuSpecs, normalizedSkus, selectedValueIds]
  );

  // 计算当前显示的价格
  const displayPrice = useMemo(() => {
    if (useSkuMode) {
      if (matchedSku) {
        return matchedSku.price;
      }
      if (priceRange) {
        if (priceRange.min === priceRange.max) {
          return priceRange.min;
        }
        return null;
      }
    }
    return price;
  }, [useSkuMode, matchedSku, priceRange, price]);

  // 计算当前显示的消费金价格（根据 SKU 动态变化）
  const displayScorePrice = useMemo<number | ScorePriceRange>(() => {
    if (useSkuMode) {
      if (matchedSku) {
        return matchedSku.score_price || 0;
      }

      if (normalizedSkus.length > 0) {
        const scorePrices = normalizedSkus
          .map((sku) => sku.score_price || 0)
          .filter((item) => item > 0);

        if (scorePrices.length > 0) {
          const minScore = Math.min(...scorePrices);
          const maxScore = Math.max(...scorePrices);
          if (minScore !== maxScore) {
            return { min: minScore, max: maxScore };
          }
          return minScore;
        }
      }
    }
    return scorePrice;
  }, [useSkuMode, matchedSku, normalizedSkus, scorePrice]);

  // 计算当前显示的库存
  const displayStock = useMemo(() => {
    if (useSkuMode && matchedSku) {
      return matchedSku.stock;
    }
    return stock;
  }, [useSkuMode, matchedSku, stock]);

  // 计算当前显示的图片
  const displayImage = useMemo(() => {
    if (useSkuMode && matchedSku && matchedSku.image) {
      return matchedSku.image;
    }

    if (useSkuMode) {
      for (const spec of skuSpecs) {
        const selectedId = selectedValueIds[spec.id];
        if (!selectedId) continue;

        const value = spec.values.find((item) => item.id === selectedId);
        if (value?.image) {
          return value.image;
        }
      }
    }

    return productImage;
  }, [useSkuMode, matchedSku, skuSpecs, selectedValueIds, productImage]);

  const actualMax = Math.min(displayStock, maxPurchase);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < actualMax) {
      setQuantity(quantity + 1);
    }
  };

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!Number.isNaN(num)) {
      if (num < 1) {
        setQuantity(1);
      } else if (num > actualMax) {
        setQuantity(actualMax);
      } else {
        setQuantity(num);
      }
    }
  };

  const handleSelectSpec = (specName: string, value: string) => {
    setSelectedSpecs((prev) => ({
      ...prev,
      [specName]: value,
    }));
  };

  const handleSelectSkuValue = (specId: number, valueId: number) => {
    setSelectedValueIds((prev) => ({
      ...prev,
      [specId]: valueId,
    }));
    setQuantity(1);
  };

  const handleConfirm = () => {
    if (useSkuMode) {
      const specsText = buildSelectedSpecsMap({ skuSpecs, selectedValueIds });
      onConfirm(quantity, specsText, matchedSku?.id);
      return;
    }

    onConfirm(quantity, specs.length > 0 ? selectedSpecs : undefined);
  };

  const allSpecsSelected = useMemo(() => {
    if (useSkuMode) {
      return skuSpecs.every((spec) => selectedValueIds[spec.id] !== undefined);
    }
    return specs.length === 0 || specs.every((spec) => selectedSpecs[spec.name]);
  }, [useSkuMode, skuSpecs, selectedValueIds, specs, selectedSpecs]);

  const canBuy = useMemo(() => {
    if (useSkuMode) {
      return allSpecsSelected && !!matchedSku && matchedSku.stock > 0;
    }
    return allSpecsSelected && stock > 0;
  }, [useSkuMode, allSpecsSelected, matchedSku, stock]);

  const selectedSpecsText = useMemo(() => {
    if (useSkuMode) {
      return buildSkuSpecsText({
        matchedSku,
        skuSpecs,
        selectedValueIds,
      });
    }
    return Object.values(selectedSpecs).join(' / ');
  }, [useSkuMode, matchedSku, skuSpecs, selectedValueIds, selectedSpecs]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-[480px] bg-white rounded-t-2xl animate-slide-up overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
        >
          <X size={18} className="text-gray-500" />
        </button>

        <div className="flex gap-3 p-4 pb-3">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <LazyImage src={displayImage} alt={productName} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 flex flex-col justify-end pt-6">
            <div className="flex items-baseline flex-wrap">
              <PriceDisplay
                displayPrice={displayPrice}
                useSkuMode={useSkuMode}
                priceRange={priceRange}
                greenPowerAmount={greenPowerAmount}
                balanceAvailableAmount={balanceAvailableAmount}
                displayScorePrice={displayScorePrice}
              />
            </div>
            <div className="text-gray-400 text-xs mt-1.5">
              库存 {displayStock} 件 {maxPurchase && maxPurchase < displayStock && `· 限购${maxPurchase}件`}
            </div>
            {selectedSpecsText && <div className="text-gray-600 text-xs mt-1">已选：{selectedSpecsText}</div>}
          </div>
        </div>

        {useSkuMode && (
          <SkuSpecSelector
            skuSpecs={skuSpecs}
            normalizedSkus={normalizedSkus}
            selectedValueIds={selectedValueIds}
            onSelectSkuValue={handleSelectSkuValue}
            isValueSelectable={isValueSelectable}
          />
        )}

        {!useSkuMode && specs.length > 0 && (
          <LegacySpecSelector
            specs={specs}
            selectedSpecs={selectedSpecs}
            onSelectSpec={handleSelectSpec}
          />
        )}

        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">购买数量</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDecrease}
                disabled={quantity <= 1}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  quantity <= 1
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                }`}
              >
                <Minus size={16} />
              </button>
              <input
                type="text"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-12 h-8 text-center border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
              />
              <button
                onClick={handleIncrease}
                disabled={quantity >= actualMax}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  quantity >= actualMax
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                }`}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 pb-safe border-t border-gray-100">
          <button
            onClick={handleConfirm}
            disabled={!canBuy}
            className={`w-full py-3 rounded-xl text-white font-semibold text-base transition-all ${
              canBuy
                ? 'bg-gradient-to-r from-red-600 to-red-500 active:opacity-90'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {displayStock === 0
              ? '暂时缺货'
              : !allSpecsSelected
                ? '请选择规格'
                : useSkuMode && !matchedSku
                  ? '该规格暂无库存'
                  : '确认'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .pb-safe {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
};

export default BuySpecSheet;
