/**
 * ProductGallery - 商品图片轮播组件
 */
import React, { useRef, useCallback } from 'react';
import { LazyImage } from '@/components/common';

interface ProductGalleryProps {
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  currentIndex,
  onIndexChange,
}) => {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  // 使用 rAF 节流滚动事件，避免高频触发导致卡顿
  const handleImageScroll = useCallback(() => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      if (!imageContainerRef.current) return;
      const scrollLeft = imageContainerRef.current.scrollLeft;
      const width = imageContainerRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex >= 0 && newIndex < images.length) {
        onIndexChange(newIndex);
      }
    });
  }, [images.length, onIndexChange]);

  const handleThumbnailClick = (idx: number) => {
    onIndexChange(idx);
    if (imageContainerRef.current) {
      imageContainerRef.current.scrollTo({
        left: idx * imageContainerRef.current.offsetWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative">
      {/* 图片轮播 */}
      <div
        ref={imageContainerRef}
        className="relative bg-white overflow-x-auto snap-x snap-mandatory flex"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={handleImageScroll}
      >
        {images.map((img, idx) => (
          <div key={idx} className="w-full flex-shrink-0 snap-center aspect-square">
            <LazyImage
              src={img || ''}
              alt={`商品图片 ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* 图片指示器 */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <div className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
          图集 {currentIndex + 1}/{images.length}
        </div>
      </div>

      {/* 规格缩略图选择器 */}
      {images.length > 1 && (
        <div className="bg-white px-3 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {images.slice(0, 6).map((img, idx) => (
            <div
              key={idx}
              onClick={() => handleThumbnailClick(idx)}
              className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                currentIndex === idx ? 'border-red-600' : 'border-gray-200'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {images.length > 6 && (
            <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-xs text-gray-500">共{images.length}款</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
