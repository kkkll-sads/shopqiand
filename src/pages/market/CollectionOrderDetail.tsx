/**
 * CollectionOrderDetail - 藏品订单详情页面
 * 
 * 显示藏品订单的详细信息
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, CreditCard, ShoppingBag, FileText, CheckCircle, XCircle, AlertCircle, ShieldCheck, Copy, Package, Calendar, Receipt, Check } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { LoadingSpinner, LazyImage } from '@/components/common';
import { getCollectionOrderDetail, CollectionOrderDetailData } from '@/services/collection';
import { normalizeAssetUrl } from '@/services/config';
import { isSuccess, extractData, extractError } from '@/utils/apiHelpers';
import { formatTime, formatAmount } from '@/utils/format';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { useLoadingMachine, LoadingEvent, LoadingState } from '@/hooks';
import { errorLog } from '@/utils/logger';
import { copyToClipboard } from '@/utils/clipboard';

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
    loadOrder();
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
      const res = await getCollectionOrderDetail({
        id,
        order_no: orderNo,
        token,
      });

      const data = extractData(res);
      if (isSuccess(res) && data) {
        setOrder(data);
        loadMachine.send(LoadingEvent.SUCCESS);
      } else {
        setError(extractError(res, '获取订单详情失败'));
        loadMachine.send(LoadingEvent.ERROR);
      }
    } catch (e: any) {
      errorLog('CollectionOrderDetail', '加载失败', e);
      setError(e?.message || '加载数据失败');
      loadMachine.send(LoadingEvent.ERROR);
    } finally {
      // 状态机已处理成功/失败
    }
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

  const formatDateTime = (timestamp?: number): string => {
    if (!timestamp || timestamp === 0) return '-';
    return formatTime(timestamp);
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

  // 订单状态步骤
  const orderSteps = [
    { key: 'created', label: '订单创建', time: order.create_time, active: true },
    { key: 'paid', label: '支付成功', time: order.pay_time, active: (order.pay_time || 0) > 0 },
    { key: 'completed', label: '交易完成', time: order.complete_time, active: (order.complete_time || 0) > 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30 max-w-[480px] mx-auto pb-safe">
      {/* 顶部装饰背景 */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 opacity-95" />
      <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
      
      {/* Header */}
      <header className="relative z-20 px-4 py-3 flex items-center sticky top-0">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2.5 -ml-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-all active:scale-95"
        >
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="ml-3 text-lg font-bold text-white drop-shadow-sm">订单详情</h1>
      </header>

      {/* 订单状态卡片 */}
      <div className="relative z-10 mx-4 mt-2 p-5 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">订单状态</p>
            <p className="text-2xl font-black text-gray-900">{order.status_text}</p>
            <p className="text-xs text-gray-400 mt-2 font-mono">订单号: {order.order_no}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Package size={32} className="text-white" />
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-4 mt-6 pb-safe">
        {/* 订单进度 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50 mx-4">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900 text-base">订单进度</h2>
          </div>

          <div className="relative">
            {orderSteps.map((step, index) => (
              <div key={step.key} className="relative pb-8 last:pb-0 flex items-start">
                {/* Node */}
                <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${step.active
                  ? 'bg-gradient-to-br from-orange-500 to-orange-400 border-orange-500 shadow-lg shadow-orange-500/30 scale-110'
                  : 'bg-white border-gray-300'
                  }`}>
                  {step.active && (
                    <CheckCircle className="w-3.5 h-3.5 text-white font-bold" strokeWidth={3} />
                  )}
                </div>

                {/* Connection line */}
                {index < orderSteps.length - 1 && (
                  <div className={`absolute left-3 top-8 w-0.5 h-full transition-colors z-0 ${step.active
                    ? 'bg-gradient-to-b from-orange-500 to-orange-300'
                    : 'bg-gray-200'
                    }`} />
                )}

                <div className="flex-1 pt-0.5 ml-4 min-w-0">
                  <p className={`text-sm mb-1.5 transition-colors ${step.active
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-400'
                    }`}>
                    {step.label}
                  </p>
                  <p className={`text-xs transition-colors ${step.active ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                    {step.time > 0 ? formatDateTime(step.time) : '等待中...'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 订单信息 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50 mx-4">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-900 text-base">订单信息</h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">订单编号</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 text-xs font-mono">{order.order_no}</span>
                <button
                  onClick={() => copyOrderNo(order.order_no)}
                  className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
                  aria-label="复制订单号"
                >
                  {copiedOrderNo ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">支付方式</span>
              <span className="text-sm text-gray-900">{order.pay_type_text || order.pay_type}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">创建时间</span>
              <span className="text-sm text-gray-900">{order.create_time_text || formatDateTime(order.create_time)}</span>
            </div>

            {order.pay_time && order.pay_time > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">支付时间</span>
                <span className="text-sm text-gray-900">{order.pay_time_text || formatDateTime(order.pay_time)}</span>
              </div>
            )}

            {order.complete_time && order.complete_time > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">完成时间</span>
                <span className="text-sm text-gray-900">{order.complete_time_text || formatDateTime(order.complete_time)}</span>
              </div>
            )}

            {order.remark && (
              <div className="flex justify-between items-start py-2">
                <span className="text-sm text-gray-500">备注</span>
                <span className="text-sm text-gray-900 text-right flex-1 ml-4">{order.remark}</span>
              </div>
            )}
          </div>
        </div>

        {/* 订单明细 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50 mx-4">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="font-semibold text-gray-900 text-base">订单明细</h2>
          </div>

          <div className="space-y-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-3 space-y-3">
                  {/* 基本商品信息 */}
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <LazyImage
                        src={normalizeAssetUrl(item.item_image)}
                        alt={item.item_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                        {item.item_title}
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>成交价: {formatAmount(item.buy_price || item.price)}</span>
                        <span>x{item.quantity}</span>
                      </div>
                      <div className="text-sm font-bold text-orange-600 mt-1">
                        {formatAmount(item.subtotal)}
                      </div>
                    </div>
                  </div>

                  {/* 详细资产字段 (如果有) */}
                  {(item.asset_code || item.hash || item.contract_no || item.session_title || item.mining_status !== undefined) && (
                    <div className="border-t border-gray-200/50 pt-3 grid grid-cols-1 gap-y-2 text-xs">
                      {item.asset_code && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">资产编号</span>
                          <span className="text-gray-900 font-mono">{item.asset_code}</span>
                        </div>
                      )}

                      {item.contract_no && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">合约编号</span>
                          <span className="text-gray-900 font-mono">{item.contract_no}</span>
                        </div>
                      )}

                      {item.hash && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-gray-500 flex-shrink-0">链上哈希</span>
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-gray-900 font-mono truncate max-w-[150px]" title={item.hash}>
                              {item.hash}
                            </span>
                            <button
                              onClick={() => handleCopyOrderNo(item.hash)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Copy size={10} />
                            </button>
                          </div>
                        </div>
                      )}

                      {(item.session_title || item.session_start_time) && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">交易场次</span>
                          <div className="text-right">
                            <div className="text-gray-900">{item.session_title || '未知场次'}</div>
                            {(item.session_start_time || item.session_end_time) && (
                              <div className="text-[10px] text-gray-400 scale-90 origin-right">
                                {item.session_start_time}-{item.session_end_time}
                                {item.is_trading_time !== undefined && (
                                  <span className={`ml-1 ${item.is_trading_time ? 'text-green-500' : 'text-red-500'}`}>
                                    ({item.is_trading_time ? '交易中' : '非交易时段'})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {item.mining_status !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">产出状态</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] bg-green-50 text-green-600 border border-green-100`}>
                            {item.mining_status === 1 ? '正在产出' : '未激活'}
                          </span>
                        </div>
                      )}

                      {item.mining_start_time && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">开始时间</span>
                          <span className="text-gray-700">{item.mining_start_time}</span>
                        </div>
                      )}

                      {item.last_dividend_time && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">上次结算</span>
                          <span className="text-gray-700">{item.last_dividend_time}</span>
                        </div>
                      )}

                      {item.expected_profit !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">预期收益</span>
                          <span className="text-orange-600 font-bold">+{item.expected_profit}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">暂无订单明细</div>
            )}
          </div>

          {/* 订单总额 */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">订单总额</span>
            <span className="text-2xl font-bold text-orange-600 font-[DINAlternate-Bold,Roboto,sans-serif]">
              {formatAmount(order.total_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Actions - 根据不同状态显示不同按钮 */}
      {(() => {
        const statusText = order.status_text || order.status || '';
        const statusLower = statusText.toLowerCase();

        // 判断是否显示底部按钮栏
        const showBottomActions = statusLower.includes('寄售中') ||
          statusLower.includes('撮合中') ||
          statusLower.includes('匹配中') ||
          statusLower.includes('待支付') ||
          statusLower.includes('待发货') ||
          statusLower.includes('待收货');

        if (!showBottomActions) return null;

        // 根据状态显示不同的按钮文本和操作
        let buttonText = '';
        let buttonAction: (() => void) | null = null;
        let buttonClass = 'flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500 font-semibold shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98]';

        if (statusLower.includes('寄售中') || statusLower.includes('撮合中') || statusLower.includes('匹配中')) {
          buttonText = '撮合中';
          buttonAction = () => {
            // TODO: 跳转到撮合池页面
            showToast('info', '撮合中', '订单正在撮合中，请稍候');
          };
        } else if (statusLower.includes('待支付')) {
          buttonText = '立即支付';
          buttonAction = () => {
            // TODO: 跳转到支付页面
            showToast('info', '支付功能', '支付功能开发中');
          };
        } else if (statusLower.includes('待发货')) {
          buttonText = '查看发货';
          buttonAction = () => {
            showToast('info', '查看发货', '发货信息查看功能开发中');
          };
        } else if (statusLower.includes('待收货')) {
          buttonText = '确认收货';
          buttonAction = () => {
            showToast('info', '确认收货', '确认收货功能开发中');
          };
        }

        if (!buttonText) return null;

        return (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-w-[480px] mx-auto pb-safe">
            <div className="p-4">
              <button
                onClick={buttonAction || undefined}
                className={buttonClass}
                disabled={!buttonAction}
              >
                {buttonText}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CollectionOrderDetail;

