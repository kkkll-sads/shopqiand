import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, Share, Heart, MessageCircle, ShoppingCart, 
  ChevronRight, Star, Minus, Plus, X, WifiOff, RefreshCcw, 
  CheckCircle2, ShieldCheck, MapPin, Store, MoreHorizontal
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { CouponBottomSheet } from '../../components/biz/CouponBottomSheet';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const baseStyle = "h-[48px] rounded-2xl font-medium text-lg flex items-center justify-center transition-opacity active:opacity-80 w-full";
  const variants: any = {
    primary: "bg-gradient-to-r from-primary-start to-primary-end text-white shadow-soft",
    secondary: "bg-bg-card text-text-main border border-border-light shadow-soft",
    outline: "bg-transparent border border-primary-start text-primary-start",
    ghost: "bg-transparent text-text-sub",
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default', className = '' }: any) => {
  const variants: any = {
    default: "bg-bg-base text-text-sub border border-border-light",
    primary: "bg-red-50 text-primary-start border border-red-100",
    solid: "bg-gradient-to-r from-primary-start to-primary-end text-white",
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded flex items-center ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const ProductDetailPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  const [showSKU, setShowSKU] = useState(false);
  const [skuMode, setSkuMode] = useState<'buy' | 'cart' | 'select'>('select');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('星空黑');
  const [selectedSize, setSelectedSize] = useState('256GB');
  const [activeTab, setActiveTab] = useState('details');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setIsScrolled(scrollRef.current.scrollTop > 100);
      }
    };
    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleBack = () => {
    goBack();
  };

  const openSKU = (mode: 'buy' | 'cart' | 'select') => {
    setSkuMode(mode);
    setShowSKU(true);
  };

  const renderHeader = () => {
    return (
      <div className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${isScrolled ? 'bg-white dark:bg-gray-900 shadow-sm' : 'bg-transparent'}`}>
        <div className="h-12 flex items-center justify-between px-4 pt-safe">
          <button 
            onClick={handleBack}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'text-text-main' : 'bg-black/30 text-white'}`}
          >
            <ChevronLeft size={20} />
          </button>
          
          {isScrolled && (
            <div className="flex-1 flex justify-center items-center space-x-6 text-md font-medium text-text-main animate-in fade-in">
              <span className="text-primary-start relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-primary-start after:rounded-full">商品</span>
              <span className="text-text-sub">评价</span>
              <span className="text-text-sub">详情</span>
            </div>
          )}

          <div className="flex space-x-3">
            <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'text-text-main' : 'bg-black/30 text-white'}`}>
              <Share size={18} />
            </button>
            <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isScrolled ? 'text-text-main' : 'bg-black/30 text-white'}`}>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHero = () => {
    if (loading) {
      return <Skeleton className="w-full aspect-square" />;
    }
    return (
      <div className="relative w-full aspect-square bg-white dark:bg-gray-900">
        <img src="https://picsum.photos/seed/product1/800/800" alt="Product" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white text-s px-2 py-1 rounded-full">
          1 / 5
        </div>
      </div>
    );
  };

  const renderPriceCard = () => {
    if (loading) {
      return (
        <Card className="m-4 p-4 space-y-3">
          <Skeleton className="w-32 h-8" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-2/3 h-4" />
        </Card>
      );
    }
    return (
      <Card className="mx-4 mt-4 p-4 rounded-t-[16px] rounded-b-none border-b border-border-light shadow-none">
        <div className="flex items-end justify-between mb-2">
          <div className="flex items-baseline text-primary-start">
            <span className="text-md font-bold">¥</span>
            <span className="text-6xl font-bold leading-none tracking-tight ml-0.5">4,999</span>
            <span className="text-md font-bold">.00</span>
            <span className="text-sm text-text-aux line-through ml-2">¥5,999.00</span>
          </div>
          <div className="flex items-center space-x-2 text-text-sub">
            <div className="flex flex-col items-center">
              <Heart size={18} />
              <span className="text-xs mt-0.5">收藏</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="solid" className="rounded-sm px-1">自营</Badge>
          <Badge variant="primary">包邮</Badge>
          <Badge variant="primary">官方保障</Badge>
          <Badge variant="default">热卖中</Badge>
        </div>

        <div 
          className="flex items-center justify-between bg-red-50/50 rounded-lg p-2 mt-2 cursor-pointer active:bg-red-50"
          onClick={() => setShowCouponModal(true)}
        >
          <div className="flex items-center space-x-2">
            <span className="text-s font-medium text-primary-start bg-red-100 px-1.5 py-0.5 rounded">满减</span>
            <span className="text-sm text-text-main">满3000减200</span>
          </div>
          <div className="flex items-center text-sm text-primary-start font-medium">
            领券 <ChevronRight size={14} />
          </div>
        </div>
      </Card>
    );
  };

  const renderTitleCard = () => {
    if (loading) {
      return (
        <Card className="mx-4 mb-4 p-4 rounded-t-none space-y-2">
          <Skeleton className="w-full h-5" />
          <Skeleton className="w-3/4 h-5" />
          <Skeleton className="w-1/2 h-4 mt-2" />
        </Card>
      );
    }
    return (
      <Card className="mx-4 mb-4 p-4 rounded-t-none shadow-soft">
        <h1 className="text-xl font-bold text-text-main leading-snug line-clamp-2 mb-2">
          Apple iPhone 15 Pro (A3104) 256GB 原色钛金属 支持移动联通电信5G 双卡双待手机
        </h1>
        <p className="text-base text-text-sub line-clamp-2 mb-3">
          【自营极速达】A17 Pro芯片，钛金属边框，4800万像素主摄，支持Type-C接口。购机享官方质保！
        </p>
        <div className="flex items-center space-x-4 text-s text-text-aux">
          <span>已售 10万+</span>
          <span>评价 5万+</span>
          <span>好评率 98%</span>
        </div>
      </Card>
    );
  };

  const renderSKUCard = () => {
    if (loading) {
      return (
        <Card className="m-4 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4 w-full">
            <Skeleton className="w-8 h-4" />
            <Skeleton className="w-48 h-4" />
          </div>
          <Skeleton className="w-4 h-4" />
        </Card>
      );
    }
    return (
      <Card className="m-4 p-4 flex justify-between items-center cursor-pointer active:bg-bg-base transition-colors" onClick={() => openSKU('select')}>
        <div className="flex items-center">
          <span className="text-base font-bold text-text-main w-10 shrink-0">已选</span>
          <span className="text-base text-text-main line-clamp-1">{selectedColor}, {selectedSize}, {quantity}件</span>
        </div>
        <ChevronRight size={16} className="text-text-aux shrink-0" />
      </Card>
    );
  };

  const renderDeliveryCard = () => {
    if (loading) {
      return (
        <Card className="m-4 p-4 space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-8 h-4" />
            <Skeleton className="w-full h-4" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="w-8 h-4" />
            <Skeleton className="w-full h-4" />
          </div>
        </Card>
      );
    }
    return (
      <Card className="m-4 p-4 space-y-4">
        <div className="flex items-start justify-between cursor-pointer active:opacity-70">
          <div className="flex items-start">
            <span className="text-base font-bold text-text-main w-10 shrink-0 mt-0.5">送至</span>
            <div className="flex flex-col">
              <div className="flex items-center text-base text-text-main mb-1">
                <MapPin size={14} className="text-primary-start mr-1" />
                <span>北京市朝阳区三里屯街道...</span>
              </div>
              <span className="text-sm text-primary-start font-medium">现货，现在至明天15:00前下单，预计明天送达</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-text-aux shrink-0 mt-0.5" />
        </div>
        
        <div className="w-full h-px bg-border-light"></div>
        
        <div 
          className="flex items-start justify-between cursor-pointer active:opacity-70"
          onClick={() => goTo('service_description')}
        >
          <div className="flex items-start">
            <span className="text-base font-bold text-text-main w-10 shrink-0 mt-0.5">服务</span>
            <div className="flex flex-wrap gap-x-3 gap-y-2">
              <span className="flex items-center text-sm text-text-sub"><CheckCircle2 size={12} className="text-primary-start mr-1" />树交所发货&售后</span>
              <span className="flex items-center text-sm text-text-sub"><CheckCircle2 size={12} className="text-primary-start mr-1" />7天无理由退货</span>
              <span className="flex items-center text-sm text-text-sub"><CheckCircle2 size={12} className="text-primary-start mr-1" />极速退款</span>
              <span className="flex items-center text-sm text-text-sub"><ShieldCheck size={12} className="text-primary-start mr-1" />正品保证</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-text-aux shrink-0 mt-0.5" />
        </div>
      </Card>
    );
  };

  const renderReviews = () => {
    if (moduleError) {
      return (
        <Card className="m-4 p-6 flex flex-col items-center justify-center">
          <RefreshCcw size={24} className="text-text-aux mb-2" />
          <p className="text-sm text-text-sub mb-3">评价加载失败</p>
          <button onClick={() => setModuleError(false)} className="px-4 py-1 border border-border-light rounded-full text-sm text-text-main">重试</button>
        </Card>
      );
    }
    if (loading) {
      return (
        <Card className="m-4 p-4 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="w-20 h-5" />
            <Skeleton className="w-16 h-4" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-16 h-4" />
            </div>
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-3/4 h-4" />
          </div>
        </Card>
      );
    }
    return (
      <Card className="m-4 p-4">
        <div 
          className="flex justify-between items-center mb-4 cursor-pointer active:opacity-70"
          onClick={() => goTo('reviews')}
        >
          <div className="flex items-center">
            <h3 className="text-lg font-bold text-text-main mr-2">用户评价</h3>
            <span className="text-sm text-text-sub">好评率 98%</span>
          </div>
          <div className="flex items-center text-sm text-text-sub">
            查看全部 <ChevronRight size={14} />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="border-b border-border-light pb-4 last:border-0 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <img src="https://picsum.photos/seed/user1/32/32" alt="User" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                <span className="text-sm text-text-main">J***客</span>
                <div className="flex text-primary-start">
                  {[1,2,3,4,5].map(i => <Star key={i} size={10} fill="currentColor" />)}
                </div>
              </div>
              <span className="text-xs text-text-aux">2023-10-24</span>
            </div>
            <p className="text-base text-text-main line-clamp-2 mb-2">
              手机非常漂亮，原色钛金属很有质感，运行速度飞快，拍照效果也特别好，非常满意的一次购物！
            </p>
            <div className="flex space-x-2 overflow-x-auto no-scrollbar">
              <img src="https://picsum.photos/seed/review1/100/100" className="w-16 h-16 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
              <img src="https://picsum.photos/seed/review2/100/100" className="w-16 h-16 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>

        <div 
          className="mt-4 pt-4 border-t border-border-light flex justify-between items-center cursor-pointer active:opacity-70"
          onClick={() => goTo('product_qa')}
        >
          <div className="flex items-center">
            <h3 className="text-md font-bold text-text-main mr-2">问大家</h3>
            <span className="text-sm text-text-sub">买过的人都在问</span>
          </div>
          <div className="flex items-center text-sm text-text-sub">
            去提问 <ChevronRight size={14} />
          </div>
        </div>
      </Card>
    );
  };

  const renderDetails = () => {
    return (
      <div className="bg-white dark:bg-gray-900 mt-4 pb-4">
        <div className="flex border-b border-border-light sticky top-12 bg-white dark:bg-gray-900 z-30">
          {['details', 'params', 'guarantee'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-md font-medium relative ${activeTab === tab ? 'text-primary-start' : 'text-text-main'}`}
            >
              {tab === 'details' ? '商品详情' : tab === 'params' ? '规格参数' : '售后保障'}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary-start rounded-full"></span>
              )}
            </button>
          ))}
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="w-full h-48" />
              <Skeleton className="w-full h-48" />
            </div>
          ) : activeTab === 'details' ? (
            <div className="space-y-2">
              <img src="https://picsum.photos/seed/detail1/800/600" className="w-full rounded-lg" referrerPolicy="no-referrer" />
              <img src="https://picsum.photos/seed/detail2/800/800" className="w-full rounded-lg" referrerPolicy="no-referrer" />
              <div className="py-4 flex justify-center">
                <button className="text-sm text-text-sub border border-border-light px-4 py-1.5 rounded-full">展开更多图文详情</button>
              </div>
            </div>
          ) : activeTab === 'params' ? (
            <div className="border border-border-light rounded-lg overflow-hidden">
              <div className="flex border-b border-border-light text-sm">
                <div className="w-1/3 bg-bg-base p-2 text-text-sub">品牌</div>
                <div className="w-2/3 p-2 text-text-main">Apple</div>
              </div>
              <div className="flex border-b border-border-light text-sm">
                <div className="w-1/3 bg-bg-base p-2 text-text-sub">商品名称</div>
                <div className="w-2/3 p-2 text-text-main">iPhone 15 Pro</div>
              </div>
              <div className="flex text-sm">
                <div className="w-1/3 bg-bg-base p-2 text-text-sub">机身颜色</div>
                <div className="w-2/3 p-2 text-text-main">原色钛金属</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-base text-text-main">
              <div>
                <h4 className="font-bold mb-1 flex items-center"><ShieldCheck size={14} className="text-primary-start mr-1" /> 厂家服务</h4>
                <p className="text-text-sub text-sm">本产品全国联保，享受三包服务，质保期为：一年质保。</p>
              </div>
              <div>
                <h4 className="font-bold mb-1 flex items-center"><CheckCircle2 size={14} className="text-primary-start mr-1" /> 承诺</h4>
                <p className="text-text-sub text-sm">树交所平台卖家销售并发货的商品，由平台卖家提供发票和相应的售后服务。请您放心购买！</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBottomBar = () => {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border-light px-2 py-2 pb-safe z-40 flex items-center justify-between">
        <div className="flex items-center space-x-4 px-2">
          <div 
            className="flex flex-col items-center cursor-pointer active:opacity-70 text-text-main"
            onClick={() => goTo('store')}
          >
            <Store size={20} className="mb-0.5" />
            <span className="text-xs">店铺</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer active:opacity-70 text-text-main"
            onClick={() => goTo('help_center')}
          >
            <MessageCircle size={20} className="mb-0.5" />
            <span className="text-xs">客服</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer active:opacity-70 text-text-main relative"
            onClick={() => goTo('cart')}
          >
            <ShoppingCart size={20} className="mb-0.5" />
            <span className="text-xs">购物车</span>
            <span className="absolute -top-1 -right-2 bg-primary-start text-white text-2xs px-1 rounded-full border border-white">2</span>
          </div>
        </div>
        
        <div className="flex space-x-2 flex-1 ml-4">
          <Button 
            variant="outline" 
            className="flex-1 h-[40px] rounded-full text-base border-primary-start text-primary-start"
            onClick={() => openSKU('cart')}
          >
            加入购物车
          </Button>
          <Button 
            className="flex-1 h-[40px] rounded-full text-base"
            onClick={() => openSKU('buy')}
          >
            立即购买
          </Button>
        </div>
      </div>
    );
  };

  const renderSKUModal = () => {
    if (!showSKU) return null;

    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowSKU(false)}></div>
        <div className="bg-white dark:bg-gray-900 rounded-t-[24px] w-full max-h-[80vh] flex flex-col relative z-10 animate-in slide-in-from-bottom duration-300">
          <button 
            onClick={() => setShowSKU(false)}
            className="absolute top-4 right-4 p-1 text-text-sub active:bg-bg-base rounded-full"
          >
            <X size={20} />
          </button>
          
          <div className="p-4 flex space-x-4 border-b border-border-light">
            <img src="https://picsum.photos/seed/product1/200/200" className="w-24 h-24 rounded-lg border border-border-light object-cover bg-white dark:bg-gray-900 -mt-8 shadow-sm" referrerPolicy="no-referrer" />
            <div className="flex flex-col justify-end pb-1">
              <div className="flex items-baseline text-primary-start mb-1">
                <span className="text-md font-bold">¥</span>
                <span className="text-5xl font-bold leading-none tracking-tight ml-0.5">4,999</span>
                <span className="text-md font-bold">.00</span>
              </div>
              <span className="text-sm text-text-sub mb-1">库存充足</span>
              <span className="text-sm text-text-main line-clamp-1">已选: {selectedColor}, {selectedSize}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <h4 className="text-md font-bold text-text-main mb-3">颜色</h4>
              <div className="flex flex-wrap gap-3">
                {['星空黑', '原色钛金属', '白色钛金属', '蓝色钛金属'].map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-1.5 rounded-full text-base border ${
                      selectedColor === color 
                        ? 'bg-red-50 border-primary-start text-primary-start font-medium' 
                        : 'bg-bg-base border-transparent text-text-main'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-md font-bold text-text-main mb-3">版本</h4>
              <div className="flex flex-wrap gap-3">
                {['128GB', '256GB', '512GB', '1TB'].map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-1.5 rounded-full text-base border ${
                      selectedSize === size 
                        ? 'bg-red-50 border-primary-start text-primary-start font-medium' 
                        : 'bg-bg-base border-transparent text-text-main'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 pb-4">
              <h4 className="text-md font-bold text-text-main">数量</h4>
              <div className="flex items-center bg-bg-base rounded-full border border-border-light">
                <button 
                  className="w-8 h-8 flex items-center justify-center text-text-main disabled:text-text-aux"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus size={14} />
                </button>
                <div className="w-10 text-center text-base font-medium text-text-main bg-white dark:bg-gray-900 h-8 flex items-center justify-center border-x border-border-light">
                  {quantity}
                </div>
                <button 
                  className="w-8 h-8 flex items-center justify-center text-text-main"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-2 pb-safe border-t border-border-light bg-white dark:bg-gray-900">
            {skuMode === 'select' ? (
              <div className="flex space-x-2 px-2">
                <Button variant="outline" className="flex-1 rounded-full border-primary-start text-primary-start" onClick={() => setShowSKU(false)}>加入购物车</Button>
                <Button className="flex-1 rounded-full" onClick={() => {
                  setShowSKU(false);
                  goTo('checkout');
                }}>立即购买</Button>
              </div>
            ) : (
              <div className="px-2">
                <Button className="w-full rounded-full" onClick={() => {
                  setShowSKU(false);
                  if (skuMode === 'buy') {
                    goTo('checkout');
                  }
                }}>确定</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative overflow-hidden">
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm z-50 absolute top-0 left-0 right-0">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}

      

      {renderHeader()}

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar pb-[60px]"
      >
        {renderHero()}
        {renderPriceCard()}
        {renderTitleCard()}
        {renderSKUCard()}
        {renderDeliveryCard()}
        {renderReviews()}
        {renderDetails()}
      </div>

      {renderBottomBar()}
      {renderSKUModal()}
      <CouponBottomSheet isOpen={showCouponModal} onClose={() => setShowCouponModal(false)} />
    </div>
  );
};
