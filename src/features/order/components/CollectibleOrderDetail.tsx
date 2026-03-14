import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Copy } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ErrorState } from '../../../components/ui/ErrorState';
import { collectionTradeApi } from '../../../api/modules/collectionTrade';
import type {
  CollectionBuyOrderDetail,
  CollectionSellOrderDetail,
} from '../../../api/modules/collectionTrade';
import { useFeedback } from '../../../components/ui/FeedbackProvider';
import { copyToClipboard } from '../../../lib/clipboard';

/** 解析藏品图片 URL */
function resolveImage(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `https://shujiaoshuo.oss-cn-hongkong.aliyuncs.com${url.startsWith('/') ? '' : '/'}${url}`;
}

function fmt(v: number | string | undefined, digits = 2): string {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toFixed(digits) : '0.00';
}

interface CollectibleOrderDetailProps {
  /** buy = 买入订单详情；sell = 卖出订单详情 */
  type: 'buy' | 'sell';
  /** buy 时为 order_id；sell 时为 consignment_id */
  id: number;
  onBack: () => void;
  onOpenHelp: () => void;
}

export const CollectibleOrderDetail = ({
  type,
  id,
  onBack,
  onOpenHelp,
}: CollectibleOrderDetailProps) => {
  const { showToast } = useFeedback();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [buyDetail, setBuyDetail] = useState<CollectionBuyOrderDetail | null>(null);
  const [sellDetail, setSellDetail] = useState<CollectionSellOrderDetail | null>(null);

  const fetchData = useCallback(async () => {
    if (id <= 0) {
      setError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      if (type === 'buy') {
        const data = await collectionTradeApi.buyOrderDetail({ id });
        setBuyDetail(data);
      } else {
        const data = await collectionTradeApi.sellOrderDetail({ id });
        setSellDetail(data);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopy = (text: string) => {
    copyToClipboard(text).then((ok) => {
      showToast({ message: ok ? '已复制' : '复制失败，请长按手动复制', type: ok ? 'success' : 'error' });
    });
  };

  /* ---- 骨架屏 ---- */
  const renderSkeleton = () => (
    <div className="p-4 space-y-3">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 animate-pulse h-24" />
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse h-28" />
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse h-40" />
    </div>
  );

  /* ==================== 买入详情内容 ==================== */
  const renderBuyContent = (order: CollectionBuyOrderDetail) => {
    const thumb = resolveImage(order.image);
    return (
      <>
        {/* 状态头部 */}
        <div className="gradient-primary-r p-6 text-white">
          <h2 className="text-4xl font-bold mb-1">{order.order_status_text}</h2>
          <p className="text-sm opacity-90">{order.pay_type_text}</p>
        </div>

        <div className="p-4 space-y-3 -mt-4 relative z-10">
          {/* 藏品信息 */}
          <Card className="p-0 overflow-hidden">
            <div className="px-3 py-3 border-b border-border-light flex items-center">
              <span className="text-white text-xs px-1 rounded mr-1.5 font-medium leading-tight bg-purple-500 dark:bg-purple-500/85">买入</span>
              <span className="text-base font-bold text-text-main">藏品交易</span>
            </div>
            <div className="p-3 flex space-x-3">
              <div className="w-[72px] h-[72px] rounded-lg bg-bg-base overflow-hidden shrink-0 border border-border-light">
                {thumb ? (
                  <img src={thumb} alt={order.item_title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-aux text-xs">藏品</div>
                )}
              </div>
              <div className="flex-1 flex flex-col">
                <div className="text-base text-text-main line-clamp-2 leading-tight mb-1">{order.item_title}</div>
                <div className="flex justify-between items-end mt-auto">
                  <div className="text-lg font-bold text-text-main leading-none">
                    <span className="text-s">¥</span>{fmt(order.buy_price)}
                  </div>
                  <span className="text-sm text-text-aux bg-bg-base px-1.5 py-0.5 rounded">{order.status_text}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* 订单信息 */}
          <Card className="p-3 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">订单编号</span>
              <span className="text-text-main flex items-center">
                {order.order_no}
                <button className="ml-1 text-text-aux cursor-pointer" onClick={() => handleCopy(order.order_no)}>
                  <Copy size={10} />
                </button>
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">下单时间</span>
              <span className="text-text-main">{order.create_time}</span>
            </div>
            {order.buy_time && (
              <div className="flex justify-between text-sm">
                <span className="text-text-sub">购买时间</span>
                <span className="text-text-main">{order.buy_time}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">支付方式</span>
              <span className="text-text-main">{order.pay_type_text}</span>
            </div>
            {order.mining_status === 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-sub">矿机状态</span>
                <span className="text-green-600 dark:text-green-300 font-medium">运行中</span>
              </div>
            )}

            <div className="h-px bg-border-light my-1" />

            {/* 支付明细 */}
            {order.pay_balance_available > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-sub">专项金支付</span>
                <span className="text-text-main">¥{fmt(order.pay_balance_available)}</span>
              </div>
            )}
            {order.pay_pending_activation_gold > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-sub">待激活金支付</span>
                <span className="text-text-main">¥{fmt(order.pay_pending_activation_gold)}</span>
              </div>
            )}
            {order.pay_ratio && (
              <div className="flex justify-between text-sm">
                <span className="text-text-sub">支付比例</span>
                <span className="text-text-main">{order.pay_ratio}</span>
              </div>
            )}

            <div className="h-px bg-border-light my-1" />
            <div className="flex justify-between text-md font-bold pt-1">
              <span className="text-text-main">实付金额</span>
              <span className="text-primary-start">¥{fmt(order.total_amount)}</span>
            </div>
          </Card>
        </div>
      </>
    );
  };

  /* ==================== 卖出详情内容 ==================== */
  const renderSellContent = (order: CollectionSellOrderDetail) => {
    const thumb = resolveImage(order.image);
    const isSettled = order.settle_status === 1;
    return (
      <>
        {/* 状态头部 */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-emerald-500 p-6 text-white">
          <h2 className="text-4xl font-bold mb-1">{order.status_text}</h2>
          <p className="text-sm opacity-90">{isSettled ? '已结算' : '待结算'}</p>
        </div>

        <div className="p-4 space-y-3 -mt-4 relative z-10">
          {/* 藏品信息 */}
          <Card className="p-0 overflow-hidden">
            <div className="px-3 py-3 border-b border-border-light flex items-center">
              <span className="text-white text-xs px-1 rounded mr-1.5 font-medium leading-tight bg-green-600">卖出</span>
              <span className="text-base font-bold text-text-main">藏品交易</span>
            </div>
            <div className="p-3 flex space-x-3">
              <div className="w-[72px] h-[72px] rounded-lg bg-bg-base overflow-hidden shrink-0 border border-border-light">
                {thumb ? (
                  <img src={thumb} alt={order.item_title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-aux text-xs">藏品</div>
                )}
              </div>
              <div className="flex-1 flex flex-col">
                <div className="text-base text-text-main line-clamp-2 leading-tight mb-1">{order.item_title}</div>
                <div className="flex justify-between items-end mt-auto">
                  <div>
                    <div className="text-xs text-text-aux mb-0.5">成交价</div>
                    <div className="text-lg font-bold text-green-600 leading-none">
                      <span className="text-s">¥</span>{fmt(order.sold_price)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-aux mb-0.5">收益</div>
                    <div className={`text-base font-bold ${order.profit_amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {order.profit_amount >= 0 ? '+' : ''}{fmt(order.profit_amount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 交易信息 */}
          <Card className="p-3 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">原买入订单号</span>
              <span className="text-text-main flex items-center">
                {order.order_no}
                <button className="ml-1 text-text-aux cursor-pointer" onClick={() => handleCopy(order.order_no)}>
                  <Copy size={10} />
                </button>
              </span>
            </div>
            {order.consign_time && (
              <div className="flex justify-between text-sm">
                <span className="text-text-sub">挂单时间</span>
                <span className="text-text-main">{order.consign_time}</span>
              </div>
            )}
            {order.sold_time && (
              <div className="flex justify-between text-sm">
                <span className="text-text-sub">成交时间</span>
                <span className="text-text-main">{order.sold_time}</span>
              </div>
            )}

            <div className="h-px bg-border-light my-1" />

            <div className="flex justify-between text-sm">
              <span className="text-text-sub">原始买入价</span>
              <span className="text-text-main">¥{fmt(order.buy_price)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">手续费</span>
              <span className="text-text-main">¥{fmt(order.service_fee)}</span>
            </div>

            <div className="h-px bg-border-light my-1" />

            {/* 结算信息 */}
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">结算状态</span>
              <span className={isSettled ? 'text-green-600 dark:text-green-300 font-medium' : 'text-text-aux'}>
                {isSettled ? '已结算' : '待结算'}
              </span>
            </div>
            {isSettled && order.settle_time && (
              <div className="flex justify-between text-sm">
                <span className="text-text-sub">结算时间</span>
                <span className="text-text-main">{order.settle_time}</span>
              </div>
            )}
            {isSettled && order.payout_total_withdrawable > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-sub">结算到可提现</span>
                <span className="text-text-main">¥{fmt(order.payout_total_withdrawable)}</span>
              </div>
            )}
            {isSettled && order.payout_total_consume > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-sub">结算到消费金</span>
                <span className="text-text-main">{fmt(order.payout_total_consume, 0)}</span>
              </div>
            )}

            <div className="h-px bg-border-light my-1" />
            <div className="flex justify-between text-md font-bold pt-1">
              <span className="text-text-main">成交金额</span>
              <span className="text-green-600 dark:text-green-300">¥{fmt(order.sold_price)}</span>
            </div>
          </Card>
        </div>
      </>
    );
  };

  /* ---- 主渲染 ---- */
  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return <ErrorState onRetry={fetchData} />;
    if (type === 'buy' && buyDetail) return renderBuyContent(buyDetail);
    if (type === 'sell' && sellDetail) return renderSellContent(sellDetail);
    return <ErrorState onRetry={fetchData} />;
  };

  return (
    <div className="absolute inset-0 bg-bg-base z-50 flex flex-col overflow-hidden">
      {/* 头部 */}
      <div className="bg-bg-card px-4 py-3 flex items-center justify-between border-b border-border-light">
        <button onClick={onBack} className="text-text-main p-1 -ml-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text-main">
          {type === 'buy' ? '买入订单详情' : '卖出订单详情'}
        </h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-[80px]">
        {renderContent()}
      </div>

      {/* 底部操作 */}
      <div className="absolute bottom-0 left-0 right-0 bg-bg-card border-t border-border-light p-3 pb-safe flex justify-end space-x-3">
        <Button variant="secondary" fullWidth={false} className="h-[36px] px-5" onClick={onOpenHelp}>
          联系客服
        </Button>
      </div>
    </div>
  );
};

