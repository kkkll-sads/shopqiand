/**
 * ReviewsPage - 商品评价页面
 * 
 * 展示商品的全部买家评价，参考京东评价页设计
 * 支持筛选标签：全部、图/视频、追评
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, ThumbsUp, MessageSquare, ChevronDown, Play, Share2, MoreHorizontal, X } from 'lucide-react';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { LoadingSpinner } from '@/components/common';
import { fetchProductReviews, ReviewItem, ReviewListData } from '@/services/shop';
import { isSuccess, extractData, extractError } from '@/utils/apiHelpers';
import { formatDateShort } from '@/utils/format';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import EmptyState from '@/components/common/EmptyState';
import { errorLog } from '@/utils/logger';
import { normalizeUrl } from '@/utils/url';

const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const productName = searchParams.get('name') || '商品';

  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'with_media' | 'follow_up'>('all');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewStats, setReviewStats] = useState<{ all: number; with_media: number; follow_up: number } | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [goodRate, setGoodRate] = useState<number>(0);

  const { handleError, errorMessage, hasError, clearError } = useErrorHandler();

  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });
  const loading = loadMachine.state === LoadingState.LOADING;

  // 加载评价数据
  useEffect(() => {
    if (!productId) return;

    const loadReviews = async () => {
      try {
        loadMachine.send(LoadingEvent.LOAD);
        clearError();

        const response = await fetchProductReviews({
          product_id: productId,
          page,
          limit: 20,
          filter: activeFilter === 'all' ? undefined : activeFilter,
        });

        if (isSuccess(response) && response.data) {
          const data = response.data as ReviewListData;
          if (page === 1) {
            setReviews(data.list || []);
          } else {
            setReviews(prev => [...prev, ...(data.list || [])]);
          }
          setReviewStats(data.stats || null);
          setGoodRate(data.good_rate || 0);
          setHasMore((data.list || []).length >= 20);
          loadMachine.send(LoadingEvent.SUCCESS);
        } else {
          handleError(response, {
            persist: true,
            showToast: false,
            customMessage: '加载评价失败',
          });
          loadMachine.send(LoadingEvent.ERROR);
        }
      } catch (err: any) {
        errorLog('ReviewsPage', '加载评价失败', err);
        handleError(err, {
          persist: true,
          showToast: false,
          customMessage: '网络错误，请重试',
        });
        loadMachine.send(LoadingEvent.ERROR);
      }
    };

    loadReviews();
  }, [productId, activeFilter, page]);

  // 筛选标签（使用真实统计数据）
  const filterTags = [
    {
      key: 'all' as const,
      label: '全部',
      suffix: reviewStats ? `${goodRate}%好评` : undefined,
      count: reviewStats ? `${reviewStats.all}+` : undefined,
    },
    {
      key: 'with_media' as const,
      label: '图/视频',
      count: reviewStats ? `${reviewStats.with_media}+` : undefined,
    },
    {
      key: 'follow_up' as const,
      label: '追评',
      count: reviewStats ? `${reviewStats.follow_up}+` : undefined,
    },
  ];

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return formatDateShort(date);
  };

  // 根据筛选条件过滤评论（前端筛选已由后端处理，这里保留以防万一）
  const filteredReviews = reviews;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 -ml-1"
          >
            <ArrowLeft size={22} className="text-gray-700" />
          </button>
          <span className="text-base font-medium text-gray-800">评价</span>
          <div className="w-[22px]" />
        </div>

        {/* 筛选标签栏 */}
        <div className="flex items-center gap-3 px-4 py-2 overflow-x-auto border-b border-gray-100" style={{ scrollbarWidth: 'none' }}>
          {filterTags.map(tag => (
            <button
              key={tag.key}
              onClick={() => setActiveFilter(tag.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${activeFilter === tag.key
                ? 'bg-red-50 text-red-500 border border-red-200'
                : 'bg-gray-50 text-gray-600 border border-transparent'
                }`}
            >
              {tag.label}
              {tag.suffix && <span className="ml-1 text-red-500">{tag.suffix}</span>}
              {tag.count && <span className="ml-1 text-gray-400">{tag.count}</span>}
            </button>
          ))}
        </div>
      </header >

      {/* 评论列表 */}
      {
        loading && reviews.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : hasError ? (
          <div className="py-16">
            <EmptyState
              title="加载失败"
              description={errorMessage || '无法加载评价数据'}
              action={{
                label: '重试',
                onClick: () => {
                  clearError();
                  loadMachine.send(LoadingEvent.RETRY);
                },
              }}
            />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-16">
            <EmptyState
              title="暂无评价"
              description="快来成为第一个评价的用户吧~"
            />
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {filteredReviews.map(review => (
                <div key={review.id} className="bg-white px-4 py-4">
                  {/* 用户信息 */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {(review.user_name || '匿名').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800">{review.user_name || '匿名用户'}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {review.rating >= 4 && (
                          <span className="text-[10px] text-red-500 bg-red-50 px-1 py-0.5 rounded">超赞</span>
                        )}
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={10}
                              className={star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(review.create_time)}</span>
                  </div>

                  {/* 评论内容 */}
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {review.content}
                  </p>

                  {/* 追评 */}
                  {review.follow_up_content && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">追评：</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.follow_up_content}</p>
                      {review.follow_up_time && (
                        <span className="text-xs text-gray-400 mt-1 block">{formatTime(review.follow_up_time)}</span>
                      )}
                    </div>
                  )}

                  {/* 商家回复 */}
                  {review.has_reply && review.reply_content && (
                    <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">商家回复：</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{review.reply_content}</p>
                      {review.reply_time && (
                        <span className="text-xs text-gray-400 mt-1 block">{formatTime(review.reply_time)}</span>
                      )}
                    </div>
                  )}

                  {/* 图片/视频展示 */}
                  {((review.images && review.images.length > 0) || review.video) && (
                    <div className="flex gap-2 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                      {review.video && (
                        <div
                          className="relative flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden bg-gray-200 cursor-pointer"
                          onClick={() => setActiveVideo(normalizeUrl(review.video)!)}
                        >
                          <img src={normalizeUrl(review.video)} alt="评价视频" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                              <Play size={20} className="text-gray-700 ml-1" fill="currentColor" />
                            </div>
                          </div>
                        </div>
                      )}
                      {review.images?.map((img, idx) => (
                        <img
                          key={idx}
                          src={normalizeUrl(img)}
                          alt={`评价图片${idx + 1}`}
                          className="flex-shrink-0 w-28 h-28 rounded-lg object-cover bg-gray-100"
                        />
                      ))}
                    </div>
                  )}

                  {/* 底部操作栏 */}
                  <div className="flex items-center justify-between pt-2">
                    <MoreHorizontal size={16} className="text-gray-400" />
                    <div className="flex items-center gap-6 text-xs text-gray-400">
                      <button className="flex items-center gap-1">
                        <ThumbsUp size={14} />
                        {review.likes > 0 ? review.likes : '有用'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 加载更多 */}
            {hasMore && (
              <div className="py-6 text-center">
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={loading}
                  className="text-sm text-gray-500 active:text-gray-700 disabled:opacity-50"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}

            {!hasMore && filteredReviews.length > 0 && (
              <div className="py-6 text-center text-sm text-gray-400">
                — 已经到底了 —
              </div>
            )}
          </>
        )
      }

      {/* 视频播放弹窗 */}
      {
        activeVideo && (
          <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 text-white/80 p-2 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>
            <video
              src={normalizeUrl(activeVideo!)}
              controls
              autoPlay
              className="w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="absolute inset-0 -z-10"
              onClick={() => setActiveVideo(null)}
            />
          </div>
        )
      }
    </div >
  );
};

export default ReviewsPage;
