import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import type { ShopProductDetail } from '../../../api/modules/shopProduct';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { SkuMode } from '../types';
import {
  buildShopProductDescription,
  buildShopProductServiceItems,
  getShopProductBadges,
  getShopProductPrimaryPrice,
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
      if (
        Math.abs(deltaX) < SWIPE_LOCK_DISTANCE &&
        Math.abs(deltaY) < SWIPE_LOCK_DISTANCE
      ) {
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

              {hasMultipleImages ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex items-center justify-between px-4">
                  <div className="pointer-events-auto flex items-center gap-2">
                    {gallery.map((image, index) => {
                      const isActive = index === activeIndex;
                      return (
                        <button
                          key={`${image}-dot-${index}`}
                          type="button"
                          aria-label={`切换到第 ${index + 1} 张主图`}
                          aria-pressed={isActive}
                          onClick={() => {
                            setActiveIndex(index);
                            setDragOffset(0);
                            setIsInteracting(false);
                          }}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isActive ? 'w-5 bg-white' : 'w-2 bg-white/55'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="rounded-full bg-black/40 px-2 py-1 text-xs text-white">
                    {currentImageIndex} / {totalImages}
                  </div>
                </div>
              ) : (
                <div className="absolute bottom-4 right-4 rounded-full bg-black/40 px-2 py-1 text-xs text-white">
                  {currentImageIndex} / {totalImages}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-base text-text-aux">
              暂无商品图片
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="bg-white px-4 py-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      ) : (
        <div className="bg-white px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-[28px] font-bold leading-none text-primary-start">
                {product ? getShopProductPrimaryPrice(product) : '价格待定'}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {productBadges.map((badge) => (
                  <span
                    key={badge}
                    className={`rounded-md border px-2 py-1 text-xs leading-none ${
                      badge === '消费金'
                        ? 'border-[#f4d38d] bg-[#fff7df] text-[#9a6b00]'
                        : badge === '混合支付'
                          ? 'border-[#f4c2b6] bg-[#fff5f1] text-primary-start'
                          : 'border-[#e5e7eb] bg-[#fafafa] text-text-sub'
                    }`}
                  >
                    {badge}
                  </span>
                ))}
                {product?.category ? (
                  <span className="rounded-md border border-[#e5e7eb] bg-[#fafafa] px-2 py-1 text-xs leading-none text-text-sub">
                    {product.category}
                  </span>
                ) : null}
                <span className="rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-xs leading-none text-text-sub">
                  {product?.is_physical === '1' ? '实体商品' : '虚拟商品'}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right text-xs leading-5 text-text-sub">
              <div>已售 {product?.sales ?? 0}</div>
              <div>库存 {product?.stock ?? 0}</div>
            </div>
          </div>

          <h1 className="mt-4 line-clamp-2 text-[16px] font-semibold leading-6 text-text-main">
            {product?.name || '商品详情'}
          </h1>
          {productDescription ? (
            <p className="mt-2 text-sm leading-6 text-text-sub">{productDescription}</p>
          ) : null}
        </div>
      )}

      {loading ? (
        <div className="mt-2 bg-white px-4 py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ) : (
        <div
          className="mt-2 flex cursor-pointer items-center justify-between bg-white px-4 py-3 transition-colors active:bg-[#fafafa]"
          onClick={onOpenServiceDescription}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-sm text-text-sub">服务</span>
              <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-2">
                {serviceItems.map((item) => (
                  <span key={item} className="inline-flex items-center text-xs text-text-main">
                    <ShieldCheck size={12} className="mr-1 text-primary-start" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="ml-3 shrink-0 text-text-aux" />
        </div>
      )}

      {loading ? (
        <div className="mt-2 bg-white px-4 py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      ) : (
        <div
          className="mt-2 flex cursor-pointer items-center justify-between bg-white px-4 py-3 transition-colors active:bg-[#fafafa]"
          onClick={() => onOpenSku('select')}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-sm text-text-sub">已选</span>
              <span className="line-clamp-1 text-sm text-text-main">
                {selectedSummary || `x${quantity}`}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="ml-3 shrink-0 text-text-aux" />
        </div>
      )}
    </>
  );
};
