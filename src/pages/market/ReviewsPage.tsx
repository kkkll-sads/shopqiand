/**
 * ReviewsPage - 商品评价页面
 * 
 * 展示商品的全部买家评价，参考京东评价页设计
 * 支持筛选标签：全部、图/视频、追评、口感超香等
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, ThumbsUp, MessageSquare, ChevronDown, Play, Share2, MoreHorizontal } from 'lucide-react';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '../../../types/states';
import { LoadingSpinner } from '../../../components/common';

interface Review {
  id: number;
  user: string;
  avatar?: string;
  level: string;
  memberTag?: string;
  purchaseInfo?: string;
  rating: number;
  content: string;
  images?: string[];
  video?: string;
  likes: number;
  time: string;
  hasReply?: boolean;
  replyContent?: string;
}

// 模拟更丰富的评论数据
const mockReviews: Review[] = [
  {
    id: 1,
    user: '好运谷行好运',
    level: '钻石会员',
    memberTag: '本店购买≥2次',
    purchaseInfo: '已购 特等有机五常大米礼盒 10 斤',
    rating: 5,
    content: '五常稻花香有机五常大米尝尝鲜，煮后米粒完整，米香浓郁，确实是五常大米中的好米，米饭就是不用放那么多水，软硬适中很适口，有嚼劲',
    images: ['/images/review1.jpg', '/images/review2.jpg'],
    video: '/videos/review1.mp4',
    likes: 128,
    time: '01-13',
  },
  {
    id: 2,
    user: 'Mr小崔lxz',
    level: '钻石会员',
    memberTag: '本店购买≥2次',
    purchaseInfo: '已购 五常稻香米 10 斤*2 整箱',
    rating: 5,
    content: '煮出来的饭有嚼劲、饭非常香、喜欢吃这款米。没有碎米...收到米盒子保装没有破损、红色的很喜庆、送礼也很好看、已推荐朋友家购买。',
    images: ['/images/review3.jpg', '/images/review4.jpg'],
    video: '/videos/review2.mp4',
    likes: 89,
    time: '01-17',
  },
  {
    id: 3,
    user: 'k***p',
    level: '钻石会员',
    rating: 5,
    content: '做工精细，质量上乘，值得信赖！给家人买的礼物，官方正品，昨天下单今天就到了，赶上了送礼，包装很高档，非常满意！',
    images: [],
    likes: 56,
    time: '1周前',
  },
  {
    id: 4,
    user: '阳***光',
    level: '金牌会员',
    rating: 5,
    content: '非常好的购物体验，商品质量没话说，物流速度也很快，客服态度也很好，有问必答。已经是第三次购买了，还会继续支持！',
    images: ['/images/review5.jpg'],
    likes: 234,
    time: '01-10',
  },
  {
    id: 5,
    user: '小***子',
    level: '普通会员',
    memberTag: 'PLUS会员',
    rating: 4,
    content: '整体还不错，就是物流稍微慢了一点，其他都很满意。商品是正品，包装也很好。',
    images: [],
    likes: 12,
    time: '01-08',
  },
];

// 筛选标签
const filterTags = [
  { key: 'all', label: '全部', suffix: '98%好评' },
  { key: 'media', label: '图/视频', count: '5万+' },
  { key: 'follow', label: '追评', count: '1000+' },
  { key: 'taste', label: '口感超香', count: '12782' },
];

const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const productName = searchParams.get('name') || '商品';
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [reviews, setReviews] = useState<Review[]>(mockReviews);

  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.SUCCESS, // 模拟数据直接成功
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

  // 根据筛选条件过滤评论
  const filteredReviews = reviews.filter(review => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'media') return (review.images && review.images.length > 0) || review.video;
    return true;
  });

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
          <div className="flex items-center gap-3">
            <Star size={20} className="text-yellow-400 fill-yellow-400" />
            <Share2 size={20} className="text-gray-500" />
            <MoreHorizontal size={20} className="text-gray-500" />
          </div>
        </div>

        {/* 筛选标签栏 */}
        <div className="flex items-center gap-3 px-4 py-2 overflow-x-auto border-b border-gray-100" style={{ scrollbarWidth: 'none' }}>
          {filterTags.map(tag => (
            <button
              key={tag.key}
              onClick={() => setActiveFilter(tag.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
                activeFilter === tag.key
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
      </header>

      {/* 评论列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredReviews.map(review => (
            <div key={review.id} className="bg-white px-4 py-4">
              {/* 用户信息 */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {review.user.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800">{review.user}</span>
                    <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <span className="text-blue-400">◇</span>
                      {review.level}
                    </span>
                    {review.memberTag && (
                      <span className="text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                        {review.memberTag}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] text-red-500 bg-red-50 px-1 py-0.5 rounded">超赞</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={10}
                          className={star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    {review.purchaseInfo && (
                      <span className="text-[10px] text-gray-400 ml-1">{review.purchaseInfo}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{review.time}</span>
              </div>

              {/* 评论内容 */}
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                {review.content}
              </p>

              {/* 图片/视频展示 */}
              {((review.images && review.images.length > 0) || review.video) && (
                <div className="flex gap-2 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {review.video && (
                    <div className="relative flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden bg-gray-200">
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                          <Play size={20} className="text-gray-700 ml-1" fill="currentColor" />
                        </div>
                      </div>
                      <span className="absolute top-1 left-1 text-[10px] text-white bg-black/50 px-1 py-0.5 rounded">
                        5秒
                      </span>
                    </div>
                  )}
                  {review.images?.map((img, idx) => (
                    <div key={idx} className="flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden bg-gray-200">
                      <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                        <span className="text-xs text-gray-400">商品图{idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 底部操作栏 */}
              <div className="flex items-center justify-between pt-2">
                <MoreHorizontal size={16} className="text-gray-400" />
                <div className="flex items-center gap-6 text-xs text-gray-400">
                  <button className="flex items-center gap-1">
                    <MessageSquare size={14} />
                    评论
                  </button>
                  <button className="flex items-center gap-1">
                    <ChevronDown size={14} />
                    点踩
                  </button>
                  <button className="flex items-center gap-1">
                    <ThumbsUp size={14} />
                    有用
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 加载更多提示 */}
      <div className="py-6 text-center text-sm text-gray-400">
        — 已经到底了 —
      </div>
    </div>
  );
};

export default ReviewsPage;
