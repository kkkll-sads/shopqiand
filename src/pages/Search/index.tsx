import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Clock, Flame, Search as SearchIcon, Trash2, XCircle } from 'lucide-react';
import { shopProductApi } from '../../api';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { buildShopProductSearchResultPath } from '../../features/shop-product/utils';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useAppNavigate } from '../../lib/navigation';

const SEARCH_HISTORY_STORAGE_KEY = 'shop-product-search-history';
const SEARCH_HISTORY_LIMIT = 10;

function readSearchHistory() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .slice(0, SEARCH_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function writeSearchHistory(history: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    SEARCH_HISTORY_STORAGE_KEY,
    JSON.stringify(history.slice(0, SEARCH_HISTORY_LIMIT)),
  );
}

export const SearchPage = () => {
  const { goBack, goTo } = useAppNavigate();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>(() => readSearchHistory());
  const [isFocused, setIsFocused] = useState(true);

  const latestRequest = useRequest(
    (signal) => shopProductApi.latest({ limit: 10, page: 1 }, signal),
    {
      cacheKey: 'search:latest',
      initialData: {
        limit: 10,
        list: [],
        page: 1,
        total: 0,
      },
      keepPreviousData: true,
    },
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const hotKeywords = useMemo(() => {
    const names = latestRequest.data?.list.map((item) => item.name.trim()).filter(Boolean) ?? [];
    return names.filter((name, index, source) => source.indexOf(name) === index);
  }, [latestRequest.data]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'search-page',
    restoreDeps: [history.length, hotKeywords.length, latestRequest.error, latestRequest.loading],
    restoreWhen: !latestRequest.loading && !latestRequest.error,
  });

  const suggestions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return hotKeywords.slice(0, 6);
    }

    return hotKeywords
      .filter((item) => item.toLowerCase().includes(keyword))
      .slice(0, 6);
  }, [hotKeywords, query]);

  const handleSearch = (value: string) => {
    const keyword = value.trim();
    if (!keyword) {
      return;
    }

    const nextHistory = [keyword, ...history.filter((item) => item !== keyword)].slice(
      0,
      SEARCH_HISTORY_LIMIT,
    );

    setHistory(nextHistory);
    writeSearchHistory(nextHistory);
    goTo(buildShopProductSearchResultPath(keyword));
  };

  const handleClearHistory = () => {
    setHistory([]);
    writeSearchHistory([]);
  };

  const renderHotSearches = () => {
    if (latestRequest.loading) {
      return (
        <Card className="rounded-2xl p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex items-center">
                <Skeleton className="mr-2 h-4 w-4 rounded" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </Card>
      );
    }

    if (latestRequest.error) {
      return (
        <Card className="rounded-2xl p-4 shadow-sm">
          <ErrorState message="热搜商品加载失败" onRetry={() => void latestRequest.reload().catch(() => undefined)} />
        </Card>
      );
    }

    if (!hotKeywords.length) {
      return (
        <Card className="rounded-2xl p-4 shadow-sm">
          <EmptyState message="暂无可搜索的推荐商品" />
        </Card>
      );
    }

    return (
      <Card className="rounded-2xl p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center text-md font-bold text-text-main">
            商品热搜
            <Flame size={14} className="ml-1 text-primary-start" />
          </h3>
          <span className="text-s text-text-aux">实时商品</span>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {hotKeywords.map((item, index) => {
            const isTop3 = index < 3;
            return (
              <button
                key={item}
                type="button"
                onClick={() => handleSearch(item)}
                className="flex items-center text-left active:opacity-70"
              >
                <span
                  className={`mr-2 w-4 shrink-0 text-center text-base font-bold ${
                    isTop3 ? 'text-primary-start' : 'text-text-aux'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="truncate text-base text-text-main">{item}</span>
              </button>
            );
          })}
        </div>
      </Card>
    );
  };

  const renderSuggestions = () => {
    if (!query.trim() || !isFocused) {
      return null;
    }

    if (!suggestions.length) {
      return (
        <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+48px)] bottom-0 z-30 bg-bg-base p-4">
          <EmptyState message="没有匹配的商品关键词" />
        </div>
      );
    }

    return (
      <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+48px)] bottom-0 z-30 overflow-y-auto bg-bg-base">
        <div className="bg-white dark:bg-gray-900">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleSearch(item)}
              className="flex w-full items-center justify-between border-b border-border-light px-4 py-3 text-left active:bg-bg-base"
            >
              <div className="text-md text-text-main">{item}</div>
              <SearchIcon size={16} className="text-text-aux" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex h-full flex-1 flex-col bg-bg-base">
      {isOffline && <OfflineBanner onAction={refreshStatus} />}

      <div className="relative z-40 border-b border-border-light bg-white pb-2 dark:bg-gray-900">
        <div className="flex h-12 items-center px-3 pt-safe">
          <button onClick={goBack} className="mr-1 p-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
          <div className="mr-3 flex h-8 flex-1 items-center rounded-full border border-border-light bg-bg-base px-3 focus-within:border-primary-start/50">
            <SearchIcon size={16} className="mr-2 shrink-0 text-text-aux" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder="搜索商品 / 分类"
              className="w-full border-none bg-transparent text-base text-text-main outline-none placeholder:text-text-aux"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="shrink-0 p-1 text-text-aux active:opacity-70"
              >
                <XCircle size={14} className="fill-text-aux text-white" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleSearch(query)}
            className="shrink-0 rounded-full bg-gradient-to-r from-primary-start to-primary-end px-3.5 py-1.5 text-base font-medium text-white shadow-sm active:opacity-80"
          >
            搜索
          </button>
        </div>
      </div>

      {renderSuggestions()}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
        {history.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="flex items-center text-md font-bold text-text-main">
                <Clock size={14} className="mr-1 text-text-aux" />
                搜索历史
              </h3>
              <button onClick={handleClearHistory} className="p-1 text-text-aux active:opacity-70">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSearch(item)}
                  className="rounded-full border border-border-light bg-white px-3 py-1.5 text-sm text-text-main shadow-sm active:bg-bg-base dark:bg-gray-900"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {renderHotSearches()}
      </div>
    </div>
  );
};
