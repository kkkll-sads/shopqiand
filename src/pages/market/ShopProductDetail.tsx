/**
 * ShopProductDetail - 商城商品详情页（淘宝风格）
 * 
 * 专门用于消费金商城商品的详情展示
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Store, MessageCircle, Heart, ShoppingCart, 
  Truck, ChevronRight, Share2
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
  /** 是否隐藏底部操作区域 */
  hideActions?: boolean;
  /** 预加载的详情数据 */
  initialData?: ShopProductDetailData | null;
}

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
  const imageContainerRef = useRef<HTMLDivElement>(null);

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
  const originalPrice = displayPrice * 1.2;
  
  // 商品图片列表
  const shopImages: string[] = [
    detailData?.thumbnail || product.image,
    ...(detailData?.detail_images || []),
  ].filter(Boolean) as string[];
  
  const mainImage = shopImages[currentImageIndex] || detailData?.thumbnail || product.image;

  return (
    <div className="min-h-screen bg-gray-100 pb-[70px]">
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm px-3 py-2 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-gray-100">
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full active:bg-gray-100">
            <Share2 size={20} className="text-gray-600" />
          </button>
        </div>
      </header>

      {/* 商品主图轮播 */}
      <div className="pt-12">
        <div 
          ref={imageContainerRef}
          className="relative bg-white aspect-square overflow-hidden"
        >
          <LazyImage
            src={mainImage || ''}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
          {shopImages.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {currentImageIndex + 1}/{shopImages.length}
            </div>
          )}
        </div>
        
        {/* 缩略图选择器 */}
        {shopImages.length > 1 && (
          <div className="bg-white px-3 py-2 flex gap-2 overflow-x-auto">
            {shopImages.slice(0, 5).map((img, idx) => (
              <div
                key={idx}
                className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                  currentImageIndex === idx ? 'border-red-500' : 'border-transparent'
                }`}
                onClick={() => setCurrentImageIndex(idx)}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {shopImages.length > 5 && (
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500 text-xs">
                全部 <ChevronRight size={14} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 价格促销区 */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 mx-2 mt-2 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="bg-yellow-400 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded">
            限时特惠
          </span>
          <span className="text-xs opacity-80">活动进行中</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm">兑换价</span>
          <span className="text-2xl font-bold">¥{displayPrice.toLocaleString()}</span>
          {scorePrice > 0 && (
            <span className="text-sm bg-white/20 px-2 py-0.5 rounded">
              +{scorePrice}消费金
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs opacity-90">
          <span className="line-through">原价 ¥{originalPrice.toFixed(0)}</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded">省 ¥{(originalPrice - displayPrice).toFixed(0)}</span>
        </div>
      </div>

      {/* 商品标题区 */}
      <div className="bg-white mx-2 mt-2 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold mt-0.5">
            树交所
          </span>
          <h1 className="text-base font-medium text-gray-800 leading-snug">
            {displayTitle}
          </h1>
        </div>
        
        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
            正品保障
          </span>
          <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
            官方直营
          </span>
          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            品质保证
          </span>
        </div>
        
        {/* 销量 */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            已售 {((parseInt(product.id, 10) || 1) * 17 % 500) + 100}件
          </span>
          <button 
            onClick={() => setIsFavorite(!isFavorite)}
            className="flex items-center gap-1 text-xs text-gray-400"
          >
            <Heart size={14} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
            收藏
          </button>
        </div>
      </div>

      {/* 配送信息 */}
      <div className="bg-white mx-2 mt-2 rounded-xl p-4">
        <div className="flex items-center gap-3 text-sm">
          <Truck size={18} className="text-green-500" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-800 font-medium">官方配送</span>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              预计3-5天内发货 · 全国包邮
            </div>
          </div>
        </div>
      </div>

      {/* 商品详情（图片展示） */}
      <div className="bg-white mx-2 mt-2 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">商品详情</h3>
        </div>
        <div className="p-4">
          {/* 商品描述 */}
          {detailData?.description && (
            <div 
              className="text-sm text-gray-600 leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ __html: detailData.description }}
            />
          )}
          
          {/* 详情图片 */}
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex items-center gap-2 z-50">
          {/* 左侧图标按钮 */}
          <div className="flex items-center gap-1">
            <button className="flex flex-col items-center justify-center w-12 py-1">
              <Store size={18} className="text-gray-500" />
              <span className="text-[10px] text-gray-500 mt-0.5">店铺</span>
            </button>
            <button className="flex flex-col items-center justify-center w-12 py-1">
              <MessageCircle size={18} className="text-gray-500" />
              <span className="text-[10px] text-gray-500 mt-0.5">客服</span>
            </button>
            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className="flex flex-col items-center justify-center w-12 py-1"
            >
              <Heart size={18} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
              <span className="text-[10px] text-gray-500 mt-0.5">收藏</span>
            </button>
          </div>
          
          {/* 右侧按钮 */}
          <div className="flex-1 flex gap-2">
            <button className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white py-3 rounded-full text-sm font-bold active:scale-[0.98] transition-transform">
              <ShoppingCart size={16} className="inline mr-1" />
              加入购物车
            </button>
            <button
              onClick={handleBuy}
              disabled={buying}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-full text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-70"
            >
              {buying ? '处理中...' : '立即购买'}
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
