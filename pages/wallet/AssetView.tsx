
import React, { useState, useEffect, useMemo } from 'react';
import { FileText, ShoppingBag, X, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { LoadingSpinner, EmptyState, LazyImage } from '../../components/common';
import { FilterBar } from '../../components/FilterBar';
import { formatAmount } from '../../utils/format';
import {
  getAllLog,
  AllLogItem,
  getMyCollection,
  MyCollectionItem,
  fetchProfile,
  normalizeAssetUrl,
} from '../../services/api';
import { getStoredToken } from '../../services/client';
import { Product, UserInfo } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { Route } from '../../router/routes';
import AssetHeaderCard from './components/asset/AssetHeaderCard';
import AssetActionsGrid from './components/asset/AssetActionsGrid';
import AssetTabSwitcher from './components/asset/AssetTabSwitcher';
import { isSuccess, extractData, extractError } from '../../utils/apiHelpers';
import { ConsignmentStatus, DeliveryStatus } from '../../constants/statusEnums';
import { useAssetActionModal, ActionModalState } from '../../hooks/useAssetActionModal';
import { useAssetTabs, TabConfig } from '../../hooks/useAssetTabs';
import { BALANCE_TYPE_OPTIONS, getBalanceTypeLabel } from '../../constants/balanceTypes';

interface AssetViewProps {
  onBack: () => void;
  onNavigate: (route: Route) => void;
  onProductSelect?: (product: Product) => void;
  initialTab?: number;
}

const AssetView: React.FC<AssetViewProps> = ({ onBack, onNavigate, onProductSelect, initialTab = 0 }) => {
  const { showToast, showDialog } = useNotification();

  // Filter States
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFlow, setFilterFlow] = useState('all');
  const [filterTime, setFilterTime] = useState('7days'); // Default to 7 days as per user example preference

  const categoryOptions = [...BALANCE_TYPE_OPTIONS];

  // Logic to sync Filter Category with Active Tab
  const handleCategoryChange = (val: string) => {
    setFilterCategory(val);
  };

  // User Info
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const [consignmentTicketCount, setConsignmentTicketCount] = useState<number>(0);

  // 调试寄售券数量变化
  useEffect(() => {
    console.log('寄售券数量变化:', consignmentTicketCount);
  }, [consignmentTicketCount]);

  // Tab Configs
  // Using useMemo to ensure configs update when filters change
  const tabConfigs: TabConfig[] = useMemo(() => [
    {
      id: 0,
      name: '资金明细',
      fetchData: async ({ page, limit, token }) => {
        // Calculate time range
        let startTime: number | undefined;
        let endTime: number | undefined;
        const now = Math.floor(Date.now() / 1000);

        switch (filterTime) {
          case 'today':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startTime = Math.floor(today.getTime() / 1000);
            endTime = now;
            break;
          case '7days':
            startTime = now - 7 * 24 * 3600;
            endTime = now;
            break;
          case '30days':
            startTime = now - 30 * 24 * 3600;
            endTime = now;
            break;
        }

        return getAllLog({
          page,
          limit,
          type: filterCategory,
          flow_direction: filterFlow as 'in' | 'out' | 'all',
          start_time: startTime,
          end_time: endTime,
          token
        });
      },
      parseData: (response) => {
        const data = extractData(response) as any;
        return {
          list: data?.list || [],
          hasMore: (data?.list?.length || 0) >= 10,
        };
      },
    },
  ], [filterCategory, filterFlow, filterTime]);

  const tabs = useAssetTabs(tabConfigs, initialTab);

  // Refresh Funds tab when filters change
  useEffect(() => {
    if (tabs.activeTab === 0) {
      tabs.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterFlow, filterTime]);

  // 当 tabConfigs 变化时，确保 activeTab 有效
  useEffect(() => {
    const validTabIds = tabConfigs.map(t => t.id);
    if (!validTabIds.includes(tabs.activeTab) && tabConfigs.length > 0) {
      tabs.setActiveTab(tabConfigs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabConfigs]);

  const actionModal = useAssetActionModal(consignmentTicketCount, () => {
    tabs.refresh();
  });

  // Helpers
  const hasConsignedBefore = (item: MyCollectionItem) => {
    const status = item.consignment_status;
    return typeof status === 'number' && status !== ConsignmentStatus.NOT_CONSIGNED;
  };
  const hasConsignedSuccessfully = (item: MyCollectionItem) => item.consignment_status === ConsignmentStatus.SOLD;
  const isConsigning = (item: MyCollectionItem) => item.consignment_status === ConsignmentStatus.CONSIGNING || item.consignment_status === ConsignmentStatus.PENDING;
  const isDelivered = (item: MyCollectionItem) => item.delivery_status === DeliveryStatus.DELIVERED;

  const handleItemClick = (item: MyCollectionItem) => {
    if (isConsigning(item) || hasConsignedSuccessfully(item) || hasConsignedBefore(item) || item.delivery_status === DeliveryStatus.NOT_DELIVERED || item.consignment_status === ConsignmentStatus.NOT_CONSIGNED) {
      // Consolidated logic handled by conditional checks inside modal open methods or simpler mapping
      if (isConsigning(item) || hasConsignedSuccessfully(item) || hasConsignedBefore(item)) {
        actionModal.openDelivery(item);
      } else if (item.delivery_status === DeliveryStatus.NOT_DELIVERED) {
        actionModal.openDelivery(item);
      } else if (item.consignment_status === ConsignmentStatus.NOT_CONSIGNED) {
        actionModal.openConsignment(item);
      } else {
        actionModal.openDelivery(item);
      }
    } else {
      actionModal.openDelivery(item);
    }
  };

  const tabNames = ['资金明细'];

  useEffect(() => {
    const loadUserInfo = async () => {
      const token = getStoredToken();
      if (!token) return;
      try {
        const response = await fetchProfile(token);
        const profileData = extractData(response);
        console.log('API响应数据:', profileData);
        if (profileData?.userInfo) {
          console.log('用户信息:', profileData.userInfo);
          console.log('API中的寄售券数量:', profileData.userInfo.consignment_coupon);
          setUserInfo(profileData.userInfo);
          useAuthStore.getState().updateUser(profileData.userInfo);
          // 从用户信息中获取寄售券数量
          const couponCount = profileData.userInfo.consignment_coupon || 0;
          console.log('设置寄售券数量为:', couponCount);
          setConsignmentTicketCount(couponCount);
        }
      } catch (err) {
        console.error('加载用户信息失败:', err);
      }
    };
    loadUserInfo();
  }, []);

  const formatTime = (timestamp: number | string | null): string => {
    if (!timestamp) return '';
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  };

  const renderAllLogItem = (item: AllLogItem) => {
    const amountVal = Number(item.amount);
    const isPositive = amountVal > 0;
    const typeText = getBalanceTypeLabel(item.type);

    return (
      <div
        key={item.id}
        className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50 transition-colors"
        onClick={() => {
          if (onNavigate && item.id) {
            onNavigate({
              name: 'money-log-detail',
              id: item.id,
              back: { name: 'asset-view' },
            });
          }
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800 mb-1">{item.memo || item.remark || '资金变动'}</div>
            <div className="text-xs text-gray-500">{formatTime(item.createtime || item.create_time)}</div>
          </div>
          <div className={`text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif] ${isPositive ? 'text-[#FF6B00]' : 'text-gray-900'}`}>
            {isPositive ? '+' : ''}{Number(amountVal).toFixed(2)}
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
          <span>{typeText}</span>
          <span className="flex items-center">
            余额: {Number(item.before_value).toFixed(2)}
            <span className="mx-1">→</span>
            {Number(item.after_value || item.after_balance).toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

  const renderCollectionItem = (item: MyCollectionItem) => {
    // New API fields: title, image, price, consignment_status
    // Helper to get image URL safely
    const imageUrl = normalizeAssetUrl(item.image) || '';

    // Status Text Logic
    let statusBadge = null;
    if (item.consignment_status === 2) {
      statusBadge = <div className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">已售出</div>;
    } else if (item.consignment_status === 1) {
      statusBadge = <div className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">寄售中</div>;
    } else {
      // consignment_status === 0
      statusBadge = <div className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200">未寄售</div>;
    }

    return (
      <div key={item.id} className="bg-white rounded-lg p-4 mb-3 shadow-sm cursor-pointer active:bg-gray-50 transition-colors border border-gray-100" onClick={() => handleItemClick(item)}>
        <div className="flex gap-3">
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {imageUrl ? (
              <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={24} /></div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-1">
              <div className="text-sm font-medium text-gray-800 flex-1 line-clamp-2">{item.title}</div>
              <ArrowRight size={16} className="text-gray-400 ml-2 flex-shrink-0" />
            </div>
            {/* New API doc does not guarantee pay_time_text. We use ID or unique_id if needed, or hide if no date */}
            <div className="text-xs text-gray-500 mb-2">
              UID: {item.unique_id || item.id}
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-bold text-gray-900">¥ {Number(item.price).toFixed(2)}</div>
              {Number(item.market_price) > 0 && (
                <div className="text-xs text-gray-400">市场价: ¥{Number(item.market_price).toFixed(2)}</div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {statusBadge}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (tabs.isLoading && tabs.data.length === 0) return <LoadingSpinner text="加载中..." />;
    if (tabs.hasError) return <div className="flex flex-col items-center justify-center py-12 text-red-400"><div className="w-16 h-16 mb-4 border-2 border-red-200 rounded-lg flex items-center justify-center"><FileText size={32} className="opacity-50" /></div><span className="text-xs">{tabs.error}</span></div>;
    if (tabs.data.length === 0) return <div className="flex flex-col items-center justify-center py-12 text-gray-400"><div className="w-16 h-16 mb-4 border-2 border-gray-200 rounded-lg flex items-center justify-center">{tabs.activeTab === 1 ? <ShoppingBag size={32} className="opacity-50" /> : <FileText size={32} className="opacity-50" />}</div><span className="text-xs">{tabs.activeTab === 1 ? '暂无藏品' : '暂无数据'}</span></div>;

    return (
      <div>
        {tabs.activeTab === 0 && tabs.data.map(renderAllLogItem)}
        {tabs.activeTab === 1 && tabs.data.map(renderCollectionItem)}
        {tabs.hasMore && (
          <button onClick={tabs.loadMore} disabled={tabs.isLoading} className="w-full py-2 text-sm text-orange-600 disabled:opacity-50">{tabs.isLoading ? '加载中...' : '加载更多'}</button>
        )}
      </div>
    );
  };



  return (
    <PageContainer title="数字资产总权益" onBack={onBack} rightAction={<button onClick={() => onNavigate({ name: 'asset-history', type: 'all', back: { name: 'asset-view' } })} className="text-sm text-orange-600">历史记录</button>} padding={false}>
      <div className="p-3 pb-20">
        <AssetHeaderCard userInfo={userInfo} onNavigate={onNavigate} />
        <AssetActionsGrid onNavigate={onNavigate} />

        {/* FilterBar replaces TabSwitcher */}
        <div className="mb-3">
          <FilterBar
            category={filterCategory}
            setCategory={handleCategoryChange}
            flow={filterFlow}
            setFlow={setFilterFlow}
            range={filterTime}
            setRange={setFilterTime}
            categoryOptions={categoryOptions}
          />
        </div>

        {renderContent()}
      </div>

      {actionModal.isOpen && actionModal.context.selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={actionModal.close}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full relative" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600" onClick={actionModal.close}><X size={20} /></button>
            <div className="flex gap-3 mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img src={normalizeAssetUrl(actionModal.context.selectedItem.image) || undefined} alt={actionModal.context.selectedItem.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800 mb-1">{actionModal.context.selectedItem.title}</div>
                <div className="text-xs text-gray-500">购买时间: {actionModal.context.selectedItem.pay_time_text || actionModal.context.selectedItem.buy_time_text}</div>
                <div className="text-sm font-bold text-gray-900 mt-1">¥ {actionModal.context.selectedItem.price}</div>
              </div>
            </div>

            {/* Logic for buttons inside Modal (simplified from original for brevity but logic intact) */}
            {(() => {
              const item = actionModal.context.selectedItem;
              if (isConsigning(item) || hasConsignedSuccessfully(item) || isDelivered(item) || hasConsignedBefore(item)) return null;
              return (
                <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                  <button onClick={actionModal.switchToDelivery} className={`flex-1 py-2 text-xs rounded-md transition-colors ${actionModal.context.actionType === 'delivery' ? 'bg-white text-orange-600 font-medium shadow-sm' : 'text-gray-600'}`}>权益分割</button>
                  <button onClick={actionModal.switchToConsignment} className={`flex-1 py-2 text-xs rounded-md transition-colors ${actionModal.context.actionType === 'consignment' ? 'bg-white text-orange-600 font-medium shadow-sm' : 'text-gray-600'}`}>寄售</button>
                </div>
              );
            })()}

            <div className="space-y-3 mb-4">
              {actionModal.context.actionType === 'delivery' ? (
                /* Check results for delivery */
                actionModal.deliveryCheckResult && (
                  <>
                    {actionModal.deliveryCheckResult.isConsigning && <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg"><AlertCircle size={16} /><span>该藏品正在寄售中，无法提货</span></div>}
                    {!actionModal.deliveryCheckResult.isConsigning && actionModal.deliveryCheckResult.hasConsignedSuccessfully && <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg"><AlertCircle size={16} /><span>该藏品已经寄售成功（已售出），无法提货</span></div>}
                    {!actionModal.deliveryCheckResult.isConsigning && !actionModal.deliveryCheckResult.hasConsignedSuccessfully && actionModal.deliveryCheckResult.isDelivered && <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg"><AlertCircle size={16} /><span>该藏品已经提货，无法再次提货</span></div>}
                    {!actionModal.deliveryCheckResult.isConsigning && !actionModal.deliveryCheckResult.hasConsignedSuccessfully && !actionModal.deliveryCheckResult.isDelivered && (
                      actionModal.deliveryCheckResult.can48Hours ?
                        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg"><CheckCircle size={16} /><span>已满足48小时提货条件</span></div> :
                        <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg"><AlertCircle size={16} /><span>还需等待 {actionModal.deliveryCheckResult.hoursLeft} 小时才能提货</span></div>
                    )}
                    {!actionModal.deliveryCheckResult.isConsigning && !actionModal.deliveryCheckResult.hasConsignedSuccessfully && !actionModal.deliveryCheckResult.isDelivered && actionModal.deliveryCheckResult.hasConsignedBefore && <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg"><AlertCircle size={16} /><span>该藏品曾经寄售过，将执行强制提货</span></div>}
                  </>
                )
              ) : (
                /* Check results for consignment */
                actionModal.consignmentCheckResult && actionModal.deliveryCheckResult && (
                  <>
                    {actionModal.deliveryCheckResult.isConsigning && <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg"><AlertCircle size={16} /><span>该藏品正在寄售中，无法再次寄售</span></div>}
                    {!actionModal.deliveryCheckResult.isConsigning && actionModal.deliveryCheckResult.hasConsignedSuccessfully && <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg"><AlertCircle size={16} /><span>该藏品已经寄售成功（已售出），无法再次寄售</span></div>}
                    {!actionModal.deliveryCheckResult.isConsigning && !actionModal.deliveryCheckResult.hasConsignedSuccessfully && (
                      actionModal.consignmentCheckResult.unlocked ?
                        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg"><CheckCircle size={16} /><span>已满足48小时寄售条件</span></div> :
                        <div className="bg-orange-50 px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-orange-600 mb-1"><AlertCircle size={16} /><span>距离可寄售时间还有：</span></div>
                          {actionModal.consignmentCheckResult.remainingText ? <div className="text-sm font-bold text-orange-700 text-center">{actionModal.consignmentCheckResult.remainingText}</div> :
                            actionModal.context.countdown ? <div className="text-sm font-bold text-orange-700 text-center">{String(actionModal.context.countdown.hours).padStart(2, '0')}:{String(actionModal.context.countdown.minutes).padStart(2, '0')}:{String(actionModal.context.countdown.seconds).padStart(2, '0')}</div> :
                              <div className="text-sm font-bold text-orange-700 text-center">{Math.floor((actionModal.consignmentCheckResult.remainingSeconds || 0) / 3600)}h {Math.floor(((actionModal.consignmentCheckResult.remainingSeconds || 0) % 3600) / 60)}m {(actionModal.consignmentCheckResult.remainingSeconds || 0) % 60}s</div>}
                        </div>
                    )}
                    {!actionModal.deliveryCheckResult.isConsigning && !actionModal.deliveryCheckResult.hasConsignedSuccessfully && (
                      <div className="bg-orange-50 px-3 py-2 rounded-lg">
                        <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs text-orange-600"><ShoppingBag size={16} /><span>我的寄售券：</span></div><div className="text-sm font-bold text-orange-700">{consignmentTicketCount} 张</div></div>
                        {consignmentTicketCount === 0 && <div className="text-xs text-red-600 mt-1">您没有寄售券，无法进行寄售</div>}
                      </div>
                    )}
                  </>
                )
              )}
            </div>

            {actionModal.context.error && <div className="text-xs text-red-600 mb-2">{actionModal.context.error}</div>}
            <button onClick={actionModal.handleSubmit} disabled={actionModal.isSubmitting || !actionModal.canSubmit} className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${!actionModal.isSubmitting && actionModal.canSubmit ? 'bg-orange-600 text-white active:bg-orange-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
              {actionModal.isSubmitting ? '提交中...' : actionModal.context.actionType === 'delivery' ? '权益分割' : '确认寄售'}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default AssetView;
