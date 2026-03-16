import React from 'react';
import { X } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { BottomSheet } from '../ui/BottomSheet';

interface ReservationAgreementDialogProps {
  isOpen: boolean;
  title: string;
  content: string;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onRetry?: () => void;
}

function hasHtmlMarkup(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export const ReservationAgreementDialog: React.FC<ReservationAgreementDialogProps> = ({
  isOpen,
  title,
  content,
  loading = false,
  error = '',
  onClose,
  onRetry,
}) => {
  const renderBody = () => {
    if (loading) {
      return (
        <div className="space-y-4 p-4">
          <Skeleton className="h-6 w-1/2 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-xl" />
          <Skeleton className="h-4 w-full rounded-xl" />
          <Skeleton className="h-4 w-4/5 rounded-xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="px-4 py-10">
          <ErrorState message={error} onRetry={onRetry} />
        </div>
      );
    }

    if (!content.trim()) {
      return (
        <div className="px-4 py-10">
          <EmptyState message="暂无内容" />
        </div>
      );
    }

    if (hasHtmlMarkup(content)) {
      return (
        <div
          className="text-sm leading-7 text-text-main [&_a]:break-all [&_a]:text-primary-start [&_img]:mx-auto [&_img]:max-w-full [&_p]:mb-4 [&_table]:w-full [&_td]:border [&_td]:border-border-light [&_td]:p-2 [&_th]:border [&_th]:border-border-light [&_th]:p-2 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    return <div className="whitespace-pre-wrap text-sm leading-7 text-text-main">{content}</div>;
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      zIndex={80}
      maxHeight="82vh"
      className="sm:max-w-[560px] sm:rounded-[28px]"
      headerLeft={null}
      headerRight={
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-base text-text-sub transition-colors active:bg-border-light dark:bg-white/5 dark:text-white/70"
          aria-label="关闭"
        >
          <X size={18} />
        </button>
      }
      footer={
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="h-[46px] w-full rounded-full gradient-primary-r text-base font-bold text-white transition-opacity active:opacity-80"
          >
            我已知晓
          </button>
        </div>
      }
    >
      <div className="px-4 py-4">{renderBody()}</div>
    </BottomSheet>
  );
};
