/**
 * ShopProductDetail - 商城商品详情页（京东风格）
 * 
 * 专门用于消费金商城商品的详情展示
 * 参考京东APP商品详情页设计
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Store, MessageCircle, Heart, ShoppingCart, 
  Truck, Shield, RotateCcw, Headphones, Star, ThumbsUp, Gift, Tag, Clock
} from 'lucide-react';
import { LazyImage } from '../../../components/common';
import PopupAnnouncementModal from '../../../components/common/PopupAnnouncementModal';
import { Product } from '../../../types';
import {
  fetchShopProductDetail,
  ShopProductDetailData,
  createOrder,
  fetchAnnouncements,
  AnnouncementItem,
} from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { isSuccess, extractData } from '../../../utils/apiHelpers';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '../../../types/states';
import { LoadingSpinner } from '../../../components/common';

interface ShopProductDetailProps {
  product: Product;
  hideActions?: boolean;
  initialData?: ShopProductDetailData | null;
}

// 模拟评论数据
const mockReviews = [
  { id: 1, user: 'j***8', avatar: '', level: '11年·购物达人', content: '在树交所入手的这款商品真的超出预期！物流超给力，隔天就收到了，精致礼盒包装很适合自戴或送礼。质量和标注一致，非常满意！', images: [], likes: 128, time: '3天前' },
  { id: 2, user: '葡***爸', avatar: '', level: '本店买过≥2次', content: '这款商品真是太漂亮了！工艺精细，设计精美，既显高贵又优雅。质量也很好，包装严实，非常满意的一次购物体验！', images: [], likes: 89, time: '5天前' },
  { id: 3, user: 'k***p', avatar: '', level: '钻石会员', content: '做工精细，质量上乘，值得信赖！给家人买的礼物，官方正品，昨天下单今天就到了，赶上了送礼...', images: [], likes: 56, time: '1周前' },
];

const ShopProductDetail: React.FC<ShopProductDetailProps> = ({ 
  product, 
  hideActions = false, 
  initialData = null 
}) => {
  const navigate = useNavigate();
  const { showToast, showDialog } = useNotification();

  const { handleError: handleBuyError } = useErrorHandler({ showToast: true, persist: false });
  const {
    errorMessage,
    hasError,
    handleError,
    clearError
  } = useErrorHandler();

  const [detailData, setDetailData] = useState<ShopProductDetailData | null>(initialData);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'product' | 'reviews' | 'detail' | 'recommend'>('product');
  const [scrollY, setScrollY] = useState(0);
  const [headerStyle, setHeaderStyle] = useState<'transparent' | 'white'>('transparent');
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 各区块 ref，用于滚动定位和自动切换 Tab
  const productSectionRef = useRef<HTMLDivElement>(null);
  const reviewsSectionRef = useRef<HTMLDivElement>(null);
  const detailSectionRef = useRef<HTMLDivElement>(null);
  const recommendSectionRef = useRef<HTMLDivElement>(null);

  // 交易须知公告
  const [showTradingNotice, setShowTradingNotice] = useState(false);
  const [tradingNoticeAnnouncement, setTradingNoticeAnnouncement] = useState<AnnouncementItem | null>(null);

  // 状态机
  const detailMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: initialData ? LoadingState.SUCCESS : LoadingState.IDLE,
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

  const buyMachine = useStateMachine<FormState, FormEvent>({
    initial: FormState.IDLE,
    transitions: {
      [FormState.IDLE]: { [FormEvent.SUBMIT]: FormState.SUBMITTING },
      [FormState.VALIDATING]: {
        [FormEvent.VALIDATION_SUCCESS]: FormState.SUBMITTING,
        [FormEvent.VALIDATION_ERROR]: FormState.ERROR,
      },
      [FormState.SUBMITTING]: {
        [FormEvent.SUBMIT_SUCCESS]: FormState.SUCCESS,
        [FormEvent.SUBMIT_ERROR]: FormState.ERROR,
      },
      [FormState.SUCCESS]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
      [FormState.ERROR]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
    },
  });

  const loading = detailMachine.state === LoadingState.LOADING;
  const buying = buyMachine.state === FormState.SUBMITTING;

  // 加载商品详情
  useEffect(() => {
    if (initialData) {
      setDetailData(initialData);
      detailMachine.send(LoadingEvent.SUCCESS);
      return;
    }

    const loadDetail = async () => {
      try {
        detailMachine.send(LoadingEvent.LOAD);
        clearError();

        const response = await fetchShopProductDetail(product.id);
        const data = extractData(response);
        
        if (data) {
          setDetailData(data);
          detailMachine.send(LoadingEvent.SUCCESS);
        } else {
          handleError(response, {
            persist: true,
            showToast: false,
            customMessage: '获取商品详情失败'
          });
          detailMachine.send(LoadingEvent.ERROR);
        }
      } catch (err: any) {
        handleError(err, {
          persist: true,
          showToast: false,
          customMessage: '数据加载失败，请重试',
          context: { productId: product.id }
        });
        detailMachine.send(LoadingEvent.ERROR);
      }
    };

    loadDetail();
  }, [product.id, initialData]);

  // 加载交易须知
  useEffect(() => {
    const loadTradingNotice = async () => {
      try {
        const response = await fetchAnnouncements({ page: 1, limit: 10, type: 'normal' });
        if (isSuccess(response) && response.data?.list) {
          const notice = response.data.list.find((item: AnnouncementItem) =>
            item.title && item.title.includes('交易须知')
          );
          if (notice) {
            const dismissedKey = `trading_notice_dismissed_${notice.id}`;
            const dismissedDate = localStorage.getItem(dismissedKey);
            const today = new Date().toDateString();
            if (dismissedDate !== today) {
              setTradingNoticeAnnouncement(notice);
              setShowTradingNotice(true);
            }
          }
        }
      } catch (error) {
        console.error('加载交易须知失败:', error);
      }
    };
    loadTradingNotice();
  }, []);

  // 图片滑动处理
  const handleImageScroll = () => {
    if (imageContainerRef.current) {
      const scrollLeft = imageContainerRef.current.scrollLeft;
      const width = imageContainerRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== currentImageIndex) {
        setCurrentImageIndex(newIndex);
      }
    }
  };

  // 页面滚动监听 - 导航栏跟随变化 + Tab 自动切换
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // 滚动超过图片区域（约 300px）时，导航栏变为白色背景
      if (currentScrollY > 300) {
        setHeaderStyle('white');
      } else {
        setHeaderStyle('transparent');
      }
      
      // 根据滚动位置自动切换 Tab
      const offset = 100; // 导航栏高度补偿
      const detailTop = detailSectionRef.current?.offsetTop ?? Infinity;
      const reviewsTop = reviewsSectionRef.current?.offsetTop ?? Infinity;
      const recommendTop = recommendSectionRef.current?.offsetTop ?? Infinity;
      
      if (currentScrollY + offset >= recommendTop) {
        setActiveTab('recommend');
      } else if (currentScrollY + offset >= detailTop) {
        setActiveTab('detail');
      } else if (currentScrollY + offset >= reviewsTop) {
        setActiveTab('reviews');
      } else {
        setActiveTab('product');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 购买
  const handleBuy = async () => {
    if (buying) return;

    showDialog({
      title: '确认购买',
      description: `确定要购买 ${product.title} 吗？`,
      confirmText: '立即支付',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          buyMachine.send(FormEvent.SUBMIT);
          const response = await createOrder({
            items: [{ product_id: Number(product.id), quantity: 1 }],
            pay_type: 'money',
          });

          if (isSuccess(response)) {
            let orderId: number | string | null = null;
            if (response.data) {
              if (typeof response.data === 'object' && 'order_id' in response.data) {
                orderId = (response.data as any).order_id;
              } else if (typeof response.data === 'object' && 'id' in response.data) {
                orderId = (response.data as any).id;
              }
            }

            if (orderId) {
              navigate(`/cashier/${orderId}`);
            } else {
              showToast('success', '订单创建成功');
              setTimeout(() => navigate('/orders/points/0'), 1500);
            }
            buyMachine.send(FormEvent.SUBMIT_SUCCESS);
          } else {
            handleBuyError(response, {
              toastTitle: '订单创建失败',
              customMessage: '订单创建失败',
              context: { productId: product.id }
            });
            buyMachine.send(FormEvent.SUBMIT_ERROR);
          }
        } catch (err: any) {
          handleBuyError(err, {
            toastTitle: '订单创建失败',
            customMessage: '系统错误',
            context: { productId: product.id }
          });
          buyMachine.send(FormEvent.SUBMIT_ERROR);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
        {errorMessage}
      </div>
    );
  }

  // 商品数据
  const displayTitle = detailData?.name || product.title;
  const displayPrice = Number(detailData?.price ?? product.price);
  const scorePrice = detailData?.score_price || product.score_price || 0;
  const originalPrice = Math.round(displayPrice * 1.15);
  const savedAmount = originalPrice - displayPrice;
  const salesCount = ((parseInt(product.id, 10) || 1) * 23 % 800) + 300;
  const reviewCount = ((parseInt(product.id, 10) || 1) * 7 % 150) + 200;
  
  // 商品图片列表
  const shopImages: string[] = [
    detailData?.thumbnail || product.image,
    ...(detailData?.detail_images || []),
  ].filter(Boolean) as string[];
  
  const mainImage = shopImages[currentImageIndex] || detailData?.thumbnail || product.image;

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-[70px]" ref={scrollContainerRef}>
      {/* 顶部Tab导航栏 - 滚动跟随变化 */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          headerStyle === 'white' 
            ? 'bg-white shadow-sm' 
            : 'bg-transparent'
        }`}
      >
        <div className={`flex items-center px-2 py-2 ${headerStyle === 'white' ? 'border-b border-gray-100' : ''}`}>
          <button 
            onClick={() => navigate(-1)} 
            className={`p-2 -ml-1 rounded-full transition-colors ${
              headerStyle === 'white' 
                ? 'active:bg-gray-100' 
                : 'bg-black/20 active:bg-black/30'
            }`}
          >
            <ChevronLeft size={22} className={headerStyle === 'white' ? 'text-gray-700' : 'text-white'} />
          </button>
          
          {/* Tab导航 - 滚动后显示 */}
          <div className={`flex-1 flex items-center justify-center gap-6 transition-opacity duration-300 ${
            headerStyle === 'white' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            {[
              { key: 'product', label: '商品', ref: productSectionRef },
              { key: 'reviews', label: '大家评', ref: reviewsSectionRef },
              { key: 'detail', label: '详情', ref: detailSectionRef },
              { key: 'recommend', label: '推荐', ref: recommendSectionRef },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  // 点击 Tab 滚动到对应区域
                  tab.ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`text-sm py-1 relative ${activeTab === tab.key ? 'text-gray-900 font-bold' : 'text-gray-500'}`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* 标题 - 滚动后显示 */}
          {headerStyle === 'transparent' && (
            <div className="flex-1" />
          )}
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-full transition-colors ${
                headerStyle === 'white' 
                  ? 'active:bg-gray-100' 
                  : 'bg-black/20 active:bg-black/30'
              }`}
            >
              <Heart size={20} className={isFavorite ? 'fill-red-500 text-red-500' : headerStyle === 'white' ? 'text-gray-500' : 'text-white'} />
            </button>
          </div>
        </div>
      </header>

      {/* 商品主图轮播 */}
      <div className="relative" ref={productSectionRef}>
        {/* 促销活动悬浮卡片 */}
        <div className="absolute left-2 top-14 z-10 bg-white rounded-lg shadow-lg overflow-hidden w-20">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] py-1 px-2 text-center">
            新春特惠
          </div>
          <div className="p-2 text-center">
            <div className="text-[10px] text-gray-500">限时直降</div>
            <div className="text-red-500 font-bold text-xs">5%OFF</div>
          </div>
          <div className="border-t border-gray-100 py-1.5 text-center">
            <span className="text-[10px] text-red-500">领券更优惠</span>
          </div>
        </div>

        {/* 图片轮播 */}
        <div 
          ref={imageContainerRef}
          className="relative bg-white overflow-x-auto snap-x snap-mandatory flex"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={handleImageScroll}
        >
          {shopImages.map((img, idx) => (
            <div key={idx} className="w-full flex-shrink-0 snap-center aspect-square">
              <LazyImage
                src={img || ''}
                alt={`${displayTitle} ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        
        {/* 图片指示器和功能按钮 */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <div className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
            图集 {currentImageIndex + 1}/{shopImages.length}
          </div>
        </div>
      </div>

      {/* 规格缩略图选择器 */}
      {shopImages.length > 1 && (
        <div className="bg-white px-3 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {shopImages.slice(0, 6).map((img, idx) => (
            <div
              key={idx}
              onClick={() => {
                setCurrentImageIndex(idx);
                if (imageContainerRef.current) {
                  imageContainerRef.current.scrollTo({
                    left: idx * imageContainerRef.current.offsetWidth,
                    behavior: 'smooth'
                  });
                }
              }}
              className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                currentImageIndex === idx ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {shopImages.length > 6 && (
            <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-xs text-gray-500">共{shopImages.length}款</span>
            </div>
          )}
        </div>
      )}

      {/* 价格促销区 - 红色渐变背景 */}
      <div className="bg-gradient-to-r from-[#e23c41] to-[#ff6034] text-white p-4 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute -right-8 bottom-0 w-16 h-16 bg-white/5 rounded-full"></div>
        
        <div className="relative">
          {/* 价格行 */}
          <div className="flex items-baseline gap-1">
            <span className="text-sm">¥</span>
            <span className="text-3xl font-bold tracking-tight">{displayPrice.toLocaleString()}</span>
            {scorePrice > 0 && (
              <span className="ml-2 text-sm bg-white/20 px-2 py-0.5 rounded">
                +{scorePrice}消费金
              </span>
            )}
          </div>
          
          {/* 促销信息 */}
          <div className="flex items-center gap-3 mt-2">
            <span className="bg-[#fff4e5] text-[#ff6600] text-[10px] px-2 py-0.5 rounded font-medium">
              入会到手价
            </span>
            <span className="text-white/80 text-xs line-through">¥{originalPrice.toLocaleString()}</span>
          </div>
          
          {/* 标签行 */}
          <div className="flex items-center gap-2 mt-3">
            <span className="flex items-center gap-1 bg-white/15 text-xs px-2 py-1 rounded">
              <Tag size={12} />
              官方直降{Math.round((savedAmount / originalPrice) * 100)}%
            </span>
            <span className="text-white/90 text-xs">已售{salesCount}+</span>
            <div className="flex-1 text-right">
              <span className="text-[#ffe4b5] text-xs font-medium">新春购物季</span>
            </div>
          </div>
        </div>
      </div>

      {/* 优惠券区域 */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span className="flex items-center gap-1 text-[10px] text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100 flex-shrink-0">
            <Gift size={12} />
            入会赠品1件
          </span>
          <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 flex-shrink-0">
            专项金支付减20元
          </span>
          <span className="text-[10px] text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-100 flex-shrink-0">
            最高返1,000积分
          </span>
        </div>
      </div>

      {/* 商品标题区 */}
      <div className="bg-white px-4 py-3">
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold mt-0.5">
            自营
          </span>
          <h1 className="text-[15px] font-medium text-gray-800 leading-snug line-clamp-2">
            {displayTitle}
          </h1>
        </div>
        
        {/* 属性标签 */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            品质保障
          </span>
          <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            正品保证
          </span>
        </div>
      </div>

      {/* 服务保障区 */}
      <div className="bg-white mt-2 px-4 py-3">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Shield size={14} className="text-green-500" />
            免费上门退换
          </span>
          <span className="flex items-center gap-1">
            <RotateCcw size={14} className="text-green-500" />
            7天无理由退货
          </span>
          <span className="flex items-center gap-1">
            <Headphones size={14} className="text-green-500" />
            专属客服
          </span>
        </div>
      </div>

      {/* 配送信息 */}
      <div className="bg-white mt-2 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck size={18} className="text-blue-500" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500 text-xs font-medium">预计明日达</span>
                <span className="text-xs text-gray-500">付款后预计1-3天送达</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">官方物流 · 全国包邮</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      </div>

      {/* 买家评价区 */}
      <div className="bg-white mt-2" ref={reviewsSectionRef}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">买家评价</span>
            <span className="text-gray-400 text-sm">{reviewCount}+</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <span>近90天好评率</span>
            <span className="text-red-500 font-bold ml-1">100%</span>
            <ChevronRight size={14} className="text-gray-400" />
          </div>
        </div>
        
        {/* 评论列表 */}
        <div className="divide-y divide-gray-50">
          {mockReviews.map(review => (
            <div key={review.id} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold">
                  {review.user.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">{review.user}</span>
                    <span className="text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">{review.level}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                {review.content}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{review.time}</span>
                <button className="flex items-center gap-1 text-xs text-gray-400">
                  <ThumbsUp size={12} />
                  {review.likes}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 问大家 */}
      <div className="bg-white mt-2 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-gray-800">问大家</span>
          <div className="flex items-center text-xs text-gray-500">
            <span>看问答讨论</span>
            <ChevronRight size={14} className="text-gray-400" />
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2.5 flex items-center justify-between">
          <span className="text-sm text-gray-400">商品好不好，快来问大家吧～</span>
          <button className="text-red-500 text-sm font-medium">提问</button>
        </div>
      </div>

      {/* 店铺推荐区 */}
      <div className="bg-white mt-2 pb-4" ref={recommendSectionRef}>
        <div className="px-4 py-3">
          <span className="font-bold text-gray-800">店内优选</span>
        </div>
        
        {/* 推荐商品网格 */}
        <div className="px-4 grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <Gift size={32} className="text-orange-300" />
              </div>
              <div className="p-2">
                <div className="text-[11px] text-gray-600 line-clamp-1">精选好物{i}</div>
                <div className="text-red-500 font-bold text-xs mt-1">¥{(displayPrice * 0.8 + i * 100).toFixed(0)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 商品详情（图片展示） */}
      <div className="bg-white mt-2" ref={detailSectionRef}>
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="font-bold text-gray-800">商品介绍</span>
        </div>
        <div className="p-4">
          {detailData?.description && (
            <div 
              className="text-sm text-gray-600 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: detailData.description }}
            />
          )}
          
          <div className="space-y-0">
            {(detailData?.detail_images || [mainImage]).filter(Boolean).map((img, idx) => (
              <img 
                key={idx}
                src={img as string}
                alt={`详情图${idx + 1}`}
                className="w-full"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      {!hideActions && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-3 py-2 flex items-center z-50">
          {/* 左侧图标按钮 */}
          <div className="flex items-center">
            <button className="flex flex-col items-center justify-center w-12 py-1">
              <Store size={20} className="text-gray-500" />
              <span className="text-[10px] text-gray-500 mt-0.5">店铺</span>
            </button>
            <button 
              onClick={() => navigate('/online-service')}
              className="flex flex-col items-center justify-center w-12 py-1"
            >
              <MessageCircle size={20} className="text-gray-500" />
              <span className="text-[10px] text-gray-500 mt-0.5">客服</span>
            </button>
            <button className="flex flex-col items-center justify-center w-12 py-1 relative">
              <ShoppingCart size={20} className="text-gray-500" />
              <span className="text-[10px] text-gray-500 mt-0.5">购物车</span>
              <span className="absolute top-0 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                2
              </span>
            </button>
          </div>
          
          {/* 右侧按钮 - 长方形设计 */}
          <div className="flex-1 flex gap-0 ml-2">
            <button className="flex-1 bg-gradient-to-r from-[#ffa940] to-[#ff7a00] text-white py-3.5 rounded-l-lg text-sm font-bold active:opacity-90 transition-opacity">
              加入购物车
            </button>
            <button
              onClick={handleBuy}
              disabled={buying}
              className="flex-1 bg-gradient-to-r from-[#ff4d4f] to-[#e23c41] text-white py-3.5 rounded-r-lg text-sm font-bold active:opacity-90 transition-opacity disabled:opacity-70 flex flex-col items-center justify-center leading-tight"
            >
              <span className="text-[10px] opacity-90">到手价 ¥{displayPrice.toLocaleString()}</span>
              <span>{buying ? '处理中...' : '立即购买'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 交易须知公告弹窗 */}
      <PopupAnnouncementModal
        visible={showTradingNotice}
        announcement={tradingNoticeAnnouncement}
        onClose={() => setShowTradingNotice(false)}
        onDontShowToday={() => {
          if (tradingNoticeAnnouncement) {
            const dismissedKey = `trading_notice_dismissed_${tradingNoticeAnnouncement.id}`;
            localStorage.setItem(dismissedKey, new Date().toDateString());
          }
        }}
      />
    </div>
  );
};

export default ShopProductDetail;
