/**
 * MyCollection - 我的藏品页面
 * 重构版本：拆分为多个子组件和 hooks
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/layouts/PageContainer';
import { MyCollectionItem } from '@/services/api';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { debugLog } from '@/utils/logger';
import type { SortOrder } from '@/components/common';

// 子组件
import {
  CollectionTabs,
  CollectionFilters,
  CollectionList,
  BatchConsignButton,
  AssetConsignModal,
  CategoryTab,
} from './components/collection';

// Hooks
import {
  useCollectionStateMachines,
  useCollectionCache,
  useCollectionFilters,
  useCollectionData,
  useConsignmentAction,
  resolveCollectionId,
  isConsigning,
  hasConsignedSuccessfully,
  hasConsignedBefore,
} from './hooks';

import { LoadingEvent, FormEvent } from '@/types/states';
import { DeliveryStatus } from '@/constants/statusEnums';

interface MyCollectionProps {
  onItemSelect?: (item: MyCollectionItem) => void;
  initialConsignItemId?: string | number;
  preSelectedItem?: MyCollectionItem | null;
}

const MyCollection: React.FC<MyCollectionProps> = ({ onItemSelect, initialConsignItemId, preSelectedItem }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ========== 状态机 ==========
  const {
    loadMachine,
    actionMachine,
    batchConsignMachine,
    checkBatchMachine,
    loading,
    actionLoading,
    batchConsignLoading,
    checkingBatchConsignable,
  } = useCollectionStateMachines();

  // ========== 基础状态 ==========
  const [activeTab, setActiveTab] = useState<CategoryTab>('hold');
  const [page, setPage] = useState<number>(1);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedPriceZone, setSelectedPriceZone] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [sortField, setSortField] = useState<string>('create_time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 弹窗状态
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MyCollectionItem | null>(null);

  // ========== 数据加载 Hook ==========
  const {
    myCollections,
    error,
    hasMore,
    userInfo,
    batchConsignableData,
    loadData,
    loadUserInfo,
    loadBatchConsignableList,
    resetCollections,
    setCollections,
    setHasMoreState,
    refreshBatchConsignableData,
    setBatchConsignableData,
  } = useCollectionData({
    activeTab,
    page,
    onLoadStart: () => loadMachine.send(LoadingEvent.LOAD),
    onLoadSuccess: () => loadMachine.send(LoadingEvent.SUCCESS),
    onLoadError: () => loadMachine.send(LoadingEvent.ERROR),
  });

  // ========== 缓存 Hook ==========
  const { restoredFromCacheRef, updateStateRef, restoreScrollPosition, isRestoredFromCache, clearRestoredFlag } =
    useCollectionCache({
      scrollContainerRef,
      onRestoreState: (state) => {
        if (state.myCollections) setCollections(state.myCollections);
        if (state.page) setPage(state.page);
        if (state.hasMore !== undefined) setHasMoreState(state.hasMore);
        if (state.activeTab) setActiveTab(state.activeTab);
        if (state.selectedSession) setSelectedSession(state.selectedSession);
        if (state.selectedPriceZone) setSelectedPriceZone(state.selectedPriceZone);
        if (state.searchKeyword) setSearchKeyword(state.searchKeyword);
        if (state.sortField) setSortField(state.sortField);
        if (state.sortOrder) setSortOrder(state.sortOrder);
      },
      onLoadingComplete: () => {
        loadMachine.send(LoadingEvent.LOAD);
        loadMachine.send(LoadingEvent.SUCCESS);
      },
    });

  // ========== 筛选 Hook ==========
  const { filteredCollections, sessionOptions, priceZoneOptions, sortOptions } = useCollectionFilters({
    collections: myCollections,
    activeTab,
    filters: { selectedSession, selectedPriceZone, searchKeyword, sortField, sortOrder },
  });

  // ========== 寄售操作 Hook ==========
  const {
    consignmentCheckData,
    availableCouponCount,
    checkingCoupons,
    actionError,
    loadConsignmentCheck,
    canPerformConsignment,
    handleDelivery,
    handleConsignment,
    handleBatchConsign,
    clearConsignmentCheck,
    setActionError,
  } = useConsignmentAction({
    onActionStart: () => actionMachine.send(FormEvent.SUBMIT),
    onActionSuccess: () => actionMachine.send(FormEvent.SUBMIT_SUCCESS),
    onActionError: () => actionMachine.send(FormEvent.SUBMIT_ERROR),
    onBatchStart: () => batchConsignMachine.send(FormEvent.SUBMIT),
    onBatchSuccess: () => batchConsignMachine.send(FormEvent.SUBMIT_SUCCESS),
    onBatchError: () => batchConsignMachine.send(FormEvent.SUBMIT_ERROR),
  });

  // ========== 无限滚动 ==========
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [loading, hasMore]);

  const bottomRef = useInfiniteScroll(handleLoadMore, hasMore, loading);

  // ========== 同步状态到缓存 ref ==========
  useEffect(() => {
    updateStateRef({
      myCollections,
      page,
      hasMore,
      activeTab,
      selectedSession,
      selectedPriceZone,
      searchKeyword,
      sortField,
      sortOrder,
    });
  }, [myCollections, page, hasMore, activeTab, selectedSession, selectedPriceZone, searchKeyword, sortField, sortOrder, updateStateRef]);

  // ========== 初始化加载 ==========
  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  useEffect(() => {
    checkBatchMachine.send(LoadingEvent.LOAD);
    loadBatchConsignableList().then(() => {
      checkBatchMachine.send(LoadingEvent.SUCCESS);
    });
  }, [loadBatchConsignableList]);

  useEffect(() => {
    if (isRestoredFromCache()) {
      clearRestoredFlag();
      debugLog('MyCollection', '跳过首次加载（从缓存恢复）');
      return;
    }
    loadData();
  }, [loadData, isRestoredFromCache, clearRestoredFlag]);

  // ========== 恢复滚动位置 ==========
  useEffect(() => {
    restoreScrollPosition(filteredCollections.length);
  }, [filteredCollections.length, restoreScrollPosition]);

  // ========== Tab 切换 ==========
  const handleTabChange = useCallback((tab: CategoryTab) => {
    setActiveTab(tab);
    setPage(1);
    resetCollections();
  }, [resetCollections]);

  // ========== 弹窗相关 ==========
  useEffect(() => {
    if (!initialConsignItemId || myCollections.length === 0) return;
    const found = myCollections.find((it) => {
      const resolved = resolveCollectionId(it);
      return (
        String(resolved) === String(initialConsignItemId) ||
        String(it.id) === String(initialConsignItemId) ||
        String(it.item_id) === String(initialConsignItemId)
      );
    });
    if (found) {
      setSelectedItem(found);
      setActionError(null);
      setShowActionModal(true);
    }
  }, [initialConsignItemId, myCollections, setActionError]);

  useEffect(() => {
    if (!preSelectedItem) return;
    setSelectedItem(preSelectedItem);
    setActionError(null);
    setShowActionModal(true);
  }, [preSelectedItem, setActionError]);

  useEffect(() => {
    if (showActionModal && selectedItem) {
      loadConsignmentCheck(selectedItem);
    } else {
      clearConsignmentCheck();
    }
  }, [showActionModal, selectedItem, loadConsignmentCheck, clearConsignmentCheck]);

  // ========== 项目点击处理 ==========
  const handleItemSelect = useCallback(
    (item: MyCollectionItem) => {
      if (onItemSelect) {
        onItemSelect(item);
        return;
      }
      navigate(`/my-collection/${item.id}`);
    },
    [onItemSelect, navigate]
  );

  // ========== 操作处理 ==========
  const handleModalDelivery = useCallback(() => {
    if (!selectedItem) return;
    handleDelivery(selectedItem, () => {
      setShowActionModal(false);
      setSelectedItem(null);
      setPage(1);
      loadData();
    });
  }, [selectedItem, handleDelivery, loadData]);

  const handleModalConsign = useCallback(() => {
    if (!selectedItem) return;
    handleConsignment(selectedItem, () => {
      setShowActionModal(false);
      setSelectedItem(null);
      handleTabChange('consign');
    });
  }, [selectedItem, handleConsignment, handleTabChange]);

  const handleBatchConsignClick = useCallback(() => {
    handleBatchConsign(batchConsignableData, async () => {
      await refreshBatchConsignableData();
      loadData();
    });
  }, [handleBatchConsign, batchConsignableData, refreshBatchConsignableData, loadData]);

  // ========== 渲染 ==========
  return (
    <PageContainer title="我的藏品" onBack={() => navigate(-1)}>
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* 固定区域：Tab + 筛选器 */}
        <div className="sticky top-0 z-20 bg-white shadow-sm">
          <CollectionTabs activeTab={activeTab} onChange={handleTabChange} />
          <CollectionFilters
            searchKeyword={searchKeyword}
            onSearchChange={setSearchKeyword}
            selectedSession={selectedSession}
            sessionOptions={sessionOptions}
            onSessionChange={setSelectedSession}
            selectedPriceZone={selectedPriceZone}
            priceZoneOptions={priceZoneOptions}
            onPriceZoneChange={setSelectedPriceZone}
            sortField={sortField}
            sortOrder={sortOrder}
            sortOptions={sortOptions}
            onSortChange={(field, order) => {
              setSortField(field);
              setSortOrder(order);
            }}
          />
        </div>

        {/* 批量寄售按钮 */}
        <BatchConsignButton
          batchData={batchConsignableData}
          loading={batchConsignLoading}
          checking={checkingBatchConsignable}
          onBatchConsign={handleBatchConsignClick}
        />

        {/* 列表区域 */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 pb-6 bg-gradient-to-b from-gray-50/30 to-white"
        >
          <CollectionList
            items={filteredCollections}
            activeTab={activeTab}
            loading={loading}
            error={error}
            hasMore={hasMore}
            isEmpty={myCollections.length === 0}
            isFilterEmpty={myCollections.length > 0 && filteredCollections.length === 0}
            bottomRef={bottomRef}
            onItemSelect={handleItemSelect}
          />
        </div>

        {/* 资产挂牌弹窗 */}
        <AssetConsignModal
          visible={showActionModal}
          item={selectedItem}
          userInfo={userInfo}
          consignmentCheckData={consignmentCheckData}
          availableCouponCount={availableCouponCount}
          actionLoading={actionLoading}
          actionError={actionError}
          canPerformAction={canPerformConsignment(selectedItem)}
          onClose={() => setShowActionModal(false)}
          onDelivery={handleModalDelivery}
          onConsign={handleModalConsign}
        />
      </div>
    </PageContainer>
  );
};

export default MyCollection;
