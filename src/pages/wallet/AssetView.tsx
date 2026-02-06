/**
 * AssetView - 资产总览页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, ShoppingBag, X, AlertCircle, CheckCircle, ArrowRight, RefreshCw, ChevronDown } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import BottomSheet from '@/components/common/BottomSheet';
import { SkeletonAssetPage, SkeletonTransactionCard } from '@/components/common';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import PullToRefresh from '@/components/common/PullToRefresh';
import {
  getAllLog,
  AllLogItem,
  MyCollectionItem,
  fetchProfile,
  normalizeAssetUrl,
} from '@/services/api';
import { getStoredToken } from '@/services/client';
import { Product, UserInfo } from '@/types';
import { useNotification } from '@/context/NotificationContext';
import { useAuthStore } from '@/stores/authStore';
import AssetHeaderCard from './components/asset/AssetHeaderCard';
import AssetActionsGrid from './components/asset/AssetActionsGrid';
import { extractData } from '@/utils/apiHelpers';
import { ConsignmentStatus, DeliveryStatus } from '@/constants/statusEnums';
import { debugLog, errorLog } from '@/utils/logger';
import { useAssetActionModal } from '@/hooks/useAssetActionModal';
import { useAssetTabs, TabConfig } from '@/hooks/useAssetTabs';
import { BALANCE_TYPE_OPTIONS, getBalanceTypeLabel } from '@/constants/balanceTypes';
import { useAppStore, MARKET_CACHE_TTL } from '@/stores/appStore';
import { setScrollRestoreInProgress } from '@/components/common/ScrollToTop';

interface AssetViewProps {
  onProductSelect?: (product: Product) => void;
  initialTab?: number;
}

const AssetView: React.FC<AssetViewProps> = ({ onProductSelect, initialTab = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, showDialog } = useNotification();
  const { listCaches, setListCache } = useAppStore();

  // 固定头部高度（PageContainer 的 header 高度）
  const HEADER_HEIGHT = 52;

  // 缓存相关 refs
  const restoredFromCacheRef = useRef(false);
  const scrollTopRef = useRef(0);
  // 用于保存最新状态值，解决 cleanup 闭包问题
  const stateRef = useRef<{
    tabsData: any[];
    activeTab: number;
    filterCategory: string;
    filterFlow: string;
    filterTime: string;
  }>({
    tabsData: [],
    activeTab: 0,
    filterCategory: 'all',
    filterFlow: 'all',
    filterTime: '7days'
  });

  // Filter States
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFlow, setFilterFlow] = useState('all');
  const [filterTime, setFilterTime] = useState('7days'); // Default to 7 days as per user example preference
  
  // 筛选弹窗状态
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [tempFilterCategory, setTempFilterCategory] = useState('all');
  const [tempFilterFlow, setTempFilterFlow] = useState('all');

  const categoryOptions = [...BALANCE_TYPE_OPTIONS];
  const flowOptions = [
    { label: '全部', value: 'all' },
    { label: '支出', value: 'out' },
    { label: '收入', value: 'in' },
  ];

  // Logic to sync Filter Category with Active Tab
  const handleCategoryChange = (val: string) => {
    setFilterCategory(val);
  };
  
  // 打开筛选弹窗，初始化临时筛选值
  const handleOpenFilterSheet = () => {
    setTempFilterCategory(filterCategory);
    setTempFilterFlow(filterFlow);
    setShowFilterSheet(true);
  };
  
  // 确认筛选，应用临时值
  const handleConfirmFilter = () => {
    setFilterCategory(tempFilterCategory);
    setFilterFlow(tempFilterFlow);
    setShowFilterSheet(false);
  };

  // User Info
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const [consignmentTicketCount, setConsignmentTicketCount] = useState<number>(0);

  // 调试寄售券数量变化
  useEffect(() => {
    debugLog('AssetView', '寄售券数量变化', consignmentTicketCount);
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

  // ========================================
  // 缓存恢复逻辑：组件挂载时检查并恢复缓存
  // ========================================
  useEffect(() => {
    const cache = listCaches.assetView;
    if (cache && Date.now() - cache.timestamp < MARKET_CACHE_TTL) {
      debugLog('AssetView', '从缓存恢复状态', {
        dataCount: cache.data.length,
        activeTab: cache.activeTab,
        scrollTop: cache.scrollTop
      });

      // 恢复筛选条件
      if (cache.filters) {
        if (cache.filters.filterCategory) setFilterCategory(cache.filters.filterCategory);
        if (cache.filters.filterFlow) setFilterFlow(cache.filters.filterFlow);
        if (cache.filters.filterTime) setFilterTime(cache.filters.filterTime);
      }

      // 标记已从缓存恢复
      restoredFromCacheRef.current = true;
      // 保存滚动位置到 ref，等待数据渲染完成后再恢复
      scrollTopRef.current = cache.scrollTop;

      // 注意：tabs.data 的恢复需要在 tabs 初始化后，通过 tabs 的机制来处理
      // 这里只恢复筛选条件和滚动位置
    }
  }, []); // 仅在组件挂载时执行一次

  // ========================================
  // 同步状态到 ref，确保 cleanup 能获取最新值
  // ========================================
  useEffect(() => {
    stateRef.current = {
      tabsData: tabs.data || [],
      activeTab: tabs.activeTab,
      filterCategory,
      filterFlow,
      filterTime
    };
  }, [tabs.data, tabs.activeTab, filterCategory, filterFlow, filterTime]);

  // ========================================
  // 滚动位置恢复：在数据渲染完成后恢复
  // ========================================
  useEffect(() => {
    // 只有在从缓存恢复且数据已渲染时才恢复滚动位置
    if (restoredFromCacheRef.current && tabs.data.length > 0 && scrollTopRef.current > 0) {
      // 设置标记，防止 ScrollToTop 重置滚动
      setScrollRestoreInProgress(location.pathname, true);

      let restoreAttempts = 0;
      const maxAttempts = 5;

      const restoreScroll = () => {
        if (scrollTopRef.current > 0) {
          // 恢复滚动位置（已保存的 scrollTop 是相对于内容区域的，需要加上头部高度）
          const targetScroll = scrollTopRef.current + HEADER_HEIGHT;
          window.scrollTo({ top: targetScroll, behavior: 'instant' });
          
          // 验证是否恢复成功（考虑头部高度）
          const currentScroll = window.scrollY;
          const actualContentScroll = Math.max(0, currentScroll - HEADER_HEIGHT);
          const diff = Math.abs(actualContentScroll - scrollTopRef.current);

          // 如果恢复成功（误差小于 10px）或达到最大尝试次数
          if (diff < 10 || restoreAttempts >= maxAttempts) {
            if (diff < 10) {
              debugLog('AssetView', '滚动位置恢复成功', {
                target: scrollTopRef.current,
                actual: actualContentScroll,
                attempts: restoreAttempts + 1,
              });
            } else {
              debugLog('AssetView', '滚动位置恢复失败（达到最大尝试次数）', {
                target: scrollTopRef.current,
                actual: actualContentScroll,
                attempts: restoreAttempts + 1,
              });
            }
            
            // 清除标记
            setScrollRestoreInProgress(location.pathname, false);
            restoredFromCacheRef.current = false;
            return;
          }

          // 如果未成功，继续尝试
          restoreAttempts++;
          if (restoreAttempts < maxAttempts) {
            setTimeout(restoreScroll, 100);
          } else {
            // 达到最大尝试次数，清除标记
            setScrollRestoreInProgress(location.pathname, false);
            restoredFromCacheRef.current = false;
          }
        } else {
          // scrollTop 为 0，直接清除标记
          setScrollRestoreInProgress(location.pathname, false);
          restoredFromCacheRef.current = false;
        }
      };

      // 使用多次 rAF + setTimeout 确保 DOM 完全渲染后再恢复
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoreScroll();
          // 延迟恢复，确保列表项完全渲染
          setTimeout(restoreScroll, 100);
          setTimeout(restoreScroll, 300);
        });
      });

      // 超时保护：5秒后强制清除标记
      setTimeout(() => {
        setScrollRestoreInProgress(location.pathname, false);
        restoredFromCacheRef.current = false;
      }, 5000);
    }
  }, [tabs.data.length, location.pathname]); // 监听数据长度变化

  // ========================================
  // 缓存保存逻辑：组件卸载时保存状态
  // ========================================
  useEffect(() => {
    // 更新滚动位置 ref（保存相对于内容区域的滚动位置，减去头部高度）
    const handleScrollForCache = () => {
      scrollTopRef.current = Math.max(0, window.scrollY - HEADER_HEIGHT);
    };

    window.addEventListener('scroll', handleScrollForCache);

    return () => {
      window.removeEventListener('scroll', handleScrollForCache);

      // 组件卸载时保存缓存（使用 stateRef 获取最新值）
      const state = stateRef.current;
      if (state.tabsData.length > 0) {
        debugLog('AssetView', '保存缓存状态', {
          dataCount: state.tabsData.length,
          activeTab: state.activeTab,
          scrollTop: scrollTopRef.current
        });

        setListCache('assetView', {
          data: state.tabsData,
          page: 1, // AssetView 使用无限滚动，page 始终为 1
          hasMore: tabs.hasMore,
          scrollTop: scrollTopRef.current,
          activeTab: String(state.activeTab),
          filters: {
            filterCategory: state.filterCategory,
            filterFlow: state.filterFlow,
            filterTime: state.filterTime
          },
          timestamp: Date.now()
        });
      }
    };
  }, [setListCache, tabs.hasMore]); // 只依赖 setListCache 和 tabs.hasMore，其他值通过 stateRef 获取

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

  useEffect(() => {
    const loadUserInfo = async () => {
      const token = getStoredToken();
      if (!token) return;
      try {
        const response = await fetchProfile(token);
        const profileData = extractData(response);
        debugLog('AssetView', 'API响应数据', profileData);
        if (profileData?.userInfo) {
          debugLog('AssetView', '用户信息', profileData.userInfo);
          debugLog('AssetView', 'API中的寄售券数量', profileData.userInfo.consignment_coupon);
          setUserInfo(profileData.userInfo);
          useAuthStore.getState().updateUser(profileData.userInfo);
          // 从用户信息中获取寄售券数量
          const couponCount = profileData.userInfo.consignment_coupon || 0;
          debugLog('AssetView', '设置寄售券数量为', couponCount);
          setConsignmentTicketCount(couponCount);
        }
      } catch (err) {
        errorLog('AssetView', '加载用户信息失败', err);
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

  // 无限滚动加载
  const handleLoadMore = useCallback(() => {
    if (tabs.hasMore && !tabs.isLoading) {
      tabs.loadMore();
    }
  }, [tabs.hasMore, tabs.isLoading, tabs.loadMore]);

  const bottomRef = useInfiniteScroll(handleLoadMore, tabs.hasMore, tabs.isLoading);

  const renderAllLogItem = (item: AllLogItem, index: number = 0) => {
    const amountVal = Number(item.amount);
    const isPositive = amountVal > 0;
    const typeText = getBalanceTypeLabel(item.type);

    // 根据类型确定标签颜色
    const getTypeColor = (type: string) => {
      if (type === 'balance' || type === '余额') return 'bg-blue-50 text-blue-600';
      if (type === 'green_power' || type === '绿色能量' || type === '算力') return 'bg-emerald-50 text-emerald-600';
      if (type === 'service_fee' || type === '服务费') return 'bg-amber-50 text-amber-600';
      if (type === 'score' || type === '积分' || type === '消费金') return 'bg-purple-50 text-purple-600';
      return 'bg-gray-100 text-gray-500';
    };

    return (
      <div
        key={item.id}
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-all"
        onClick={() => {
          if (item.id) {
            navigate(`/money-log/${item.id}`);
          }
        }}
        style={{ animation: index < 10 ? `slideUp 0.3s ease-out ${index * 0.03}s both` : undefined }}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-800 mb-1.5">{item.memo || item.remark || '资金变动'}</div>
            <div className="text-xs text-gray-400">{formatTime(item.createtime || item.create_time)}</div>
          </div>
          <div className={`text-xl font-black font-mono ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositive ? '+' : ''}{Number(amountVal).toFixed(2)}
          </div>
        </div>
        <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-100">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getTypeColor(item.type)}`}>{typeText}</span>
          <span className="flex items-center gap-1 font-mono text-gray-400">
            <span>{Number(item.before_value).toFixed(2)}</span>
            <span className="text-gray-300">→</span>
            <span className={isPositive ? 'text-emerald-500' : 'text-rose-500'}>{Number(item.after_value || item.after_balance).toFixed(2)}</span>
          </span>
        </div>
      </div>
    );
  };

  const renderCollectionItem = (item: MyCollectionItem, index: number = 0) => {
    const imageUrl = normalizeAssetUrl(item.image) || '';

    // Status config
    const getStatusConfig = () => {
      if (item.consignment_status === 2) {
        return { text: '已售出', gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', border: 'border-emerald-200', textColor: 'text-emerald-600' };
      } else if (item.consignment_status === 1) {
        return { text: '寄售中', gradient: 'from-amber-500 to-red-500', bg: 'bg-amber-50', border: 'border-amber-200', textColor: 'text-amber-600' };
      }
      return { text: '持有中', gradient: 'from-gray-400 to-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', textColor: 'text-gray-600' };
    };
    const statusConfig = getStatusConfig();

    return (
      <div
        key={item.id}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-3 shadow-lg cursor-pointer hover:shadow-xl active:scale-[0.99] transition-all border border-white/50"
        onClick={() => handleItemClick(item)}
        style={{ animation: index < 10 ? `slideUp 0.3s ease-out ${index * 0.03}s both` : undefined }}
      >
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-md border border-gray-100 bg-gradient-to-br from-gray-50 to-slate-50">
            {imageUrl ? (
              <img src={imageUrl} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={28} /></div>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm font-semibold text-gray-800 flex-1 line-clamp-2">{item.title}</div>
                <ArrowRight size={16} className="text-gray-300 ml-2 flex-shrink-0" />
              </div>
              <div className="text-[10px] text-gray-400 mb-2 font-mono">
                #{item.unique_id || item.id}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-base font-black text-gray-900">¥{Number(item.price).toFixed(2)}</div>
                {Number(item.market_price) > 0 && (
                  <div className="text-[10px] text-gray-400">市场价: ¥{Number(item.market_price).toFixed(2)}</div>
                )}
              </div>
              <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.textColor} ${statusConfig.border} border shadow-sm`}>
                {statusConfig.text}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (tabs.isLoading && tabs.data.length === 0) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonTransactionCard key={i} />
          ))}
        </div>
      );
    }
    if (tabs.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <FileText size={32} className="text-red-400" />
          </div>
          <span className="text-sm text-gray-500">{tabs.error}</span>
        </div>
      );
    }
    if (tabs.data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            {tabs.activeTab === 1 ? <ShoppingBag size={32} className="text-gray-300" /> : <FileText size={32} className="text-gray-300" />}
          </div>
          <span className="text-sm text-gray-400">{tabs.activeTab === 1 ? '暂无藏品' : '暂无数据'}</span>
        </div>
      );
    }

    return (
      <div>
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        {tabs.activeTab === 0 && tabs.data.map((item, index) => renderAllLogItem(item, index))}
        {tabs.activeTab === 1 && tabs.data.map((item, index) => renderCollectionItem(item, index))}
        
        {/* 无限滚动触发器 */}
        <div ref={bottomRef} className="h-4" />
        
        {/* 加载更多指示器 */}
        {tabs.isLoading && tabs.data.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
              加载中...
            </div>
          </div>
        )}
        
        {/* 没有更多数据 */}
        {!tabs.hasMore && tabs.data.length > 0 && (
          <div className="py-4 text-center text-gray-400 text-xs">
            <div className="inline-flex items-center gap-2">
              <div className="w-8 h-px bg-gray-200" />
              <span>已加载全部</span>
              <div className="w-8 h-px bg-gray-200" />
            </div>
          </div>
        )}
      </div>
    );
  };



  return (
    <PageContainer title="数字资产总权益" onBack={() => navigate(-1)} rightAction={<button onClick={() => navigate('/asset-history/all')} className="text-sm text-red-600">历史记录</button>} padding={false}>
      <div className="p-3 pb-20">
        <AssetHeaderCard userInfo={userInfo} />
        <AssetActionsGrid />

        {/* 全部交易按钮 */}
        <div className="mb-3">
          <button
            onClick={handleOpenFilterSheet}
            className="flex items-center justify-between w-full bg-white rounded-xl p-3 shadow-sm active:scale-[0.98] transition-transform border border-gray-100"
          >
            <span className="text-sm font-medium text-gray-700">全部交易</span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
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
                  <button onClick={actionModal.switchToDelivery} className={`flex-1 py-2 text-xs rounded-md transition-colors ${actionModal.context.actionType === 'delivery' ? 'bg-white text-red-600 font-medium shadow-sm' : 'text-gray-600'}`}>权益分割</button>
                  <button onClick={actionModal.switchToConsignment} className={`flex-1 py-2 text-xs rounded-md transition-colors ${actionModal.context.actionType === 'consignment' ? 'bg-white text-red-600 font-medium shadow-sm' : 'text-gray-600'}`}>寄售</button>
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
                        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg"><AlertCircle size={16} /><span>还需等待 {actionModal.deliveryCheckResult.hoursLeft} 小时才能提货</span></div>
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
                        <div className="bg-red-50 px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-red-600 mb-1"><AlertCircle size={16} /><span>距离可寄售时间还有：</span></div>
                          {actionModal.consignmentCheckResult.remainingText ? <div className="text-sm font-bold text-red-700 text-center">{actionModal.consignmentCheckResult.remainingText}</div> :
                            actionModal.context.countdown ? <div className="text-sm font-bold text-red-700 text-center">{String(actionModal.context.countdown.hours).padStart(2, '0')}:{String(actionModal.context.countdown.minutes).padStart(2, '0')}:{String(actionModal.context.countdown.seconds).padStart(2, '0')}</div> :
                              <div className="text-sm font-bold text-red-700 text-center">{Math.floor((actionModal.consignmentCheckResult.remainingSeconds || 0) / 3600)}h {Math.floor(((actionModal.consignmentCheckResult.remainingSeconds || 0) % 3600) / 60)}m {(actionModal.consignmentCheckResult.remainingSeconds || 0) % 60}s</div>}
                        </div>
                    )}
                    {!actionModal.deliveryCheckResult.isConsigning && !actionModal.deliveryCheckResult.hasConsignedSuccessfully && (
                      <div className="bg-red-50 px-3 py-2 rounded-lg">
                        <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs text-red-600"><ShoppingBag size={16} /><span>我的寄售券：</span></div><div className="text-sm font-bold text-red-700">{consignmentTicketCount} 张</div></div>
                        {consignmentTicketCount === 0 && <div className="text-xs text-red-600 mt-1">您没有寄售券，无法进行寄售</div>}
                      </div>
                    )}
                  </>
                )
              )}
            </div>

            {actionModal.context.error && <div className="text-xs text-red-600 mb-2">{actionModal.context.error}</div>}
            <button onClick={actionModal.handleSubmit} disabled={actionModal.isSubmitting || !actionModal.canSubmit} className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${!actionModal.isSubmitting && actionModal.canSubmit ? 'bg-red-600 text-white active:bg-red-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
              {actionModal.isSubmitting ? '提交中...' : actionModal.context.actionType === 'delivery' ? '权益分割' : '确认寄售'}
            </button>
          </div>
        </div>
      )}
      
      {/* 筛选弹窗 */}
      <BottomSheet
        visible={showFilterSheet}
        title="选择筛选项"
        onClose={() => setShowFilterSheet(false)}
      >
        <div className="p-4 space-y-6 pb-safe">
          {/* 收支类型 */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">收支类型</div>
            <div className="grid grid-cols-3 gap-2">
              {flowOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTempFilterFlow(opt.value)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    tempFilterFlow === opt.value
                      ? 'bg-green-50 text-green-600 border-2 border-green-500'
                      : 'bg-gray-50 text-gray-600 border-2 border-transparent active:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 交易类型 */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">交易类型</div>
            <div className="grid grid-cols-3 gap-2">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTempFilterCategory(opt.value)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    tempFilterCategory === opt.value
                      ? 'bg-green-50 text-green-600 border-2 border-green-500'
                      : 'bg-gray-50 text-gray-600 border-2 border-transparent active:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowFilterSheet(false)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium active:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirmFilter}
              className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium active:bg-green-600 transition-colors"
            >
              确定
            </button>
          </div>
        </div>
      </BottomSheet>
    </PageContainer>
  );
};

export default AssetView;
