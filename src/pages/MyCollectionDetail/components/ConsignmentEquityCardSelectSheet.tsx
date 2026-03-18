import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, CreditCard, X } from 'lucide-react';
import type { ConsignmentEquityCard } from '../../../api';
import { BottomSheet } from '../../../components/ui/BottomSheet';

interface ConsignmentEquityCardSelectSheetProps {
  cards: ConsignmentEquityCard[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: number[]) => void;
  recommendedId: number | null;
  selectedIds: number[];
}

const TEXT = {
  title: '\u9009\u62e9\u5bc4\u552e\u6743\u76ca\u5361',
  confirm: '\u786e\u5b9a',
  noCard: '\u6682\u4e0d\u4f7f\u7528\u6743\u76ca\u5361',
  fullFee: '\u672c\u6b21\u5168\u989d\u652f\u4ed8\u624b\u7eed\u8d39',
  recommended: '\u63a8\u8350',
  available: '\u4eca\u65e5\u53ef\u7528',
  usedToday: '\u4eca\u65e5\u5df2\u4f7f\u7528',
  deductible: '\u53ef\u62b5\u6263',
  expireSuffix: '\u5230\u671f',
};

function formatCurrency(value: number | string | undefined): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return '0.00';
  }

  return amount.toFixed(2);
}

export function ConsignmentEquityCardSelectSheet({
  cards,
  isOpen,
  onClose,
  onConfirm,
  recommendedId,
  selectedIds,
}: ConsignmentEquityCardSelectSheetProps) {
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedIds);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setLocalSelectedIds(selectedIds);
  }, [selectedIds, isOpen]);

  const totalDeduction = useMemo(() => {
    let sum = 0;
    for (const id of localSelectedIds) {
      const card = cards.find((c) => c.id === id);
      if (card) {
        sum += card.actual_deduct_amount;
      }
    }
    return sum;
  }, [cards, localSelectedIds]);

  const handleConfirm = () => {
    onConfirm(localSelectedIds);
    onClose();
  };

  const handleToggle = (id: number) => {
    setLocalSelectedIds((prev) => {
      if (prev.indexOf(id) >= 0) {
        return prev.filter((v) => v !== id);
      }
      return prev.concat(id);
    });
  };

  const handleClearAll = () => {
    setLocalSelectedIds([]);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={TEXT.title}
      zIndex={100}
      className="bg-bg-card sm:max-w-[430px]"
      headerLeft={null}
      headerRight={
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-text-sub active:bg-bg-hover"
        >
          <X size={20} />
        </button>
      }
      footer={
        <div className="px-4 py-3">
          {localSelectedIds.length > 0 ? (
            <div className="mb-2 text-center text-xs text-text-sub">
              {'\u5df2\u9009 '}{localSelectedIds.length}{' \u5f20\uff0c\u5408\u8ba1\u62b5\u6263 \u00a5'}{formatCurrency(totalDeduction)}
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8B0000] to-[#A00000] text-base font-medium text-amber-50 shadow-lg shadow-red-900/15 active:scale-[0.98]"
          >
            {TEXT.confirm}
          </button>
        </div>
      }
    >
      <div className="px-4 py-3 no-scrollbar">
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleClearAll}
            className={`flex w-full items-center rounded-[12px] border p-3 text-left transition-colors ${
              localSelectedIds.length === 0
                ? 'border-primary-start bg-red-50/50 dark:bg-red-900/10'
                : 'border-border-light bg-bg-card active:bg-bg-hover'
            }`}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-bg-base text-text-sub">
              <CreditCard size={18} />
            </div>
            <div className="min-w-0 flex-1 px-3">
              <div className="text-sm font-medium text-text-main">{TEXT.noCard}</div>
              <div className="mt-0.5 text-xs text-text-sub">{TEXT.fullFee}</div>
            </div>
            {localSelectedIds.length === 0 ? (
              <CheckCircle2 size={20} className="ml-2 shrink-0 text-primary-start" />
            ) : (
              <Circle size={20} className="ml-2 shrink-0 text-border-main" />
            )}
          </button>

          {cards.map((card) => {
            const isAvailable = card.today_remaining > 0;
            const isSelected = localSelectedIds.indexOf(card.id) >= 0;
            const isRecommended = recommendedId != null && recommendedId === card.id;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => isAvailable && handleToggle(card.id)}
                disabled={!isAvailable}
                className={`flex w-full items-center rounded-[12px] border p-3 text-left transition-colors ${
                  !isAvailable
                    ? 'cursor-not-allowed border-border-light bg-gray-100 opacity-60 dark:bg-gray-800'
                    : isSelected
                      ? 'border-primary-start bg-red-50/50 dark:bg-red-900/10'
                      : 'border-border-light bg-bg-card active:bg-bg-hover'
                }`}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-bg-base text-text-sub">
                  <CreditCard size={18} />
                </div>
                <div className="min-w-0 flex-1 px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-main">{card.card_name}</span>
                    {isRecommended ? (
                      <span className="rounded-full bg-primary-start/10 px-2 py-0.5 text-xs text-primary-start">
                        {TEXT.recommended}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {isAvailable ? TEXT.available : TEXT.usedToday}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-sub">
                    <span>
                      {TEXT.deductible} {'\u00a5'}{formatCurrency(card.actual_deduct_amount)}
                    </span>
                    <span>
                      {card.end_time_text || ''} {TEXT.expireSuffix}
                    </span>
                  </div>
                </div>
                {isSelected && isAvailable ? (
                  <CheckCircle2 size={20} className="ml-2 shrink-0 text-primary-start" />
                ) : (
                  <Circle
                    size={20}
                    className={`ml-2 shrink-0 ${!isAvailable ? 'text-gray-400 dark:text-gray-500' : 'text-border-main'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}
