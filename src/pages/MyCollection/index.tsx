import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Filter,
  PackageOpen,
  Search,
  X,
} from 'lucide-react';
import { getErrorMessage, isAbortError } from '../../api/core/errors';
import {
  collectionTradeApi,
  type MyCollectionItem,
  type MyCollectionStatus,
} from '../../api/modules/collectionTrade';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  collectionConsignmentService,
  type BatchConsignableResponse,
} from '../../services/collectionConsignmentService';

type CollectionTab = 'holding' | 'consigning' | 'transferred' | 'rights_node';
type PriceFilter = 'all' | 'high_price' | 'low_price';

const TABS: Array<{ id: CollectionTab; label: string }> = [
  { id: 'holding', label: '持仓中' },
  { id: 'consigning', label: '寄售中' },
  { id: 'transferred', label: '已流转' },
  { id: 'rights_node', label: '权益节点' },
];

const FILTERS: Array<{ id: PriceFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'high_price', label: '2000元以上' },
  { id: 'low_price', label: '2000元及以下' },
];

const TAB_STATUS_MAP: Record<CollectionTab, MyCollectionStatus> = {
  holding: 'holding',
  consigning: 'consigned',
  transferred: 'sold',
  rights_node: 'mining',
};

function formatMoney(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  return amount.toFixed(2);
}

function getEmptyMessage(activeTab: CollectionTab, hasKeyword: boolean) {
  if (hasKeyword) {
    return '未找到匹配的藏品';
  }

  if (activeTab === 'holding') {
    return '暂无持仓中的藏品';
  }

  if (activeTab === 'consigning') {
    return '暂无寄售中的藏品';
  }

  if (activeTab === 'transferred') {
    return '暂无已流转藏品';
  }

  return '暂无权益节点藏品';
}

export const MyCollectionPage = () => {
  const location = useLocation();
  const { goBackOr, goTo, navigate } = useAppNavigate();
  const { showToast } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CollectionTab>('holding');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState<PriceFilter>('all');
  const [requestKeyword, setRequestKeyword] = useState('');

  const [collections, setCollections] = useState<MyCollectionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadSeed, setReloadSeed] = useState(0);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchData, setBatchData] = useState<BatchConsignableResponse | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedBatchItems, setSelectedBatchItems] = useState<number[]>([]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const routeTab = query.get('tab');

    if (routeTab && TABS.some((tab) => tab.id === routeTab)) {
      setActiveTab(routeTab as CollectionTab);
    }
  }, [location.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRequestKeyword(searchQuery.trim());
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const loadCollections = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await collectionTradeApi.myCollection(
        {
          page: 1,
          limit: 50,
          status: TAB_STATUS_MAP[activeTab],
          ...(requestKeyword ? { keyword: requestKeyword } : {}),
          sort: 'create_time',
          order: 'desc',
        },
        signal,
      );

      setCollections(response.list);
      setTotal(response.total);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      setCollections([]);
      setTotal(0);
      setLoadError(getErrorMessage(error));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [activeTab, requestKeyword]);

  useEffect(() => {
    const controller = new AbortController();
    void loadCollections(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadCollections, reloadSeed]);

  const handleRefresh = useCallback(async () => {
    await loadCollections();
  }, [loadCollections]);

  const filteredCollections = useMemo(() => {
    if (activeFilter === 'all') {
      return collections;
    }

    return collections.filter((item) => {
      if (activeFilter === 'high_price') {
        return item.market_price > 2000;
      }

      return item.market_price <= 2000;
    });
  }, [activeFilter, collections]);

  const collectionMap = useMemo(() => {
    const map = new Map<number, MyCollectionItem>();
    for (const item of collections) {
      const key = item.user_collection_id || item.id;
      if (key > 0) {
        map.set(key, item);
      }
    }
    return map;
  }, [collections]);

  const handleBatchConsignClick = async () => {
    setShowBatchModal(true);
    setBatchLoading(true);

    try {
      const response = await collectionConsignmentService.getBatchConsignableList();
      if (response.code === 1) {
        setBatchData(response);
        setSelectedBatchItems(response.data.items.map((item) => item.user_collection_id));
      } else {
        showToast({ message: '获取可寄售藏品失败', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to fetch batch consignable list', error);
      showToast({ message: '获取可寄售藏品失败，请稍后重试', type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const openDetail = (item: MyCollectionItem) => {
    if (activeTab === 'transferred' && item.consignment_id > 0) {
      navigate(
        `/order?order_type=collectible&collectible_tab=${encodeURIComponent('卖出订单')}&sell_id=${item.consignment_id}&from=my_collection_transferred`,
      );
      return;
    }

    const id = item.user_collection_id || item.id;
    if (!id) {
      return;
    }

    navigate(`/my-collection/detail/${id}`, { state: { item } });
  };

  const renderTabs = () => (
    <div className="sticky top-12 z-10 flex border-b border-border-light bg-white px-2 dark:bg-gray-900">
      {TABS.map((tab) => (
        <div
          key={tab.id}
          className={`relative flex-1 py-3 text-center text-[14px] font-medium transition-colors ${
            activeTab === tab.id ? 'text-primary-start' : 'text-text-sub'
          }`}
          onClick={() => {
            setActiveTab(tab.id);
            setShowFilter(false);
          }}
        >
          {tab.label}
          {activeTab === tab.id ? (
            <div className="absolute bottom-0 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-t-full bg-primary-start" />
          ) : null}
        </div>
      ))}
    </div>
  );

  const renderItem = (item: MyCollectionItem) => {
    const imageUrl = item.image;
    const showTransferredIncome = activeTab === 'transferred';
    const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      openDetail(item);
    };

    return (
      <div
        className="mb-3 cursor-pointer rounded-[16px] bg-white p-3 shadow-sm transition-transform active:scale-[0.98] dark:bg-gray-900"
        role="button"
        tabIndex={0}
        onClick={() => openDetail(item)}
        onKeyDown={handleCardKeyDown}
      >
        <div className="mb-3 flex space-x-3">
          <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[12px] bg-gray-100 dark:bg-gray-800">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.title || '藏品'}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-aux">
                <PackageOpen size={20} />
              </div>
            )}
            <div className="absolute left-0 top-0 rounded-br-[8px] bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
              {item.session_title || '未分场次'}
            </div>
          </div>

          <div className="flex flex-1 flex-col pt-0.5">
            <div className="mb-1 flex items-start justify-between">
              <h3 className="mr-2 line-clamp-1 text-[15px] font-bold text-text-main">{item.title || '未命名藏品'}</h3>
              <span className="shrink-0 whitespace-nowrap rounded bg-red-50 px-1.5 py-0.5 text-[11px] text-primary-start dark:bg-red-900/20">
                {item.status_text || '持有中'}
              </span>
            </div>

            <div className="mb-2 text-[11px] text-text-sub">入藏时间: {item.create_time_text || '--'}</div>

            <div className="mt-auto grid grid-cols-2 gap-2 rounded-[8px] bg-gray-50 p-2 dark:bg-gray-800/50">
              <div>
                <div className="mb-1 text-[10px] text-text-sub">买入价</div>
                <div className="text-[13px] font-medium leading-none text-text-main">¥{formatMoney(item.buy_price)}</div>
              </div>
              <div>
                <div className="mb-1 text-[10px] text-text-sub">
                  {showTransferredIncome ? '寄售收益' : '市场价'}
                </div>
                <div className="text-[13px] font-bold leading-none text-primary-start">
                  ¥{formatMoney(showTransferredIncome ? item.profit_amount : item.market_price)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border-light pt-3">
          <div className="text-[11px] text-text-sub">
            交易次数: <span className="font-medium text-text-main">{item.transaction_count}</span> 次
          </div>
          <div className="flex shrink-0 space-x-2">
            <button
              className="rounded-full border border-border-main px-4 py-1.5 text-[12px] text-text-main active:bg-gray-50 dark:active:bg-gray-800"
              onClick={(event) => {
                event.stopPropagation();
                openDetail(item);
              }}
            >
              详情
            </button>
            {activeTab === 'holding' ? (
              <button
                className="rounded-full bg-gradient-to-r from-primary-start to-primary-end px-4 py-1.5 text-[12px] text-white shadow-sm active:opacity-80"
                onClick={(event) => {
                  event.stopPropagation();
                  openDetail(item);
                }}
              >
                寄售
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3 p-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="mb-3 rounded-[16px] bg-white p-3 shadow-sm dark:bg-gray-900">
              <div className="mb-3 flex space-x-3">
                <Skeleton className="h-[88px] w-[88px] shrink-0 rounded-[12px]" />
                <div className="flex flex-1 flex-col pt-0.5">
                  <div className="mb-1 flex items-start justify-between">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-5 w-12 rounded" />
                  </div>
                  <Skeleton className="mb-2 h-3 w-1/2" />
                  <Skeleton className="mt-auto h-12 w-full rounded-[8px]" />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border-light pt-3">
                <Skeleton className="h-4 w-24" />
                <div className="flex space-x-2">
                  <Skeleton className="h-7 w-14 rounded-full" />
                  <Skeleton className="h-7 w-14 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <AlertCircle size={40} className="mb-3 text-red-500" />
          <p className="mb-4 text-[14px] text-text-sub">{loadError}</p>
          <button
            className="rounded-full border border-primary-start px-5 py-2 text-[13px] font-medium text-primary-start"
            onClick={() => setReloadSeed((seed) => seed + 1)}
          >
            重试
          </button>
        </div>
      );
    }

    if (filteredCollections.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <PackageOpen size={48} className="mb-4 text-border-main" strokeWidth={1} />
          <p className="mb-2 text-[14px] text-text-sub">{getEmptyMessage(activeTab, requestKeyword.length > 0)}</p>
          {activeTab !== 'holding' ? (
            <p className="text-center text-[12px] text-text-aux">您可以在市场中选购心仪的藏品</p>
          ) : null}
          {activeTab !== 'holding' ? (
            <button
              className="mt-6 rounded-full border border-primary-start px-6 py-2 text-[14px] font-medium text-primary-start transition-colors active:bg-red-50 dark:active:bg-red-900/20"
              onClick={() => goTo('store')}
            >
              去逛逛
            </button>
          ) : null}
        </div>
      );
    }

    return (
      <div className="p-4">
        {filteredCollections.map((item, index) => (
          <div key={`collection-${item.user_collection_id || item.id || 0}-${index}`}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-bg-base">
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border-light bg-white px-4 dark:bg-gray-900">
        <button onClick={() => goBackOr('user')} className="-ml-2 p-2 text-text-main active:opacity-70">
          <ChevronLeft size={20} />
        </button>
        <span className="text-[17px] font-medium text-text-main">我的藏品</span>
        <div className="-mr-2 flex space-x-1">
          <button
            className={`p-2 active:opacity-70 ${showSearch ? 'text-primary-start' : 'text-text-main'}`}
            onClick={() => {
              setShowSearch((current) => !current);
              if (showFilter) {
                setShowFilter(false);
              }
            }}
          >
            <Search size={18} />
          </button>
          <button
            className={`p-2 active:opacity-70 ${showFilter ? 'text-primary-start' : 'text-text-main'}`}
            onClick={() => {
              setShowFilter((current) => !current);
              if (showSearch) {
                setShowSearch(false);
              }
            }}
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {showSearch ? (
        <div className="animate-in slide-in-from-top-2 sticky top-12 z-20 border-b border-border-light bg-white px-4 py-3 dark:bg-gray-900">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-text-aux" />
            <input
              type="text"
              placeholder="搜索藏品名称/编号"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-full bg-gray-100 py-2 pl-9 pr-8 text-[13px] text-text-main focus:outline-none dark:bg-gray-800"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-0.5 text-text-aux active:text-text-main"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showFilter ? (
        <>
          <div className="fixed inset-0 z-20 bg-black/40" onClick={() => setShowFilter(false)} />
          <div className="animate-in slide-in-from-top-2 absolute left-0 right-0 top-12 z-30 border-b border-border-light bg-white dark:bg-gray-900">
            <div className="p-4">
              <div className="mb-3 text-[13px] font-medium text-text-main">价格筛选</div>
              <div className="grid grid-cols-3 gap-3">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setActiveFilter(filter.id);
                      setShowFilter(false);
                    }}
                    className={`rounded-[8px] py-2 text-center text-[12px] transition-colors ${
                      activeFilter === filter.id
                        ? 'border border-primary-start bg-red-50 text-primary-start dark:bg-red-900/20'
                        : 'border border-transparent bg-gray-50 text-text-main dark:bg-gray-800'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {renderTabs()}

      <PullToRefreshContainer className="flex-1" onRefresh={handleRefresh} disabled={loading}>
        <div className={`flex-1 overflow-y-auto no-scrollbar ${activeTab === 'holding' ? 'pb-[80px]' : 'pb-safe'}`}>
          {renderContent()}
        </div>
      </PullToRefreshContainer>

      {activeTab === 'holding' ? (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border-light bg-white pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)] dark:bg-gray-900 dark:shadow-[0_-4px_16px_rgba(0,0,0,0.2)]">
          <div className="mx-auto flex max-w-[390px] items-center justify-between px-4 py-3">
            <div className="text-[13px] text-text-sub">可批量寄售藏品</div>
            <button
              onClick={() => void handleBatchConsignClick()}
              disabled={batchLoading}
              className="rounded-full bg-gradient-to-r from-primary-start to-primary-end px-6 py-2 text-[14px] font-medium text-white shadow-sm active:opacity-80 disabled:opacity-50"
            >
              {batchLoading ? '加载中...' : '批量寄售'}
            </button>
          </div>
        </div>
      ) : null}

      {showBatchModal ? (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBatchModal(false)} />
          <div className="animate-in slide-in-from-bottom duration-200 relative z-10 mx-auto flex max-h-[80vh] w-full max-w-[390px] flex-col rounded-t-[20px] bg-bg-card">
            <div className="flex items-center justify-between border-b border-border-light p-4">
              <h3 className="text-[16px] font-bold text-text-main">批量寄售</h3>
              <div className="flex items-center space-x-3">
                {batchData && batchData.data.items.length > 0 && !batchLoading ? (
                  <button
                    onClick={() => {
                      if (selectedBatchItems.length === batchData.data.items.length) {
                        setSelectedBatchItems([]);
                      } else {
                        setSelectedBatchItems(batchData.data.items.map((item) => item.user_collection_id));
                      }
                    }}
                    className="text-[14px] text-primary-start active:opacity-70"
                  >
                    {selectedBatchItems.length === batchData.data.items.length ? '取消全选' : '全选'}
                  </button>
                ) : null}
                <button onClick={() => setShowBatchModal(false)} className="-mr-1 p-1 text-text-aux active:text-text-main">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              {batchLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-[12px]" />
                  <Skeleton className="h-16 w-full rounded-[12px]" />
                  <Skeleton className="h-16 w-full rounded-[12px]" />
                </div>
              ) : batchData ? (
                <>
                  <div className="mb-4 flex items-start rounded-[12px] bg-red-50 p-3 dark:bg-red-900/20">
                    <AlertCircle size={16} className="mt-0.5 mr-2 shrink-0 text-primary-start" />
                    <div className="text-[13px] text-text-main">
                      当前可寄售藏品数量：
                      <span className="font-bold text-primary-start">{batchData.data.available_now_count}</span> 个
                      <div className="mt-1 text-[11px] text-text-sub">
                        总藏品数 {batchData.data.stats.total_collections} 个，活跃场次 {batchData.data.stats.active_sessions} 场
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {batchData.data.items.map((item, index) => {
                      const linked = collectionMap.get(item.user_collection_id);
                      const title = item.title || linked?.title || `藏品 ${item.user_collection_id}`;
                      const serial = linked?.unique_id || linked?.asset_code || String(item.user_collection_id);
                      const imageUrl = item.image || linked?.image || '';
                      const isSelected = selectedBatchItems.includes(item.user_collection_id);

                      const toggleSelection = () => {
                        if (isSelected) {
                          setSelectedBatchItems((previous) => previous.filter((id) => id !== item.user_collection_id));
                        } else {
                          setSelectedBatchItems((previous) => [...previous, item.user_collection_id]);
                        }
                      };

                      return (
                        <div
                          key={`${item.user_collection_id}-${index}`}
                          className={`cursor-pointer rounded-[12px] border p-3 transition-colors ${
                            isSelected
                              ? 'border-primary-start bg-red-50/50 dark:bg-red-900/10'
                              : 'border-border-light'
                          }`}
                          onClick={toggleSelection}
                        >
                          <div className="flex items-center">
                            <div className="mr-3 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-gray-100 dark:bg-gray-800">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={title}
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <PackageOpen size={16} className="text-text-aux" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 line-clamp-1 text-[14px] font-medium text-text-main">{title}</div>
                              <div className="text-[12px] text-text-sub">编号: {serial}</div>
                            </div>
                            {isSelected ? (
                              <CheckCircle2 size={20} className="ml-2 shrink-0 text-primary-start" />
                            ) : (
                              <Circle size={20} className="ml-2 shrink-0 text-border-main" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-[14px] text-text-sub">暂无数据</div>
              )}
            </div>

            {batchData && batchData.data.items.length > 0 ? (
              <div className="border-t border-border-light bg-bg-card p-4 pb-safe">
                <button
                  className="w-full rounded-full bg-gradient-to-r from-primary-start to-primary-end py-3 text-[15px] font-medium text-white shadow-sm active:opacity-80 disabled:opacity-50"
                  disabled={selectedBatchItems.length === 0}
                  onClick={() => {
                    showToast({ message: `已确认寄售 ${selectedBatchItems.length} 个藏品`, type: 'success' });
                    setShowBatchModal(false);
                  }}
                >
                  确认寄售 ({selectedBatchItems.length})
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
