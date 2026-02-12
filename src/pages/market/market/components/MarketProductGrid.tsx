import React from 'react';
import { LayoutGrid, Loader2 } from 'lucide-react';
import { EmptyState, SkeletonProductGrid } from '@/components/common';
import type { Product } from '@/types';
import MarketProductCard from './MarketProductCard';

interface MarketProductGridProps {
  loading: boolean;
  error: string | null;
  products: Product[];
  activeFilter: string;
  loadingMore: boolean;
  hasMore: boolean;
  onSelectProduct: (product: Product) => void;
}

const MarketProductGrid: React.FC<MarketProductGridProps> = ({
  loading,
  error,
  products,
  activeFilter,
  loadingMore,
  hasMore,
  onSelectProduct,
}) => {
  return (
    <div className="p-2.5">
      {loading ? (
        <SkeletonProductGrid count={6} />
      ) : error ? (
        <div className="py-20">
          <EmptyState
            icon={<LayoutGrid size={48} className="text-gray-300" />}
            title="加载失败"
            description={error}
          />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {products.map((product, index) => (
            <MarketProductCard
              key={product.id}
              product={product}
              index={index}
              activeFilter={activeFilter}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      ) : (
        <div className="py-20">
          <EmptyState
            icon={<LayoutGrid size={48} className="text-gray-300" />}
            title="暂无相关商品"
            description="换个关键词试试吧"
          />
        </div>
      )}

      {loadingMore && (
        <div className="py-6 flex items-center justify-center text-gray-400 text-xs">
          <Loader2 size={16} className="animate-spin mr-2 text-red-500" />
          正在加载更多商品...
        </div>
      )}

      {!loading && !hasMore && products.length > 0 && (
        <div className="py-6 text-center text-gray-400 text-xs pb-20">
          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-px bg-gray-200" />
            <span>已加载全部</span>
            <div className="w-8 h-px bg-gray-200" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketProductGrid;
