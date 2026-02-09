/**
 * AssetView - 资产总览页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import {
  getAllLog,
  type MyCollectionItem,
  fetchProfile,
} from '@/services';
import { getStoredToken } from '@/services/client';
import type { Product, UserInfo } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import AssetHeaderCard from './components/asset/AssetHeaderCard';
import AssetActionsGrid from './components/asset/AssetActionsGrid';
import AssetTransactionContent from './components/asset/AssetTransactionContent';
import AssetActionModal from './components/asset/AssetActionModal';
import AssetFilterSheet, { type FilterOption } from './components/asset/AssetFilterSheet';
import { extractData } from '@/utils/apiHelpers';
import { ConsignmentStatus, DeliveryStatus } from '@/constants/statusEnums';
import { debugLog, errorLog } from '@/utils/logger';
import { useAssetActionModal } from '@/hooks/useAssetActionModal';
import { useAssetTabs, type TabConfig } from '@/hooks/useAssetTabs';
import { BALANCE_TYPE_OPTIONS } from '@/constants/balanceTypes';
import { useAppStore, MARKET_CACHE_TTL } from '@/stores/appStore';
import { setScrollRestoreInProgress } from '@/components/common/ScrollToTop';

interface AssetViewProps {
  onProductSelect?: (product: Product) => void;
  initialTab?: number;
}

const HEADER_HEIGHT = 52;

const AssetView: React.FC<AssetViewProps> = ({ initialTab = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { listCaches, setListCache } = useAppStore();

  const restoredFromCacheRef = useRef(false);
  const scrollTopRef = useRef(0);
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
    filterTime: '7days',
  });

  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFlow, setFilterFlow] = useState('all');
  const [filterTime, setFilterTime] = useState('7days');

  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [tempFilterCategory, setTempFilterCategory] = useState('all');
  const [tempFilterFlow, setTempFilterFlow] = useState('all');

  const categoryOptions: FilterOption[] = [...BALANCE_TYPE_OPTIONS];
  const flowOptions: FilterOption[] = [
    { label: '全部', value: 'all' },
    { label: '支出', value: 'out' },
    { label: '收入', value: 'in' },
  ];

  const handleOpenFilterSheet = () => {
    setTempFilterCategory(filterCategory);
    setTempFilterFlow(filterFlow);
    setShowFilterSheet(true);
  };

  const handleConfirmFilter = () => {
    setFilterCategory(tempFilterCategory);
    setFilterFlow(tempFilterFlow);
    setShowFilterSheet(false);
  };

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [consignmentTicketCount, setConsignmentTicketCount] = useState<number>(0);

  useEffect(() => {
    debugLog('AssetView', '寄售券数量变化', consignmentTicketCount);
  }, [consignmentTicketCount]);

  const tabConfigs: TabConfig[] = useMemo(
    () => [
      {
        id: 0,
        name: '资金明细',
        fetchData: async ({ page, limit, token }) => {
          let startTime: number | undefined;
          let endTime: number | undefined;
          const now = Math.floor(Date.now() / 1000);

          switch (filterTime) {
            case 'today': {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              startTime = Math.floor(today.getTime() / 1000);
              endTime = now;
              break;
            }
            case '7days':
              startTime = now - 7 * 24 * 3600;
              endTime = now;
              break;
            case '30days':
              startTime = now - 30 * 24 * 3600;
              endTime = now;
              break;
            default:
              break;
          }

          return getAllLog({
            page,
            limit,
            type: filterCategory,
            flow_direction: filterFlow as 'in' | 'out' | 'all',
            start_time: startTime,
            end_time: endTime,
            token,
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
    ],
    [filterCategory, filterFlow, filterTime]
  );

  const tabs = useAssetTabs(tabConfigs, initialTab);

  useEffect(() => {
    const cache = listCaches.assetView;
    if (cache && Date.now() - cache.timestamp < MARKET_CACHE_TTL) {
      debugLog('AssetView', '从缓存恢复状态', {
        dataCount: cache.data.length,
        activeTab: cache.activeTab,
        scrollTop: cache.scrollTop,
      });

      if (cache.filters) {
        if (cache.filters.filterCategory) setFilterCategory(cache.filters.filterCategory);
        if (cache.filters.filterFlow) setFilterFlow(cache.filters.filterFlow);
        if (cache.filters.filterTime) setFilterTime(cache.filters.filterTime);
      }

      restoredFromCacheRef.current = true;
      scrollTopRef.current = cache.scrollTop;
    }
  }, []);

  useEffect(() => {
    stateRef.current = {
      tabsData: tabs.data || [],
      activeTab: tabs.activeTab,
      filterCategory,
      filterFlow,
      filterTime,
    };
  }, [tabs.data, tabs.activeTab, filterCategory, filterFlow, filterTime]);

  useEffect(() => {
    if (restoredFromCacheRef.current && tabs.data.length > 0 && scrollTopRef.current > 0) {
      setScrollRestoreInProgress(location.pathname, true);

      let restoreAttempts = 0;
      const maxAttempts = 5;

      const restoreScroll = () => {
        if (scrollTopRef.current > 0) {
          const targetScroll = scrollTopRef.current + HEADER_HEIGHT;
          window.scrollTo({ top: targetScroll, behavior: 'instant' });

          const currentScroll = window.scrollY;
          const actualContentScroll = Math.max(0, currentScroll - HEADER_HEIGHT);
          const diff = Math.abs(actualContentScroll - scrollTopRef.current);

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

            setScrollRestoreInProgress(location.pathname, false);
            restoredFromCacheRef.current = false;
            return;
          }

          restoreAttempts += 1;
          if (restoreAttempts < maxAttempts) {
            setTimeout(restoreScroll, 100);
          } else {
            setScrollRestoreInProgress(location.pathname, false);
            restoredFromCacheRef.current = false;
          }
        } else {
          setScrollRestoreInProgress(location.pathname, false);
          restoredFromCacheRef.current = false;
        }
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoreScroll();
          setTimeout(restoreScroll, 100);
          setTimeout(restoreScroll, 300);
        });
      });

      setTimeout(() => {
        setScrollRestoreInProgress(location.pathname, false);
        restoredFromCacheRef.current = false;
      }, 5000);
    }
  }, [tabs.data.length, location.pathname]);

  useEffect(() => {
    const handleScrollForCache = () => {
      scrollTopRef.current = Math.max(0, window.scrollY - HEADER_HEIGHT);
    };

    window.addEventListener('scroll', handleScrollForCache);

    return () => {
      window.removeEventListener('scroll', handleScrollForCache);

      const state = stateRef.current;
      if (state.tabsData.length > 0) {
        debugLog('AssetView', '保存缓存状态', {
          dataCount: state.tabsData.length,
          activeTab: state.activeTab,
          scrollTop: scrollTopRef.current,
        });

        setListCache('assetView', {
          data: state.tabsData,
          page: 1,
          hasMore: tabs.hasMore,
          scrollTop: scrollTopRef.current,
          activeTab: String(state.activeTab),
          filters: {
            filterCategory: state.filterCategory,
            filterFlow: state.filterFlow,
            filterTime: state.filterTime,
          },
          timestamp: Date.now(),
        });
      }
    };
  }, [setListCache, tabs.hasMore]);

  useEffect(() => {
    if (tabs.activeTab === 0) {
      tabs.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterFlow, filterTime]);

  useEffect(() => {
    const validTabIds = tabConfigs.map((tab) => tab.id);
    if (!validTabIds.includes(tabs.activeTab) && tabConfigs.length > 0) {
      tabs.setActiveTab(tabConfigs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabConfigs]);

  const actionModal = useAssetActionModal(consignmentTicketCount, () => {
    tabs.refresh();
  });

  const hasConsignedBefore = (item: MyCollectionItem) => {
    const status = item.consignment_status;
    return typeof status === 'number' && status !== ConsignmentStatus.NOT_CONSIGNED;
  };

  const hasConsignedSuccessfully = (item: MyCollectionItem) =>
    item.consignment_status === ConsignmentStatus.SOLD;

  const isConsigning = (item: MyCollectionItem) =>
    item.consignment_status === ConsignmentStatus.CONSIGNING ||
    item.consignment_status === ConsignmentStatus.PENDING;

  const isDelivered = (item: MyCollectionItem) => item.delivery_status === DeliveryStatus.DELIVERED;

  const handleItemClick = (item: MyCollectionItem) => {
    if (
      isConsigning(item) ||
      hasConsignedSuccessfully(item) ||
      hasConsignedBefore(item) ||
      item.delivery_status === DeliveryStatus.NOT_DELIVERED ||
      item.consignment_status === ConsignmentStatus.NOT_CONSIGNED
    ) {
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
          const couponCount = profileData.userInfo.consignment_coupon || 0;
          debugLog('AssetView', '设置寄售券数量为', couponCount);
          setConsignmentTicketCount(couponCount);
        }
      } catch (error) {
        errorLog('AssetView', '加载用户信息失败', error);
      }
    };

    loadUserInfo();
  }, []);

  const handleLoadMore = useCallback(() => {
    if (tabs.hasMore && !tabs.isLoading) {
      tabs.loadMore();
    }
  }, [tabs.hasMore, tabs.isLoading, tabs.loadMore]);

  const bottomRef = useInfiniteScroll(handleLoadMore, tabs.hasMore, tabs.isLoading);

  return (
    <PageContainer
      title="数字资产总权益"
      onBack={() => navigate(-1)}
      rightAction={
        <button onClick={() => navigate('/asset-history/all')} className="text-sm text-red-600">
          历史记录
        </button>
      }
      padding={false}
    >
      <div className="p-3 pb-20">
        <AssetHeaderCard userInfo={userInfo} />
        <AssetActionsGrid />

        <div className="mb-3">
          <button
            onClick={handleOpenFilterSheet}
            className="flex items-center justify-between w-full bg-white rounded-xl p-3 shadow-sm active:scale-[0.98] transition-transform border border-gray-100"
          >
            <span className="text-sm font-medium text-gray-700">全部交易</span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
        </div>

        <AssetTransactionContent
          tabs={tabs}
          bottomRef={bottomRef}
          onMoneyLogClick={(id) => navigate(`/money-log/${id}`)}
          onCollectionClick={handleItemClick}
        />
      </div>

      <AssetActionModal
        actionModal={actionModal}
        consignmentTicketCount={consignmentTicketCount}
        hasConsignedBefore={hasConsignedBefore}
        hasConsignedSuccessfully={hasConsignedSuccessfully}
        isConsigning={isConsigning}
        isDelivered={isDelivered}
      />

      <AssetFilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        categoryOptions={categoryOptions}
        flowOptions={flowOptions}
        tempFilterCategory={tempFilterCategory}
        tempFilterFlow={tempFilterFlow}
        onTempFilterCategoryChange={setTempFilterCategory}
        onTempFilterFlowChange={setTempFilterFlow}
        onConfirm={handleConfirmFilter}
      />
    </PageContainer>
  );
};

export default AssetView;
