/**
 * ReservationRecordPage - 预约记录页面（现代化UI版）
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Sparkles } from 'lucide-react';
import {
  fetchReservations,
  fetchCollectionSessions,
  ReservationItem,
  ReservationStatus as ReservationStatusType,
} from '@/services';
import { SelectFilter, SortSelector } from '@/components/common';
import type { SortOrder } from '@/components/common';
import type { SelectOption } from '@/components/common';
import { Product } from '@/types';
import { getStoredToken } from '@/services/client';
import { extractError, isSuccess } from '@/utils/apiHelpers';
import { errorLog, debugLog } from '@/utils/logger';
import { useAppStore, MARKET_CACHE_TTL } from '@/stores/appStore';
import ReservationRecordStatusTabs from './components/ReservationRecordStatusTabs';
import ReservationRecordContent from './components/ReservationRecordContent';

interface ReservationRecordPageProps {
  onProductSelect?: (product: Product) => void;
  source?: string;
  sessionId?: string;
  zoneId?: string;
  sessionTitle?: string;
  sessionStartTime?: string;
  sessionEndTime?: string;
}

const PAGE_SIZE = 10;

const ReservationRecordPage: React.FC<ReservationRecordPageProps> = () => {
  const navigate = useNavigate();
  const { listCaches, setListCache } = useAppStore();

  const restoredFromCacheRef = useRef(false);
  const scrollTopRef = useRef(0);
  const stateRef = useRef<{
    records: ReservationItem[];
    page: number;
    hasMore: boolean;
    statusFilter: ReservationStatusType | undefined;
    sessionFilter: string;
    zoneFilter: string;
    sortField: string;
    sortOrder: string;
  }>({
    records: [],
    page: 1,
    hasMore: true,
    statusFilter: -1,
    sessionFilter: 'all',
    zoneFilter: 'all',
    sortField: 'create_time',
    sortOrder: 'desc',
  });

  const [statusFilter, setStatusFilter] = useState<ReservationStatusType | undefined>(-1);
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'create_time' | 'weight' | 'freeze_amount'>('create_time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [sessionOptions, setSessionOptions] = useState<SelectOption[]>([]);
  const [records, setRecords] = useState<ReservationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cache = listCaches.reservationRecord;
    if (cache && Date.now() - cache.timestamp < MARKET_CACHE_TTL) {
      debugLog('ReservationRecordPage', '从缓存恢复状态', {
        dataCount: cache.data.length,
        page: cache.page,
        statusFilter: cache.filters?.statusFilter,
        scrollTop: cache.scrollTop,
      });

      setRecords(cache.data as ReservationItem[]);
      setPage(cache.page);
      setHasMore(cache.hasMore);
      if (cache.filters?.statusFilter !== undefined) {
        setStatusFilter(cache.filters.statusFilter);
      }
      if (cache.filters?.sessionFilter) setSessionFilter(cache.filters.sessionFilter);
      if (cache.filters?.zoneFilter) setZoneFilter(cache.filters.zoneFilter);
      if (cache.filters?.sortField) setSortField(cache.filters.sortField);
      if (cache.filters?.sortOrder) setSortOrder(cache.filters.sortOrder as SortOrder);

      restoredFromCacheRef.current = true;
      scrollTopRef.current = cache.scrollTop;

      const token = getStoredToken();
      setIsLoggedIn(!!token);
    }
  }, [listCaches.reservationRecord]);

  useEffect(() => {
    stateRef.current = {
      records,
      page,
      hasMore,
      statusFilter,
      sessionFilter,
      zoneFilter,
      sortField,
      sortOrder,
    };
  }, [records, page, hasMore, statusFilter, sessionFilter, zoneFilter, sortField, sortOrder]);

  useEffect(() => {
    if (restoredFromCacheRef.current && records.length > 0 && scrollTopRef.current > 0) {
      const restoreScroll = () => {
        if (containerRef.current && scrollTopRef.current > 0) {
          const targetScroll = scrollTopRef.current;
          containerRef.current.scrollTo({ top: targetScroll, behavior: 'instant' });
          if (Math.abs(containerRef.current.scrollTop - targetScroll) > 10) {
            setTimeout(() => {
              if (containerRef.current) {
                containerRef.current.scrollTo({ top: targetScroll, behavior: 'instant' });
              }
            }, 100);
          }
        }
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoreScroll();
          setTimeout(restoreScroll, 100);
          setTimeout(restoreScroll, 300);
        });
      });

      restoredFromCacheRef.current = false;
    }
  }, [records.length]);

  useEffect(() => {
    const handleScrollForCache = () => {
      if (containerRef.current) {
        scrollTopRef.current = containerRef.current.scrollTop;
      }
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScrollForCache);

    return () => {
      container?.removeEventListener('scroll', handleScrollForCache);

      const state = stateRef.current;
      if (state.records.length > 0) {
        debugLog('ReservationRecordPage', '保存缓存状态', {
          dataCount: state.records.length,
          page: state.page,
          statusFilter: state.statusFilter,
          scrollTop: scrollTopRef.current,
        });

        setListCache('reservationRecord', {
          data: state.records,
          page: state.page,
          hasMore: state.hasMore,
          scrollTop: scrollTopRef.current,
          filters: {
            statusFilter: state.statusFilter,
            sessionFilter: state.sessionFilter,
            zoneFilter: state.zoneFilter,
            sortField: state.sortField,
            sortOrder: state.sortOrder,
          },
          timestamp: Date.now(),
        });
      }
    };
  }, [setListCache]);

  useEffect(() => {
    const token = getStoredToken();
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetchCollectionSessions();
        if (cancelled) return;
        if (isSuccess(res) && res.data?.list?.length) {
          const options: SelectOption[] = [
            { value: 'all', label: '全部场次' },
            ...res.data.list.map((session: { id: number; title: string }) => ({
              value: String(session.id),
              label: session.title,
            })),
          ];
          setSessionOptions(options);
        }
      } catch (e) {
        if (!cancelled) errorLog('ReservationRecordPage', '获取场次列表失败', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const zoneOptions: SelectOption[] = useMemo(
    () => [{ value: 'all', label: '全部分区' }],
    []
  );

  const sortOptions = useMemo(
    () => [
      { value: 'create_time', label: '创建时间' },
      { value: 'weight', label: '权重' },
      { value: 'freeze_amount', label: '冻结金额' },
    ],
    []
  );

  const loadRecords = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response = await fetchReservations({
          status: statusFilter,
          page: pageNum,
          limit: PAGE_SIZE,
          session_id: sessionFilter === 'all' ? undefined : sessionFilter,
          zone_id: zoneFilter === 'all' ? undefined : zoneFilter,
          sort: sortField,
          order: sortOrder,
        });

        if (isSuccess(response) && response.data) {
          const newList = response.data.list || [];
          const total = response.data.total || 0;
          if (append) {
            setRecords((prev) => [...prev, ...newList]);
          } else {
            setRecords(newList);
          }
          setPage(pageNum);
          setHasMore(pageNum * PAGE_SIZE < total);
        } else {
          setError(extractError(response, '加载失败'));
        }
      } catch (err: any) {
        errorLog('ReservationRecordPage', '加载申购记录失败', err);
        if (err?.name === 'NeedLoginError') return;
        setError(err?.msg || '网络连接异常');
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [statusFilter, sessionFilter, zoneFilter, sortField, sortOrder]
  );

  useEffect(() => {
    if (restoredFromCacheRef.current) {
      restoredFromCacheRef.current = false;
      debugLog('ReservationRecordPage', '跳过首次加载（从缓存恢复）');
      return;
    }

    if (isLoggedIn) {
      setPage(1);
      setRecords([]);
      loadRecords(1, false);
    }
  }, [statusFilter, isLoggedIn, sessionFilter, zoneFilter, sortField, sortOrder, loadRecords]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || loadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadRecords(page + 1, true);
    }
  }, [loadingMore, hasMore, page, loadRecords]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-20 bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 flex items-center justify-between text-white shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full active:bg-white/20 transition-all"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">申购记录</h1>
        <div className="w-10" />
      </header>

      <div className="mx-4 mt-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <FileText size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">申购记录</p>
              <p className="text-lg font-bold text-gray-900">
                {records.length} <span className="text-sm font-normal text-gray-400">条</span>
              </p>
            </div>
          </div>
          <Sparkles size={18} className="text-red-400" />
        </div>
      </div>

      <ReservationRecordStatusTabs statusFilter={statusFilter} onChange={setStatusFilter} />

      {isLoggedIn && (
        <div className="mt-3 mx-4 flex gap-2 overflow-x-auto pb-1">
          <SelectFilter
            label="场次"
            value={sessionFilter}
            options={sessionOptions.length ? sessionOptions : [{ value: 'all', label: '全部场次' }]}
            onChange={setSessionFilter}
            placeholder="全部场次"
          />
          <SelectFilter
            label="价格区"
            value={zoneFilter}
            options={zoneOptions}
            onChange={setZoneFilter}
            placeholder="全部分区"
          />
          <SortSelector
            sortField={sortField}
            sortOrder={sortOrder}
            options={sortOptions}
            onSortChange={(field, order) => {
              setSortField(field as 'create_time' | 'weight' | 'freeze_amount');
              setSortOrder(order);
            }}
          />
        </div>
      )}

      <ReservationRecordContent
        containerRef={containerRef}
        isLoggedIn={isLoggedIn}
        loading={loading}
        error={error}
        records={records}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onRetry={() => loadRecords(1, false)}
        onLogin={() => navigate('/login')}
        onCardClick={(record) => navigate(`/reservation-record/${record.id}`)}
        onGoCollection={() => navigate('/my-collection')}
        onScroll={handleScroll}
      />
    </div>
  );
};

export default ReservationRecordPage;
