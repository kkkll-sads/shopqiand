import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import type { ShopProductDetail } from '../../../api/modules/shopProduct';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
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
          className="relative aspect-square w-full overflow-hidden bg-white dark:bg-gray-900"
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

              {hasMultipleImages && (
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
                            isActive ? 'w-6 bg-white' : 'w-2 bg-white/45'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="rounded-full bg-black/40 px-2 py-1 text-s text-white backdrop-blur-sm">
                    {currentImageIndex} / {totalImages}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-base text-text-aux">
              暂无商品图片
            </div>
          )}

          {!hasMultipleImages && gallery.length > 0 && (
            <div className="absolute bottom-4 right-4 rounded-full bg-black/40 px-2 py-1 text-s text-white backdrop-blur-sm">
              {currentImageIndex} / {totalImages}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <Card className="m-4 space-y-3 p-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      ) : (
        <Card className="mx-4 mt-4 rounded-t-[16px] rounded-b-none border-b border-border-light p-4 shadow-none">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold leading-tight text-primary-start">
                {product ? getShopProductPrimaryPrice(product) : '价格待定'}
              </div>
            </div>
            <div className="text-sm text-text-sub">库存 {product?.stock ?? 0}</div>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {(product ? getShopProductBadges(product) : []).map((badge) => (
              <Badge key={badge} variant={badge === '消费金' ? 'score' : 'primary'}>
                {badge}
              </Badge>
            ))}
            {product?.category && (
              <Badge variant="default" className="rounded-full">
                {product.category}
              </Badge>
            )}
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="mx-4 mb-4 space-y-2 rounded-t-none p-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </Card>
      ) : (
        <Card className="mx-4 mb-4 rounded-t-none p-4 shadow-soft">
          <h1 className="mb-2 line-clamp-2 text-xl font-bold leading-snug text-text-main">
            {product?.name || '商品详情'}
          </h1>
          {productDescription && (
            <p className="mb-3 text-base text-text-sub">{productDescription}</p>
          )}
          <div className="flex items-center space-x-4 text-s text-text-aux">
            <span>销量 {product?.sales ?? 0}</span>
            <span>库存 {product?.stock ?? 0}</span>
            <span>{product?.is_physical === '1' ? '实物商品' : '虚拟商品'}</span>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="m-4 flex items-center justify-between p-4">
          <div className="flex w-full items-center space-x-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-4 w-4" />
        </Card>
      ) : (
        <Card
          className="m-4 flex cursor-pointer items-center justify-between p-4 transition-colors active:bg-bg-base"
          onClick={() => onOpenSku('select')}
        >
          <div className="flex items-center">
            <span className="w-12 shrink-0 text-base font-bold text-text-main">已选</span>
            <span className="line-clamp-1 text-base text-text-main">
              {selectedSummary || `x${quantity}`}
            </span>
          </div>
          <ChevronRight size={16} className="shrink-0 text-text-aux" />
        </Card>
      )}

      {loading ? (
        <Card className="m-4 space-y-4 p-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-full" />
          </div>
        </Card>
      ) : (
        <Card
          className="m-4 cursor-pointer p-4 transition-colors active:bg-bg-base"
          onClick={onOpenServiceDescription}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <span className="mt-0.5 w-12 shrink-0 text-base font-bold text-text-main">服务</span>
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {serviceItems.map((item) => (
                  <span key={item} className="flex items-center text-sm text-text-sub">
                    <ShieldCheck size={12} className="mr-1 text-primary-start" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight size={16} className="mt-0.5 shrink-0 text-text-aux" />
          </div>
        </Card>
      )}
    </>
  );
};
