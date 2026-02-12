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
import { getCollectionOrderDetail, CollectionOrderDetailData } from '@/services/collection/my-collection';
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
import { buildOrderSteps, OrderActionType } from './types';

const CollectionOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const orderNo = searchParams.get('orderNo') || undefined;
  const { showToast } = useNotification();

  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<CollectionOrderDetailData | null>(null);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);

  const loadMachine = useLoadingMachine();
  const loading = loadMachine.state === LoadingState.LOADING;

  useEffect(() => {
    void loadOrder();
  }, [id, orderNo]);

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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
          <LoadingSpinner text="加载中..." />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center sticky top-0 z-10">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="ml-2 text-lg font-bold text-gray-900">订单详情</h1>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <Package size={40} className="text-red-400" />
          </div>
          <p className="text-gray-500 text-center">{error || '订单不存在'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-sm font-medium shadow-lg active:scale-95 transition-transform"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  const orderSteps = buildOrderSteps(order);
  const statusText = order.status_text || order.status || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30 max-w-[480px] mx-auto pb-safe">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 opacity-95" />
      <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />

      <header className="relative z-20 px-4 py-3 flex items-center sticky top-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 -ml-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-all active:scale-95"
        >
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="ml-3 text-lg font-bold text-white drop-shadow-sm">订单详情</h1>
      </header>

      <CollectionOrderHeroCard order={order} />

      <div className="relative z-10 space-y-4 mt-6 pb-safe">
        <CollectionOrderTimelineCard orderSteps={orderSteps} formatDateTime={formatDateTime} />

        <CollectionOrderInfoCard
          order={order}
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
