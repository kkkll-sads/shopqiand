
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, FileText, TrendingUp, TrendingDown, Wallet, CreditCard, Gift } from 'lucide-react';
import {
  getAllLog,
  AllLogItem,
  AUTH_TOKEN_KEY,
} from '../../services/api';

interface AssetHistoryProps {
  onBack: () => void;
}

const AssetHistory: React.FC<AssetHistoryProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<number>(0); // 0: 全部, 1: 可用余额, 2: 提现余额, 3: 服务费余额, 4: 消费金
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [allLogs, setAllLogs] = useState<AllLogItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const tabs = ['全部', '供应链专项金', '可调度收益', '确权金', '消费金'];

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
    setAllLogs([]);
    setHasMore(false);
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [activeTab, page]);

  const loadData = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setError('请先登录');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 根据 activeTab 确定 type 参数
      const typeMap: Record<number, 'all' | 'balance_available' | 'withdrawable_money' | 'service_fee_balance' | 'score'> = {
        0: 'all',
        1: 'balance_available',
        2: 'withdrawable_money',
        3: 'service_fee_balance',
        4: 'score',
      };

      const type = typeMap[activeTab] || 'all';
      console.log(`[AssetHistory] 当前tab: ${activeTab}, 请求type: ${type}`);

      const res = await getAllLog({ page, limit: 10, type, token });
      console.log(`[AssetHistory] API响应:`, res);

      if (res.code === 1 && res.data) {
        console.log(`[AssetHistory] 返回${res.data.list?.length || 0}条记录`);
        // 打印前3条记录的type字段
        res.data.list?.slice(0, 3).forEach((item, idx) => {
          console.log(`[AssetHistory] 记录${idx + 1} - type: "${item.type}", amount: ${item.amount}, remark: ${item.remark || item.memo}`);
        });

        if (page === 1) {
          setAllLogs(res.data.list || []);
        } else {
          setAllLogs(prev => [...prev, ...(res.data?.list || [])]);
        }
        setHasMore((res.data.list?.length || 0) >= 10 && (res.data.current_page || 1) * 10 < (res.data.total || 0));
      } else {
        setError(res.msg || '获取明细失败');
      }
    } catch (e: any) {
      console.error('[AssetHistory] 加载失败:', e);
      setError(e?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (idx: number) => {
    setActiveTab(idx);
  };

  const formatTime = (timestamp: number | string | null): string => {
    if (!timestamp) return '';
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type: AllLogItem['type'], fieldType?: string): string => {
    // 优先使用 field_type 判断
    if (fieldType === 'green_power') {
      return '绿色算力';
    }
    const labels: Record<AllLogItem['type'], string> = {
      balance_available: '供应链专项金',
      withdrawable_money: '可调度收益',
      service_fee_balance: '确权金',
      score: '消费金',
    };
    // 如果 type 是 green_power，返回绿色算力
    if (type === 'green_power') {
      return '绿色算力';
    }
    return labels[type] || type;
  };

  const getTypeIcon = (type: AllLogItem['type']) => {
    switch (type) {
      case 'balance_available':
        return <Wallet size={20} className="text-orange-600" />;
      case 'withdrawable_money':
        return <TrendingDown size={20} className="text-blue-600" />;
      case 'service_fee_balance':
        return <CreditCard size={20} className="text-purple-600" />;
      case 'score':
        return <Gift size={20} className="text-yellow-600" />;
      default:
        return <Wallet size={20} className="text-gray-600" />;
    }
  };

  const getTypeBgColor = (type: AllLogItem['type']): string => {
    switch (type) {
      case 'balance_available':
        return 'bg-orange-100';
      case 'withdrawable_money':
        return 'bg-blue-100';
      case 'service_fee_balance':
        return 'bg-purple-100';
      case 'score':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  };

  const renderLogItem = (item: AllLogItem) => {
    // 检测是否是绿色算力相关的记录
    const isGreenPower = item.field_type === 'green_power' || 
                         item.type === 'green_power' || 
                         (item.remark && item.remark.includes('绿色算力'));
    
    const isScore = item.type === 'score';
    const displayAmount = isScore ? Math.abs(item.amount) : item.amount;
    const displayBefore = isScore ? Math.abs(item.before_value) : item.before_value;
    const displayAfter = isScore ? Math.abs(item.after_value) : item.after_value;

    return (
      <div key={`log-${item.id}`} className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-full ${getTypeBgColor(item.type)} flex items-center justify-center flex-shrink-0`}>
            {getTypeIcon(item.type)}
          </div>

          {/* Middle: Title & Time */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 mb-1 truncate">
              {item.remark || getTypeLabel(item.type, item.field_type)}
            </div>
            <div className="text-xs text-gray-400">
              {formatTime(item.create_time || item.createtime)}
            </div>
          </div>

          {/* Right: Amount & Balance */}
          <div className="text-right flex-shrink-0">
            <div className={`text-base font-bold mb-1 font-[DINAlternate-Bold,Roboto,sans-serif] ${item.amount >= 0 ? 'text-[#FF6B00]' : 'text-gray-900'}`}>
              {item.amount >= 0 ? '+' : ''}{displayAmount.toFixed(isScore ? 0 : 2)}{isGreenPower ? '算力' : (isScore ? '' : '元')}
            </div>
            <div className="text-[11px] text-gray-400">
              余额: {displayAfter.toFixed(isScore ? 0 : 2)}
            </div>
          </div>
        </div>

        {/* Optional: Bottom details for clarity if needed, or keep compact. 
            User request "Show balance change clearly" -> The '余额: xxx' above handles the current balance.
            If user wants "Old -> New", we can add a small footer line or keep it compact.
            The user example image showed "Service Fee Balance: 1323.00 -> 1446.00" at the bottom.
            Let's add that specific footer style.
        */}
        <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
            {getTypeLabel(item.type, item.field_type)}
          </span>
          <div className="text-xs text-gray-400">
            {getTypeLabel(item.type, item.field_type)}余额: {displayBefore.toFixed(isScore ? 0 : 2)} → {displayAfter.toFixed(isScore ? 0 : 2)}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading && page === 1) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 size={32} className="animate-spin mb-4" />
          <span className="text-xs">加载中...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-red-400">
          <div className="w-16 h-16 mb-4 border-2 border-red-200 rounded-lg flex items-center justify-center">
            <FileText size={32} className="opacity-50" />
          </div>
          <span className="text-xs">{error}</span>
        </div>
      );
    }

    if (allLogs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="w-16 h-16 mb-4 border-2 border-gray-200 rounded-lg flex items-center justify-center">
            <FileText size={32} className="opacity-50" />
          </div>
          <span className="text-xs">暂无数据</span>
        </div>
      );
    }

    return (
      <div>
        {allLogs.map(renderLogItem)}
        {hasMore && (
          <button
            onClick={() => setPage(prev => prev + 1)}
            disabled={loading}
            className="w-full py-2 text-sm text-orange-600 disabled:opacity-50"
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        )}
      </div>
    );

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white px-4 py-3 flex items-center sticky top-0 z-10">
        <button onClick={onBack} className="absolute left-4 p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-800 w-full text-center">历史记录</h1>
      </header>

      <div className="p-4">
        {/* Tabs */}
        <div className="flex overflow-x-auto whitespace-nowrap bg-white p-1 rounded-full mb-4 no-scrollbar">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => handleTabChange(idx)}
              className={`flex-none px-4 py-2 text-xs rounded-full transition-colors whitespace-nowrap ${idx === activeTab ? 'bg-orange-100 text-orange-600 font-bold' : 'text-gray-500'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default AssetHistory;

