import type { FC } from 'react';
import { ChevronRight, Copy } from 'lucide-react';
import type { ShopOrderListItem } from '../../../api';
import { resolveShopProductImageUrl } from '../../shop-product/utils';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import {
  canShowOrderLogistics,
  isAfterSaleEligibleOrderStatus,
  isPendingReceiptOrderStatus,
} from '../status';

interface MallOrderCardProps {
  order: ShopOrderListItem;
  onOpenOrderDetail: () => void;
  onCopy: (text: string) => void;
  onOpenLogistics: (order: ShopOrderListItem) => void;
  onOpenCashier: () => void;
  onCancelOrder?: (orderId: number, cancelReason?: string) => void | Promise<void>;
  onCancelAfterSale?: (orderId: number, afterSaleId?: number) => void | Promise<void>;
  onConfirmOrder?: (orderId: number) => void | Promise<void>;
  onReview?: (orderId: number, productId: number) => void;
  onRefund?: (orderId: number) => void | Promise<void>;
}

/** 格式化金额显示：消费金或人民币 */
function formatOrderAmount(order: ShopOrderListItem): string {
  if (order.pay_type === 'score') {
    return `${order.total_score}消费金`;
  }
  if (order.pay_type === 'combined') {
    const parts: string[] = [];
    if (order.total_amount > 0) parts.push(`¥${Number(order.total_amount).toFixed(2)}`);
    if (order.total_score > 0) parts.push(`${order.total_score}消费金`);
    return parts.join(' + ') || '—';
  }
  return order.total_amount > 0 ? `¥${Number(order.total_amount).toFixed(2)}` : '—';
}

/** 格式化商品单价显示 */
function formatItemPrice(price: number, scorePrice: number, payType: string): string {
  if (payType === 'score' || (scorePrice > 0 && price <= 0)) {
    return `${scorePrice}消费金`;
  }
  return price > 0 ? `¥${Number(price).toFixed(2)}` : '—';
}

/** 判断订单是否需要显示底部操作按钮 */
function getOrderActions(order: ShopOrderListItem) {
  const status = order.status;
  const isCommented = order.is_commented === 1;
  const afterSaleStatus = order.after_sale_status ?? '';
  const canApplyAfterSale =
    (order.product_type === 'physical' || order.product_type === 'mixed') &&
    isAfterSaleEligibleOrderStatus(status) &&
    !afterSaleStatus;
  return {
    showPay: status === 'pending',
    showCancel: status === 'pending',
    showLogistics: canShowOrderLogistics(status),
    showRefund: canApplyAfterSale,
    showCancelAfterSale: afterSaleStatus === 'processing' && order.can_cancel_after_sale === 1,
    showConfirm: isPendingReceiptOrderStatus(status) && afterSaleStatus !== 'processing',
    showReview: status === 'completed' && !isCommented,
    showReviewed: status === 'completed' && isCommented,
  };
}

const ACTION_BTN = 'text-xs h-[28px] px-3.5 !rounded-md';

export const MallOrderCard: FC<MallOrderCardProps> = ({
  order,
  onOpenOrderDetail,
  onCopy,
  onOpenLogistics,
  onOpenCashier,
  onCancelOrder,
  onCancelAfterSale,
  onConfirmOrder,
  onReview,
  onRefund,
}) => {
  const firstItem = order.items?.[0];
  const itemCount = order.items?.length ?? 0;
  const thumbnail = firstItem?.product_thumbnail
    ? resolveShopProductImageUrl(firstItem.product_thumbnail)
    : '';
  const title = firstItem?.product_name || '商品';
  const totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const actions = getOrderActions(order);

  return (
    <Card className="mb-3 p-0 overflow-hidden cursor-pointer" onClick={onOpenOrderDetail}>
      {/* 顶部：店铺 + 订单状态 */}
      <div className="px-3 py-2.5 border-b border-border-light flex justify-between items-center bg-bg-base/50">
        <div className="flex items-center">
          <span className="bg-primary-start text-white text-xs px-1 rounded mr-1.5 font-medium leading-tight">
            自营
          </span>
          <span className="text-base font-bold text-text-main">树交所自营</span>
          <ChevronRight size={14} className="text-text-aux ml-0.5" />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-base text-primary-start font-medium">{order.status_text}</span>
          {order.after_sale_status_text ? (
            <span className="text-xs text-text-aux mt-0.5">售后{order.after_sale_status_text}</span>
          ) : null}
        </div>
      </div>

      <div className="p-3">
        {/* 商品信息 - 展示第一个商品 */}
        <div className="flex space-x-3 mb-3">
          <div className="w-[72px] h-[72px] rounded-lg bg-bg-base overflow-hidden shrink-0 border border-border-light">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-aux text-xs">
                商品
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="text-base text-text-main line-clamp-2 leading-tight mb-1">{title}</div>
            {order.pay_type_text ? (
              <div className="text-s text-text-aux bg-bg-base inline-block self-start px-1.5 py-0.5 rounded mb-auto line-clamp-1">
                {order.pay_type_text}
              </div>
            ) : null}
            <div className="flex justify-between items-end mt-1">
              <div className="text-lg font-bold text-text-main leading-none">
                {firstItem
                  ? formatItemPrice(firstItem.price, firstItem.score_price, order.pay_type)
                  : '—'}
              </div>
              <div className="text-sm text-text-aux">x{firstItem?.quantity || 1}</div>
            </div>
          </div>
        </div>

        {/* 多商品/多包裹提示 */}
        {(itemCount > 1 || (order.shipment_count != null && order.shipment_count > 1)) && (
          <div className="text-s text-text-sub mb-3 text-right">
            {itemCount > 1 && `共${itemCount}件商品，合计${totalQuantity}件`}
            {itemCount > 1 && order.shipment_count != null && order.shipment_count > 1 && ' · '}
            {order.shipment_count != null && order.shipment_count > 1 && `${order.shipment_count}个包裹`}
          </div>
        )}

        {/* 订单号 + 应付金额 */}
        <div className="flex justify-between items-center mb-3 text-s text-text-sub">
          <div className="flex items-center min-w-0">
            <span className="truncate">订单号 {order.order_no}</span>
            <button
              className="ml-1 cursor-pointer text-text-aux shrink-0"
              onClick={(event) => {
                event.stopPropagation();
                onCopy(order.order_no);
              }}
            >
              <Copy size={10} />
            </button>
          </div>
          <div className="shrink-0 ml-2">
            应付金额:{' '}
            <span className="text-md font-bold text-primary-start">
              {formatOrderAmount(order)}
            </span>
          </div>
        </div>

        {/* 操作按钮区 */}
        <div
          className="flex justify-end space-x-2 pt-3 border-t border-border-light"
          onClick={(event) => event.stopPropagation()}
        >
          {actions.showCancel && onCancelOrder && (
            <Button
              variant="secondary"
              fullWidth={false}
              className={ACTION_BTN}
              onClick={() => onCancelOrder(order.id)}
            >
              取消订单
            </Button>
          )}
          {actions.showRefund && onRefund && (
            <Button
              fullWidth={false}
              className={ACTION_BTN}
              onClick={() => onRefund(order.id)}
            >
              申请售后
            </Button>
          )}
          {actions.showCancelAfterSale && onCancelAfterSale && (
            <Button
              variant="secondary"
              fullWidth={false}
              className={ACTION_BTN}
              onClick={() => onCancelAfterSale(order.id, order.after_sale_id)}
            >
              取消申请
            </Button>
          )}
          {actions.showLogistics && (
            <Button
              variant="secondary"
              fullWidth={false}
              className={ACTION_BTN}
              onClick={() => onOpenLogistics(order)}
            >
              查看物流
            </Button>
          )}
          {actions.showPay && (
            <Button
              fullWidth={false}
              className={ACTION_BTN}
              onClick={onOpenCashier}
            >
              去付款
            </Button>
          )}
          {actions.showConfirm && onConfirmOrder && (
            <Button
              fullWidth={false}
              className={ACTION_BTN}
              onClick={() => onConfirmOrder(order.id)}
            >
              确认收货
            </Button>
          )}
          {actions.showReview && onReview && firstItem && (
            <Button
              fullWidth={false}
              className={ACTION_BTN}
              onClick={() => onReview(order.id, firstItem.product_id)}
            >
              去评价
            </Button>
          )}
          {actions.showReviewed && (
            <Button
              variant="secondary"
              fullWidth={false}
              className={`${ACTION_BTN} !opacity-60 cursor-default`}
              disabled
            >
              已评价
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
