import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import {
  getOrderDetail,
  ShopOrderItem,
  confirmOrder,
  normalizeAssetUrl,
  payOrder,
  cancelOrder,
} from '@/services';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess, extractError } from '@/utils/apiHelpers';
import { useErrorHandler, useLoadingMachine, LoadingEvent, LoadingState } from '@/hooks';
import { copyToClipboard } from '@/utils/clipboard';
import OrderStatusProgress from './components/OrderStatusProgress';
import OrderLogisticsCard from './components/OrderLogisticsCard';
import OrderRecipientCard from './components/OrderRecipientCard';
import OrderProductInfoCard from './components/OrderProductInfoCard';
import OrderInfoCard from './components/OrderInfoCard';
import OrderBottomActions from './components/OrderBottomActions';

const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { orderId = '' } = useParams<{ orderId?: string }>();
  const { showToast, showDialog } = useNotification();
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);

  const { errorMessage, hasError, handleError } = useErrorHandler();
  const { handleError: handleOperationError } = useErrorHandler({ showToast: true, persist: false });

  const [order, setOrder] = useState<ShopOrderItem | null>(null);
  const loadMachine = useLoadingMachine();
  const loading = loadMachine.state === LoadingState.LOADING;

  const loadOrder = useCallback(async () => {
    try {
      loadMachine.send(LoadingEvent.LOAD);
      const token = getStoredToken();
      if (!token) return;

      const response = await getOrderDetail({ id: orderId, token });
      if (isSuccess(response) && response.data) {
        setOrder(response.data);
        loadMachine.send(LoadingEvent.SUCCESS);
      } else {
        const errorMsg = extractError(response, '获取订单详情失败');
        if (errorMsg.includes('订单不存在')) {
          showToast('error', '订单不存在', errorMsg);
          setTimeout(() => {
            navigate('/orders/points/0', { replace: true });
          }, 1500);
          loadMachine.send(LoadingEvent.ERROR);
          return;
        }

        handleError(response, {
          persist: true,
          showToast: false,
          customMessage: errorMsg,
          context: { orderId },
        });
        loadMachine.send(LoadingEvent.ERROR);
      }
    } catch (err) {
      handleError(err, {
        persist: true,
        showToast: false,
        customMessage: '网络请求失败',
        context: { orderId },
      });
      loadMachine.send(LoadingEvent.ERROR);
    }
  }, [loadMachine, orderId, showToast, navigate, handleError]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handlePayOrder = (id: number) => {
    const targetId = String(id).trim();
    if (order?.pay_type === 'score') {
      showDialog({
        title: '确认支付',
        description: '确定要支付此订单吗？',
        confirmText: '确定支付',
        cancelText: '取消',
        onConfirm: async () => {
          try {
            const token = getStoredToken() || '';
            const response = await payOrder({ id: targetId, token });

            if (isSuccess(response)) {
              showToast('success', '支付成功');
              loadOrder();
            } else {
              handleOperationError(response, {
                toastTitle: '支付失败',
                customMessage: '支付失败',
                context: { orderId: targetId },
              });
            }
          } catch (error) {
            handleOperationError(error, {
              toastTitle: '支付失败',
              customMessage: '网络请求失败',
              context: { orderId: targetId },
            });
          }
        },
      });
    } else {
      navigate(`/cashier/${targetId}`);
    }
  };

  const handleConfirmReceipt = async (id: number) => {
    showDialog({
      title: '确认收货',
      description: '请确认您已收到商品，确认后交易将完成。',
      confirmText: '确认收货',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          const token = getStoredToken() || '';
          const response = await confirmOrder({ id, token });
          if (isSuccess(response)) {
            showToast('success', response.msg || '收货成功');
            loadOrder();
          } else {
            handleOperationError(response, {
              toastTitle: '操作失败',
              customMessage: '确认收货失败',
              context: { orderId: id },
            });
          }
        } catch (error) {
          handleOperationError(error, {
            toastTitle: '操作失败',
            customMessage: '网络请求失败',
            context: { orderId: id },
          });
        }
      },
    });
  };

  const handleCancelOrder = async (id: number) => {
    showDialog({
      title: '取消订单',
      description: '确定要取消此订单吗？取消后无法恢复。',
      confirmText: '确定取消',
      cancelText: '再想想',
      onConfirm: async () => {
        try {
          const token = getStoredToken() || '';
          const response = await cancelOrder({ id, token });
          if (isSuccess(response)) {
            showToast('success', response.msg || '订单取消成功');
            const targetPath = order?.pay_type === 'score' ? '/orders/points/0' : '/orders/product/0';
            navigate(targetPath, { replace: true });
          } else {
            handleOperationError(response, {
              toastTitle: '取消失败',
              customMessage: '订单取消失败',
              context: { orderId: id },
            });
          }
        } catch (error) {
          handleOperationError(error, {
            toastTitle: '取消失败',
            customMessage: '网络请求失败',
            context: { orderId: id },
          });
        }
      },
    });
  };

  const handleCopyOrderNo = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedOrderNo(true);
      showToast('success', '复制成功', '订单号已复制到剪贴板');
      setTimeout(() => setCopiedOrderNo(false), 2000);
    } else {
      showToast('error', '复制失败', '请手动复制');
    }
  };

  const formatDateTime = (timestamp: number) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleGoReview = () => {
    if (!order) return;
    const firstItem = order.items?.[0];
    if (!firstItem) return;

    const params = new URLSearchParams({
      order_id: String(order.id),
      product_id: String(firstItem.product_id),
      name: firstItem.product_name || '',
      image: normalizeAssetUrl(firstItem.product_thumbnail || firstItem.product_image || ''),
    });

    navigate(`/submit-review?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-gray-50">
        <div className="text-center">
          <div className="space-y-4 w-80">
            <div className="skeleton h-32 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (hasError || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-6">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
          <Package className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-500 text-center">{errorMessage || '订单不存在'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-medium shadow-lg shadow-red-500/30 active:scale-95 transition-transform"
        >
          返回
        </button>
      </div>
    );
  }

  const orderSteps = [
    { key: 'created', label: '订单创建', time: order.create_time, active: true },
    { key: 'paid', label: '支付成功', time: order.pay_time, active: order.pay_time > 0 },
    { key: 'shipped', label: '商品发货', time: order.ship_time, active: order.ship_time > 0 },
    { key: 'completed', label: '交易完成', time: order.complete_time, active: order.complete_time > 0 },
  ];

  const currentStep = orderSteps.filter((step) => step.active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-gray-50/30 max-w-[480px] mx-auto pb-safe">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-red-500 via-red-500 to-red-600 opacity-95" />
      <div className="absolute top-0 left-0 right-0 h-48 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />

      <header className="relative z-20 sticky top-0">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-all active:scale-95"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="flex-1 text-center pr-9 font-bold text-white text-lg drop-shadow-sm">订单详情</h1>
        </div>
      </header>

      <div className="relative z-10 pb-24 pt-2">
        <OrderStatusProgress
          statusText={order.status_text}
          orderSteps={orderSteps}
          currentStep={currentStep}
          formatDateTime={formatDateTime}
        />

        {order.shipping_company && (
          <OrderLogisticsCard shippingCompany={order.shipping_company} shippingNo={order.shipping_no} />
        )}

        {order.recipient_name && (
          <OrderRecipientCard
            recipientName={order.recipient_name}
            recipientPhone={order.recipient_phone}
            recipientAddress={order.recipient_address}
          />
        )}

        <OrderProductInfoCard
          items={order.items}
          totalAmount={order.total_amount}
          totalScore={order.total_score}
        />

        <OrderInfoCard
          order={order}
          copiedOrderNo={copiedOrderNo}
          onCopyOrderNo={handleCopyOrderNo}
          formatDateTime={formatDateTime}
        />
      </div>

      <OrderBottomActions
        order={order}
        onCancelOrder={handleCancelOrder}
        onPayOrder={handlePayOrder}
        onConfirmReceipt={handleConfirmReceipt}
        onGoReview={handleGoReview}
        onBuyAgain={() => {}}
      />
    </div>
  );
};

export default OrderDetail;
