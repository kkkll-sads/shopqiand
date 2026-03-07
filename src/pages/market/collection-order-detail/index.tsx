/**
 * CollectionOrderDetail - 藏品订单详情页面
 *
 * 显示藏品订单的详细信息
 *
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { LoadingSpinner } from '@/components/common';
import {
  fetchReservationDetail,
  getCollectionOrderDetail,
} from '@/services';
import type { CollectionOrderDetailData, ReservationDetailData } from '@/services';
import { isSuccess, extractData, extractError } from '@/utils/apiHelpers';
import { formatTime } from '@/utils/format';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { useLoadingMachine, LoadingEvent, LoadingState } from '@/hooks';
import { errorLog } from '@/utils/logger';
import { copyToClipboard } from '@/utils/clipboard';
import CollectionOrderBottomActions from './components/CollectionOrderBottomActions';
import CollectionOrderHeroCard from './components/CollectionOrderHeroCard';
import CollectionOrderInfoCard from './components/CollectionOrderInfoCard';
import CollectionOrderItemsCard from './components/CollectionOrderItemsCard';
import CollectionOrderTimelineCard from './components/CollectionOrderTimelineCard';
import { buildOrderPaymentSummary, getReservationRecordId } from '@/pages/market/utils/orderPayment';
import { buildOrderSteps, OrderActionType } from './types';

const CollectionOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const orderNo = searchParams.get('orderNo') || undefined;
  const { showToast } = useNotification();

  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<CollectionOrderDetailData | null>(null);
  const [reservationRecord, setReservationRecord] = useState<ReservationDetailData | null>(null);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);

  const loadMachine = useLoadingMachine();
  const loading = loadMachine.state === LoadingState.LOADING;

  useEffect(() => {
    void loadOrder();
  }, [id, orderNo]);

  useEffect(() => {
    let cancelled = false;

    const loadReservationSummary = async () => {
      if (!order) {
        setReservationRecord(null);
        return;
      }

      const reservationId = getReservationRecordId(order);
      const paymentSummary = buildOrderPaymentSummary(order);
      if (!reservationId || paymentSummary.hasReservationSummary) {
        setReservationRecord(null);
        return;
      }

      try {
        const token = getStoredToken();
        if (!token) {
          setReservationRecord(null);
          return;
        }

        const response = await fetchReservationDetail(reservationId, token);
        const data = extractData(response);
        if (!cancelled && isSuccess(response) && data) {
          setReservationRecord(data);
          return;
        }

        if (!cancelled) {
          setReservationRecord(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setReservationRecord(null);
        }
        errorLog('CollectionOrderDetail', '加载预约摘要失败', e);
      }
    };

    void loadReservationSummary();

    return () => {
      cancelled = true;
    };
  }, [order]);

  const loadOrder = async () => {
    const token = getStoredToken();
    if (!token) {
      setError('请先登录');
      loadMachine.send(LoadingEvent.ERROR);
      return;
    }

    if (!id && !orderNo) {
      setError('缺少必要参数');
      loadMachine.send(LoadingEvent.ERROR);
      return;
    }

    loadMachine.send(LoadingEvent.LOAD);
    setError(null);
    setReservationRecord(null);

    try {
      const response = await getCollectionOrderDetail({
        id,
        order_no: orderNo,
        token,
      });

      const data = extractData(response);
      if (isSuccess(response) && data) {
        setOrder(data);
        loadMachine.send(LoadingEvent.SUCCESS);
      } else {
        setError(extractError(response, '获取订单详情失败'));
        loadMachine.send(LoadingEvent.ERROR);
      }
    } catch (e: any) {
      errorLog('CollectionOrderDetail', '加载失败', e);
      setError(e?.message || '加载数据失败');
      loadMachine.send(LoadingEvent.ERROR);
    }
  };

  const handleCopyOrderNo = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedOrderNo(true);
      showToast('success', '复制成功', '订单号已复制到剪贴板');
      setTimeout(() => setCopiedOrderNo(false), 2000);
      return;
    }

    showToast('error', '复制失败', '请手动复制');
  };

  const formatDateTime = (timestamp?: number): string => {
    if (!timestamp || timestamp === 0) return '-';
    return formatTime(timestamp);
  };

  const handleBottomAction = (action: OrderActionType) => {
    switch (action) {
      case 'matching':
        showToast('info', '撮合中', '订单正在撮合中，请稍候');
        break;
      case 'pay':
        showToast('info', '支付功能', '支付功能开发中');
        break;
      case 'ship':
        showToast('info', '查看发货', '发货信息查看功能开发中');
        break;
      case 'receive':
        showToast('info', '确认收货', '确认收货功能开发中');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <LoadingSpinner text="加载中..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 flex items-center h-14 px-4 sticky top-0 z-10">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:bg-gray-50 rounded transition-colors text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="flex-1 text-center pr-9 text-base font-bold text-gray-900">订单详情</h1>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Package size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm text-center">{error || '订单不存在'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-8 py-2 bg-gray-900 text-white rounded-full text-sm font-medium active:scale-95 transition-transform"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  const orderSteps = buildOrderSteps(order);
  const statusText = order.status_text || order.status || '';
  const paymentSummary = buildOrderPaymentSummary(order, reservationRecord);

  return (
    <div className="min-h-screen bg-gray-50 max-w-[480px] mx-auto pb-safe">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-red-500 to-red-600" />

      <header className="relative z-20 px-4 h-14 flex items-center sticky top-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-white active:bg-white/10 rounded transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-center pr-8 text-base font-bold text-white">订单详情</h1>
      </header>

      <CollectionOrderHeroCard order={order} />

      <div className="relative z-10 space-y-3 mt-4 pb-safe">
        <CollectionOrderTimelineCard orderSteps={orderSteps} formatDateTime={formatDateTime} />

        <CollectionOrderInfoCard
          order={order}
          paymentSummary={paymentSummary}
          copiedOrderNo={copiedOrderNo}
          onCopyOrderNo={handleCopyOrderNo}
          formatDateTime={formatDateTime}
        />

        <CollectionOrderItemsCard order={order} onCopy={handleCopyOrderNo} />
      </div>

      <CollectionOrderBottomActions statusText={statusText} onAction={handleBottomAction} />
    </div>
  );
};

export default CollectionOrderDetail;
