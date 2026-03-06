import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Star, StarHalf, ThumbsUp, MessageCircle, MoreHorizontal, AlertCircle, RefreshCcw, WifiOff, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';

// Mock Data
const MOCK_REVIEWS = [
  {
    id: '1',
    user: {
      avatar: 'https://picsum.photos/seed/user1/100/100',
      nickname: 'j***8',
    },
    rating: 5,
    date: '2023-10-25',
    text: '手机收到了，非常惊艳！钛金属边框手感极佳，重量也比上一代轻了很多。A17 Pro芯片运行速度飞快，玩游戏完全不卡顿。拍照效果也一如既往的优秀，特别是夜景模式，噪点控制得很好。物流速度更是没得说，昨天下单今天就到了，京东自营就是靠谱！强烈推荐购买！',
    images: [
      'https://picsum.photos/seed/review1_1/400/400',
      'https://picsum.photos/seed/review1_2/400/400',
      'https://picsum.photos/seed/review1_3/400/400',
    ],
    skuInfo: '原色钛金属，256GB',
    likes: 128,
    comments: 12,
  },
  {
    id: '2',
    user: {
      avatar: 'https://picsum.photos/seed/user2/100/100',
      nickname: '1***a',
    },
    rating: 4,
    date: '2023-10-20',
    text: '整体还不错，就是发热有点严重，特别是在充电和玩大型游戏的时候。电池续航感觉一般般，勉强够用一天。不过屏幕素质确实顶尖，看着很舒服。',
    images: [
      'https://picsum.photos/seed/review2_1/400/400',
    ],
    skuInfo: '白色钛金属，512GB',
    likes: 45,
    comments: 3,
  },
  {
    id: '3',
    user: {
      avatar: 'https://picsum.photos/seed/user3/100/100',
      nickname: '张***三',
    },
    rating: 5,
    date: '2023-10-15',
    text: '给老婆买的生日礼物，她非常喜欢。颜色很好看，拍照很清晰。',
    images: [],
    skuInfo: '蓝色钛金属，256GB',
    likes: 12,
    comments: 0,
  },
  {
    id: '4',
    user: {
      avatar: 'https://picsum.photos/seed/user4/100/100',
      nickname: 'l***e',
    },
    rating: 5,
    date: '2023-10-10',
    text: '首发抢到的，太香了！Type-C接口终于来了，出门不用带两根线了。动作按钮也很实用，可以自定义很多功能。',
    images: [
      'https://picsum.photos/seed/review4_1/400/400',
      'https://picsum.photos/seed/review4_2/400/400',
      'https://picsum.photos/seed/review4_3/400/400',
      'https://picsum.photos/seed/review4_4/400/400',
    ],
    skuInfo: '黑色钛金属，1TB',
    likes: 356,
    comments: 45,
  },
  {
    id: '5',
    user: {
      avatar: 'https://picsum.photos/seed/user5/100/100',
      nickname: 'w***9',
    },
    rating: 3,
    date: '2023-10-05',
    text: '感觉升级幅度不大，有点后悔换了。而且边框容易沾染指纹，需要经常擦拭。',
    images: [],
    skuInfo: '原色钛金属，256GB',
    likes: 8,
    comments: 2,
  }
];

const TAGS = [
  { label: '物流快', count: 1205 },
  { label: '正品行货', count: 890 },
  { label: '包装严实', count: 654 },
  { label: '手感极佳', count: 432 },
  { label: '运行流畅', count: 321 },
  { label: '拍照清晰', count: 210 },
];

export function ReviewsPage() {
  const { goTo, goBack } = useAppNavigate();
  const [viewState, setViewState] = useState<'loading' | 'error' | 'empty' | 'normal'>('loading');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [activeFilter, setActiveFilter] = useState('全部');
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reviews, setReviews] = useState(MOCK_REVIEWS.slice(0, 3));
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate initial loading
    const timer = setTimeout(() => {
      setViewState('normal');
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, []);

  const handleBack = () => {
    goBack();
  };

  const toggleExpand = (id: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      const currentLength = reviews.length;
      const nextReviews = MOCK_REVIEWS.slice(currentLength, currentLength + 2);
      if (nextReviews.length > 0) {
        setReviews(prev => [...prev, ...nextReviews]);
      } else {
        setHasMore(false);
      }
      setLoadingMore(false);
    }, 800);
  };

  const renderStars = (rating: number, size = 14) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= rating ? "text-primary-start fill-primary-start" : "text-border-main fill-border-light"}
          />
        ))}
      </div>
    );
  };

  const renderSkeleton = () => (
    <div className="p-4 space-y-4">
      <Card className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="w-24 h-8" />
          <Skeleton className="w-16 h-4" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="w-20 h-6 rounded-full" />)}
        </div>
      </Card>
      <div className="flex space-x-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-16 h-6" />)}
      </div>
      {[1, 2, 3].map(i => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-16 h-3" />
            </div>
          </div>
          <Skeleton className="w-full h-12" />
          <div className="flex space-x-2">
            <Skeleton className="w-20 h-20 rounded-lg" />
            <Skeleton className="w-20 h-20 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderEmpty = () => (
    <EmptyState message="暂无评价" />
  );

  const renderContent = () => {
    if (viewState === 'loading') return renderSkeleton();
    if (viewState === 'error') return renderError();
    if (viewState === 'empty') return renderEmpty();

    return (
      <div className="pb-safe">
        {/* Overall Rating Card */}
        <Card className="m-4 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline space-x-2">
              <span className="text-base text-text-main font-medium">好评度</span>
              <span className="text-6xl font-bold text-primary-start">98%</span>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-1 mb-1">
                <span className="text-sm text-text-sub">综合评分</span>
                {renderStars(5, 12)}
              </div>
              <span className="text-s text-text-aux">10万+条评价</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag, index) => (
              <div 
                key={index}
                className="px-2.5 py-1 bg-red-50 text-text-main text-s rounded-full"
              >
                {tag.label} <span className="text-text-aux">{tag.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Filter Bar */}
        <div className="sticky top-11 z-10 bg-bg-base/95 backdrop-blur px-4 py-2 flex space-x-4 overflow-x-auto scrollbar-hide border-b border-border-light">
          {['全部', '最新', '有图/视频', '追评', '低分'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap text-base px-1 py-1 ${
                activeFilter === filter 
                  ? 'text-text-main font-bold border-b-2 border-primary-start' 
                  : 'text-text-sub'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Review List */}
        <div className="space-y-2 mt-2">
          {reviews.map(review => {
            const isExpanded = expandedReviews[review.id];
            const textLines = review.text.length > 60; // Rough estimate for 3 lines
            
            return (
              <Card key={review.id} className="mx-4 p-4 shadow-sm rounded-xl">
                {/* User Info */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <img src={review.user.avatar} alt="avatar" className="w-8 h-8 rounded-full bg-border-light object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-medium text-text-main">{review.user.nickname}</span>
                        {renderStars(review.rating, 10)}
                      </div>
                      <span className="text-s text-text-aux">{review.date}</span>
                    </div>
                  </div>
                  <MoreHorizontal size={16} className="text-text-aux" />
                </div>

                {/* Review Text */}
                <div className="mb-3 relative">
                  <p className={`text-md text-text-main leading-relaxed ${!isExpanded && textLines ? 'line-clamp-3' : ''}`}>
                    {review.text}
                  </p>
                  {textLines && !isExpanded && (
                    <button 
                      onClick={() => toggleExpand(review.id)}
                      className="absolute bottom-0 right-0 bg-white dark:bg-gray-900 pl-2 text-primary-start text-base font-medium"
                    >
                      展开
                    </button>
                  )}
                  {textLines && isExpanded && (
                    <button 
                      onClick={() => toggleExpand(review.id)}
                      className="text-primary-start text-base font-medium mt-1"
                    >
                      收起
                    </button>
                  )}
                </div>

                {/* Images */}
                {review.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {review.images.map((img, idx) => (
                      <div 
                        key={idx} 
                        className="aspect-square rounded-lg overflow-hidden bg-border-light cursor-pointer"
                        onClick={() => setPreviewImage(img)}
                      >
                        <img src={img} alt={`review-${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                )}

                {/* SKU Info & Actions */}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-s text-text-aux line-clamp-1 flex-1 mr-4">{review.skuInfo}</span>
                  <div className="flex items-center space-x-4 text-text-sub">
                    <button className="flex items-center space-x-1 text-sm">
                      <MessageCircle size={14} />
                      <span>{review.comments || '评论'}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-sm">
                      <ThumbsUp size={14} />
                      <span>{review.likes || '点赞'}</span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Load More */}
        {hasMore ? (
          <div 
            className="py-6 flex justify-center items-center text-sm text-text-sub cursor-pointer"
            onClick={loadMore}
          >
            {loadingMore ? (
              <span className="flex items-center"><RefreshCcw size={14} className="animate-spin mr-2" /> 加载中...</span>
            ) : (
              '点击加载更多'
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-text-aux">
            没有更多评价了
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-red-500 text-white text-sm py-1.5 px-4 flex items-center justify-center sticky top-0 z-50">
          <WifiOff size={14} className="mr-2" />
          网络连接已断开，请检查网络设置
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg-base/95 backdrop-blur flex items-center justify-between px-4 h-11 border-b border-border-light">
        <button onClick={handleBack} className="p-1 -ml-1 active:bg-border-light rounded-full">
          <ChevronLeft size={24} className="text-text-main" />
        </button>
        <h1 className="text-xl font-medium text-text-main">评价</h1>
        <button 
          onClick={() => goTo('add_review')}
          className="text-md text-primary-start font-medium active:opacity-70"
        >
          写评价
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex justify-between items-center p-4 text-white">
            <span className="text-md">图片预览</span>
            <button onClick={() => setPreviewImage(null)} className="p-2">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img 
              src={previewImage} 
              alt="preview" 
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Debug State Controller */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-50 opacity-50 hover:opacity-100 transition-opacity">
        <div className="bg-black/80 text-white text-xs p-2 rounded-lg flex flex-col gap-1">
          <div className="font-bold mb-1 border-b border-white/20 pb-1">状态控制</div>
          <button onClick={() => setViewState('normal')} className={viewState === 'normal' ? 'text-primary-start' : ''}>Normal</button>
          <button onClick={() => setViewState('loading')} className={viewState === 'loading' ? 'text-primary-start' : ''}>Loading</button>
          <button onClick={() => setViewState('error')} className={viewState === 'error' ? 'text-primary-start' : ''}>Error</button>
          <button onClick={() => setViewState('empty')} className={viewState === 'empty' ? 'text-primary-start' : ''}>Empty</button>
        </div>
      </div>
    </div>
  );
}
