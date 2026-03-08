import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CreditCard, Box, MapPin, Copy } from 'lucide-react';
import { reservationApi } from '../../api';
import { PageHeader } from '../../components/layout/PageHeader';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { useRequest } from '../../hooks/useRequest';
import { copyToClipboard } from '../../lib/clipboard';
import { useAppNavigate } from '../../lib/navigation';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { formatReservationAmount, getReservationStatusConfig } from '../../features/reservation/utils';

export const ReservationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const reservationId = parseInt(id || '', 10);
  const { goBack } = useAppNavigate();
  const { showToast } = useFeedback();

  const { data, loading, error, reload } = useRequest(
    (signal) => {
      if (!reservationId || isNaN(reservationId)) {
        return Promise.reject(new Error('无效的订单ID'));
      }
      return reservationApi.getDetail(reservationId, signal);
    },
    { cacheKey: `reservation_detail_${reservationId}` },
  );

  const handleRefresh = useCallback(async () => {
    await reload().catch(() => {});
  }, [reload]);

  const handleCopy = useCallback(async (text: string | number) => {
    const ok = await copyToClipboard(String(text));
    showToast({ message: ok ? '复制成功' : '复制失败，请手动长按复制', type: ok ? 'success' : 'error' });
  }, [showToast]);

  const cfg = useMemo(() => {
    return data ? getReservationStatusConfig(data.status) : null;
  }, [data]);

  const renderContent = () => {
    if (loading && !data) {
      return (
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      );
    }

    if (error || !data) {
      return (
        <ErrorState
          message={error?.message || '无法加载预约详情'}
          onRetry={handleRefresh}
        />
      );
    }

    const isMixed = data.payment?.is_mixed;
    const isMatched = data.deal?.matched;

    return (
      <div className="p-4 space-y-4 pb-[80px]">
        {/* 状态卡片 */}
        <div className={`p-6 rounded-2xl text-white ${data.status === 0 ? 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-orange-500/20' :
            data.status === 1 ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-green-500/20' :
              'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-700 dark:to-gray-800 shadow-gray-500/20'
          } shadow-md relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <h2 className="text-2xl font-bold mb-1.5 relative z-10">{cfg?.text}</h2>
          <p className="text-white/90 text-sm relative z-10">
            {data.status === 0 ? '系统正在为您优先撮合适配的藏品...' : data.status === 1 ? '恭喜您，抢购商品已成功为您锁定！' : '预约订单已失效或已退款'}
          </p>
        </div>

        {/* 商品与场次信息 */}
        <div className="bg-bg-card rounded-2xl p-4 shadow-sm border border-border-light">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border-light">
            <Box size={16} className="text-text-aux" />
            <span className="font-semibold text-text-main text-sm">申购标的信息</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">场次名称</span>
              <span className="text-text-main font-medium">{data.session_title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">价格区间</span>
              <span className="text-text-main font-medium">{data.zone_name} (¥{data.zone_min_price} - ¥{data.zone_max_price})</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-text-sub">资产包/商品</span>
              <span className="text-text-main font-medium text-right break-all max-w-[65%]">{data.deal?.item_title || data.package_name}</span>
            </div>
          </div>
        </div>

        {/* 支付与退款明细 */}
        <div className="bg-bg-card rounded-2xl p-4 shadow-sm border border-border-light">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border-light">
            <CreditCard size={16} className="text-text-aux" />
            <span className="font-semibold text-text-main text-sm">支付明细</span>
            <span className="ml-auto px-2 py-0.5 rounded text-[10px] bg-primary-start/10 text-primary-start font-medium">
              {isMixed ? '混合支付' : '专项金支付'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm items-center">
              <span className="text-text-sub">预约冻结汇总</span>
              <span className="text-text-main font-medium font-mono text-base">{formatReservationAmount(data.freeze_amount)}</span>
            </div>
            {isMixed && (
              <div className="text-xs text-text-aux space-y-1 block pb-2 border-b border-dashed border-border-light">
                <div className="flex justify-between pl-2">
                  <span>专项金支付</span>
                  <span>{formatReservationAmount(data.freeze_balance_available)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span>待活化金支付</span>
                  <span>{formatReservationAmount(data.freeze_pending_activation_gold)}</span>
                </div>
              </div>
            )}

            {isMatched && data.actual_payment && (
              <>
                <div className="flex justify-between text-sm items-center pt-2">
                  <span className="text-text-sub">实际成功支付</span>
                  <span className="text-text-main font-bold font-mono text-base">{formatReservationAmount(data.actual_payment.total_amount)}</span>
                </div>
                {isMixed && (
                  <div className="text-xs text-text-aux space-y-1 block pb-2 border-b border-dashed border-border-light">
                    <div className="flex justify-between pl-2">
                      <span>实扣专项金</span>
                      <span>{formatReservationAmount(data.actual_payment.balance_amount)}</span>
                    </div>
                    <div className="flex justify-between pl-2">
                      <span>实扣待活化金</span>
                      <span>{formatReservationAmount(data.actual_payment.pending_activation_gold_amount)}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {isMatched && data.refund && data.refund.total_amount > 0 && (
              <>
                <div className="flex justify-between text-sm items-center pt-2">
                  <span className="text-text-sub">已退回差价</span>
                  <span className="text-green-600 dark:text-green-500 font-bold font-mono text-base">+{formatReservationAmount(data.refund.total_amount)}</span>
                </div>
                {isMixed && (
                  <div className="text-xs text-text-aux space-y-1 block">
                    <div className="flex justify-between pl-2 text-green-600/70 dark:text-green-500/70">
                      <span>退回专项金</span>
                      <span>+{formatReservationAmount(data.refund.balance_amount)}</span>
                    </div>
                    <div className="flex justify-between pl-2 text-green-600/70 dark:text-green-500/70">
                      <span>退回待活化金</span>
                      <span>+{formatReservationAmount(data.refund.pending_activation_gold_amount)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 基础订单信息 */}
        <div className="bg-bg-card rounded-2xl p-4 shadow-sm border border-border-light">
          <div className="space-y-3">
            <div className="flex justify-between text-xs items-center">
              <span className="text-text-aux">预约单号</span>
              <div className="flex items-center space-x-1.5 cursor-pointer active:opacity-70 transition-opacity" onClick={() => handleCopy(data.id)}>
                <span className="text-text-sub font-mono">{data.id}</span>
                <Copy size={12} className="text-text-aux hover:text-primary-start" />
              </div>
            </div>
            <div className="flex justify-between text-xs items-center">
              <span className="text-text-aux">创建时间</span>
              <span className="text-text-sub">{data.create_time}</span>
            </div>
            {isMatched && data.deal?.match_order_no && (
              <div className="flex justify-between text-xs items-center">
                <span className="text-text-aux">撮合订单号</span>
                <div className="flex items-center space-x-1.5 cursor-pointer active:opacity-70 transition-opacity" onClick={() => handleCopy(data.deal.match_order_no)}>
                  <span className="text-text-sub font-mono">{data.deal.match_order_no}</span>
                  <Copy size={12} className="text-text-aux hover:text-primary-start" />
                </div>
              </div>
            )}
            {isMatched && data.deal?.match_time && (
              <div className="flex justify-between text-xs">
                <span className="text-text-aux">成交时间</span>
                <span className="text-text-sub">{data.deal.match_time}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="申购记录详情" onBack={goBack} />
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {renderContent()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
