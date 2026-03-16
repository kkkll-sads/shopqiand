import { useEffect, useRef } from 'react';
import { Check, Loader2, X, Zap } from 'lucide-react';
import type { BindableMiningItem, MembershipCardProduct } from '../../../api';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';

interface MiningSelectionSheetProps {
  isOpen: boolean;
  buying: boolean;
  hasMore: boolean;
  list: BindableMiningItem[];
  loading: boolean;
  loadingMore: boolean;
  onBuy: () => void;
  onClose: () => void;
  onLoadMore: () => void;
  onSelect: (id: number | null) => void;
  product: MembershipCardProduct | null;
  selectedId: number | null;
  formatMoney: (value: number | string | undefined, fractionDigits?: number) => string;
}

export function MiningSelectionSheet({
  isOpen,
  buying,
  hasMore,
  list,
  loading,
  loadingMore,
  onBuy,
  onClose,
  onLoadMore,
  onSelect,
  product,
  selectedId,
  formatMoney,
}: MiningSelectionSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const el = scrollRef.current;
    if (!el || !hasMore || loadingMore) return;

    const handleScroll = () => {
      const threshold = 80;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
        onLoadMore();
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isOpen, hasMore, loadingMore, onLoadMore]);

  const handleClose = () => {
    if (buying) return;
    onClose();
  };

  const toggleSelect = (id: number) => {
    onSelect(selectedId === id ? null : id);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="选择绑定矿机"
      zIndex={100}
      className="bg-bg-card sm:max-w-[430px]"
      maskClosable={!buying}
      draggable={!buying}
      headerLeft={null}
      headerRight={
        <button
          type="button"
          onClick={handleClose}
          disabled={buying}
          className="rounded-full p-1.5 text-text-sub active:bg-bg-hover"
        >
          <X size={20} />
        </button>
      }
      footer={!loading && list.length > 0 ? (
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={onBuy}
            disabled={selectedId === null || buying}
            className={`flex h-11 w-full items-center justify-center rounded-full text-base font-medium transition-colors ${
              selectedId !== null && !buying
                ? 'gradient-primary-r text-white'
                : 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            }`}
          >
            {buying ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                购买中...
              </>
            ) : selectedId === null ? (
              '请选择矿机'
            ) : (
              '确认购买'
            )}
          </button>
        </div>
      ) : null}
    >
      <div className="border-b border-border-main px-4 py-2 text-xs text-text-sub">
        {product ? `${product.name} · ¥${formatMoney(product.price)}` : '请选择一个可绑定矿机'}
      </div>

      <div ref={scrollRef} className="h-full overflow-y-auto no-scrollbar px-4 py-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-bg-base p-3">
                <Skeleton className="size-14 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !list.length ? (
          <EmptyState
            icon={<Zap size={48} />}
            message="暂无可绑定的矿机"
            actionText="关闭"
            onAction={handleClose}
          />
        ) : (
          <div className="space-y-2">
            {list.map((item) => {
              const isSelected = selectedId === item.userCollectionId;
              return (
                <button
                  key={item.userCollectionId}
                  type="button"
                  onClick={() => toggleSelect(item.userCollectionId)}
                  disabled={buying}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent bg-bg-base active:bg-bg-hover'
                  }`}
                >
                  <div className={`relative z-10 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700'
                  }`}>
                    {isSelected ? <Check size={14} strokeWidth={3} /> : null}
                  </div>
                  {item.image ? (
                    <img src={item.image} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                      <Zap size={20} className="text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-text-main">{item.title}</div>
                    <div className="mt-1 text-xs text-text-sub">买入价 ¥{formatMoney(item.price)}</div>
                  </div>
                </button>
              );
            })}
            {loadingMore ? (
              <div className="flex items-center justify-center py-3 text-text-sub">
                <Loader2 size={18} className="mr-2 animate-spin" />
                <span className="text-xs">加载更多...</span>
              </div>
            ) : !hasMore && list.length > 0 ? (
              <div className="py-3 text-center text-xs text-text-sub">已加载全部</div>
            ) : null}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
