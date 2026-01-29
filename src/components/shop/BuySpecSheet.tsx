/**
 * BuySpecSheet - 商品规格选择弹窗
 * 
 * 支持多规格 SKU 选择，实现：
 * - 规格值动态可选/禁用
 * - 价格和库存实时更新
 * - SKU 匹配算法
 * 
 * @version 2.0.0 - 支持 SKU 多规格
 */
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { LazyImage } from '@/components/common';
import { SkuSpec, Sku, PriceRange } from '@/services/shop';

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

/**
 * 标准化 spec_value_ids 格式
 * 兼容后端返回数组或字符串两种格式
 */
const normalizeSpecValueIds = (sku: Sku): Sku => {
  // 如果是数组，转换为逗号分隔的字符串
  if (Array.isArray(sku.spec_value_ids)) {
    return {
      ...sku,
      spec_value_ids: sku.spec_value_ids.join(','),
    };
  }
  // 如果已经是字符串，直接返回
  return sku;
};

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
    // 仅在弹窗从关闭变为打开时初始化状态
    if (visible && !prevVisibleRef.current) {
      setQuantity(1);
      setSelectedSpecs({});
      // 使用预选值初始化
      const initialValues = Object.keys(preSelectedValueIds).length > 0 
        ? { ...preSelectedValueIds } 
        : {};
      setSelectedValueIds(initialValues);
    }
    prevVisibleRef.current = visible;
  }, [visible, preSelectedValueIds]);

  // 标准化 SKU 数据格式（兼容数组和字符串）
  const normalizedSkus = useMemo(() => {
    return skus.map(normalizeSpecValueIds);
  }, [skus]);
  
  // 判断是否使用新版 SKU 模式（有 skuSpecs 且 skus 非空即启用，兼容后端 has_sku 为数字 1 或未返回）
  const useSkuMode =
    (hasSku || (skuSpecs.length > 0 && normalizedSkus.length > 0)) &&
    skuSpecs.length > 0 &&
    normalizedSkus.length > 0;

  /**
   * 根据已选规格值ID查找匹配的 SKU
   */
  const findMatchedSku = useCallback((selections: Record<number, number>): Sku | null => {
    if (!useSkuMode) return null;
    
    // 获取所有已选的规格值ID并排序
    const selectedIds = skuSpecs
      .map(spec => selections[spec.id])
      .filter(id => id !== undefined);
    
    // 如果还没选完所有规格，返回 null
    if (selectedIds.length !== skuSpecs.length) return null;
    
    // 排序后生成 spec_value_ids 字符串
    const targetIds = selectedIds.join(',');
    
    // 查找匹配的 SKU
    return normalizedSkus.find(sku => {
      return String(sku.spec_value_ids) === targetIds && sku.stock > 0;
    }) || null;
  }, [useSkuMode, skuSpecs, normalizedSkus]);

  /**
   * 检查某个规格值是否可选（有库存）
   */
  const isValueSelectable = useCallback((specId: number, valueId: number): boolean => {
    if (!useSkuMode) return true;
    
    // 创建一个测试选择
    const testSelections = { ...selectedValueIds, [specId]: valueId };
    
    // 获取当前规格的索引
    const specIndex = skuSpecs.findIndex(s => s.id === specId);
    if (specIndex === -1) return false;
    
    // 检查是否有任意 SKU 匹配这个组合且有库存
    return normalizedSkus.some(sku => {
      if (sku.stock <= 0) return false;
      
      // 解析 spec_value_ids
      const skuValueIds = String(sku.spec_value_ids).split(',').map(Number);
      
      // 检查每个已选的规格值是否匹配
      for (let i = 0; i < skuSpecs.length; i++) {
        const spec = skuSpecs[i];
        const selectedId = testSelections[spec.id];
        
        // 如果这个规格已选，检查是否匹配
        if (selectedId !== undefined && skuValueIds[i] !== selectedId) {
          return false;
        }
      }
      
      return true;
    });
  }, [useSkuMode, selectedValueIds, skuSpecs, normalizedSkus]);

  // 当前匹配的 SKU
  const matchedSku = useMemo(() => {
    return findMatchedSku(selectedValueIds);
  }, [findMatchedSku, selectedValueIds]);

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
        return null; // 返回 null 表示显示价格区间
      }
    }
    return price;
  }, [useSkuMode, matchedSku, priceRange, price]);

  // 计算当前显示的消费金价格（根据 SKU 动态变化）
  const displayScorePrice = useMemo(() => {
    if (useSkuMode) {
      if (matchedSku) {
        return matchedSku.score_price || 0;
      }
      // 未完全选择规格时，显示消费金价格范围
      if (normalizedSkus.length > 0) {
        const scorePrices = normalizedSkus
          .map(sku => sku.score_price || 0)
          .filter(p => p > 0);
        if (scorePrices.length > 0) {
          const minScore = Math.min(...scorePrices);
          const maxScore = Math.max(...scorePrices);
          if (minScore !== maxScore) {
            return { min: minScore, max: maxScore }; // 返回区间对象
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
    // 检查选中的规格值是否有图片
    if (useSkuMode) {
      for (const spec of skuSpecs) {
        const selectedId = selectedValueIds[spec.id];
        if (selectedId) {
          const value = spec.values.find(v => v.id === selectedId);
          if (value && value.image) {
            return value.image;
          }
        }
      }
    }
    return productImage;
  }, [useSkuMode, matchedSku, skuSpecs, selectedValueIds, productImage]);

  // 计算实际限购数量
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
    if (!isNaN(num)) {
      if (num < 1) {
        setQuantity(1);
      } else if (num > actualMax) {
        setQuantity(actualMax);
      } else {
        setQuantity(num);
      }
    }
  };

  // 旧版规格选择
  const handleSelectSpec = (specName: string, value: string) => {
    setSelectedSpecs(prev => ({
      ...prev,
      [specName]: value,
    }));
  };

  // 新版 SKU 规格值选择
  const handleSelectSkuValue = (specId: number, valueId: number) => {
    setSelectedValueIds(prev => ({
      ...prev,
      [specId]: valueId,
    }));
    // 重置数量为1
    setQuantity(1);
  };

  const handleConfirm = () => {
    if (useSkuMode) {
      // 新版 SKU 模式：构建选中的规格文本
      const specsText: Record<string, string> = {};
      skuSpecs.forEach(spec => {
        const valueId = selectedValueIds[spec.id];
        if (valueId) {
          const value = spec.values.find(v => v.id === valueId);
          if (value) {
            specsText[spec.name] = value.value;
          }
        }
      });
      onConfirm(quantity, specsText, matchedSku?.id);
    } else {
      // 旧版规格模式
      onConfirm(quantity, specs.length > 0 ? selectedSpecs : undefined);
    }
  };

  // 检查是否所有规格都已选择
  const allSpecsSelected = useMemo(() => {
    if (useSkuMode) {
      return skuSpecs.every(spec => selectedValueIds[spec.id] !== undefined);
    }
    return specs.length === 0 || specs.every(spec => selectedSpecs[spec.name]);
  }, [useSkuMode, skuSpecs, selectedValueIds, specs, selectedSpecs]);

  // 检查是否可以购买（有匹配的 SKU 且有库存）
  const canBuy = useMemo(() => {
    if (useSkuMode) {
      return allSpecsSelected && matchedSku && matchedSku.stock > 0;
    }
    return allSpecsSelected && stock > 0;
  }, [useSkuMode, allSpecsSelected, matchedSku, stock]);

  // 获取选中的规格文本
  const selectedSpecsText = useMemo(() => {
    if (useSkuMode) {
      if (matchedSku) {
        return matchedSku.spec_value_names;
      }
      const parts: string[] = [];
      skuSpecs.forEach(spec => {
        const valueId = selectedValueIds[spec.id];
        if (valueId) {
          const value = spec.values.find(v => v.id === valueId);
          if (value) {
            parts.push(value.value);
          }
        }
      });
      return parts.length > 0 ? parts.join(' / ') : '';
    }
    return Object.values(selectedSpecs).join(' / ');
  }, [useSkuMode, matchedSku, skuSpecs, selectedValueIds, selectedSpecs]);

  // 渲染价格显示
  const renderPriceDisplay = () => {
    const parts: React.ReactNode[] = [];

    // 现金价格
    if (displayPrice !== null && displayPrice > 0) {
      parts.push(
        <span key="price" className="text-red-500">
          <span className="text-sm">¥</span>
          <span className="text-2xl font-bold font-[DINAlternate-Bold]">{displayPrice.toFixed(2)}</span>
        </span>
      );
    } else if (useSkuMode && priceRange && priceRange.min !== priceRange.max) {
      // 显示价格区间
      parts.push(
        <span key="price-range" className="text-red-500">
          <span className="text-sm">¥</span>
          <span className="text-xl font-bold font-[DINAlternate-Bold]">{priceRange.min.toFixed(2)}</span>
          <span className="text-sm mx-1">-</span>
          <span className="text-sm">¥</span>
          <span className="text-xl font-bold font-[DINAlternate-Bold]">{priceRange.max.toFixed(2)}</span>
        </span>
      );
    }

    // 绿色能量
    if (greenPowerAmount > 0) {
      if (parts.length > 0) parts.push(<span key="plus1" className="text-gray-400 mx-1">+</span>);
      parts.push(
        <span key="green" className="text-green-500 text-sm">{greenPowerAmount}绿色能量</span>
      );
    }

    // 余额可用金额
    if (balanceAvailableAmount > 0) {
      if (parts.length > 0) parts.push(<span key="plus2" className="text-gray-400 mx-1">+</span>);
      parts.push(
        <span key="balance" className="text-blue-500 text-sm">{balanceAvailableAmount}余额</span>
      );
    }

    // 消费金（根据 SKU 动态显示）
    if (typeof displayScorePrice === 'object' && displayScorePrice !== null) {
      // 显示消费金价格区间
      if (parts.length > 0) parts.push(<span key="plus3" className="text-gray-400 mx-1">+</span>);
      parts.push(
        <span key="score" className="text-red-500">
          <span className="text-xl font-bold">{displayScorePrice.min}</span>
          <span className="text-sm mx-0.5">-</span>
          <span className="text-xl font-bold">{displayScorePrice.max}</span>
          <span className="text-sm ml-0.5">消费金</span>
        </span>
      );
    } else if (typeof displayScorePrice === 'number' && displayScorePrice > 0) {
      if (parts.length > 0) parts.push(<span key="plus3" className="text-gray-400 mx-1">+</span>);
      parts.push(
        <span key="score" className="text-red-500">
          <span className="text-2xl font-bold">{displayScorePrice}</span>
          <span className="text-sm ml-0.5">消费金</span>
        </span>
      );
    }

    // 如果全为0，显示免费
    if (parts.length === 0) {
      return <span className="text-red-500 text-xl font-bold">免费</span>;
    }

    return <>{parts}</>;
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-[480px] bg-white rounded-t-2xl animate-slide-up overflow-hidden">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
        >
          <X size={18} className="text-gray-500" />
        </button>

        {/* 商品信息区 */}
        <div className="flex gap-3 p-4 pb-3">
          {/* 商品图片 */}
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <LazyImage
              src={displayImage}
              alt={productName}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 价格和库存 */}
          <div className="flex-1 flex flex-col justify-end pt-6">
            <div className="flex items-baseline flex-wrap">
              {renderPriceDisplay()}
            </div>
            <div className="text-gray-400 text-xs mt-1.5">
              库存 {displayStock} 件 {maxPurchase && maxPurchase < displayStock && `· 限购${maxPurchase}件`}
            </div>
            {selectedSpecsText && (
              <div className="text-gray-600 text-xs mt-1">
                已选：{selectedSpecsText}
              </div>
            )}
          </div>
        </div>

        {/* SKU 规格选择区（新版 - 京东风格） */}
        {useSkuMode && (
          <div className="px-4 py-3 border-t border-gray-100 max-h-[320px] overflow-y-auto">
            {skuSpecs.map((spec, specIndex) => {
              // 检查是否有图片（规格值图片或对应SKU图片）
              const hasSpecImages = spec.values.some(v => v.image);
              const hasSkuImages = specIndex === 0 && normalizedSkus.some(sku => sku.image);
              const showGridMode = hasSpecImages || hasSkuImages;
              
              // 获取规格值对应的价格和图片
              const getValueInfo = (valueId: number) => {
                // 找到包含此规格值的SKU
                const relatedSkus = normalizedSkus.filter(sku => {
                  const ids = String(sku.spec_value_ids).split(',').map(Number);
                  return ids[specIndex] === valueId;
                });
                
                if (relatedSkus.length === 0) return { price: null, image: null };
                
                // 获取价格范围
                const prices = relatedSkus.map(s => s.score_price || s.price || 0).filter(p => p > 0);
                const minPrice = prices.length > 0 ? Math.min(...prices) : null;
                const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
                
                // 获取图片（优先使用SKU图片）
                const skuWithImage = relatedSkus.find(s => s.image);
                const image = skuWithImage?.image || spec.values.find(v => v.id === valueId)?.image;
                
                return { 
                  minPrice, 
                  maxPrice,
                  image,
                  isScorePrice: relatedSkus.some(s => s.score_price && s.score_price > 0)
                };
              };
              
              return (
                <div key={spec.id} className="mb-4 last:mb-0">
                  <div className="text-sm text-gray-700 mb-2 font-medium">{spec.name}</div>
                  
                  {/* 网格模式（有图片时） */}
                  {showGridMode ? (
                    <div className="grid grid-cols-3 gap-2">
                      {spec.values.map((value) => {
                        const isSelected = selectedValueIds[spec.id] === value.id;
                        const selectable = isValueSelectable(spec.id, value.id);
                        const { minPrice, maxPrice, image, isScorePrice } = getValueInfo(value.id);
                        
                        return (
                          <button
                            key={value.id}
                            onClick={() => selectable && handleSelectSkuValue(spec.id, value.id)}
                            disabled={!selectable}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                              isSelected
                                ? 'border-red-500 bg-red-50'
                                : selectable
                                  ? 'border-gray-200 hover:border-gray-300 active:scale-[0.98]'
                                  : 'border-gray-100 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {/* 图片区域 */}
                            {image && (
                              <div className="aspect-square bg-gray-100">
                                <img 
                                  src={image} 
                                  alt={value.value}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            
                            {/* 信息区域 */}
                            <div className="p-2 text-center">
                              <div className={`text-xs font-medium truncate ${
                                isSelected ? 'text-red-600' : 'text-gray-700'
                              }`}>
                                {value.value}
                              </div>
                              {minPrice !== null && (
                                <div className={`text-xs mt-0.5 ${
                                  isSelected ? 'text-red-500' : 'text-gray-500'
                                }`}>
                                  {isScorePrice ? (
                                    minPrice === maxPrice 
                                      ? `${minPrice}消费金`
                                      : `${minPrice}-${maxPrice}`
                                  ) : (
                                    minPrice === maxPrice
                                      ? `¥${minPrice}`
                                      : `¥${minPrice}-${maxPrice}`
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* 选中标记 */}
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            
                            {/* 不可选遮罩 */}
                            {!selectable && (
                              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                <span className="text-[10px] text-gray-400">无货</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* 标签模式（无图片时） */
                    <div className="flex flex-wrap gap-2">
                      {spec.values.map((value) => {
                        const isSelected = selectedValueIds[spec.id] === value.id;
                        const selectable = isValueSelectable(spec.id, value.id);
                        
                        return (
                          <button
                            key={value.id}
                            onClick={() => selectable && handleSelectSkuValue(spec.id, value.id)}
                            disabled={!selectable}
                            className={`relative px-4 py-1.5 rounded-full text-sm border transition-all ${
                              isSelected
                                ? 'border-red-500 bg-red-50 text-red-500'
                                : selectable
                                  ? 'border-gray-200 text-gray-700 hover:border-gray-300 active:scale-95'
                                  : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                            }`}
                          >
                            {value.value}
                            {!selectable && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="w-full h-[1px] bg-gray-300 transform rotate-[-20deg]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 旧版规格选择区 */}
        {!useSkuMode && specs.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 max-h-[200px] overflow-y-auto">
            {specs.map((spec) => (
              <div key={spec.id} className="mb-4 last:mb-0">
                <div className="text-sm text-gray-700 mb-2">{spec.name}</div>
                <div className="flex flex-wrap gap-2">
                  {spec.values.map((value) => (
                    <button
                      key={value}
                      onClick={() => handleSelectSpec(spec.name, value)}
                      className={`px-4 py-1.5 rounded-full text-sm border transition-all ${selectedSpecs[spec.name] === value
                          ? 'border-red-500 bg-red-50 text-red-500'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 数量选择区 */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">购买数量</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDecrease}
                disabled={quantity <= 1}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${quantity <= 1
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
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${quantity >= actualMax
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                  }`}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 pb-safe border-t border-gray-100">
          <button
            onClick={handleConfirm}
            disabled={!canBuy}
            className={`w-full py-3 rounded-xl text-white font-semibold text-base transition-all ${canBuy
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
