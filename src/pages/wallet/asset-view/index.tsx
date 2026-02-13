/**
 * AssetView - 资产总览页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { MyCollectionItem } from '@/services';
import type { Product } from '@/types';
import { useAssetActionModal } from '@/hooks/useAssetActionModal';
import { useAppStore, type ListCacheKey, type ListPageCache } from '@/stores/appStore';
import AssetHeaderCard from '../components/asset/AssetHeaderCard';
import AssetActionsGrid from '../components/asset/AssetActionsGrid';
import AssetTransactionContent from '../components/asset/AssetTransactionContent';
import AssetActionModal from '../components/asset/AssetActionModal';
import AssetFilterSheet from '../components/asset/AssetFilterSheet';
import { useAssetViewFilters } from './hooks/useAssetViewFilters';
import { useAssetViewTabs } from './hooks/useAssetViewTabs';
import { useAssetViewCache } from './hooks/useAssetViewCache';
import { useAssetViewUserInfo } from './hooks/useAssetViewUserInfo';
import {
  hasConsignedBefore,
  hasConsignedSuccessfully,
  isConsigning,
  isDelivered,
  shouldOpenConsignment,
} from './utils';

interface AssetViewProps {
  onProductSelect?: (product: Product) => void;
  initialTab?: number;
}

const AssetView: React.FC<AssetViewProps> = ({ initialTab = 0 }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { listCaches, setListCache } = useAppStore();

  const filters = useAssetViewFilters();

  const stableSetListCache = useCallback(
    (key: ListCacheKey, cache: ListPageCache) => setListCache(key, cache),
    [setListCache]
  );

  const tabs = useAssetViewTabs({
    initialTab,
    filterCategory: filters.filterCategory,
    filterFlow: filters.filterFlow,
    filterTime: filters.filterTime,
  });

  useAssetViewCache({
    pathname,
    cache: listCaches.assetView,
    setListCache: stableSetListCache,
    tabsData: tabs.data,
    activeTab: tabs.activeTab,
    hasMore: tabs.hasMore,
    filterCategory: filters.filterCategory,
    filterFlow: filters.filterFlow,
    filterTime: filters.filterTime,
    setFilterCategory: filters.setFilterCategory,
    setFilterFlow: filters.setFilterFlow,
    setFilterTime: filters.setFilterTime,
  });

  const { userInfo, consignmentTicketCount } = useAssetViewUserInfo();

  const actionModal = useAssetActionModal(consignmentTicketCount, () => {
    tabs.refresh();
  });

  const handleItemClick = useCallback(
    (item: MyCollectionItem) => {
      if (shouldOpenConsignment(item)) {
        actionModal.openConsignment(item);
        return;
      }

      actionModal.openDelivery(item);
    },
    [actionModal]
  );

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
            onClick={filters.handleOpenFilterSheet}
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
        visible={filters.showFilterSheet}
        onClose={() => filters.setShowFilterSheet(false)}
        categoryOptions={filters.categoryOptions}
        flowOptions={filters.flowOptions}
        timeOptions={filters.timeOptions}
        tempFilterCategory={filters.tempFilterCategory}
        tempFilterFlow={filters.tempFilterFlow}
        tempFilterTime={filters.tempFilterTime}
        onTempFilterCategoryChange={filters.setTempFilterCategory}
        onTempFilterFlowChange={filters.setTempFilterFlow}
        onTempFilterTimeChange={filters.setTempFilterTime}
        onConfirm={filters.handleConfirmFilter}
      />
    </PageContainer>
  );
};

export default AssetView;
