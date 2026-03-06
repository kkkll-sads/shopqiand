import React, { useState, useEffect } from 'react';
import { ChevronLeft, WifiOff, AlertCircle, Filter, Copy, ChevronRight, FileText } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';

export const BillingPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [empty, setEmpty] = useState(false);
  
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'frozen'>('all');
  const [selectedBill, setSelectedBill] = useState<any>(null);

  const mockData = [
    {
      month: '2023年10月',
      items: [
        { id: 'b1', type: '购买商品', desc: 'Apple iPhone 15 Pro', time: '10-25 14:30', amount: '-7999.00', status: '交易成功', isIncome: false },
        { id: 'b2', type: '充值', desc: '微信支付充值', time: '10-24 09:15', amount: '+10000.00', status: '充值成功', isIncome: true },
        { id: 'b3', type: '退款', desc: '订单退款', time: '10-20 16:45', amount: '+199.00', status: '退款成功', isIncome: true },
        { id: 'b4', type: '确权服务费', desc: '数字确权手续费', time: '10-18 10:00', amount: '-50.00', status: '已扣除', isIncome: false },
      ]
    },
    {
      month: '2023年9月',
      items: [
        { id: 'b5', type: '提现', desc: '提现至银行卡(尾号1234)', time: '09-15 11:20', amount: '-5000.00', status: '提现成功', isIncome: false },
        { id: 'b6', type: '冻结', desc: '交易担保冻结', time: '09-10 15:00', amount: '-1000.00', status: '冻结中', isIncome: false, isFrozen: true },
      ]
    }
  ];

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const handleBack = () => {
    if (selectedBill) {
      setSelectedBill(null);
    } else {
      goBack();
    }
  };

  const handleCopy = (text: string) => {
    alert(`已复制: ${text}`);
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-gray-100 dark:border-gray-800">
      {offline && (
        <div className="bg-red-50 dark:bg-red-900/30 text-brand-start dark:text-red-400 px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-800 rounded shadow-sm">刷新</button>
        </div>
      )}
      <div className="h-12 flex items-center justify-between px-3 pt-safe">
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-gray-900 dark:text-gray-100 active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center w-1/3">
          {selectedBill ? '账单详情' : '账单明细'}
        </h1>
        <div className="w-1/3 flex justify-end">
          {!selectedBill && (
            <button className="text-md text-gray-600 dark:text-gray-400 px-2 py-1 active:opacity-70 flex items-center">
              <Filter size={14} className="mr-1" /> 筛选
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderTabs = () => {
    if (selectedBill) return null;
    return (
      <div className="bg-white dark:bg-gray-900 flex border-b border-gray-100 dark:border-gray-800 shrink-0 px-2">
        {[
          { id: 'all', label: '全部' },
          { id: 'income', label: '收入' },
          { id: 'expense', label: '支出' },
          { id: 'frozen', label: '冻结' }
        ].map(tab => (
          <button 
            key={tab.id}
            className={`flex-1 py-3 text-base font-medium relative transition-colors ${filter === tab.id ? 'text-brand-start' : 'text-gray-600 dark:text-gray-400'}`}
            onClick={() => setFilter(tab.id as any)}
          >
            {tab.label}
            {filter === tab.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-brand-start rounded-t-full"></div>}
          </button>
        ))}
      </div>
    );
  };

  const renderSkeleton = () => (
    <div className="p-4 space-y-6">
      {[1, 2].map((group) => (
        <div key={group} className="space-y-3">
          <div className="w-20 h-5 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm space-y-4">
            {[1, 2].map((item) => (
              <div key={item} className="flex justify-between items-center animate-pulse">
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="w-32 h-3 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
                <div className="space-y-2 flex flex-col items-end">
                  <div className="w-16 h-5 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderEmpty = () => (
    <EmptyState message="暂无账单记录" />
  );

  const renderList = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();
    if (empty) return renderEmpty();

    return (
      <div className="p-4 space-y-6 pb-safe">
        {mockData.map((group, gIdx) => (
          <div key={gIdx}>
            <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 mb-3 ml-1">{group.month}</h3>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-800 overflow-hidden">
              {group.items.map((item, iIdx) => (
                <div 
                  key={item.id} 
                  className={`px-4 py-3.5 flex justify-between items-center cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors ${iIdx < group.items.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                  onClick={() => setSelectedBill(item)}
                >
                  <div className="flex flex-col">
                    <span className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{item.type}</span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">{item.time} | {item.desc}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-xl font-bold mb-1 ${item.isIncome ? 'text-success' : 'text-gray-900 dark:text-gray-100'}`}>
                      {item.amount}
                    </span>
                    <span className="text-s text-gray-500 dark:text-gray-400">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDetail = () => {
    if (!selectedBill) return null;
    return (
      <div className="flex-1 flex flex-col bg-[#FFF8F8] dark:bg-gray-950 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm dark:shadow-none border border-transparent dark:border-gray-800 flex flex-col items-center mb-4">
          <span className="text-md text-gray-500 dark:text-gray-400 mb-2">{selectedBill.type}</span>
          <span className={`text-7xl font-bold mb-6 ${selectedBill.isIncome ? 'text-success' : 'text-gray-900 dark:text-gray-100'}`}>
            {selectedBill.amount}
          </span>
          
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-500 dark:text-gray-400">当前状态</span>
              <span className="text-base text-gray-900 dark:text-gray-100 font-medium">{selectedBill.status}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-500 dark:text-gray-400">交易时间</span>
              <span className="text-base text-gray-900 dark:text-gray-100">{selectedBill.time}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-500 dark:text-gray-400">交易说明</span>
              <span className="text-base text-gray-900 dark:text-gray-100">{selectedBill.desc}</span>
            </div>
            <div className="w-full h-px bg-gray-100 dark:bg-gray-800 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-500 dark:text-gray-400">流水单号</span>
              <div className="flex items-center">
                <span className="text-base text-gray-900 dark:text-gray-100 mr-2">2023102514300001</span>
                <button onClick={() => handleCopy('2023102514300001')} className="text-gray-400 dark:text-gray-500 active:text-gray-600 dark:text-gray-400">
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-500 dark:text-gray-400">关联订单</span>
              <div className="flex items-center">
                <span className="text-base text-gray-900 dark:text-gray-100 mr-2">1234567890</span>
                <button onClick={() => handleCopy('1234567890')} className="text-gray-400 dark:text-gray-500 active:text-gray-600 dark:text-gray-400">
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-none border border-transparent dark:border-gray-800">
          <div className="flex items-center justify-between cursor-pointer active:opacity-70">
            <span className="text-md text-gray-900 dark:text-gray-100">对此订单有疑问？</span>
            <div className="flex items-center text-gray-400 dark:text-gray-500">
              <span className="text-sm mr-1">联系客服</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FFF8F8] dark:bg-gray-950 relative h-full overflow-hidden">
      {/* Demo Controls */}
      {!selectedBill && (
        <div className="px-4 py-2 flex space-x-2 overflow-x-auto no-scrollbar bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 text-xs absolute top-12 left-0 right-0 z-50 opacity-50 hover:opacity-100 transition-opacity">
          <span className="text-gray-500 dark:text-gray-400 flex items-center shrink-0">Demo:</span>
          <button onClick={() => setLoading(!loading)} className={`px-2 py-1 rounded border ${loading ? 'bg-brand-start text-white border-[#FF4142]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>Loading</button>
          <button onClick={() => setOffline(!offline)} className={`px-2 py-1 rounded border ${offline ? 'bg-brand-start text-white border-[#FF4142]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>Offline</button>
          <button onClick={() => setError(!error)} className={`px-2 py-1 rounded border ${error ? 'bg-brand-start text-white border-[#FF4142]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>Error</button>
          <button onClick={() => setEmpty(!empty)} className={`px-2 py-1 rounded border ${empty ? 'bg-brand-start text-white border-[#FF4142]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>Empty</button>
        </div>
      )}

      {renderHeader()}
      {renderTabs()}
      
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {selectedBill ? renderDetail() : renderList()}
      </div>
    </div>
  );
};
