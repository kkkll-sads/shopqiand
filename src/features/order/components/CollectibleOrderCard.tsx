import type { FC } from 'react';
import { ChevronRight, Copy } from 'lucide-react';
import type { CollectionBuyOrder, CollectionSellOrder } from '../../../api';
import { Card } from '../../../components/ui/Card';

/** 解析藏品图片 URL（相对路径补全域名） */
function resolveCollectionImage(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  // 相对路径补全 OSS 域名
  return `https://shujiaoshuo.oss-cn-hongkong.aliyuncs.com${url.startsWith('/') ? '' : '/'}${url}`;
}

/* ==================== 买入订单卡片 ==================== */

interface BuyOrderCardProps {
  order: CollectionBuyOrder;
  onCopy: (text: string) => void;
  onSelect?: () => void;
}

export const CollectibleBuyOrderCard: FC<BuyOrderCardProps> = ({ order, onCopy, onSelect }) => {
  const thumb = resolveCollectionImage(order.image);

  return (
    <Card className="mb-3 p-0 overflow-hidden cursor-pointer" onClick={onSelect}>
      {/* 顶部：标签 + 状态 */}
      <div className="px-3 py-2.5 border-b border-border-light flex justify-between items-center bg-bg-base/50">
        <div className="flex items-center">
          <span className="bg-purple-500 text-white text-xs px-1 rounded mr-1.5 font-medium leading-tight">买入</span>
          <span className="text-base font-bold text-text-main">藏品交易</span>
          <ChevronRight size={14} className="text-text-aux ml-0.5" />
        </div>
        <span className="text-base text-primary-start font-medium">{order.status_text}</span>
      </div>

      <div className="p-3">
        {/* 商品信息 */}
        <div className="flex space-x-3 mb-3">
          <div className="w-[72px] h-[72px] rounded-lg bg-bg-base overflow-hidden shrink-0 border border-border-light">
            {thumb ? (
              <img src={thumb} alt={order.item_title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-aux text-xs">藏品</div>
            )}
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="text-base text-text-main line-clamp-2 leading-tight mb-1">{order.item_title}</div>
            <div className="text-s text-text-aux bg-bg-base inline-block self-start px-1.5 py-0.5 rounded mb-auto line-clamp-1">
              {order.pay_type_text}
            </div>
            <div className="flex justify-between items-end mt-1">
              <div className="text-lg font-bold text-text-main leading-none">
                <span className="text-s">¥</span>{Number(order.buy_price).toFixed(2)}
              </div>
              <div className="text-sm text-text-aux">1件</div>
            </div>
          </div>
        </div>

        {/* 订单号 + 金额 */}
        <div className="flex justify-between items-center mb-3 text-s text-text-sub">
          <div className="flex items-center min-w-0">
            <span className="truncate">订单号 {order.order_no}</span>
            <button
              className="ml-1 cursor-pointer text-text-aux shrink-0"
              onClick={(e) => { e.stopPropagation(); onCopy(order.order_no); }}
            >
              <Copy size={10} />
            </button>
          </div>
          <div className="shrink-0 ml-2">
            买入金额: <span className="text-md font-bold text-primary-start">¥{Number(order.buy_price).toFixed(2)}</span>
          </div>
        </div>

        {/* 时间 */}
        <div className="text-s text-text-aux">{order.buy_time}</div>
      </div>
    </Card>
  );
};

/* ==================== 卖出订单卡片 ==================== */

interface SellOrderCardProps {
  order: CollectionSellOrder;
  onCopy: (text: string) => void;
  onSelect?: () => void;
}

export const CollectibleSellOrderCard: FC<SellOrderCardProps> = ({ order, onCopy, onSelect }) => {
  const thumb = resolveCollectionImage(order.image);
  const profit = order.sold_price - order.buy_price;

  return (
    <Card className="mb-3 p-0 overflow-hidden cursor-pointer" onClick={onSelect}>
      {/* 顶部：标签 + 状态 */}
      <div className="px-3 py-2.5 border-b border-border-light flex justify-between items-center bg-bg-base/50">
        <div className="flex items-center">
          <span className="bg-green-600 text-white text-xs px-1 rounded mr-1.5 font-medium leading-tight">卖出</span>
          <span className="text-base font-bold text-text-main">藏品交易</span>
          <ChevronRight size={14} className="text-text-aux ml-0.5" />
        </div>
        <span className="text-base text-green-600 font-medium">{order.status_text}</span>
      </div>

      <div className="p-3">
        {/* 商品信息 */}
        <div className="flex space-x-3 mb-3">
          <div className="w-[72px] h-[72px] rounded-lg bg-bg-base overflow-hidden shrink-0 border border-border-light">
            {thumb ? (
              <img src={thumb} alt={order.item_title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-aux text-xs">藏品</div>
            )}
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="text-base text-text-main line-clamp-2 leading-tight mb-1">{order.item_title}</div>
            <div className="flex justify-between items-end mt-1">
              <div className="text-lg font-bold text-text-main leading-none">
                <span className="text-s">¥</span>{Number(order.buy_price).toFixed(2)}
              </div>
              <div className={`text-sm font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* 订单号 + 金额 */}
        <div className="flex justify-between items-center mb-3 text-s text-text-sub">
          <div className="flex items-center min-w-0">
            <span className="truncate">订单号 {order.order_no}</span>
            <button
              className="ml-1 cursor-pointer text-text-aux shrink-0"
              onClick={(e) => { e.stopPropagation(); onCopy(order.order_no); }}
            >
              <Copy size={10} />
            </button>
          </div>
          <div className="shrink-0 ml-2">
            成交金额: <span className="text-md font-bold text-green-600">¥{Number(order.sold_price).toFixed(2)}</span>
          </div>
        </div>

        {/* 时间 */}
        <div className="text-s text-text-aux">{order.sold_time}</div>
      </div>
    </Card>
  );
};
