import React, { useState, useEffect } from 'react';
import { useAppNavigate } from '../../lib/navigation';
import { Search, MessageSquare, Grid, Zap, Ticket, Gift, Flame, Award, FileText, MapPin, ChevronRight, ShoppingCart, ShieldCheck, Clock, CheckCircle2, WifiOff, RefreshCcw, FileX } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { BottomTab } from '../../components/layout/BottomTab';
import { Skeleton } from '../../components/ui/Skeleton';

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

export const StorePage = () => {
  const { goTo } = useAppNavigate();
  // States for demonstration
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(true);
  const [emptyFeed, setEmptyFeed] = useState(false);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const kingKongItems = [
    { icon: Grid, label: '全部分类' },
    { icon: Zap, label: '限时秒杀' },
    { icon: Ticket, label: '领券中心' },
    { icon: Gift, label: '新人专享' },
    { icon: Flame, label: '热卖排行' },
    { icon: Award, label: '品牌闪购' },
    { icon: FileText, label: '我的订单' },
    { icon: MapPin, label: '地址/客服' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative overflow-hidden">
      {/* Offline Banner */}
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm z-50">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg-base/95 px-4 py-2 flex items-center space-x-3 border-b border-border-light">
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="bg-primary-start text-white text-xs font-bold px-1.5 py-0.5 rounded leading-none">
            树交所
            <br/>
            自营
          </div>
        </div>
        <div 
          className="flex-1 h-8 bg-bg-card rounded-full flex items-center px-3 shadow-sm border border-border-light cursor-text"
          onClick={() => goTo('search')}
        >
          <Search size={14} className="text-text-aux mr-2 shrink-0" />
          <span className="text-sm text-text-aux truncate">搜索商品 / SKU / 关键词</span>
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          <button 
            className="flex items-center justify-center w-8 h-8 text-text-main relative active:opacity-70"
            onClick={() => goTo('cart')}
          >
            <ShoppingCart size={20} />
          </button>
          <button 
            className="flex items-center justify-center w-8 h-8 text-text-main relative active:opacity-70"
            onClick={() => goTo('message_center')}
          >
            <MessageSquare size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-start rounded-full border border-bg-base"></span>
          </button>
        </div>
      </div>

      

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        
        {/* King Kong Area (8 Grid) */}
        <div className="grid grid-cols-4 gap-y-4 px-4 mt-4 mb-4">
          {kingKongItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index} 
                className="flex flex-col items-center cursor-pointer active:opacity-70 transition-opacity"
                onClick={() => {
                  if (item.label === '全部分类') {
                    goTo('category');
                  } else if (item.label === '领券中心') {
                    goTo('coupon');
                  } else if (item.label === '我的订单') {
                    goTo('order');
                  } else if (item.label === '地址/客服') {
                    goTo('help_center');
                  }
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-bg-card shadow-sm flex items-center justify-center mb-1.5 text-text-main">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <span className="text-sm text-text-main">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Main Banner */}
        <div className="px-4 mb-4">
          {loading ? (
            <Skeleton className="w-full h-[100px] rounded-2xl" />
          ) : (
            <div className="rounded-2xl bg-gradient-to-r from-primary-start to-primary-end p-4 relative overflow-hidden shadow-soft flex items-center justify-between h-[100px]">
              <div className="relative z-10">
                <h2 className="text-white font-bold text-4xl mb-1">自营精选</h2>
                <p className="text-white/90 text-sm">官方保障 · 极速发货</p>
              </div>
              <button className="bg-white dark:bg-gray-900 text-primary-start text-sm font-bold px-3 py-1.5 rounded-full shadow-sm relative z-10">
                去逛逛
              </button>
            </div>
          )}
        </div>

        {/* Service Guarantees */}
        <div className="px-4 mb-3 flex justify-between items-center text-s text-text-sub">
          <span className="flex items-center"><CheckCircle2 size={12} className="text-primary-start mr-1" /> 自营保障</span>
          <span className="flex items-center"><CheckCircle2 size={12} className="text-primary-start mr-1" /> 极速发货</span>
          <span className="flex items-center"><CheckCircle2 size={12} className="text-primary-start mr-1" /> 售后无忧</span>
        </div>

        {/* Coupons Module */}
        <div className="px-4 mb-4">
          {loading ? (
            <Skeleton className="w-full h-[70px] rounded-xl" />
          ) : (
            <div className="bg-bg-card rounded-xl p-3 shadow-soft border border-border-light flex items-center">
              <div className="flex-1 flex items-center border-r border-border-light border-dashed pr-3">
                <div className="text-primary-start font-bold mr-2">
                  <span className="text-md">¥</span><span className="text-5xl leading-none">100</span>
                </div>
                <div>
                  <div className="text-base font-bold text-text-main">满199可用</div>
                  <div className="text-xs text-text-aux">自营全品类通用</div>
                </div>
              </div>
              <div className="pl-3 shrink-0">
                <button className="bg-primary-start text-white text-sm font-medium px-3 py-1.5 rounded-full">
                  立即领取
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Flash Sale */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <h3 className="text-xl font-bold text-text-main mr-2">限时秒杀</h3>
              <div className="flex items-center space-x-1 text-xs font-mono">
                <span className="bg-primary-start text-white px-1.5 py-0.5 rounded">10点场</span>
                <span className="text-primary-start font-bold">01:45:22</span>
              </div>
            </div>
            <span className="text-sm text-text-aux flex items-center">更多 <ChevronRight size={12} /></span>
          </div>
          
          {moduleError ? (
            <Card className="flex flex-col items-center justify-center py-6 border border-border-light">
              <RefreshCcw size={24} className="text-text-aux mb-2" />
              <p className="text-base text-text-sub mb-3">模块加载失败</p>
              <button onClick={() => setModuleError(false)} className="px-4 py-1.5 border border-border-light rounded-full text-sm text-text-main">重试</button>
            </Card>
          ) : (
            <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="w-[100px] shrink-0 space-y-2">
                    <Skeleton className="w-full aspect-square rounded-xl" />
                    <Skeleton className="w-3/4 h-3" />
                    <Skeleton className="w-1/2 h-4" />
                  </div>
                ))
              ) : (
                [1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="w-[100px] shrink-0 flex flex-col cursor-pointer active:opacity-70 transition-opacity"
                    onClick={() => goTo('product_detail')}
                  >
                    <div className="w-full aspect-square bg-bg-card rounded-xl mb-2 overflow-hidden shadow-sm border border-border-light">
                      <img src={`https://picsum.photos/seed/jdflash${i}/150/150`} alt="Product" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="text-sm text-text-main line-clamp-1 mb-1">Apple iPhone 15</div>
                    <div className="text-lg font-bold text-primary-start leading-none mb-1">
                      <span className="text-s">¥</span>5999
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-text-aux line-through">¥6999</div>
                      <div className="text-xs text-text-aux">已抢80%</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Today's Picks / Feed */}
        <div className="px-4 mb-4">
          <h3 className="text-xl font-bold text-text-main mb-3 flex items-center justify-center">
            <span className="w-4 h-px bg-border-light mr-2"></span>
            今日精选
            <span className="w-4 h-px bg-border-light ml-2"></span>
          </h3>
          
          {emptyFeed ? (
            <Card className="flex flex-col items-center justify-center py-10 border border-border-light">
              <FileX size={40} className="text-text-aux mb-3 opacity-50" strokeWidth={1.5} />
              <p className="text-md text-text-sub mb-4">暂无商品推荐，去分类看看</p>
              <button 
                className="px-5 py-2 border border-primary-start text-primary-start rounded-full text-base font-medium active:bg-red-50 transition-colors"
                onClick={() => goTo('category')}
              >
                去分类
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-bg-card rounded-2xl overflow-hidden shadow-soft border border-border-light flex flex-col">
                    <Skeleton className="w-full aspect-square rounded-none" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="w-full h-3" />
                      <Skeleton className="w-2/3 h-3" />
                      <Skeleton className="w-1/2 h-4 mt-2" />
                    </div>
                  </div>
                ))
              ) : (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <div 
                    key={i} 
                    className="bg-bg-card rounded-2xl overflow-hidden shadow-soft border border-border-light flex flex-col cursor-pointer active:opacity-70 transition-opacity"
                    onClick={() => goTo('product_detail')}
                  >
                    <img src={`https://picsum.photos/seed/jdprod${i}/200/200`} alt="Product" className="w-full aspect-square object-cover" referrerPolicy="no-referrer" />
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="text-base text-text-main line-clamp-2 mb-2 leading-tight">
                        <span className="inline-block bg-primary-start text-white text-xs px-1 rounded mr-1 font-medium">自营</span>
                        Sony/索尼 WH-1000XM5 头戴式无线降噪耳机 蓝牙耳机
                      </div>
                      <div className="flex flex-wrap gap-1 mb-auto pb-2">
                        <span className="text-xs text-primary-start border border-primary-start/30 rounded px-1">包邮</span>
                        <span className="text-xs text-primary-start border border-primary-start/30 rounded px-1">官方</span>
                        <span className="text-xs text-primary-start border border-primary-start/30 rounded px-1">热卖</span>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <div className="flex flex-col">
                          <div className="text-xl font-bold text-primary-start leading-none mb-1">
                            <span className="text-sm">¥</span>2499
                          </div>
                          <div className="text-xs text-text-aux">已售1万+</div>
                        </div>
                        <button className="w-7 h-7 rounded-full bg-bg-base border border-border-light flex items-center justify-center text-text-main active:bg-border-light transition-colors">
                          <ShoppingCart size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
