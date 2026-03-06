import React, { useState, useEffect } from 'react';
import { useAppNavigate } from '../../lib/navigation';
import { Search, ChevronRight, Copy, Package, Truck, Clock, ShieldCheck, AlertCircle, FileText, CheckCircle2, WifiOff, RefreshCcw, FileX, ArrowLeft, MapPin } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { BottomTab } from '../../components/layout/BottomTab';
import { Skeleton } from '../../components/ui/Skeleton';

const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const baseStyle = "h-[32px] rounded-full font-medium text-base px-4 flex items-center justify-center transition-opacity active:opacity-80";
  const variants: any = {
    primary: "bg-gradient-to-r from-primary-start to-primary-end text-white shadow-sm",
    secondary: "bg-bg-card text-text-main border border-border-light shadow-sm",
    outline: "bg-transparent border border-primary-start text-primary-start",
    ghost: "bg-transparent text-text-sub",
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const OrderPage = () => {
  const { goTo } = useAppNavigate();
  const [orderType, setOrderType] = useState<'mall' | 'collectible'>('mall');
  const [mallTab, setMallTab] = useState('全部');
  const [collectibleTab, setCollectibleTab] = useState('全部');
  const [selectedOrder, setSelectedOrder] = useState<any>(null); // For detail view

  // States for demonstration
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  const [emptyList, setEmptyList] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [orderType, mallTab, collectibleTab]);

  const mallTabs = ['全部', '待付款', '待发货', '待收货', '已完成', '售后'];
  const collectibleTabs = ['全部', '交易中', '待交割', '已完成', '已取消', '申诉'];

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    alert('订单号已复制');
  };

  const renderMallOrderCard = (i: number) => (
    <Card key={i} className="mb-3 p-0 overflow-hidden cursor-pointer" onClick={() => goTo('order_detail')}>
      <div className="px-3 py-2.5 border-b border-border-light flex justify-between items-center bg-bg-base/50">
        <div className="flex items-center">
          <span className="bg-primary-start text-white text-xs px-1 rounded mr-1.5 font-medium leading-tight">自营</span>
          <span className="text-base font-bold text-text-main">树交所官方自营旗舰店</span>
          <ChevronRight size={14} className="text-text-aux ml-0.5" />
        </div>
        <span className="text-base text-primary-start font-medium">待付款</span>
      </div>
      <div className="p-3">
        <div className="flex space-x-3 mb-3">
          <div className="w-[72px] h-[72px] rounded-lg bg-bg-base overflow-hidden shrink-0 border border-border-light">
            <img src={`https://picsum.photos/seed/order${i}/150/150`} alt="Product" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1 flex flex-col">
            <div className="text-base text-text-main line-clamp-2 leading-tight mb-1">
              Apple iPhone 15 Pro (A2849) 256GB 蓝色钛金属 支持移动联通电信5G 双卡双待手机
            </div>
            <div className="text-s text-text-aux bg-bg-base inline-block self-start px-1.5 py-0.5 rounded mb-auto">
              颜色：蓝色钛金属 / 容量：256GB
            </div>
            <div className="flex justify-between items-end mt-1">
              <div className="text-lg font-bold text-text-main leading-none">
                <span className="text-s">¥</span>7999.00
              </div>
              <div className="text-sm text-text-aux">x1</div>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mb-3 text-s text-text-sub">
          <div className="flex items-center">
            订单号: 28394018239 <Copy size={10} className="ml-1 cursor-pointer" onClick={(e) => handleCopy(e, '28394018239')} />
          </div>
          <div>
            应付金额: <span className="text-md font-bold text-primary-start">¥7999.00</span>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-3 border-t border-border-light" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" className="text-sm h-[28px] px-3">取消订单</Button>
          <Button variant="secondary" className="text-sm h-[28px] px-3" onClick={() => goTo('logistics')}>查看物流</Button>
          <Button 
            className="text-sm h-[28px] px-3"
            onClick={() => goTo('cashier')}
          >去付款</Button>
        </div>
      </div>
    </Card>
  );

  const renderCollectibleOrderCard = (i: number) => (
    <Card key={i} className="mb-3 p-0 overflow-hidden cursor-pointer" onClick={() => setSelectedOrder({ type: 'collectible', id: i })}>
      <div className="px-3 py-2.5 border-b border-border-light flex justify-between items-center bg-bg-base/50">
        <div className="flex items-center">
          <span className="bg-purple-500 text-white text-xs px-1 rounded mr-1.5 font-medium leading-tight">藏品</span>
          <span className="text-base font-bold text-text-main">国家博物馆数字文创</span>
          <ChevronRight size={14} className="text-text-aux ml-0.5" />
        </div>
        <span className="text-base text-orange-500 font-medium">撮合中</span>
      </div>
      <div className="px-3 py-2 bg-orange-50 text-orange-600 text-s flex items-center">
        <Clock size={12} className="mr-1" /> 预计在 24 小时内完成撮合交割
      </div>
      <div className="p-3">
        <div className="flex space-x-3 mb-3">
          <div className="w-[72px] h-[72px] rounded-lg bg-bg-base overflow-hidden shrink-0 border border-border-light">
            <img src={`https://picsum.photos/seed/col${i}/150/150`} alt="Collectible" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1 flex flex-col">
            <div className="text-md font-bold text-text-main line-clamp-1 leading-tight mb-1">
              四羊方尊 3D数字复刻版
            </div>
            <div className="text-s text-text-aux mb-auto">
              编号: #1024 / 发行量: 5000
            </div>
            <div className="flex justify-between items-end mt-1">
              <div className="text-lg font-bold text-text-main leading-none">
                <span className="text-s">¥</span>299.00
              </div>
              <div className="text-sm text-text-aux">1 份</div>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mb-3 text-s text-text-sub">
          <div className="flex items-center">
            交易单号: T993820192 <Copy size={10} className="ml-1 cursor-pointer" onClick={(e) => handleCopy(e, 'T993820192')} />
          </div>
          <div>
            合计金额: <span className="text-md font-bold text-text-main">¥299.00</span>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-3 border-t border-border-light" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" className="text-sm h-[28px] px-3">取消交易</Button>
          <Button variant="outline" className="text-sm h-[28px] px-3 border-text-main text-text-main">查看详情</Button>
        </div>
      </div>
    </Card>
  );

  const renderOrderDetail = () => {
    if (!selectedOrder || selectedOrder.type === 'mall') return null;
    const isMall = false;

    return (
      <div className="absolute inset-0 bg-bg-base z-50 flex flex-col overflow-hidden">
        {/* Detail Header */}
        <div className="bg-bg-card px-4 py-3 flex items-center justify-between border-b border-border-light">
          <button onClick={() => setSelectedOrder(null)} className="text-text-main p-1 -ml-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-text-main">订单详情</h1>
          <div className="w-6"></div> {/* Spacer */}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-[80px]">
          {/* Status Header */}
          <div className="bg-gradient-to-r from-primary-start to-primary-end p-6 text-white">
            <h2 className="text-4xl font-bold mb-1">撮合交易中</h2>
            <p className="text-sm opacity-90">系统正在为您匹配最优交易对手</p>
          </div>

          {/* Progress / Address */}
          <Card className="mx-4 -mt-4 relative z-10 mb-3 p-4">
            <div className="flex justify-between items-center mb-4 relative">
              <div className="absolute top-1/2 left-4 right-4 h-px bg-border-light -z-10"></div>
              <div className="flex flex-col items-center bg-bg-card px-1">
                <div className="w-4 h-4 rounded-full bg-primary-start flex items-center justify-center text-white mb-1"><CheckCircle2 size={10} /></div>
                <span className="text-xs text-primary-start">已下单</span>
              </div>
              <div className="flex flex-col items-center bg-bg-card px-1">
                <div className="w-4 h-4 rounded-full bg-primary-start flex items-center justify-center text-white mb-1"><Clock size={10} /></div>
                <span className="text-xs text-primary-start">撮合中</span>
              </div>
              <div className="flex flex-col items-center bg-bg-card px-1">
                <div className="w-4 h-4 rounded-full bg-border-light mb-1"></div>
                <span className="text-xs text-text-aux">待交割</span>
              </div>
              <div className="flex flex-col items-center bg-bg-card px-1">
                <div className="w-4 h-4 rounded-full bg-border-light mb-1"></div>
                <span className="text-xs text-text-aux">已完成</span>
              </div>
            </div>
            <div className="bg-bg-base rounded-lg p-3 text-s text-text-sub">
              <p className="mb-1"><span className="text-text-main">2026-02-27 10:00:00</span> 订单已提交，等待系统撮合</p>
              <p><span className="text-text-main">2026-02-27 10:05:00</span> 正在为您寻找匹配的卖家份额...</p>
            </div>
          </Card>

          {/* Item Info */}
          <Card className="mx-4 mb-3 p-0 overflow-hidden">
            <div className="px-3 py-3 border-b border-border-light flex items-center">
              <span className="text-white text-xs px-1 rounded mr-1.5 font-medium leading-tight bg-purple-500">
                藏品
              </span>
              <span className="text-base font-bold text-text-main">国家博物馆数字文创</span>
            </div>
            <div className="p-3 flex space-x-3">
              <div className="w-[72px] h-[72px] rounded-lg bg-bg-base overflow-hidden shrink-0 border border-border-light">
                <img src={`https://picsum.photos/seed/detail${selectedOrder.id}/150/150`} alt="Item" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="text-base text-text-main line-clamp-2 leading-tight mb-1">
                  四羊方尊 3D数字复刻版
                </div>
                <div className="text-s text-text-aux mb-auto">
                  编号: #1024 / 发行量: 5000
                </div>
                <div className="flex justify-between items-end mt-1">
                  <div className="text-lg font-bold text-text-main leading-none">
                    <span className="text-s">¥</span>299.00
                  </div>
                  <div className="text-sm text-text-aux">x1</div>
                </div>
              </div>
            </div>
            <div className="px-3 py-2 bg-bg-base border-t border-border-light flex justify-between items-center">
              <span className="text-sm text-text-main flex items-center"><ShieldCheck size={14} className="mr-1 text-green-500" /> 确权证书</span>
              <span className="text-sm text-text-aux flex items-center cursor-pointer">查看 <ChevronRight size={12} /></span>
            </div>
          </Card>

          {/* Order Info */}
          <Card className="mx-4 mb-4 p-3 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">订单编号</span>
              <span className="text-text-main flex items-center">28394018239 <Copy size={10} className="ml-1 text-text-aux cursor-pointer" onClick={(e) => handleCopy(e, '28394018239')} /></span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">下单时间</span>
              <span className="text-text-main">2026-02-27 10:00:00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">支付方式</span>
              <span className="text-text-main">在线支付</span>
            </div>
            <div className="h-px bg-border-light my-1"></div>
            <div className="flex justify-between text-sm">
              <span className="text-text-sub">商品总额</span>
              <span className="text-text-main">¥299.00</span>
            </div>
            <div className="flex justify-between text-md font-bold pt-1">
              <span className="text-text-main">应付金额</span>
              <span className="text-primary-start">¥299.00</span>
            </div>
          </Card>
        </div>

        {/* Detail Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-bg-card border-t border-border-light p-3 pb-safe flex justify-end space-x-3">
          <Button 
            variant="secondary" 
            className="h-[36px] px-5"
            onClick={() => goTo('help_center')}
          >联系客服</Button>
          <Button variant="secondary" className="h-[36px] px-5">取消交易</Button>
        </div>
      </div>
    );
  };

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
      <div className="bg-bg-card px-4 py-3 flex items-center justify-between border-b border-border-light sticky top-0 z-40">
        <div className="w-6"></div> {/* Spacer for balance */}
        <h1 className="text-3xl font-bold text-text-main">订单</h1>
        <button 
          className="text-text-main p-1 -mr-1 active:opacity-70"
          onClick={() => goTo('search')}
        >
          <Search size={20} />
        </button>
      </div>

      

      {/* Primary Segmented Control */}
      <div className="bg-bg-card px-4 py-3 border-b border-border-light">
        <div className="flex bg-bg-base rounded-lg p-1">
          <button
            className={`flex-1 py-1.5 text-md font-medium rounded-md transition-colors ${orderType === 'mall' ? 'bg-white dark:bg-gray-900 text-primary-start shadow-sm' : 'text-text-sub'}`}
            onClick={() => setOrderType('mall')}
          >
            商城订单
          </button>
          <button
            className={`flex-1 py-1.5 text-md font-medium rounded-md transition-colors ${orderType === 'collectible' ? 'bg-white dark:bg-gray-900 text-primary-start shadow-sm' : 'text-text-sub'}`}
            onClick={() => setOrderType('collectible')}
          >
            藏品订单
          </button>
        </div>
      </div>

      {/* Secondary Tabs */}
      <div className="bg-bg-card border-b border-border-light">
        <div className="flex overflow-x-auto no-scrollbar px-2">
          {orderType === 'mall' ? (
            mallTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setMallTab(tab)}
                className={`px-4 py-3 text-base whitespace-nowrap relative ${mallTab === tab ? 'text-primary-start font-bold' : 'text-text-main'}`}
              >
                {tab}
                {mallTab === tab && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[3px] bg-primary-start rounded-t-full"></div>}
              </button>
            ))
          ) : (
            collectibleTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setCollectibleTab(tab)}
                className={`px-4 py-3 text-base whitespace-nowrap relative ${collectibleTab === tab ? 'text-primary-start font-bold' : 'text-text-main'}`}
              >
                {tab}
                {collectibleTab === tab && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[3px] bg-primary-start rounded-t-full"></div>}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Order List Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-4">
        {moduleError ? (
          <Card className="flex flex-col items-center justify-center py-10 border border-border-light">
            <RefreshCcw size={32} className="text-text-aux mb-3" />
            <p className="text-md text-text-sub mb-4">订单数据加载失败</p>
            <Button variant="outline" onClick={() => setModuleError(false)} className="h-[32px] px-6">重试</Button>
          </Card>
        ) : emptyList ? (
          <Card className="flex flex-col items-center justify-center py-12 border border-border-light bg-transparent shadow-none">
            <FileX size={48} className="text-text-aux mb-4 opacity-50" strokeWidth={1.5} />
            <p className="text-md text-text-sub mb-5">
              {orderType === 'mall' ? '暂无商城订单，去逛逛自营商城' : '暂无藏品订单，去确权中心看看'}
            </p>
            <Button 
              variant="outline" 
              className="h-[36px] px-6 rounded-full border-primary-start text-primary-start"
              onClick={() => goTo(orderType === 'mall' ? 'store' : 'shield')}
            >
              {orderType === 'mall' ? '去商城' : '去确权中心'}
            </Button>
          </Card>
        ) : loading ? (
          // Skeleton Loading
          [1, 2, 3].map(i => (
            <Card key={i} className="mb-3 p-0 overflow-hidden">
              <div className="px-3 py-3 border-b border-border-light flex justify-between items-center">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-12 h-4" />
              </div>
              <div className="p-3">
                <div className="flex space-x-3 mb-3">
                  <Skeleton className="w-[72px] h-[72px] rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-2/3 h-4" />
                    <Skeleton className="w-1/3 h-3 mt-2" />
                  </div>
                </div>
                <div className="flex justify-between mb-3">
                  <Skeleton className="w-32 h-3" />
                  <Skeleton className="w-16 h-4" />
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t border-border-light">
                  <Skeleton className="w-20 h-[28px] rounded-full" />
                  <Skeleton className="w-20 h-[28px] rounded-full" />
                </div>
              </div>
            </Card>
          ))
        ) : (
          // Actual Order List
          orderType === 'mall' ? (
            [1, 2, 3].map(i => renderMallOrderCard(i))
          ) : (
            [1, 2].map(i => renderCollectibleOrderCard(i))
          )
        )}
      </div>

      {/* Detail View Overlay */}
      {renderOrderDetail()}
    </div>
  );
};
