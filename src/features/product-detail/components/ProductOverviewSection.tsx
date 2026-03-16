import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';
import type { ShopProductDetail } from '../../../api/modules/shopProduct';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { SkuMode } from '../types';
import {
  buildShopProductDescription,
  buildShopProductServiceItems,
  formatShopProductSales,
  getShopProductBadges,
  getShopProductPriceCaption,
  getShopProductPricePresentation,
  resolveShopProductImageUrl,
} from '../../shop-product/utils';

interface ProductOverviewSectionProps {
  loading: boolean;
  onOpenServiceDescription: () => void;
  onOpenSku: (mode: SkuMode) => void;
  product: ShopProductDetail | null;
  quantity: number;
  selectedSummary: string;
}

const AUTO_PLAY_INTERVAL = 4500;
const SWIPE_THRESHOLD = 56;
const SWIPE_LOCK_DISTANCE = 10;

export const ProductOverviewSection = ({
  loading,
  onOpenServiceDescription,
  onOpenSku,
  product,
  quantity,
  selectedSummary,
}: ProductOverviewSectionProps) => {
  const gallery = useMemo(
    () =>
      product
        ? [product.thumbnail, ...(product.images ?? [])]
            .map((image) => resolveShopProductImageUrl(image))
            .filter(Boolean)
            .filter((image, index, source) => source.indexOf(image) === index)
        : [],
    [product],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const isHorizontalSwipeRef = useRef(false);

  const serviceItems = buildShopProductServiceItems(product);
  const productDescription = buildShopProductDescription(product);
  const productBadges = product ? getShopProductBadges(product) : [];
  const pricePresentation = product ? getShopProductPricePresentation(product) : null;
  const priceCaption = product ? getShopProductPriceCaption(product) : '';
  const hasMultipleImages = gallery.length > 1;
  const currentImageIndex = gallery.length > 0 ? activeIndex + 1 : 1;
  const totalImages = Math.max(gallery.length, 1);

  useEffect(() => {
    setActiveIndex(0);
    setDragOffset(0);
    setIsInteracting(false);
  }, [product?.id]);

  useEffect(() => {
    setActiveIndex((current) => {
      if (!gallery.length) {
        return 0;
      }
      return Math.min(current, gallery.length - 1);
    });
  }, [gallery.length]);

  useEffect(() => {
    if (!hasMultipleImages || isInteracting) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % gallery.length);
    }, AUTO_PLAY_INTERVAL);

    return () => window.clearInterval(timer);
  }, [gallery.length, hasMultipleImages, isInteracting]);

  const resetSwipeState = () => {
    setDragOffset(0);
    setIsInteracting(false);
    dragDistanceRef.current = 0;
    isHorizontalSwipeRef.current = false;
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!hasMultipleImages) {
      return;
    }

    const touch = event.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    dragDistanceRef.current = 0;
    isHorizontalSwipeRef.current = false;
    setIsInteracting(true);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!hasMultipleImages || event.touches.length === 0) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;

    if (!isHorizontalSwipeRef.current) {
      if (Math.abs(deltaX) < SWIPE_LOCK_DISTANCE && Math.abs(deltaY) < SWIPE_LOCK_DISTANCE) {
        return;
      }

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }

      isHorizontalSwipeRef.current = true;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const width = carouselRef.current?.clientWidth ?? window.innerWidth;
    const maxOffset = width * 0.24;
    dragDistanceRef.current = deltaX;
    setDragOffset(Math.max(-maxOffset, Math.min(maxOffset, deltaX)));
  };

  const handleTouchEnd = () => {
    if (!hasMultipleImages) {
      return;
    }

    if (isHorizontalSwipeRef.current) {
      const width = carouselRef.current?.clientWidth ?? window.innerWidth;
      const threshold = Math.max(SWIPE_THRESHOLD, width * 0.12);

      if (dragDistanceRef.current <= -threshold) {
        setActiveIndex((current) => (current + 1) % gallery.length);
      } else if (dragDistanceRef.current >= threshold) {
        setActiveIndex((current) => (current - 1 + gallery.length) % gallery.length);
      }
    }

    resetSwipeState();
  };

  const renderPrice = () => {
    if (!pricePresentation) {
      return <span className="text-[28px] font-bold leading-none text-primary-start">价格待定</span>;
    }

    if (
      pricePresentation.mode === 'mixed' &&
      pricePresentation.moneyText &&
      pricePresentation.scoreText
    ) {
      return (
        <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
          <span className="text-[28px] font-bold leading-none text-primary-start">
            {pricePresentation.moneyText}
          </span>
          <span className="pb-0.5 text-sm font-medium text-text-main">+</span>
          <span className="text-[24px] font-bold leading-none text-orange-500">
            {pricePresentation.scoreText}
          </span>
          <span className="pb-0.5 text-xs font-medium text-orange-500">消费金</span>
        </div>
      );
    }

    if (pricePresentation.mode === 'score' && pricePresentation.scoreText) {
      return (
        <div className="flex items-end gap-1.5">
          <span className="text-[28px] font-bold leading-none text-primary-start">
            {pricePresentation.scoreText}
          </span>
          <span className="pb-0.5 text-xs font-medium text-primary-start">消费金</span>
        </div>
      );
    }

    return (
      <span className="text-[28px] font-bold leading-none text-primary-start">
        {pricePresentation.primaryText}
      </span>
    );
  };

  return (
    <>
      {loading ? (
        <Skeleton className="aspect-square w-full" />
      ) : (
        <div
          ref={carouselRef}
          className="relative aspect-square w-full overflow-hidden bg-white"
          onTouchCancel={handleTouchEnd}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchStart}
          role="group"
          aria-roledescription="carousel"
          aria-label={`${product?.name || '商品'}主图`}
          style={{ touchAction: hasMultipleImages ? 'pan-y' : undefined }}
        >
          {gallery.length > 0 ? (
            <>
              <div
                className="flex h-full"
                style={{
                  transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))`,
                  transitionDuration: isInteracting ? '0ms' : '320ms',
                  transitionProperty: 'transform',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                {gallery.map((image, index) => (
                  <div key={`${image}-${index}`} className="h-full w-full shrink-0">
                    <img
                      src={image}
                      alt={`${product?.name || '商品'} ${index + 1}`}
                      className="h-full w-full object-cover"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>

              <div className="absolute bottom-4 right-4 rounded-full bg-black/45 px-2 py-1 text-xs text-white">
                {currentImageIndex} / {totalImages}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-base text-text-aux">暂无商品图片</div>
          )}
        </div>
      )}

      {loading ? (
        <div className="mx-4 mt-4 rounded-t-2xl rounded-b-none border border-border-light bg-white p-4">
          <Skeleton className="h-8 w-44" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-4 rounded-t-2xl rounded-b-none border border-border-light bg-white px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {renderPrice()}
              {priceCaption ? <div className="mt-2 text-xs text-text-sub">{priceCaption}</div> : null}
            </div>
            <div className="shrink-0 text-right text-[11px] text-text-aux">
              <div>已售 {formatShopProductSales(product?.sales)}</div>
              <div className="mt-1">库存 {product?.stock ?? '--'}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {productBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-sm bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-primary-start"
              >
                {badge}
              </span>
            ))}
            {product?.category ? (
              <span className="rounded-sm border border-border-light bg-bg-base px-1.5 py-0.5 text-[11px] text-text-sub">
                {product.category}
              </span>
            ) : null}
            <span className="rounded-sm border border-border-light bg-bg-base px-1.5 py-0.5 text-[11px] text-text-sub">
              {product?.is_physical === '1' ? '实体商品' : '虚拟商品'}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mx-4 rounded-b-2xl border border-t-0 border-border-light bg-white p-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-4/5" />
          <Skeleton className="mt-3 h-4 w-2/3" />
        </div>
      ) : (
        <div className="mx-4 rounded-b-2xl border border-t-0 border-border-light bg-white px-4 py-4 shadow-soft">
          <h1 className="line-clamp-2 text-[16px] font-bold leading-6 text-text-main">
            {product?.name || '商品详情'}
          </h1>
          {productDescription ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-sub">{productDescription}</p>
          ) : null}
          <div className="mt-3 flex items-center gap-4 text-[11px] text-text-aux">
            <span>销量 {formatShopProductSales(product?.sales)}</span>
            <span>库存 {product?.stock ?? '--'}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mx-4 mt-4 rounded-2xl border border-border-light bg-white p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ) : (
        <div
          className="mx-4 mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-border-light bg-white px-4 py-3 transition-colors active:bg-bg-base"
          onClick={() => onOpenSku('select')}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="shrink-0 text-sm font-bold text-text-main">已选</span>
            <span className="line-clamp-1 text-sm text-text-main">{selectedSummary || `x${quantity}`}</span>
          </div>
          <ChevronRight size={16} className="ml-3 shrink-0 text-text-aux" />
        </div>
      )}

      {loading ? (
        <div className="mx-4 mt-3 rounded-2xl border border-border-light bg-white p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ) : (
        <div
          className="mx-4 mt-3 flex cursor-pointer items-start justify-between rounded-2xl border border-border-light bg-white px-4 py-3 transition-colors active:bg-bg-base"
          onClick={onOpenServiceDescription}
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="mt-0.5 shrink-0 text-sm font-bold text-text-main">服务</span>
            {serviceItems.length > 0 ? (
              <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-2">
                {serviceItems.slice(0, 4).map((item, index) => (
                  <span key={item} className="inline-flex items-center text-xs text-text-sub">
                    {index < 3 ? (
                      <CheckCircle2 size={12} className="mr-1 text-primary-start" />
                    ) : (
                      <ShieldCheck size={12} className="mr-1 text-primary-start" />
                    )}
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-text-sub">暂无服务信息</span>
            )}
          </div>
          <ChevronRight size={16} className="ml-3 mt-0.5 shrink-0 text-text-aux" />
        </div>
      )}
    </>
  );
};
