/**
 * 应用全局状态管理 Store
 */
import { create } from 'zustand';
import type { Tab, Product, NewsItem } from '@/types';
import type { MyCollectionItem } from '@/services';

/**
 * 市场页缓存状态
 * 用于保存列表页状态，实现返回时恢复滚动位置和数据
 */
export interface MarketCache {
  products: Product[];
  page: number;
  hasMore: boolean;
  scrollTop: number;
  activeFilter: string;
  selectedCategory: string;
  searchQuery: string;
  categoryList: string[];
  timestamp: number; // 缓存时间，用于过期判断
}

// 缓存过期时间：5 分钟
export const MARKET_CACHE_TTL = 5 * 60 * 1000;

/**
 * 通用列表页缓存接口
 * 用于我的藏品、资产历史、申购记录等列表页
 */
export interface ListPageCache<T = any> {
  data: T[];
  page: number;
  hasMore: boolean;
  scrollTop: number;
  filters?: Record<string, any>; // 筛选条件
  activeTab?: string;            // 标签页状态
  timestamp: number;
}

// 缓存 key 类型
export type ListCacheKey = 'myCollection' | 'assetHistory' | 'reservationRecord' | 'assetView';

interface AppState {
  // Tab 状态
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;

  // 商品选择状态
  selectedProduct: Product | null;
  productDetailOrigin: 'market' | 'artist' | 'trading-zone' | 'reservation-record';
  setSelectedProduct: (
    product: Product | null,
    origin?: 'market' | 'artist' | 'trading-zone' | 'reservation-record'
  ) => void;
  clearSelectedProduct: () => void;

  // 藏品选择状态
  selectedCollectionItem: MyCollectionItem | null;
  setSelectedCollectionItem: (item: MyCollectionItem | null) => void;

  // 新闻/公告状态
  newsList: NewsItem[];
  setNewsList: (list: NewsItem[]) => void;
  markNewsRead: (id: string) => void;
  markAllNewsRead: () => void;
  unreadNewsCount: number;

  // 额外未读消息数
  extraUnreadCount: number;
  setExtraUnreadCount: (count: number) => void;

  // 弹窗公告
  popupQueue: any[];
  setPopupQueue: (queue: any[]) => void;
  showPopupAnnouncement: boolean;
  setShowPopupAnnouncement: (show: boolean) => void;

  // 市场页缓存状态
  marketCache: MarketCache | null;
  setMarketCache: (cache: MarketCache) => void;
  clearMarketCache: () => void;

  // 通用列表页缓存状态
  listCaches: Partial<Record<ListCacheKey, ListPageCache | null>>;
  setListCache: (key: ListCacheKey, cache: ListPageCache) => void;
  clearListCache: (key: ListCacheKey) => void;
  clearAllListCaches: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Tab 状态
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // 商品选择状态
  selectedProduct: null,
  productDetailOrigin: 'market',
  setSelectedProduct: (product, origin = 'market') =>
    set({ selectedProduct: product, productDetailOrigin: origin }),
  clearSelectedProduct: () => set({ selectedProduct: null, productDetailOrigin: 'market' }),

  // 藏品选择状态
  selectedCollectionItem: null,
  setSelectedCollectionItem: (item) => set({ selectedCollectionItem: item }),

  // 新闻/公告状态
  newsList: [],
  setNewsList: (list) =>
    set({
      newsList: list,
      unreadNewsCount: list.filter((n) => n.isUnread).length,
    }),
  markNewsRead: (id) =>
    set((state) => {
      const newList = state.newsList.map((item) =>
        item.id === id ? { ...item, isUnread: false } : item
      );
      return {
        newsList: newList,
        unreadNewsCount: newList.filter((n) => n.isUnread).length,
      };
    }),
  markAllNewsRead: () =>
    set((state) => ({
      newsList: state.newsList.map((item) => ({ ...item, isUnread: false })),
      unreadNewsCount: 0,
    })),
  unreadNewsCount: 0,

  // 额外未读消息数
  extraUnreadCount: 0,
  setExtraUnreadCount: (count) => set({ extraUnreadCount: count }),

  // 弹窗公告
  popupQueue: [],
  setPopupQueue: (queue) => set({ popupQueue: queue }),
  showPopupAnnouncement: false,
  setShowPopupAnnouncement: (show) => set({ showPopupAnnouncement: show }),

  // 市场页缓存状态
  marketCache: null,
  setMarketCache: (cache) => set({ marketCache: cache }),
  clearMarketCache: () => set({ marketCache: null }),

  // 通用列表页缓存状态
  listCaches: {},
  setListCache: (key, cache) => set((state) => ({
    listCaches: { ...state.listCaches, [key]: cache }
  })),
  clearListCache: (key) => set((state) => ({
    listCaches: { ...state.listCaches, [key]: null }
  })),
  clearAllListCaches: () => set({ listCaches: {} }),
}));

// 选择器 hooks
export const useActiveTab = () => useAppStore((state) => state.activeTab);
export const useSelectedProduct = () => useAppStore((state) => state.selectedProduct);
export const useNewsList = () => useAppStore((state) => state.newsList);
export const useUnreadNewsCount = () => useAppStore((state) => state.unreadNewsCount);
export const useMarketCache = () => useAppStore((state) => state.marketCache);
export const useListCache = (key: ListCacheKey) => useAppStore((state) => state.listCaches[key]);
