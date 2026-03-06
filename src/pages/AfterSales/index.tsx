import React, { useState, useEffect } from 'react';
import { ChevronLeft, WifiOff, AlertCircle, Package, ChevronRight, Camera, CheckCircle2, Clock, HeadphonesIcon, FileText, RefreshCcw, Store } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';

interface AfterSalesItem {
  id: string;
  orderId: string;
  type: '退货退款' | '仅退款' | '换货';
  status: '处理中' | '已完成' | '已关闭';
  subStatus: string;
  amount: number;
  time: string;
  product: {
    title: string;
    sku: string;
    image: string;
  };
}

const MOCK_LIST: AfterSalesItem[] = [
  {
    id: 'AS123456789',
    orderId: 'JD987654321',
    type: '退货退款',
    status: '处理中',
    subStatus: '商家审核中',
    amount: 7999.00,
    time: '2026-02-28 10:00:00',
    product: {
      title: 'Apple iPhone 15 Pro (A3104) 256GB 蓝色钛金属 支持移动联通电信5G 双卡双待手机',
      sku: '蓝色钛金属, 256GB',
      image: 'https://picsum.photos/seed/iphone/200/200',
    }
  },
  {
    id: 'AS987654321',
    orderId: 'JD123456789',
    type: '仅退款',
    status: '已完成',
    subStatus: '退款成功',
    amount: 199.00,
    time: '2026-02-20 15:30:00',
    product: {
      title: '罗马仕 20000毫安充电宝 22.5W超级快充',
      sku: '白色, 20000mAh',
      image: 'https://picsum.photos/seed/powerbank/200/200',
    }
  }
];

const MOCK_TIMELINE = [
  { title: '商家审核中', desc: '您的售后申请已提交，等待商家审核。', time: '2026-02-28 10:05:00', active: true },
  { title: '买家发起申请', desc: '发起了退货退款申请，原因：商品降价', time: '2026-02-28 10:00:00', active: false },
];

export const AfterSalesPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [view, setView] = useState<'list' | 'entry' | 'apply' | 'detail'>('list');
  const [activeTab, setActiveTab] = useState<'processing' | 'completed' | 'closed'>('processing');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  
  const [selectedService, setSelectedService] = useState<'退货退款' | '仅退款' | '换货' | null>(null);

  useEffect(() => {
    fetchData();
  }, [view, activeTab]);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      if (Math.random() < 0.1) {
        setError(true);
      }
      setLoading(false);
    }, 600);
  };

  const handleBack = () => {
    if (view === 'apply') {
      setView('entry');
    } else if (view === 'entry' || view === 'detail') {
      setView('list');
    } else {
      goBack();
    }
  };

  const renderHeader = (title: string) => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-border-light">
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}
      <div className="h-12 flex items-center justify-between px-3 pt-safe">
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-text-main text-center w-1/3">{title}</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm animate-pulse">
          <div className="flex justify-between mb-3">
            <div className="w-32 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
            <div className="w-16 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
          </div>
          <div className="flex mb-3">
            <div className="w-[72px] h-[72px] bg-gray-100 dark:bg-gray-800 rounded-lg mr-3 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="w-full h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
              <div className="w-2/3 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="w-24 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
            <div className="w-20 h-7 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderEmpty = () => (
    <EmptyState message="暂无售后记录" />
  );

  const renderList = () => {
    const filteredList = MOCK_LIST.filter(item => {
      if (activeTab === 'processing') return item.status === '处理中';
      if (activeTab === 'completed') return item.status === '已完成';
      if (activeTab === 'closed') return item.status === '已关闭';
      return true;
    });

    return (
      <div className="flex-1 flex flex-col relative h-full">
        {renderHeader('退换/售后')}
        
        {/* Tabs */}
        <div className="flex px-4 h-11 relative border-b border-border-light bg-white dark:bg-gray-900 shrink-0">
          {[
            { id: 'processing', label: '处理中' },
            { id: 'completed', label: '已完成' },
            { id: 'closed', label: '已关闭' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 flex justify-center items-center text-md font-medium transition-colors relative ${
                activeTab === tab.id ? 'text-primary-start' : 'text-text-sub'
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary-start rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading ? renderSkeleton() : error ? renderError() : filteredList.length === 0 ? renderEmpty() : (
            <div className="p-3 space-y-3">
              {filteredList.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-border-light/50">
                    <div className="flex items-center text-sm text-text-sub">
                      <Store size={14} className="mr-1" />
                      <span>树交所自营</span>
                      <ChevronRight size={12} className="ml-0.5" />
                    </div>
                    <span className={`text-base font-medium ${item.status === '处理中' ? 'text-primary-start' : 'text-text-sub'}`}>
                      {item.subStatus}
                    </span>
                  </div>
                  
                  <div className="flex mb-3">
                    <img src={item.product.image} alt={item.product.title} className="w-[72px] h-[72px] rounded-lg mr-3 border border-border-light/50" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base text-text-main line-clamp-2 leading-snug mb-1">{item.product.title}</h3>
                      <div className="text-s text-text-sub">{item.product.sku}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1">
                    <div className="text-sm text-text-main flex items-center">
                      <span className="bg-gray-100 dark:bg-gray-800 text-text-sub px-1.5 py-0.5 rounded text-xs mr-2">{item.type}</span>
                      {item.type !== '换货' && (
                        <>退款: <span className="font-bold ml-1">¥{item.amount.toFixed(2)}</span></>
                      )}
                    </div>
                    <button 
                      onClick={() => setView('detail')}
                      className="px-4 py-1.5 rounded-full border border-border-main text-sm text-text-main active:bg-gray-50 dark:bg-gray-800 transition-colors"
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEntry = () => {
    const product = MOCK_LIST[0].product;
    return (
      <div className="flex-1 flex flex-col relative h-full">
        {renderHeader('选择售后类型')}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
          {/* Product Info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-3 shadow-sm flex items-center">
            <img src={product.image} alt={product.title} className="w-[60px] h-[60px] rounded-lg mr-3 border border-border-light/50" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base text-text-main line-clamp-2 leading-snug mb-1">{product.title}</h3>
              <div className="text-s text-text-sub">{product.sku}</div>
            </div>
          </div>
          
          <h3 className="text-md font-bold text-text-main mb-3 px-1 mt-4">选择服务类型</h3>
          
          <div className="space-y-3">
            <div 
              className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm flex items-center justify-between active:bg-gray-50 dark:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => { setSelectedService('退货退款'); setView('apply'); }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-3 text-primary-start shrink-0">
                  <Package size={20} />
                </div>
                <div>
                  <div className="text-lg font-bold text-text-main mb-1">退货退款</div>
                  <div className="text-sm text-text-sub">已收到货，需要退换已收到的货物</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-aux shrink-0" />
            </div>

            <div 
              className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm flex items-center justify-between active:bg-gray-50 dark:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => { setSelectedService('仅退款'); setView('apply'); }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mr-3 text-orange-500 shrink-0">
                  <span className="text-3xl font-bold">¥</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-text-main mb-1">仅退款</div>
                  <div className="text-sm text-text-sub">未收到货，或与卖家协商同意前提下</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-aux shrink-0" />
            </div>

            <div 
              className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm flex items-center justify-between active:bg-gray-50 dark:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => { setSelectedService('换货'); setView('apply'); }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3 text-blue-500 shrink-0">
                  <RefreshCcw size={20} />
                </div>
                <div>
                  <div className="text-lg font-bold text-text-main mb-1">换货</div>
                  <div className="text-sm text-text-sub">商品存在质量问题，联系卖家换货</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-aux shrink-0" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderApply = () => {
    const product = MOCK_LIST[0].product;
    return (
      <div className="flex-1 flex flex-col relative h-full bg-bg-base">
        {renderHeader('申请售后')}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 pb-24">
          {/* Product Info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-3 shadow-sm flex items-center">
            <img src={product.image} alt={product.title} className="w-[60px] h-[60px] rounded-lg mr-3 border border-border-light/50" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base text-text-main line-clamp-2 leading-snug mb-1">{product.title}</h3>
              <div className="text-s text-text-sub">{product.sku}</div>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-3 shadow-sm flex justify-between items-center active:bg-gray-50 dark:bg-gray-800 cursor-pointer">
            <span className="text-md text-text-main font-medium">申请原因</span>
            <div className="flex items-center text-base text-text-sub">
              <span>请选择申请原因</span>
              <ChevronRight size={16} className="ml-1" />
            </div>
          </div>

          {/* Amount */}
          {selectedService !== '换货' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-3 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-md text-text-main font-medium">退款金额</span>
                <span className="text-xl text-primary-start font-bold">¥7999.00</span>
              </div>
              <div className="text-s text-text-sub bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg">
                不可修改，最多¥7999.00，含发货邮费¥0.00
              </div>
            </div>
          )}

          {/* Description & Upload */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-3 shadow-sm">
            <span className="text-md text-text-main font-medium mb-3 block">补充描述和凭证</span>
            <textarea 
              className="w-full h-24 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-base text-text-main placeholder:text-text-aux outline-none resize-none mb-3" 
              placeholder="补充描述，有助于商家更好的处理售后问题"
            ></textarea>
            <div className="flex flex-wrap gap-2">
              <div className="w-[72px] h-[72px] bg-gray-50 dark:bg-gray-800 border border-dashed border-border-light rounded-lg flex flex-col items-center justify-center text-text-aux active:bg-gray-100 dark:bg-gray-800 cursor-pointer">
                <Camera size={24} className="mb-1" />
                <span className="text-xs">上传凭证</span>
              </div>
            </div>
            <div className="text-s text-text-sub mt-3">最多上传3张，支持JPG、PNG格式</div>
          </div>
        </div>

        {/* Bottom Submit */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-border-light pb-safe">
          <button 
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                setView('list');
              }, 800);
            }}
            className="w-full h-11 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white text-lg font-medium shadow-sm active:opacity-80"
          >
            提交申请
          </button>
        </div>
      </div>
    );
  };

  const renderDetail = () => {
    return (
      <div className="flex-1 flex flex-col relative h-full bg-bg-base">
        {renderHeader('售后详情')}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 pb-24">
          {/* Status Header */}
          <div className="bg-gradient-to-r from-primary-start to-primary-end rounded-xl p-5 mb-3 text-white shadow-sm">
            <div className="flex items-center mb-2">
              <Clock size={20} className="mr-2" />
              <span className="text-3xl font-bold">商家审核中</span>
            </div>
            <div className="text-sm opacity-90">商家将在 23小时59分 内处理</div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-3 shadow-sm">
            <div className="text-md font-bold text-text-main mb-4">进度追踪</div>
            <div className="relative pl-4">
              {MOCK_TIMELINE.map((item, idx) => (
                <div key={idx} className="mb-6 last:mb-0 relative">
                  {/* Line */}
                  {idx !== MOCK_TIMELINE.length - 1 && (
                    <div className="absolute left-[-11px] top-[14px] bottom-[-24px] w-px bg-border-light"></div>
                  )}
                  {/* Dot */}
                  <div className={`absolute left-[-14px] top-[4px] w-[7px] h-[7px] rounded-full ${item.active ? 'bg-primary-start ring-4 ring-red-50' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                  
                  <div className={`text-md font-medium mb-1 ${item.active ? 'text-text-main' : 'text-text-sub'}`}>{item.title}</div>
                  <div className={`text-sm mb-1.5 ${item.active ? 'text-text-main' : 'text-text-sub'}`}>{item.desc}</div>
                  <div className="text-s text-text-aux">{item.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-3 shadow-sm">
            <div className="text-md font-bold text-text-main mb-3">售后信息</div>
            <div className="space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-text-sub">服务单号</span>
                <span className="text-text-main flex items-center">
                  AS123456789
                  <span className="ml-2 text-primary-start text-s px-1.5 py-0.5 bg-red-50 rounded">复制</span>
                </span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-text-sub">申请时间</span>
                <span className="text-text-main">2026-02-28 10:00:00</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-text-sub">售后类型</span>
                <span className="text-text-main">退货退款</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-text-sub">申请原因</span>
                <span className="text-text-main">商品降价</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-text-sub">退款金额</span>
                <span className="text-primary-start font-medium">¥7999.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-border-light pb-safe flex space-x-3">
          <button className="flex-1 h-10 rounded-full border border-border-main text-text-main text-md font-medium flex items-center justify-center active:bg-gray-50 dark:bg-gray-800 transition-colors">
            <HeadphonesIcon size={16} className="mr-1.5" /> 联系客服
          </button>
          <button className="flex-1 h-10 rounded-full border border-border-main text-text-main text-md font-medium active:bg-gray-50 dark:bg-gray-800 transition-colors">
            取消申请
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative h-full overflow-hidden">
      {view === 'list' && renderList()}
      {view === 'entry' && renderEntry()}
      {view === 'apply' && renderApply()}
      {view === 'detail' && renderDetail()}
    </div>
  );
};
