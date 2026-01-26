/**
 * ProductGrid - 商品网格组件
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LazyImage } from '@/components/common';
import { Product } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { TradingDisplayItem } from '../../hooks/useTradingZone';

interface ProductGridProps {
  items: TradingDisplayItem[];
  activePriceZone: string;
  loading: boolean;
  error: string | null;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  items,
  activePriceZone,
  loading,
  error,
}) => {
  const navigate = useNavigate();
  const { setSelectedProduct } = useAppStore();

  const filteredItems = items.filter(item => {
    if (activePriceZone === 'all') return true;
    return item.price_zone === activePriceZone;
  });

  const buildProductData = (item: TradingDisplayItem): Product => ({
    id: String(item.id || item.package_id),
    title: item.title,
    price: item.price,
    image: item.image,
    artist: '',
    category: 'Data Asset',
    productType: 'collection' as const,
    sessionId: item.session_id,
    zoneId: item.zone_id || item.price_zone_id,
    packageId: item.package_id,
    priceZone: item.price_zone,
    ...(item.source === 'consignment' && item.consignment_id
      ? { consignmentId: item.consignment_id }
      : {}),
  });

  const handleGoToReservation = (item: TradingDisplayItem) => {
    const productData = buildProductData(item);
    setSelectedProduct(productData, 'trading-zone');
    navigate('/reservation');
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm">{error}</div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm">暂无资产</div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {filteredItems.map((item) => (
        <div
          key={item.displayKey}
          className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:border-red-200 hover:shadow-xl transition-all active:scale-[0.98] group cursor-pointer"
          onClick={() => handleGoToReservation(item)}
        >
          <div className="aspect-square bg-gray-50 relative overflow-hidden">
            <LazyImage
              src={item.image}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="p-4">
            <h3 className="text-gray-900 text-sm font-bold line-clamp-1 mb-3">
              {item.title}
            </h3>
            <div className="flex justify-between items-center">
              <div className="text-red-500 font-extrabold text-base flex items-baseline gap-0.5">
                <span>{item.price_zone}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGoToReservation(item);
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-red-200 active:scale-95 transition-all hover:shadow-xl"
              >
                申购
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
