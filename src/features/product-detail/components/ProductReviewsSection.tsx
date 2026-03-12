import { ChevronRight, RefreshCcw, Star } from 'lucide-react';
import type { ShopProductReviewSummary } from '../../../api/modules/shopProduct';
import { Skeleton } from '../../../components/ui/Skeleton';
import {
  getShopProductReviewImages,
  getShopProductReviewUser,
  resolveShopProductImageUrl,
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
      <div className="mt-2 bg-white px-4 py-6 text-center">
        <RefreshCcw size={22} className="mx-auto mb-2 text-text-aux" />
        <p className="mb-3 text-sm text-text-sub">评价摘要加载失败</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-[#e5e7eb] px-4 py-1.5 text-sm text-text-main"
        >
          重试
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-2 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="mt-4 space-y-2 border-t border-[#f1f1f1] pt-4">
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
  const summaryText =
    totalReviews > 0 && summary?.good_rate != null
      ? `好评率 ${summary.good_rate}% · 共 ${totalReviews} 条`
      : `暂无评价 · 共 ${totalReviews} 条`;

  return (
    <div className="mt-2 bg-white px-4 py-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left active:opacity-80"
        onClick={onOpenReviews}
      >
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-text-main">用户评价</h3>
          <p className="mt-1 text-xs text-text-sub">{summaryText}</p>
        </div>
        <span className="flex items-center text-sm text-text-sub">
          查看全部
          <ChevronRight size={14} />
        </span>
      </button>

      {preview ? (
        <div className="mt-4 border-t border-[#f1f1f1] pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={resolveShopProductImageUrl(preview.avatar)}
                alt={getShopProductReviewUser(preview)}
                className="h-7 w-7 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="text-sm text-text-main">{getShopProductReviewUser(preview)}</span>
              <div className="flex text-primary-start">
                {Array.from({ length: preview.rating ?? 5 }).map((_, index) => (
                  <Star key={index} size={10} fill="currentColor" />
                ))}
              </div>
            </div>
            <span className="text-xs text-text-aux">{preview.time || '--'}</span>
          </div>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-main">
            {preview.content || '该用户暂未填写评价内容'}
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
        <div className="mt-4 border-t border-[#f1f1f1] pt-4 text-sm text-text-sub">
          当前商品还没有公开评价。
        </div>
      )}

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-between border-t border-[#f1f1f1] pt-4 text-left active:opacity-80"
        onClick={onOpenQa}
      >
        <div>
          <h3 className="text-[15px] font-semibold text-text-main">商品问答</h3>
          <p className="mt-1 text-xs text-text-sub">查看商品相关咨询</p>
        </div>
        <span className="flex items-center text-sm text-text-sub">
          去提问
          <ChevronRight size={14} />
        </span>
      </button>
    </div>
  );
};
