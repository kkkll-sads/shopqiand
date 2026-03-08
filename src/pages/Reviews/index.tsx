import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, RefreshCcw, Star, ThumbsUp, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  shopProductApi,
  type ShopProductReview,
  type ShopProductReviewListResponse,
  type ShopProductReviewSummary,
} from '../../api';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  getShopProductReviewImages,
  getShopProductReviewUser,
  resolveShopProductImageUrl,
} from '../../features/shop-product/utils';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';

const EMPTY_SUMMARY: ShopProductReviewSummary = {
  follow_up_count: 0,
  good_rate: 100,
  preview: [],
  total: 0,
  with_media_count: 0,
};

const EMPTY_REVIEW_LIST: ShopProductReviewListResponse = {
  good_rate: 100,
  limit: 10,
  list: [],
  page: 1,
  stats: {
    all: 0,
    follow_up: 0,
    with_media: 0,
  },
  total: 0,
};

const REVIEW_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'with_media', label: '有图/视频' },
  { id: 'follow_up', label: '追评' },
] as const;

type ReviewFilter = (typeof REVIEW_FILTERS)[number]['id'];

function renderStars(rating: number, size = 14) {
  return (
    <div className="flex items-center space-x-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          className={
            index < rating
              ? 'fill-primary-start text-primary-start'
              : 'fill-border-light text-border-main'
          }
        />
      ))}
    </div>
  );
}

export function ReviewsPage() {
  const params = useParams();
  const { goBack } = useAppNavigate();
  const { isOffline, refreshStatus } = useNetworkStatus();

  const routeProductId = Number(params.id);
  const hasValidProductId = Number.isFinite(routeProductId) && routeProductId > 0;

  const [activeFilter, setActiveFilter] = useSessionState<ReviewFilter>(
    `reviews:${hasValidProductId ? routeProductId : 'invalid'}:filter`,
    'all',
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ShopProductReview[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const summaryRequest = useRequest(
    (signal) =>
      hasValidProductId
        ? shopProductApi.reviewSummary(routeProductId, signal)
        : Promise.resolve(EMPTY_SUMMARY),
    {
      cacheKey: `reviews:summary:${routeProductId}`,
      deps: [hasValidProductId, routeProductId],
      initialData: EMPTY_SUMMARY,
      keepPreviousData: true,
    },
  );

  const listRequest = useRequest(
    (signal) =>
      hasValidProductId
        ? shopProductApi.reviews(
            {
              filter: activeFilter,
              limit: 10,
              page: 1,
              product_id: routeProductId,
            },
            signal,
          )
        : Promise.resolve(EMPTY_REVIEW_LIST),
    {
      cacheKey: `reviews:list:${routeProductId}:${activeFilter}`,
      deps: [activeFilter, hasValidProductId, routeProductId],
      initialData: EMPTY_REVIEW_LIST,
      keepPreviousData: true,
    },
  );

  useEffect(() => {
    const nextReviews = listRequest.data?.list ?? [];
    setReviews(nextReviews);
    setPage(1);
    setHasMore(nextReviews.length < (listRequest.data?.total ?? 0));
  }, [listRequest.data]);

  const tagItems = useMemo(
    () => [
      { label: '全部', count: summaryRequest.data?.total ?? 0 },
      { label: '有图/视频', count: summaryRequest.data?.with_media_count ?? 0 },
      { label: '追评', count: summaryRequest.data?.follow_up_count ?? 0 },
    ],
    [summaryRequest.data],
  );

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: !previewImage,
    namespace: `reviews:${hasValidProductId ? routeProductId : 'invalid'}:${activeFilter}`,
    restoreDeps: [activeFilter, hasMore, listRequest.loading, reviews.length],
    restoreWhen: !previewImage && !listRequest.loading,
  });

  const loadMore = async () => {
    if (!hasValidProductId || loadingMore || !hasMore) {
      return;
    }

    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const response = await shopProductApi.reviews({
        filter: activeFilter,
        limit: 10,
        page: nextPage,
        product_id: routeProductId,
      });

      const nextReviews = [...reviews, ...response.list];
      setReviews(nextReviews);
      setPage(nextPage);
      setHasMore(nextReviews.length < response.total);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-4 p-4">
      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-6 w-24 rounded-full" />
          ))}
        </div>
      </Card>
      <div className="flex space-x-4 px-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-6 w-20" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="space-y-3 p-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="flex space-x-2">
            <Skeleton className="h-20 w-20 rounded-lg" />
            <Skeleton className="h-20 w-20 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );

  const renderContent = () => {
    if (!hasValidProductId) {
      return <EmptyState message="无效的商品评价页" />;
    }

    if (listRequest.loading && reviews.length === 0) {
      return renderSkeleton();
    }

    if (listRequest.error && reviews.length === 0) {
      return (
        <ErrorState
          message="商品评价加载失败"
          onRetry={() => {
            void Promise.allSettled([summaryRequest.reload(), listRequest.reload()]);
          }}
        />
      );
    }

    return (
      <div className="pb-safe">
        <Card className="m-4 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-base font-medium text-text-main">好评率</span>
              <span className="text-6xl font-bold text-primary-start">
                {summaryRequest.data?.good_rate ?? 100}%
              </span>
            </div>
            <div className="flex flex-col items-end">
              <div className="mb-1 flex items-center space-x-1">
                <span className="text-sm text-text-sub">综合评分</span>
                {renderStars(Math.max(1, Math.min(5, Math.round((summaryRequest.data?.good_rate ?? 100) / 20))), 12)}
              </div>
              <span className="text-s text-text-aux">
                {summaryRequest.data?.total ?? 0} 条评价
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {tagItems.map((tag) => (
              <div key={tag.label} className="rounded-full bg-red-50 px-2.5 py-1 text-s text-text-main">
                {tag.label} <span className="text-text-aux">{tag.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="sticky top-11 z-10 flex overflow-x-auto border-b border-border-light bg-bg-base/95 px-4 py-2 backdrop-blur">
          {REVIEW_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`mr-6 whitespace-nowrap px-1 py-1 text-base ${
                activeFilter === filter.id
                  ? 'border-b-2 border-primary-start font-bold text-text-main'
                  : 'text-text-sub'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {reviews.length === 0 ? (
          <EmptyState message="当前筛选下暂无评价" />
        ) : (
          <div className="mt-2 space-y-2">
            {reviews.map((review) => {
              const images = getShopProductReviewImages(review);
              return (
                <Card key={review.id} className="mx-4 rounded-xl p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={resolveShopProductImageUrl(review.avatar)}
                        alt={getShopProductReviewUser(review)}
                        className="h-8 w-8 rounded-full bg-border-light object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-medium text-text-main">
                            {getShopProductReviewUser(review)}
                          </span>
                          {renderStars(review.rating ?? 5, 10)}
                        </div>
                        <span className="text-s text-text-aux">{review.time || '--'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-md leading-relaxed text-text-main">
                      {review.content || '该用户未填写文字评价。'}
                    </p>
                  </div>

                  {review.purchase_info && (
                    <div className="mb-3 text-s text-text-aux">{review.purchase_info}</div>
                  )}

                  {images.length > 0 && (
                    <div className="mb-3 grid grid-cols-3 gap-1.5">
                      {images.map((image) => (
                        <button
                          key={image}
                          type="button"
                          className="aspect-square overflow-hidden rounded-lg bg-border-light"
                          onClick={() => setPreviewImage(image)}
                        >
                          <img
                            src={image}
                            alt="review"
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {review.follow_up?.content && (
                    <div className="mb-3 rounded-xl bg-bg-base p-3">
                      <div className="mb-1 text-xs font-medium text-primary-start">追评</div>
                      <p className="text-sm text-text-main">{review.follow_up.content}</p>
                    </div>
                  )}

                  {review.reply_content && (
                    <div className="mb-3 rounded-xl bg-bg-base p-3">
                      <div className="mb-1 text-xs font-medium text-primary-start">商家回复</div>
                      <p className="text-sm text-text-main">{review.reply_content}</p>
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between">
                    <span className="line-clamp-1 flex-1 pr-4 text-s text-text-aux">
                      {review.level || review.member_tag || '普通会员'}
                    </span>
                    <div className="flex items-center space-x-4 text-text-sub">
                      <span className="flex items-center space-x-1 text-sm">
                        <MessageCircle size={14} />
                        <span>{review.has_reply ? '已回复' : '评价'}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-sm">
                        <ThumbsUp size={14} />
                        <span>{review.likes ?? 0}</span>
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {reviews.length > 0 &&
          (hasMore ? (
            <div
              className="flex cursor-pointer items-center justify-center py-6 text-sm text-text-sub"
              onClick={loadMore}
            >
              {loadingMore ? (
                <span className="flex items-center">
                  <RefreshCcw size={14} className="mr-2 animate-spin" />
                  加载中...
                </span>
              ) : (
                '点击加载更多'
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-text-aux">没有更多评价了</div>
          ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      {isOffline && <OfflineBanner onAction={refreshStatus} center />}

      <PageHeader
        title="评价"
        onBack={goBack}
        className="sticky top-0 z-40 border-b border-border-light bg-bg-base/95 backdrop-blur"
        contentClassName="h-11 px-4"
        titleClassName="text-xl font-medium text-text-main"
        backButtonClassName="rounded-full text-text-main active:bg-border-light"
      />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-md">图片预览</span>
            <button onClick={() => setPreviewImage(null)} className="p-2">
              <X size={24} />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            <img
              src={previewImage}
              alt="preview"
              className="max-h-full max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
