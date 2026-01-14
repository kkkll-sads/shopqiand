/**
 * 应用全局状态管理 Store
 */
import { create } from 'zustand';
import type { Tab, Product, NewsItem } from '../../types';
import type { MyCollectionItem } from '../../services/api';

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
}));

// 选择器 hooks
export const useActiveTab = () => useAppStore((state) => state.activeTab);
export const useSelectedProduct = () => useAppStore((state) => state.selectedProduct);
export const useNewsList = () => useAppStore((state) => state.newsList);
export const useUnreadNewsCount = () => useAppStore((state) => state.unreadNewsCount);
