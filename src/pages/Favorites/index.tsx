import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  Circle,
  HeartOff,
  ShoppingCart,
  Trash2,
  WifiOff,
} from 'lucide-react';
import { shopCartApi, shopFavoriteApi, type ShopFavoriteItem } from '../../api';
import { getErrorMessage, isAbortError } from '../../api/core/errors';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { buildShopProductPath } from '../../features/shop-product/utils';
import { useAppNavigate } from '../../lib/navigation';

function formatProductPrice(item: ShopFavoriteItem) {
  if (item.purchaseType === 'both' && item.price > 0 && item.scorePrice > 0) {
    return `¥${item.price.toFixed(2)} + ${item.scorePrice.toFixed(0)} 消费金`;
  }

  if (item.purchaseType === 'score' && item.scorePrice > 0) {
    return `${item.scorePrice.toFixed(0)} 消费金`;
  }

  return `¥${item.price.toFixed(2)}`;
}

function isProductAvailable(item: ShopFavoriteItem) {
  return item.productStatus === '1' && item.stock > 0;
}

export const FavoritesPage = () => {
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showConfirm, showToast } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [products, setProducts] = useState<ShopFavoriteItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [cartingId, setCartingId] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const loadFavorites = async (signal?: AbortSignal) => {
    if (!isAuthenticated) {
      setProducts([]);
      setError(null);
      setLoading(false);
      setIsEditing(false);
      setSelectedIds([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await shopFavoriteApi.list({ signal });
      setProducts(response.list);
      setSelectedIds((current) => current.filter((id) => response.list.some((item) => item.id === id)));
      setIsEditing((current) => current && response.list.length > 0);
    } catch (nextError) {
      if (isAbortError(nextError)) {
        return;
      }
      setProducts([]);
      setSelectedIds([]);
      setIsEditing(false);
      setError(nextError instanceof Error ? nextError : new Error('加载收藏失败'));
      showToast({ message: '加载收藏失败', type: 'error' });
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadFavorites(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated,
    namespace: 'favorites-page',
    restoreDeps: [isAuthenticated, loading, Boolean(error), products.length, isEditing],
    restoreWhen: isAuthenticated && !loading && !error,
  });

  const handleRefresh = async () => {
    refreshStatus();
    await loadFavorites();
  };

  const toggleEdit = () => {
    setIsEditing((current) => !current);
    setSelectedIds([]);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(products.map((item) => item.id));
  };

  const handleDelete = async () => {
    if (!selectedIds.length || removing) {
      return;
    }

    const confirmed = await showConfirm({
      title: '取消收藏',
      message: `确认取消收藏这 ${selectedIds.length} 件商品吗？`,
      confirmText: '确认取消',
      cancelText: '再想想',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    setRemoving(true);
    try {
      await shopFavoriteApi.remove(selectedIds);
      setProducts((current) => current.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      setIsEditing(false);
      showToast({ message: '已取消收藏', type: 'success' });
    } catch (nextError) {
      showToast({ message: getErrorMessage(nextError), type: 'error', duration: 3000 });
    } finally {
      setRemoving(false);
    }
  };

  const handleAddCart = async (item: ShopFavoriteItem) => {
    if (cartingId) {
      return;
    }

    if (item.productStatus !== '1') {
      showToast({ message: '商品已下架', type: 'warning' });
      return;
    }

    if (item.stock <= 0) {
      showToast({ message: '商品库存不足', type: 'warning' });
      return;
    }

    setCartingId(item.id);
    try {
      await shopCartApi.add({
        product_id: item.productId,
        quantity: 1,
        source: 'normal',
      });
      showToast({ message: '已加入购物车', type: 'success' });
    } catch (nextError) {
      showToast({ message: getErrorMessage(nextError), type: 'error', duration: 3000 });
    } finally {
      setCartingId(null);
    }
  };

  const renderHeader = () => (
    <div className="relative z-40 shrink-0 border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
      {isOffline ? (
        <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-primary-start dark:border-red-500/15 dark:bg-red-500/12 dark:text-red-300">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络连接不稳定，请检查后重试</span>
          </div>
          <button
            type="button"
            onClick={() => {
              void handleRefresh();
            }}
            className="rounded bg-bg-card px-2 py-1 font-medium text-text-main shadow-soft"
          >
            刷新
          </button>
        </div>
      ) : null}

      <div className="flex h-11 items-center justify-between px-3">
        <div className="flex w-1/3 items-center">
          <button type="button" onClick={goBack} className="p-1 -ml-1 text-gray-900 active:opacity-70 dark:text-gray-100">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="w-1/3 text-center text-2xl font-medium text-gray-900 dark:text-gray-100">我的收藏</h1>
        <div className="flex w-1/3 justify-end">
          {isAuthenticated && !loading && !error && products.length > 0 ? (
            <button
              type="button"
              onClick={toggleEdit}
              className="px-2 py-1 text-md text-gray-600 active:opacity-70 dark:text-gray-400"
            >
              {isEditing ? '完成' : '编辑'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-3 p-3">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex rounded-xl bg-white p-3 animate-pulse dark:bg-gray-900">
          <div className="mr-3 h-28 w-28 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="flex flex-1 flex-col justify-between py-1">
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="flex items-end justify-between">
              <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmpty = () => {
    if (!isAuthenticated) {
      return (
        <EmptyState
          icon={<HeartOff size={48} />}
          message="登录后查看你的收藏"
          actionText="去登录"
          actionVariant="primary"
          onAction={() => goTo('login')}
        />
      );
    }

    return (
      <EmptyState
        icon={<HeartOff size={48} />}
        message="暂无收藏商品"
        actionText="去逛逛"
        onAction={() => goTo('store')}
      />
    );
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return renderEmpty();
    }

    if (loading) {
      return renderSkeleton();
    }

    if (error) {
      return <ErrorState message={getErrorMessage(error)} onRetry={() => void handleRefresh()} />;
    }

    if (products.length === 0) {
      return renderEmpty();
    }

    return (
      <div className="space-y-3 p-3 pb-24">
        {products.map((item) => {
          const selected = selectedIds.includes(item.id);
          const available = isProductAvailable(item);
          const statusText = item.productStatus !== '1' ? '已下架' : item.stock <= 0 ? '已售罄' : '';

          return (
            <div
              key={item.id}
              className="relative flex items-center overflow-hidden rounded-xl bg-white p-3 dark:bg-gray-900"
              onClick={() => {
                if (isEditing) {
                  toggleSelect(item.id);
                  return;
                }
                goTo(buildShopProductPath(item.productId));
              }}
            >
              {isEditing ? (
                <div className="shrink-0 pr-3">
                  {selected ? (
                    <CheckCircle2 size={20} className="rounded-full bg-brand-start text-white fill-current text-text-price" />
                  ) : (
                    <Circle size={20} className="text-gray-300 dark:text-gray-600" />
                  )}
                </div>
              ) : null}

              <div className="relative mr-3 h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-text-aux">暂无图片</div>
                )}
                {statusText ? (
                  <div className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-center text-xs text-white">
                    {statusText}
                  </div>
                ) : null}
              </div>

              <div className="flex h-28 min-w-0 flex-1 flex-col justify-between py-0.5">
                <div>
                  <div className="line-clamp-2 text-md font-medium leading-snug text-gray-900 dark:text-gray-100">
                    {item.name}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-text-sub">
                    <span>销量 {item.sales}</span>
                    <span className="mx-2 text-border-main">|</span>
                    <span>库存 {item.stock}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-end justify-between">
                  <div className="text-xl font-bold leading-none text-text-price">{formatProductPrice(item)}</div>

                  {!isEditing ? (
                    <button
                      type="button"
                      disabled={!available || cartingId === item.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleAddCart(item);
                      }}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        !available || cartingId === item.id
                          ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                          : 'bg-brand-start text-white active:opacity-80'
                      }`}
                    >
                      <ShoppingCart size={14} />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-bg-hover dark:bg-gray-950">
      {renderHeader()}

      {isAuthenticated ? (
        <PullToRefreshContainer className="flex-1" onRefresh={handleRefresh} disabled={loading || isEditing || removing}>
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
            {renderContent()}
          </div>
        </PullToRefreshContainer>
      ) : (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          {renderContent()}
        </div>
      )}

      {isAuthenticated && isEditing && !loading && !error && products.length > 0 ? (
        <div className="absolute right-0 bottom-0 left-0 z-40 flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 pb-safe dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center active:opacity-70"
          >
            {isAllSelected ? (
              <CheckCircle2 size={20} className="mr-2 rounded-full bg-brand-start text-white fill-current text-text-price" />
            ) : (
              <Circle size={20} className="mr-2 text-gray-300 dark:text-gray-600" />
            )}
            <span className="text-md text-gray-900 dark:text-gray-100">全选</span>
          </button>

          <button
            type="button"
            disabled={selectedIds.length === 0 || removing}
            onClick={() => void handleDelete()}
            className={`flex h-[36px] items-center rounded-full px-6 text-md font-medium transition-all ${
              selectedIds.length > 0 && !removing
                ? 'bg-gradient-to-r from-brand-start to-brand-end text-white active:opacity-80'
                : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            }`}
          >
            <Trash2 size={16} className="mr-1.5" />
            {removing ? '处理中' : `取消收藏${selectedIds.length ? ` (${selectedIds.length})` : ''}`}
          </button>
        </div>
      ) : null}
    </div>
  );
};
