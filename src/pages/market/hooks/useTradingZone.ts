/**
 * useTradingZone - 交易区逻辑 Hook
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  fetchCollectionSessions,
  fetchCollectionItemsBySession,
  CollectionSessionItem,
  CollectionItem,
  fetchAnnouncements,
  AnnouncementItem,
} from '@/services';
import { isSuccess } from '@/utils/apiHelpers';
import { debugLog, errorLog } from '@/utils/logger';

export interface TradingSession {
  id: string;
  title: string;
  image: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface TradingDisplayItem extends CollectionItem {
  source?: 'collection' | 'consignment' | 'mixed';
  consignment_id?: number;
  displayKey: string;
  hasStockInfo?: boolean;
  package_name?: string;
  package_id?: number;
  official_stock?: number;
  consignment_count?: number;
  total_available?: number;
  min_price?: number;
  max_price?: number;
  price_range?: string;
  consignment_list?: Array<{
    consignment_id: number;
    price: number;
    seller_id: number;
  }>;
}

interface UseTradingZoneParams {
  initialSessionId?: string;
  initialSessionTitle?: string;
  initialSessionStartTime?: string;
  initialSessionEndTime?: string;
}

export function useTradingZone({
  initialSessionId,
  initialSessionTitle,
  initialSessionStartTime,
  initialSessionEndTime,
}: UseTradingZoneParams) {
  const [sessions, setSessions] = useState<TradingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TradingSession | null>(null);
  const [tradingItems, setTradingItems] = useState<TradingDisplayItem[]>([]);
  const [activePriceZone, setActivePriceZone] = useState<string>('all');
  const [now, setNow] = useState(new Date());
  const [navigating, setNavigating] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Error states
  const [sessionErrorMessage, setSessionErrorMessage] = useState<string | null>(null);
  const [itemsErrorMessage, setItemsErrorMessage] = useState<string | null>(null);

  const hasSessionError = !!sessionErrorMessage;
  const hasItemsError = !!itemsErrorMessage;

  // Refs for tracking loading state
  const loadingSessionRef = useRef<string | null>(null);
  const sessionsLoadedRef = useRef(false);
  const sessionStatusesRef = useRef<Map<string, { status: 'active' | 'waiting' | 'ended'; target: Date | null }>>(new Map());

  // Load session items
  const loadSessionItems = useCallback(async (session: TradingSession) => {
    if (loadingSessionRef.current === session.id) {
      debugLog('useTradingZone', 'Session already loading, skipping', session.id);
      return;
    }

    try {
      loadingSessionRef.current = session.id;
      setItemsLoading(true);
      setItemsErrorMessage(null);

      const response = await fetchCollectionItemsBySession(session.id, { page: 1, limit: 100 });

      if (isSuccess(response) && response.data?.list) {
        const allItems = response.data.list.map((item: any) => {
          const hasConsignment = item.consignment_count > 0 || (item.consignment_list && item.consignment_list.length > 0);
          const hasOfficial = item.official_stock > 0 || item.stock > 0;

          let source: 'collection' | 'consignment' | 'mixed' = 'collection';
          if (hasConsignment && hasOfficial) {
            source = 'mixed';
          } else if (hasConsignment) {
            source = 'consignment';
          }

          const displayPrice = Number(item.price || item.min_price || 0);
          const totalAvailable = item.total_available ?? ((item.official_stock || 0) + (item.consignment_count || 0));

          return {
            ...item,
            price: displayPrice,
            stock: totalAvailable,
            official_stock: item.official_stock || item.stock || 0,
            consignment_count: item.consignment_count || 0,
            total_available: totalAvailable,
            package_name: item.package_name || item.title,
            title: item.package_name || item.title || `${item.price_zone}元区`,
            package_id: item.package_id,
            displayKey: `pkg-${item.zone_id || item.id}-${item.package_name || item.id}`,
            source,
            hasStockInfo: totalAvailable > 0
          } as TradingDisplayItem;
        });

        if (allItems.length > 0) {
          setTradingItems(allItems);
        } else {
          setItemsErrorMessage('暂无上链资产');
        }
      } else {
        setItemsErrorMessage('暂无上链资产');
      }

      setSelectedSession(session);
    } catch (err: any) {
      errorLog('useTradingZone', '加载专场商品失败:', err);
      setItemsErrorMessage('数据同步延迟，请重试');
      setSelectedSession(session);
    } finally {
      setItemsLoading(false);
      loadingSessionRef.current = null;
    }
  }, []);

  // Load sessions - only run once
  useEffect(() => {
    if (sessionsLoadedRef.current) return;

    const loadSessions = async () => {
      sessionsLoadedRef.current = true;
      setLoading(true);
      setSessionErrorMessage(null);

      try {
        const response = await fetchCollectionSessions();
        if (isSuccess(response) && response.data?.list) {
          const sessionList: TradingSession[] = response.data.list.map((item: CollectionSessionItem) => ({
            id: String(item.id),
            title: item.title,
            image: item.image,
            startTime: item.start_time,
            endTime: item.end_time,
            isActive: !!(item as any)?.is_active,
            ...(item as any),
          }));
          setSessions(sessionList);

          if (initialSessionId) {
            const matchedSession = sessionList.find(s => s.id === initialSessionId);
            if (matchedSession) {
              loadSessionItems(matchedSession);
            } else if (initialSessionTitle) {
              const tempSession: TradingSession = {
                id: initialSessionId,
                title: initialSessionTitle,
                image: '',
                startTime: initialSessionStartTime || '',
                endTime: initialSessionEndTime || '',
              };
              loadSessionItems(tempSession);
            }
          }
        } else {
          setSessionErrorMessage('获取数据资产池失败');
        }
      } catch (err: any) {
        errorLog('useTradingZone', '加载专场列表失败:', err);
        setSessionErrorMessage('网络连接异常');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [initialSessionId, initialSessionTitle, initialSessionStartTime, initialSessionEndTime, loadSessionItems]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      sessionStatusesRef.current.clear();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get session status
  const getSessionStatus = useCallback((session: TradingSession) => {
    const cached = sessionStatusesRef.current.get(session.id);
    if (cached) {
      return cached;
    }

    const [startH, startM] = session.startTime.split(':').map(Number);
    const [endH, endM] = session.endTime.split(':').map(Number);
    const startDate = new Date(now); startDate.setHours(startH, startM, 0, 0);
    const endDate = new Date(now); endDate.setHours(endH, endM, 0, 0);

    let status: 'active' | 'waiting' | 'ended';
    let target: Date | null = null;

    if (now >= endDate) {
      status = 'ended';
    } else if (session.isActive || (now >= startDate && now < endDate)) {
      status = 'active';
      target = endDate;
    } else if (now < startDate) {
      status = 'waiting';
      target = startDate;
    } else {
      status = 'ended';
    }

    const result = { status, target };
    sessionStatusesRef.current.set(session.id, result);
    return result;
  }, [now]);

  // Get price zones from items
  const priceZones = useMemo(() => {
    return ['all', ...Array.from(new Set(
      tradingItems
        .map(item => item.price_zone)
        .filter(zone => zone)
    ))] as string[];
  }, [tradingItems]);

  return {
    sessions,
    selectedSession,
    tradingItems,
    activePriceZone,
    loading,
    itemsLoading,
    hasSessionError,
    sessionErrorMessage,
    hasItemsError,
    itemsErrorMessage,
    navigating,
    priceZones,
    setSelectedSession,
    setTradingItems,
    setActivePriceZone,
    setNavigating,
    loadSessionItems,
    getSessionStatus,
  };
}
