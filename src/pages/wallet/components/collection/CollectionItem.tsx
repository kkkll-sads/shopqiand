/**
 * 单个藏品卡片组件
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { MyCollectionItem, normalizeAssetUrl } from '@/services';
import { formatTime } from '@/utils/format';
import { ConsignmentStatus, DeliveryStatus } from '@/constants/statusEnums';
import { hasConsignedBefore } from '../../hooks/useConsignmentAction';

interface CollectionItemProps {
  item: MyCollectionItem;
  activeTab: string;
  onItemSelect?: (item: MyCollectionItem) => void;
}

/**
 * 状态标签渲染
 */
function StatusChip({ item, activeTab }: { item: MyCollectionItem; activeTab: string }) {
  let text = item.status_text;
  let colorType = 'gray';

  if (text) {
    if (text.includes('确权') || text.includes('成功') || text.includes('已售出') || text.includes('持有')) {
      colorType = 'green';
    } else if (text.includes('寄售') || text.includes('出售')) {
      colorType = 'blue';
    } else if (text.includes('失败') || text.includes('取消')) {
      colorType = 'red';
    } else if (text.includes('提货') || text.includes('待')) {
      colorType = 'orange';
    }
  } else {
    if (activeTab === 'sold' || item.consignment_status === ConsignmentStatus.SOLD) {
      text = '已售出';
      colorType = 'green';
    } else if (item.consignment_status === ConsignmentStatus.CONSIGNING) {
      text = '寄售中';
      colorType = 'blue';
    } else if (item.delivery_status === DeliveryStatus.DELIVERED) {
      text = item.delivery_status_text || '已提货';
      colorType = 'green';
    } else if (hasConsignedBefore(item)) {
      if (item.consignment_status === ConsignmentStatus.PENDING) {
        text = '待寄售';
        colorType = 'orange';
      } else {
        text = item.consignment_status_text || '待提货';
        colorType = 'orange';
      }
    } else {
      text = item.consignment_status_text || '未寄售';
      colorType = 'gray';
    }
  }

  if (!text) return null;

  const styles = {
    green: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    red: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    orange: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
  }[colorType] || { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' };

  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-lg flex items-center gap-1 ${styles.bg} ${styles.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
      {text}
    </span>
  );
}

/**
 * 藏品卡片组件
 */
export const CollectionItem: React.FC<CollectionItemProps> = ({ item, activeTab, onItemSelect }) => {
  const navigate = useNavigate();

  if (!item) return null;

  const title = item.item_title || item.title || '未命名藏品';
  const image = item.item_image || item.image || '';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onItemSelect) {
      onItemSelect(item);
    } else {
      navigate(`/my-collection/${item.id}`);
    }
  };

  // 价格计算
  const isSold = activeTab === 'sold' || item.consignment_status === ConsignmentStatus.SOLD;
  const mainPrice = isSold
    ? Number(item.sold_price) || Number(item.consignment_price)
    : Number(item.buy_price) || Number(item.price) || Number(item.principal_amount);
  const priceLabel = isSold ? '成交' : '买入';

  return (
    <div
      key={item.id || item.user_collection_id || `item-${item.item_id}`}
      className="group bg-white rounded-2xl p-3 mb-3 border border-gray-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* 左侧封面图 */}
        <div className="w-16 h-16 rounded-xl bg-gray-50 flex-shrink-0 border border-gray-100 overflow-hidden relative">
          <img
            src={normalizeAssetUrl(image) || undefined}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.visibility = 'hidden';
            }}
          />
        </div>

        {/* 中间信息区 */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* 标题行 */}
          <div className="text-[17px] font-semibold text-gray-900 leading-tight line-clamp-1 mt-0.5">{title}</div>

          {/* 标签行 */}
          <div className="flex flex-wrap gap-2 items-center mt-1">
            {item.session_title && (
              <span className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg">{item.session_title}</span>
            )}
            {item.asset_code && (
              <span className="text-[11px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded-lg font-mono">
                {item.asset_code.length > 15
                  ? `${item.asset_code.substring(0, 8)}...${item.asset_code.substring(item.asset_code.length - 4)}`
                  : `#${item.asset_code}`}
              </span>
            )}
            <StatusChip item={item} activeTab={activeTab} />
          </div>

          {/* 价格与时间区块 */}
          <div className="mt-3">
            {mainPrice > 0 ? (
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-gray-400">{priceLabel}</span>
                <span className="text-xl font-bold text-gray-900 font-mono">¥{mainPrice.toFixed(2)}</span>
              </div>
            ) : (
              <div className="h-6"></div>
            )}
            <div className="text-xs text-gray-400 mt-1 font-mono opacity-80">
              {item.pay_time_text || item.buy_time_text || formatTime(item.pay_time || item.create_time)}
            </div>
          </div>
        </div>

        {/* 右侧 Chevron */}
        <div className="flex items-center justify-center pl-1">
          <ChevronRight size={20} className="text-gray-300" />
        </div>
      </div>
    </div>
  );
};

export default CollectionItem;
