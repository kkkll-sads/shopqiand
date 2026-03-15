import { useEffect, useState } from 'react';
import { Check, CreditCard, X } from 'lucide-react';
import type { ConsignmentEquityCard } from '../../../api';

interface ConsignmentEquityCardSelectSheetProps {
  cards: ConsignmentEquityCard[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedId: number | null) => void;
  recommendedId: number | null;
  selectedId: number | null;
}

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
  selectedId,
}: ConsignmentEquityCardSelectSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [localSelectedId, setLocalSelectedId] = useState<number | null>(selectedId);

  useEffect(() => {
    setLocalSelectedId(selectedId);
  }, [selectedId, isOpen]);

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
    onConfirm(localSelectedId);
    handleClose();
  };

  const handleSelect = (id: number | null) => {
    setLocalSelectedId(id);
  };

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
          <h3 className="text-base font-semibold text-text-main">选择寄售权益卡</h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1.5 text-text-sub active:bg-bg-hover"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 no-scrollbar">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${
                localSelectedId === null
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent bg-bg-base active:bg-bg-hover'
              }`}
            >
              <div
                className={`relative z-10 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                  localSelectedId === null
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700'
                }`}
              >
                {localSelectedId === null ? <Check size={14} strokeWidth={3} /> : null}
              </div>
              <CreditCard size={20} className="shrink-0 text-text-sub" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-text-main">暂不使用权益卡</div>
                <div className="mt-0.5 text-xs text-text-sub">本次全额支付手续费</div>
              </div>
            </button>

            {cards.map((card) => {
              const isAvailable = card.today_remaining > 0;
              const isSelected = localSelectedId === card.id;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => isAvailable && handleSelect(card.id)}
                  disabled={!isAvailable}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${
                    !isAvailable
                      ? 'cursor-not-allowed border-transparent bg-gray-100 opacity-60 dark:bg-gray-800'
                      : isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent bg-bg-base active:bg-bg-hover'
                  }`}
                >
                  <div
                    className={`relative z-10 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      !isAvailable
                        ? 'border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-gray-700'
                        : isSelected
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700'
                    }`}
                  >
                    {isSelected && isAvailable ? <Check size={14} strokeWidth={3} /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-main">{card.card_name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          isAvailable
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {isAvailable ? '今日可用' : '今日已使用'}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-sub">
                      <span>可抵扣 ¥{formatCurrency(card.actual_deduct_amount)}</span>
                      <span>{card.end_time_text || ''} 到期</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-border-main px-4 py-3 pb-safe">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8B0000] to-[#A00000] text-base font-medium text-amber-50 shadow-lg shadow-red-900/15 active:scale-[0.98]"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
