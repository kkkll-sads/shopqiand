/**
 * useProductDetail - 商品详情数据加载 Hook
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Product } from '@/types';
import {
  fetchShopProductDetail,
  fetchReviewSummary,
  ShopProductDetailData,
  ReviewSummaryData,
} from '@/services';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess, extractData } from '@/utils/apiHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { errorLog } from '@/utils/logger';
import { multiply, round as roundCurrency, subtract } from '@/utils/currency';

interface UseProductDetailParams {
  product: Product;
  initialData?: ShopProductDetailData | null;
}

export function useProductDetail({ product, initialData }: UseProductDetailParams) {
  const { showToast } = useNotification();
  const { handleError, errorMessage, hasError, clearError } = useErrorHandler();

  const [detailData, setDetailData] = useState<ShopProductDetailData | null>(initialData);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryData | null>(null);
  const [loading, setLoading] = useState(!initialData);

  // 使用 ref 追踪加载状态，避免重复请求
  const loadingRef = useRef(false);
  const reviewLoadedRef = useRef(false);
  const productIdRef = useRef(product.id);

  // 当 productId 变化时重置状态
  useEffect(() => {
    if (productIdRef.current !== product.id) {
      productIdRef.current = product.id;
      loadingRef.current = false;
      reviewLoadedRef.current = false;
      setDetailData(initialData);
      setReviewSummary(null);
      setLoading(!initialData);
    }
  }, [product.id, initialData]);

  // Load product detail - 只依赖 product.id
  useEffect(() => {
    // 如果有初始数据或已在加载中，跳过
    if (initialData || loadingRef.current) {
      return;
    }

    const loadDetail = async () => {
      loadingRef.current = true;
      setLoading(true);
      
      try {
        const response = await fetchShopProductDetail(Number(product.id));
        const data = extractData(response);
        if (data) {
          setDetailData(data);
        } else {
          handleError(response, {
            toastTitle: '加载失败',
            customMessage: '获取商品详情失败',
            context: { productId: product.id }
          });
        }
      } catch (err) {
        handleError(err, {
          toastTitle: '加载失败',
          customMessage: '网络错误，请重试',
          context: { productId: product.id }
        });
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Load review summary - 独立于主数据加载，失败不影响页面
  useEffect(() => {
    // 必须有详情数据且未加载过评价
    if (!detailData || reviewLoadedRef.current) {
      return;
    }

    const loadReviews = async () => {
      reviewLoadedRef.current = true;
      
      try {
        const response = await fetchReviewSummary(Number(product.id));
        const data = extractData(response);
        if (data) {
          setReviewSummary(data);
        }
        // 即使失败也不做任何处理，评价是可选数据
      } catch (err) {
        // 静默处理错误，只记录日志
        errorLog('useProductDetail', '加载评价摘要失败', err);
        // 不设置任何状态，不触发重新渲染
      }
    };

    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailData !== null, product.id]);

  // Computed values
  const displayTitle = useMemo(() => detailData?.name || product.title, [detailData, product.title]);
  const hasSku = useMemo(() => detailData?.has_sku === '1', [detailData]);
  const priceRange = useMemo(() => detailData?.price_range, [detailData]);
  const displayPrice = useMemo(() => {
    if (hasSku && priceRange) {
      return priceRange.min;
    }
    return Number(detailData?.price ?? product.price);
  }, [hasSku, priceRange, detailData, product.price]);
  const maxPrice = useMemo(() => {
    if (hasSku && priceRange) {
      return priceRange.max;
    }
    return displayPrice;
  }, [hasSku, priceRange, displayPrice]);
  const showPriceRange = useMemo(() => {
    return hasSku && priceRange && priceRange.min !== priceRange.max;
  }, [hasSku, priceRange]);
  const scorePrice = useMemo(() => detailData?.score_price || product.score_price || 0, [detailData, product.score_price]);

  const originalPrice = useMemo(() => {
    return roundCurrency(multiply(displayPrice, 1.15), 0).toNumber();
  }, [displayPrice]);
  const savedAmount = useMemo(() => {
    return subtract(originalPrice, displayPrice).toNumber();
  }, [originalPrice, displayPrice]);

  const salesCount = useMemo(() => {
    return (detailData as any)?.sales_count ?? (detailData as any)?.sales ?? 0;
  }, [detailData]);
  const reviewCount = useMemo(() => {
    return reviewSummary?.total ?? 0;
  }, [reviewSummary]);

  // 商品图片列表
  const detailImages = useMemo(() => {
    return Array.isArray(detailData?.detail_images) ? detailData.detail_images : [];
  }, [detailData]);

  const serverImages = useMemo(() => {
    return Array.isArray(detailData?.images) ? detailData.images : [];
  }, [detailData]);

  const shopImages = useMemo(() => {
    return serverImages.length > 0
      ? serverImages
      : [detailData?.thumbnail || product.image].filter(Boolean) as string[];
  }, [serverImages, detailData, product.image]);

  const safeShopImages = useMemo(() => {
    return shopImages.length > 0 ? shopImages : [product.image].filter(Boolean);
  }, [shopImages, product.image]);

  // 检查是否有可选择的规格
  const hasSelectableSpecs = useMemo(() => {
    const hasSkuFlag = detailData?.has_sku === '1';
    if (hasSkuFlag && detailData?.sku_specs && detailData.sku_specs.length > 0) {
      return true;
    }

    const rawSpecs = detailData?.specs || [];
    if (!Array.isArray(rawSpecs) || rawSpecs.length === 0) {
      return false;
    }

    const firstSpec = rawSpecs[0];
    if (firstSpec && firstSpec.id && firstSpec.name && Array.isArray(firstSpec.values)) {
      return rawSpecs.some(spec => spec.values && spec.values.length > 0);
    }

    const uniqueNames = new Set(rawSpecs.map((s: any) => s?.name).filter(Boolean));
    const uniqueValues = new Set(rawSpecs.map((s: any) => s?.value).filter(Boolean));
    return uniqueNames.size > 1 || uniqueValues.size > 1;
  }, [detailData]);

  return {
    detailData,
    reviewSummary,
    loading,
    hasError,
    errorMessage,
    clearError,
    displayTitle,
    hasSku,
    displayPrice,
    maxPrice,
    showPriceRange,
    scorePrice,
    originalPrice,
    savedAmount,
    salesCount,
    reviewCount,
    detailImages,
    safeShopImages,
    hasSelectableSpecs,
  };
}
