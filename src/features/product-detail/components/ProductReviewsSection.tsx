import { ChevronRight, RefreshCcw, Star } from 'lucide-react';
import type { ShopProductReviewSummary } from '../../../api/modules/shopProduct';
import { Skeleton } from '../../../components/ui/Skeleton';
import {
  getShopProductReviewImages,
  getShopProductReviewUser,
  resolveShopProductReviewAvatarUrl,
} from '../../shop-product/utils';

interface ProductReviewsSectionProps {
  loading: boolean;
  moduleError: boolean;
  onOpenQa: () => void;
  onOpenReviews: () => void;
  onRetry: () => void;
  summary: ShopProductReviewSummary | null;
}

export const ProductReviewsSection = ({
  loading,
  moduleError,
  onOpenQa,
  onOpenReviews,
  onRetry,
  summary,
}: ProductReviewsSectionProps) => {
  if (moduleError) {
    return (
      <div className="mx-4 mt-4 rounded-2xl border border-border-light bg-white px-4 py-6 text-center">
        <RefreshCcw size={22} className="mx-auto mb-2 text-text-aux" />
        <p className="mb-3 text-sm text-text-sub">评价加载失败</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-border-light px-4 py-1.5 text-sm text-text-main"
        >
          重试
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-4 mt-4 rounded-2xl border border-border-light bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="mt-4 space-y-2 border-t border-border-light pt-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  const preview = summary?.preview?.[0];
  const previewImages = preview ? getShopProductReviewImages(preview) : [];
  const totalReviews = summary?.total ?? 0;
  const goodRate = summary?.good_rate;
  const summaryText =
    totalReviews > 0 && typeof goodRate === 'number'
      ? `好评率 ${goodRate}% · 共 ${totalReviews} 条`
      : `共 ${totalReviews} 条评价`;

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-border-light bg-white px-4 py-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left active:opacity-80"
        onClick={onOpenReviews}
      >
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-text-main">用户评价</h3>
          <p className="mt-1 text-xs text-text-sub">{summaryText}</p>
        </div>
        <span className="flex items-center text-sm text-text-sub">
          查看全部
          <ChevronRight size={14} />
        </span>
      </button>

      {preview ? (
        <div className="mt-4 border-t border-border-light pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <img
                src={resolveShopProductReviewAvatarUrl(preview.avatar)}
                alt={getShopProductReviewUser(preview)}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
                onError={(event) => {
                  const target = event.currentTarget;
                  target.onerror = null;
                  target.src = '/favicon.png';
                }}
              />
              <span className="line-clamp-1 text-sm text-text-main">{getShopProductReviewUser(preview)}</span>
              <div className="flex shrink-0 text-primary-start">
                {Array.from({ length: Math.max(1, Math.min(preview.rating ?? 5, 5)) }).map((_, index) => (
                  <Star key={index} size={10} fill="currentColor" />
                ))}
              </div>
            </div>
            <span className="shrink-0 text-xs text-text-aux">{preview.time || '--'}</span>
          </div>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-main">
            {preview.content || '该用户未填写评价内容'}
          </p>

          {preview.purchase_info ? (
            <div className="mt-2 text-xs text-text-sub">{preview.purchase_info}</div>
          ) : null}

          {previewImages.length > 0 ? (
            <div className="mt-3 flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden no-scrollbar overscroll-x-contain">
              {previewImages.map((image) => (
                <img
                  key={image}
                  src={image}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 border-t border-border-light pt-4 text-sm text-text-sub">暂无公开评价</div>
      )}

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-between border-t border-border-light pt-4 text-left active:opacity-80"
        onClick={onOpenQa}
      >
        <div>
          <h3 className="text-sm font-bold text-text-main">问大家</h3>
          <p className="mt-1 text-xs text-text-sub">查看商品相关问答</p>
        </div>
        <span className="flex items-center text-sm text-text-sub">
          去提问
          <ChevronRight size={14} />
        </span>
      </button>
    </div>
  );
};
