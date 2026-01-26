/**
 * OrderFundDetail - 订单资金详情页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Receipt, ShoppingCart, CreditCard } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { LoadingSpinner } from '@/components/common';
import { getAllLog, AllLogItem } from '@/services/wallet';
import { getStoredToken } from '@/services/client';
import { extractData, extractError } from '@/utils/apiHelpers';
import { getBalanceTypeLabel } from '@/constants/balanceTypes';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { errorLog } from '@/utils/logger';

const OrderFundDetail: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [orderFundLogs, setOrderFundLogs] = useState<AllLogItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });
  const loading = loadMachine.state === LoadingState.LOADING;

  const loadData = async (pageNum: number, isRefresh = false) => {
    const token = getStoredToken();
    if (!token) {
      setError('请先登录');
      return;
    }

    loadMachine.send(LoadingEvent.LOAD);
    if (isRefresh) setError(null);

    try {
      const res = await getAllLog({
        page: pageNum,
        limit: 20,
        token
      });

      const data = extractData(res);
      if (data) {
        const filteredList = (data.list || []).filter(item => {
          const memo = (item.memo || item.remark || '').toLowerCase();
          return memo.includes('订单') || 
                 memo.includes('order') || 
                 memo.includes('购买') || 
                 memo.includes('支付') ||
                 memo.includes('充值') ||
                 memo.includes('退款') ||
                 memo.includes('商城') ||
                 memo.includes('商品');
        });

        if (pageNum === 1) {
          setOrderFundLogs(filteredList);
        } else {
          setOrderFundLogs(prev => [...prev, ...filteredList]);
        }
        setHasMore((data.list?.length || 0) >= 20 && (data.current_page || 1) * 20 < (data.total || 0));
        loadMachine.send(LoadingEvent.SUCCESS);
      } else {
        if (isRefresh) setError(extractError(res, '获取订单资金明细失败'));
        loadMachine.send(LoadingEvent.ERROR);
      }
    } catch (e: any) {
      errorLog('OrderFundDetail', '加载失败', e);
      if (isRefresh) setError(e?.message || '加载数据失败');
      loadMachine.send(LoadingEvent.ERROR);
    } finally {
      // 状态机已处理成功/失败
    }
  };

  useEffect(() => {
    setPage(1);
    setOrderFundLogs([]);
    setHasMore(false);
    loadData(1, true);
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage);
    }
  };

  const getTypeLabel = (type: string, fieldType?: string): string => {
    const typeToUse = fieldType || type;
    return getBalanceTypeLabel(typeToUse);
  };

  const getOrderIcon = (memo: string) => {
    const memoLower = memo.toLowerCase();
    if (memoLower.includes('充值')) {
      return <CreditCard className="w-4 h-4" />;
    } else if (memoLower.includes('商城') || memoLower.includes('商品')) {
      return <ShoppingCart className="w-4 h-4" />;
    }
    return <Receipt className="w-4 h-4" />;
  };

  const renderLogItem = (item: AllLogItem) => {
    const amountVal = Number(item.amount);
    let isPositive = amountVal > 0;
    if (item.before_value !== undefined && item.after_value !== undefined) {
      isPositive = Number(item.after_value) > Number(item.before_value);
    }

    const typeLabel = getTypeLabel(item.type, item.field_type);
    const isScore = item.type === 'score';

    return (
      <div key={`order-fund-${item.id}`} className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-4 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                {getOrderIcon(item.memo || item.remark || '')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                    item.type === 'balance_available' ? 'bg-orange-50 text-orange-600' :
                    item.type === 'withdrawable_money' ? 'bg-blue-50 text-blue-600' :
                    item.type === 'service_fee_balance' ? 'bg-purple-50 text-purple-600' :
                    item.type === 'score' ? 'bg-yellow-50 text-yellow-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {typeLabel}
                  </span>
                </div>
                <div className="text-sm text-gray-700 font-medium truncate">
                  {item.memo || item.remark || '订单资金变动'}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400 ml-10">
              {(item.createtime || item.create_time)
                ? (() => {
                    const timestamp = item.createtime || item.create_time || 0;
                    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
                    return new Date(ts * 1000).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                  })()
                : ''}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className={`text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif] ${
              isPositive ? 'text-[#FF6B00]' : 'text-gray-900'
            }`}>
              {isPositive ? '+' : ''}{Math.abs(amountVal).toFixed(2)}
              <span className="text-xs font-normal ml-0.5 text-gray-400">
                {isScore ? '' : '元'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
          <span className="text-xs text-gray-400">变动前余额</span>
          <span className="text-xs text-gray-600 font-mono">
            {Number(item.before_value || 0).toFixed(2)}
            <span className="mx-2 text-gray-300">→</span>
            {Number(item.after_value || item.after_balance || 0).toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <PageContainer title="订单资金详情" onBack={() => navigate(-1)}>
      {loading && page === 1 && <LoadingSpinner text="加载中..." />}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 text-red-400">
          <div className="w-16 h-16 mb-4 border-2 border-red-200 rounded-lg flex items-center justify-center">
            <FileText size={32} className="opacity-50" />
          </div>
          <span className="text-xs">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="p-4">
          {orderFundLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Receipt size={24} className="text-gray-300" />
              </div>
              <span className="text-xs text-gray-400">暂无订单资金记录</span>
            </div>
          ) : (
            <div className="space-y-3 pb-safe">
              {orderFundLogs.map(renderLogItem)}

              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="w-full py-3 text-sm text-gray-500 text-center disabled:opacity-50 active:bg-gray-50 rounded-xl border border-gray-200"
                >
                  {loading ? '加载中...' : '点击加载更多'}
                </button>
              )}

              {!hasMore && orderFundLogs.length > 5 && (
                <div className="text-center py-4 text-xs text-gray-300">
                  - 到底了 -
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default OrderFundDetail;
