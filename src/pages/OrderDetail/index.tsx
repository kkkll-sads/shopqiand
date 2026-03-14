/**
 * @file OrderDetail/index.tsx - 订单详情页面
 * @description 展示单个订单的详细信息，包括商品、物流、支付等。
 */

import React, { useState, useEffect, useCallback } from 'react'; // React 核心 Hook
import { useParams } from 'react-router-dom';
import { ChevronLeft, WifiOff, MapPin, Truck, ChevronRight, Copy, Package, Clock, CreditCard, CheckCircle2, XCircle, ShoppingBag, RotateCcw } from 'lucide-react';
import { copyToClipboard } from '../../lib/clipboard';
import { useAppNavigate } from '../../lib/navigation';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { shopOrderApi } from '../../api/modules/shopOrder';
import type { ShopOrderDetailResponse, ShopOrderItemDetail } from '../../api/modules/shopOrder';
import { ApiError, getErrorMessage } from '../../api/core/errors';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { buildShopProductPath, resolveShopProductImageUrl } from '../../features/shop-product/utils';
import {
  isAfterSaleEligibleOrderStatus,
  isPendingReceiptOrderStatus,
} from '../../features/order/status';

function formatTime(ts: number): string {
  if (!ts) return '--';
  const d = new Date(ts * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatItemPrice(item: ShopOrderItemDetail, payType: string): string {
  const price = Number(item.price) || 0;
  const scorePrice = Number(item.score_price) || 0;
  if (payType === 'combined' && price > 0 && scorePrice > 0) {
    return `¥${price.toFixed(2)} + ${scorePrice}消费金`;
  }
  if (payType === 'score' || (scorePrice > 0 && price <= 0)) {
    return `${scorePrice}消费金`;
  }
  return price > 0 ? `¥${price.toFixed(2)}` : '—';
}

function formatTotalAmount(order: ShopOrderDetailResponse): string {
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

const STATUS_CONFIG: Record<string, { icon: typeof Package; gradient: string; bgColor: string }> = {
  pending: { icon: Clock, gradient: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-50' },
  paid: { icon: CreditCard, gradient: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50' },
  shipped: { icon: Truck, gradient: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-50' },
  pending_confirm: { icon: Truck, gradient: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-50' },
  pending_receive: { icon: Truck, gradient: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-50' },
  completed: { icon: CheckCircle2, gradient: 'from-emerald-500 to-green-500', bgColor: 'bg-emerald-50' },
  cancelled: { icon: XCircle, gradient: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50' },
  refunded: { icon: RotateCcw, gradient: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50' },
};

function getActiveSteps(status: string): number {
  const map: Record<string, number> = {
    pending: 1,
    paid: 2,
    shipped: 3,
    pending_confirm: 3,
    pending_receive: 3,
    completed: 4,
  };
  return map[status] ?? 0;
}

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = id ? parseInt(id, 10) : 0;
  const { goBackOr, navigate } = useAppNavigate();
  const { showToast, showLoading, hideLoading, showConfirm } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [order, setOrder] = useState<ShopOrderDetailResponse | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (orderId <= 0) {
      setError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const data = await shopOrderApi.detail({ id: orderId });
      setOrder(data);
    } catch (error) {
      if (error instanceof ApiError && error.message !== 'Network request failed.' && error.message !== 'Request timed out.') {
        showToast({ message: error.message || '订单状态已变更，正在返回订单列表', type: 'warning' });
        navigate('/order', { replace: true });
        return;
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [navigate, orderId, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBack = () => goBackOr('order');

  const handleCopy = (text: string) => {
    if (!text) return;
    copyToClipboard(text).then((ok) => {
      showToast({ message: ok ? '已复制' : '复制失败', type: ok ? 'success' : 'error' });
    });
  };

  const handleConfirmReceipt = async () => {
    if (orderId <= 0 || confirming) return;
    setConfirming(true);
    showLoading('确认收货中...');
    try {
      await shopOrderApi.confirm(orderId);
      showToast({ message: '确认收货成功', type: 'success' });
      await fetchData();
    } catch (e) {
      showToast({ message: getErrorMessage(e), type: 'error' });
    } finally {
      hideLoading();
      setConfirming(false);
    }
  };

  const handleCancelOrder = async () => {
    if (orderId <= 0) return;
    const confirmed = await showConfirm({
      title: '取消订单',
      message: '确定要取消这笔商城订单吗？',
      confirmText: '确认取消',
      cancelText: '再想想',
      danger: true,
    });
    if (!confirmed) return;
    showLoading('取消中...');
    try {
      await shopOrderApi.cancel({ order_id: orderId });
      showToast({ message: '订单已取消', type: 'success' });
      navigate('/order', { replace: true });
    } catch (e) {
      showToast({ message: getErrorMessage(e) || '取消订单失败', type: 'error' });
    } finally {
      hideLoading();
    }
  };

  const handleApplyAfterSale = async () => {
    if (orderId <= 0) return;
    navigate(`/after-sales/apply/${orderId}`);
  };

  const handleCancelAfterSale = async () => {
    if (orderId <= 0 || !order?.after_sale_id) return;
    const confirmed = await showConfirm({
      title: '取消申请',
      message: '确定要取消当前商城订单的售后申请吗？',
      confirmText: '确认取消',
      cancelText: '保留申请',
      danger: true,
    });
    if (!confirmed) return;
    showLoading('取消售后申请中...');
    try {
      await shopOrderApi.cancelAfterSale({ after_sale_id: order.after_sale_id });
      showToast({ message: '售后申请已取消', type: 'success' });
      await fetchData();
    } catch (e) {
      showToast({ message: getErrorMessage(e) || '取消售后申请失败', type: 'error' });
    } finally {
      hideLoading();
    }
  };

  const handleGoPay = () => {
    if (!order) return;
    const cashierParams = new URLSearchParams({
      order_id: String(order.id),
      amount: String(order.total_amount),
      total_score: String(order.total_score),
      order_no: order.order_no,
      pay_type: order.pay_type,
      balance: order.balance_available ?? '0',
      score_balance: order.score ?? '0',
    });
    navigate(`/cashier?${cashierParams.toString()}`);
  };

  const hasBottomBar = !loading && !error && order &&
    (order.status === 'pending' || order.status === 'paid' || isPendingReceiptOrderStatus(order.status) || order.status === 'completed');
  const canApplyAfterSale = order
    ? (order.product_type === 'physical' || order.product_type === 'mixed') &&
      isAfterSaleEligibleOrderStatus(order.status) &&
      !order.after_sale_status
    : false;

  const renderSkeleton = () => (
    <div className="p-4 space-y-3">
      <div className="rounded-2xl overflow-hidden">
        <div className="h-[120px] bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 animate-pulse" />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 animate-pulse">
        <div className="flex items-start">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-3 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 animate-pulse">
        <div className="flex space-x-3">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-2" />
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 animate-pulse space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex justify-between">
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-20" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error || !order) return <ErrorState onRetry={fetchData} />;

    const activeSteps = getActiveSteps(order.status);
    const showProgress = order.status !== 'cancelled' && order.status !== 'refunded';
    const stepLabels = ['下单', '付款', '发货', '完成'];
    const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
    const StatusIcon = config.icon;
    return (
      <div className={`p-4 space-y-3 ${hasBottomBar ? 'pb-28' : 'pb-8'}`}>
        {/* ===== Status Card ===== */}
        <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5" />

          <div className="flex items-center mb-1 relative z-10">
            <StatusIcon size={22} className="mr-2.5 drop-shadow" />
            <h2 className="text-2xl font-bold tracking-wide">{order.status_text}</h2>
          </div>
          <p className="text-sm opacity-80 ml-[32px] mb-4">{order.pay_type_text}</p>

          {showProgress && (
            <div className="flex items-center justify-between relative mt-2 px-1">
              <div className="absolute top-[10px] left-[16px] right-[16px] h-[2px] bg-white/25 z-0" />
              {activeSteps > 1 && (
                <div
                  className="absolute top-[10px] left-[16px] h-[2px] bg-white z-0 transition-all duration-500"
                  style={{ width: `calc(${((activeSteps - 1) / (stepLabels.length - 1)) * 100}% - 32px)` }}
                />
              )}
              {stepLabels.map((label, i) => (
                <div key={label} className="flex flex-col items-center z-10 relative">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                    i < activeSteps
                      ? 'bg-white border-white shadow-sm'
                      : 'bg-transparent border-white/40'
                  }`}>
                    {i < activeSteps && <div className="w-2 h-2 rounded-full bg-current" style={{ color: 'var(--tw-gradient-from)' }} />}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium ${i < activeSteps ? 'opacity-100' : 'opacity-50'}`}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== Logistics Entry ===== */}
        {order.shipping_no && (
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 flex items-center active:bg-gray-50 dark:active:bg-gray-800 cursor-pointer shadow-sm transition-colors"
            onClick={() => navigate(`/logistics/${orderId}`)}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mr-3 shrink-0">
              <Truck size={20} />
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-base font-medium text-text-main leading-snug line-clamp-1">
                {order.shipping_company_display || order.shipping_company} {order.shipping_no}
              </p>
              {order.ship_time > 0 && (
                <p className="text-xs text-text-aux mt-0.5">{formatTime(order.ship_time)}</p>
              )}
            </div>
            <ChevronRight size={18} className="text-text-aux shrink-0" />
          </div>
        )}

        {order.after_sale_status_text && order.after_sale_info && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-text-main">售后信息</h3>
              <span className="text-sm font-medium text-primary-start">{order.after_sale_status_text}</span>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-aux">售后原因</span>
                <span className="text-text-main ml-4 text-right">{order.after_sale_info.reason || '—'}</span>
              </div>
              {order.after_sale_info.description ? (
                <div className="flex justify-between">
                  <span className="text-text-aux">问题描述</span>
                  <span className="text-text-main ml-4 text-right">{order.after_sale_info.description}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-text-aux">申请时间</span>
                <span className="text-text-main">{formatTime(order.after_sale_info.apply_time)}</span>
              </div>
              {order.after_sale_info.close_reason ? (
                <div className="flex justify-between">
                  <span className="text-text-aux">关闭原因</span>
                  <span className="text-text-main ml-4 text-right">{order.after_sale_info.close_reason}</span>
                </div>
              ) : null}
              {order.after_sale_info.admin_remark ? (
                <div className="flex justify-between">
                  <span className="text-text-aux">处理备注</span>
                  <span className="text-text-main ml-4 text-right">{order.after_sale_info.admin_remark}</span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ===== Address Card ===== */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center mr-3 shrink-0 mt-0.5">
              <MapPin size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-base font-bold text-text-main">{order.recipient_name}</span>
                <span className="text-sm text-text-sub">{order.recipient_phone}</span>
              </div>
              <p className="text-sm text-text-sub leading-relaxed">{order.recipient_address}</p>
            </div>
          </div>
        </div>

        {/* ===== Product List ===== */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 flex items-center border-b border-gray-50 dark:border-gray-800">
            <ShoppingBag size={16} className="text-text-main mr-1.5" />
            <span className="text-base font-bold text-text-main">商品信息</span>
            <span className="text-xs text-text-aux ml-auto">共{order.items.length}件</span>
          </div>

          <div className="px-4 py-2 divide-y divide-gray-50 dark:divide-gray-800">
            {order.items.map(item => {
              const thumb = item.product_thumbnail ? resolveShopProductImageUrl(item.product_thumbnail) : '';
              const productPath = buildShopProductPath(item.product_id);
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  className="flex py-3 cursor-pointer active:opacity-80 transition-opacity"
                  onClick={() => navigate(productPath)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(productPath); } }}
                >
                  <div className="w-[76px] h-[76px] bg-gray-50 dark:bg-gray-800 rounded-xl shrink-0 mr-3 overflow-hidden border border-gray-100 dark:border-gray-700">
                    {thumb ? (
                      <img src={thumb} alt={item.product_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-aux text-xs">商品</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col min-w-0 justify-between py-0.5">
                    <div className="text-sm text-text-main line-clamp-2 leading-snug">{item.product_name}</div>
                    <div className="flex justify-between items-end">
                      <span className="text-base font-bold text-text-main">{formatItemPrice(item, order.pay_type)}</span>
                      <span className="text-xs text-text-aux">x{item.quantity}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Amount Summary */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
            <div className="flex justify-end items-baseline gap-1">
              <span className="text-sm text-text-sub">实付款</span>
              <span className="text-xl font-bold text-text-price">{formatTotalAmount(order)}</span>
            </div>
          </div>
        </div>

        {/* ===== Order Info ===== */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
          <h3 className="text-base font-bold text-text-main mb-3">订单信息</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-text-aux shrink-0">订单编号</span>
              <div className="flex items-center min-w-0 ml-4">
                <span className="text-text-main font-mono text-xs truncate">{order.order_no}</span>
                <button onClick={() => handleCopy(order.order_no)} className="ml-1.5 text-text-aux active:text-primary-start shrink-0 p-0.5">
                  <Copy size={13} />
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-text-aux">下单时间</span>
              <span className="text-text-main">{formatTime(order.create_time)}</span>
            </div>
            {order.pay_time > 0 && (
              <div className="flex justify-between">
                <span className="text-text-aux">支付时间</span>
                <span className="text-text-main">{formatTime(order.pay_time)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-text-aux">支付方式</span>
              <span className="text-text-main">{order.pay_type_text || '在线支付'}</span>
            </div>
            {order.remark && (
              <div className="flex justify-between">
                <span className="text-text-aux shrink-0">订单备注</span>
                <span className="text-text-main ml-4 text-right">{order.remark}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F7F7FA] dark:bg-gray-950 relative h-full overflow-hidden">
      {offline && (
        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm py-2 px-4 flex items-center justify-center shrink-0">
          <WifiOff size={14} className="mr-2" />
          网络连接已断开，请检查网络设置
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-gray-100 dark:border-gray-800">
        <div className="h-12 flex items-center px-3">
          <button onClick={handleBack} className="p-1.5 -ml-1 text-text-main active:opacity-70 rounded-full">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-lg font-bold text-text-main flex-1 text-center -ml-8 pointer-events-none">订单详情</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderContent()}
      </div>

      {/* ===== Bottom Action Bar ===== */}
      {!loading && !error && order?.status === 'pending' && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 px-4 py-3 pb-safe flex justify-between items-center z-40">
          <div className="text-sm text-text-sub">
            应付 <span className="text-base font-bold text-text-price">{formatTotalAmount(order)}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              className="px-5 py-2 rounded-full text-sm font-medium text-text-sub border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              onClick={handleCancelOrder}
            >
              取消订单
            </button>
            <button
              className="px-6 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 shadow-sm active:opacity-80 transition-opacity"
              onClick={handleGoPay}
            >
              立即付款
            </button>
          </div>
        </div>
      )}

      {!loading && !error && order?.status === 'paid' && canApplyAfterSale && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 px-4 py-3 pb-safe flex justify-end items-center gap-2.5 z-40">
          {order.after_sale_status === 'processing' ? (
            <button
              className="px-5 py-2 rounded-full text-sm font-medium text-text-sub border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              onClick={handleCancelAfterSale}
            >
              取消申请
            </button>
          ) : (
            <button
              className="px-5 py-2 rounded-full text-sm font-medium text-text-sub border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              onClick={handleApplyAfterSale}
            >
              申请售后
            </button>
          )}
        </div>
      )}

      {!loading && !error && order && isPendingReceiptOrderStatus(order.status) && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 px-4 py-3 pb-safe flex justify-end items-center gap-2.5 z-40">
          {order.after_sale_status === 'processing' ? (
            <button
              className="px-5 py-2 rounded-full text-sm font-medium text-text-sub border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              onClick={handleCancelAfterSale}
            >
              取消申请
            </button>
          ) : (
            <button
              className="px-5 py-2 rounded-full text-sm font-medium text-text-sub border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              onClick={handleApplyAfterSale}
            >
              申请售后
            </button>
          )}
          <button
            className="px-6 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-500 shadow-sm active:opacity-80 transition-opacity disabled:opacity-50"
            onClick={handleConfirmReceipt}
            disabled={confirming || orderId <= 0 || order.after_sale_status === 'processing'}
          >
            {confirming ? '确认中...' : '确认收货'}
          </button>
        </div>
      )}

      {!loading && !error && order?.status === 'completed' && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 px-4 py-3 pb-safe flex justify-end items-center gap-2.5 z-40">
          {order.after_sale_status === 'processing' ? (
            <button
              className="px-5 py-2 rounded-full text-sm font-medium text-text-sub border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              onClick={handleCancelAfterSale}
            >
              取消申请
            </button>
          ) : canApplyAfterSale ? (
            <button
              className="px-5 py-2 rounded-full text-sm font-medium text-text-sub border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              onClick={handleApplyAfterSale}
            >
              申请售后
            </button>
          ) : (
            <span className="text-sm text-text-aux flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              交易已完成
            </span>
          )}
        </div>
      )}
    </div>
  );
};



