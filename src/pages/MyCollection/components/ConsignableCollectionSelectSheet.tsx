/**
 * @file ConsignableCollectionSelectSheet.tsx
 * @description 可寄售藏品选择 Bottom Sheet，支持多选后批量提交寄售，支持下拉加载更多。
 */

import { useEffect, useRef, useState } from 'react';
import { Box, Check, ChevronRight, CreditCard, Loader2, X } from 'lucide-react';
import type { ConsignmentEquityCard } from '../../../api';
import { ConsignmentEquityCardSelectSheet } from '../../MyCollectionDetail/components/ConsignmentEquityCardSelectSheet';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

export interface ConsignableCollectionItem {
  user_collection_id: number;
  title: string;
  image: string | null;
  session_title?: string;
  zone_name?: string;
  buy_price?: number;
  consignment_price?: number;
  service_fee?: number;
  service_fee_rate?: number;
}

interface ConsignableCollectionSelectSheetProps {
  isOpen: boolean;
  items: ConsignableCollectionItem[];
  onClose: () => void;
  onConfirm: (selectedIds: number[], equityCardId: number | null) => void;
  stats?: {
    current_time?: string;
    active_sessions?: number;
    is_in_trading_time?: boolean;
  };
  /** 是否还有更多可加载 */
  hasMore?: boolean;
  /** 是否正在加载更多 */
  loadingMore?: boolean;
  /** 加载更多回调 */
  onLoadMore?: () => void | Promise<void>;
  /** 可寄售总数（分页时用于显示「已选 x / total 个」） */
  totalCount?: number;
  /** 可用权益卡列表 */
  equityCards?: ConsignmentEquityCard[];
  /** 推荐的权益卡 ID */
  recommendedEquityCardId?: number | null;
}

function formatCurrency(value: number | string | undefined): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '0.00';
  return amount.toFixed(2);
}

export function ConsignableCollectionSelectSheet({
  isOpen,
  items,
  onClose,
  onConfirm,
  stats,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  totalCount,
  equityCards = [],
  recommendedEquityCardId,
}: ConsignableCollectionSelectSheetProps) {
  const sheetScrollRef = useRef<HTMLDivElement | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<number>>(new Set());
  const [selectedEquityCardId, setSelectedEquityCardId] = useState<number | null>(null);
  const [equityCardSheetOpen, setEquityCardSheetOpen] = useState(false);

  const availableEquityCards = equityCards.filter((c) => c.today_remaining > 0);
  const selectedCard = equityCards.find((c) => c.id === selectedEquityCardId) ?? null;

  useEffect(() => {
    if (isOpen && items.length > 0) {
      setLocalSelectedIds(new Set(items.map((item) => item.user_collection_id)));
    }

    if (isOpen && recommendedEquityCardId != null && recommendedEquityCardId > 0) {
      const exists = equityCards.some((c) => c.id === recommendedEquityCardId && c.today_remaining > 0);
      if (exists) setSelectedEquityCardId(recommendedEquityCardId);
    }
  }, [isOpen, items, equityCards, recommendedEquityCardId]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return undefined;
    }

    setIsVisible(false);
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleConfirm = () => {
    const ids = Array.from(localSelectedIds);
    if (ids.length === 0) {
      return;
    }

    onConfirm(ids, selectedEquityCardId);
    handleClose();
  };

  const toggleSelect = (id: number) => {
    setLocalSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setLocalSelectedIds(new Set(items.map((item) => item.user_collection_id)));
  };

  const handleDeselectAll = () => {
    setLocalSelectedIds(new Set());
  };

  const selectedCount = localSelectedIds.size;
  const displayTotal = totalCount ?? items.length;

  useInfiniteScroll({
    disabled: !isOpen || !onLoadMore,
    hasMore,
    loading: loadingMore,
    onLoadMore: onLoadMore ?? (() => {}),
    rootRef: sheetScrollRef,
    targetRef: loadMoreTriggerRef,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      <div
        className={`relative mx-auto flex w-full max-h-[80vh] flex-col rounded-t-2xl bg-bg-card shadow-lg transition-transform duration-300 ease-out sm:max-w-[430px] ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border-main px-4 py-3.5">
          <h3 className="text-base font-semibold text-text-main">选择寄售藏品</h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1.5 text-text-sub active:bg-bg-hover"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-border-light px-4 py-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="rounded-full border border-border-light bg-bg-base px-3 py-1.5 text-xs font-medium text-text-main active:bg-bg-hover"
            >
              全选
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="rounded-full border border-border-light bg-bg-base px-3 py-1.5 text-xs font-medium text-text-main active:bg-bg-hover"
            >
              取消全选
            </button>
          </div>
          <span className="text-xs text-text-sub">
            已选 {selectedCount} / {displayTotal} 个
          </span>
        </div>

        <div ref={sheetScrollRef} className="flex-1 overflow-y-auto px-4 py-3 no-scrollbar">
          {items.length === 0 && !loadingMore ? (
            <div className="py-8 text-center text-sm text-text-sub">暂无可寄售的藏品</div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const isSelected = localSelectedIds.has(item.user_collection_id);
                return (
                  <button
                    key={item.user_collection_id}
                    type="button"
                    onClick={() => toggleSelect(item.user_collection_id)}
                    className={`relative flex w-full items-center gap-3 rounded-2xl border-2 p-3 pl-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-[#8B0000] border-l-[5px] border-l-[#8B0000] bg-[#fde8e8] shadow-lg shadow-red-900/20 ring-2 ring-red-500/40 dark:border-red-600 dark:border-l-red-600 dark:bg-red-950/50 dark:ring-red-500/50'
                        : 'border-transparent bg-bg-base active:bg-bg-hover'
                    }`}
                  >
                    {isSelected ? (
                      <span className="absolute top-2 right-2 z-10 rounded-full bg-[#8B0000] px-2.5 py-1 text-[11px] font-bold text-white shadow-md dark:bg-red-600">
                        ✓ 已选
                      </span>
                    ) : null}
                    <div
                      className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
                        isSelected
                          ? 'border-[#8B0000] bg-[#8B0000] text-white shadow-sm dark:border-red-600 dark:bg-red-600'
                          : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700'
                      }`}
                    >
                      {isSelected ? <Check size={18} strokeWidth={3} /> : null}
                    </div>
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-bg-base">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-text-aux">
                          <Box size={24} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-medium text-text-main">
                        {item.title || `藏品 #${item.user_collection_id}`}
                      </div>
                      {(item.session_title || item.zone_name) ? (
                        <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-text-sub">
                          {item.session_title ? (
                            <span className="rounded-full bg-bg-base px-2 py-0.5">{item.session_title}</span>
                          ) : null}
                          {item.zone_name ? (
                            <span className="rounded-full bg-bg-base px-2 py-0.5">{item.zone_name}</span>
                          ) : null}
                        </div>
                      ) : null}
                      {(item.consignment_price != null || item.service_fee != null) ? (
                        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-text-sub">
                          {item.consignment_price != null ? (
                            <span>寄售价 ¥{Number(item.consignment_price).toFixed(2)}</span>
                          ) : null}
                          {item.service_fee != null ? (
                            <span>服务费 ¥{Number(item.service_fee).toFixed(2)}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
              <div ref={loadMoreTriggerRef} className="py-4 text-center">
                {loadingMore ? (
                  <span className="inline-flex items-center gap-2 text-xs text-text-aux">
                    <Loader2 size={14} className="animate-spin" />
                    加载中...
                  </span>
                ) : hasMore ? (
                  <span className="text-xs text-text-aux">下滑加载更多</span>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border-main px-4 py-3 pb-safe">
          {availableEquityCards.length > 0 ? (
            <button
              type="button"
              onClick={() => setEquityCardSheetOpen(true)}
              className={`mb-3 flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all active:scale-[0.98] ${
                selectedCard
                  ? 'border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100 dark:border-emerald-500/50 dark:bg-emerald-950/30 dark:shadow-none'
                  : 'border-amber-400 bg-amber-50 shadow-md shadow-amber-100 dark:border-amber-500/50 dark:bg-amber-950/30 dark:shadow-none'
              }`}
            >
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                selectedCard
                  ? 'bg-emerald-500 text-white'
                  : 'animate-pulse bg-amber-500 text-white'
              }`}>
                <CreditCard size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {selectedCard ? '已选择权益卡' : '选择权益卡可抵扣手续费'}
                </div>
                <div className="mt-0.5 text-xs">
                  {selectedCard ? (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {selectedCard.card_name} · 每件抵扣 ¥{formatCurrency(selectedCard.actual_deduct_amount)}
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400">
                      有 {availableEquityCards.length} 张可用，点击选择
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className={selectedCard ? 'text-emerald-500' : 'text-amber-500'} />
            </button>
          ) : null}
          <div className="mb-2 text-center text-[11px] leading-5 text-text-aux">
            当前时间 {stats?.current_time || '--'}，活跃场次 {stats?.active_sessions ?? '--'}
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className={`flex h-11 w-full items-center justify-center rounded-full text-base font-medium transition-colors ${
              selectedCount > 0
                ? 'bg-gradient-to-r from-[#8B0000] to-[#A00000] text-amber-50 shadow-lg shadow-red-900/15 active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
            }`}
          >
            确认寄售 {selectedCount > 0 ? `（${selectedCount} 个）` : ''}
          </button>
        </div>
      </div>

      <ConsignmentEquityCardSelectSheet
        cards={equityCards}
        isOpen={equityCardSheetOpen}
        onClose={() => setEquityCardSheetOpen(false)}
        onConfirm={(id) => setSelectedEquityCardId(id)}
        recommendedId={recommendedEquityCardId ?? null}
        selectedId={selectedEquityCardId}
      />
    </div>
  );
}
