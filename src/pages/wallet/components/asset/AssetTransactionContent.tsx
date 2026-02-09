import React from 'react';
import { ArrowRight, FileText, ShoppingBag } from 'lucide-react';
import { SkeletonTransactionCard } from '@/components/common';
import { getBalanceTypeLabel } from '@/constants/balanceTypes';
import { normalizeAssetUrl, type AllLogItem, type MyCollectionItem } from '@/services';

interface AssetTabsView {
  data: any[];
  isLoading: boolean;
  hasError: boolean;
  error: string | null;
  activeTab: number;
  hasMore: boolean;
}

interface AssetTransactionContentProps {
  tabs: AssetTabsView;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  onMoneyLogClick: (id: string | number) => void;
  onCollectionClick: (item: MyCollectionItem) => void;
}

const getTypeColor = (type: string) => {
  if (type === 'balance' || type === '余额') return 'bg-blue-50 text-blue-600';
  if (type === 'green_power' || type === '绿色能量' || type === '算力') return 'bg-emerald-50 text-emerald-600';
  if (type === 'service_fee' || type === '服务费') return 'bg-amber-50 text-amber-600';
  if (type === 'score' || type === '积分' || type === '消费金') return 'bg-purple-50 text-purple-600';
  return 'bg-gray-100 text-gray-500';
};

const formatTime = (timestamp: number | string | null): string => {
  if (!timestamp) return '';
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp, 10) * 1000 : timestamp * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getCollectionStatusConfig = (item: MyCollectionItem) => {
  if (item.consignment_status === 2) {
    return {
      text: '已售出',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      textColor: 'text-emerald-600',
    };
  }

  if (item.consignment_status === 1) {
    return {
      text: '寄售中',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      textColor: 'text-amber-600',
    };
  }

  return {
    text: '持有中',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    textColor: 'text-gray-600',
  };
};

const renderAllLogItem = (
  item: AllLogItem,
  index: number,
  onMoneyLogClick: (id: string | number) => void
) => {
  const amountVal = Number(item.amount);
  const isPositive = amountVal > 0;
  const typeText = getBalanceTypeLabel(item.type);

  return (
    <div
      key={item.id}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-all"
      onClick={() => {
        if (item.id) {
          onMoneyLogClick(item.id);
        }
      }}
      style={{ animation: index < 10 ? `slideUp 0.3s ease-out ${index * 0.03}s both` : undefined }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800 mb-1.5">{item.memo || item.remark || '资金变动'}</div>
          <div className="text-xs text-gray-400">{formatTime(item.createtime || item.create_time)}</div>
        </div>
        <div className={`text-xl font-black font-mono ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? '+' : ''}
          {Number(amountVal).toFixed(2)}
        </div>
      </div>
      <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-100">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getTypeColor(item.type)}`}>{typeText}</span>
        <span className="flex items-center gap-1 font-mono text-gray-400">
          <span>{Number(item.before_value).toFixed(2)}</span>
          <span className="text-gray-300">→</span>
          <span className={isPositive ? 'text-emerald-500' : 'text-rose-500'}>
            {Number(item.after_value || item.after_balance).toFixed(2)}
          </span>
        </span>
      </div>
    </div>
  );
};

const renderCollectionItem = (
  item: MyCollectionItem,
  index: number,
  onCollectionClick: (item: MyCollectionItem) => void
) => {
  const imageUrl = normalizeAssetUrl(item.image) || '';
  const statusConfig = getCollectionStatusConfig(item);

  return (
    <div
      key={item.id}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-3 shadow-lg cursor-pointer hover:shadow-xl active:scale-[0.99] transition-all border border-white/50"
      onClick={() => onCollectionClick(item)}
      style={{ animation: index < 10 ? `slideUp 0.3s ease-out ${index * 0.03}s both` : undefined }}
    >
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-md border border-gray-100 bg-gradient-to-br from-gray-50 to-slate-50">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
              onError={(event) => {
                (event.target as HTMLImageElement).style.visibility = 'hidden';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingBag size={28} />
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div className="text-sm font-semibold text-gray-800 flex-1 line-clamp-2">{item.title}</div>
              <ArrowRight size={16} className="text-gray-300 ml-2 flex-shrink-0" />
            </div>
            <div className="text-[10px] text-gray-400 mb-2 font-mono">#{item.unique_id || item.id}</div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-base font-black text-gray-900">¥{Number(item.price).toFixed(2)}</div>
              {Number(item.market_price) > 0 && (
                <div className="text-[10px] text-gray-400">市场价: ¥{Number(item.market_price).toFixed(2)}</div>
              )}
            </div>
            <div
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.textColor} ${statusConfig.border} border shadow-sm`}
            >
              {statusConfig.text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AssetTransactionContent: React.FC<AssetTransactionContentProps> = ({
  tabs,
  bottomRef,
  onMoneyLogClick,
  onCollectionClick,
}) => {
  if (tabs.isLoading && tabs.data.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonTransactionCard key={index} />
        ))}
      </div>
    );
  }

  if (tabs.hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 mb-4 bg-red-50 rounded-full flex items-center justify-center">
          <FileText size={32} className="text-red-400" />
        </div>
        <span className="text-sm text-gray-500">{tabs.error}</span>
      </div>
    );
  }

  if (tabs.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          {tabs.activeTab === 1 ? (
            <ShoppingBag size={32} className="text-gray-300" />
          ) : (
            <FileText size={32} className="text-gray-300" />
          )}
        </div>
        <span className="text-sm text-gray-400">{tabs.activeTab === 1 ? '暂无藏品' : '暂无数据'}</span>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {tabs.activeTab === 0 &&
        tabs.data.map((item, index) => renderAllLogItem(item as AllLogItem, index, onMoneyLogClick))}
      {tabs.activeTab === 1 &&
        tabs.data.map((item, index) =>
          renderCollectionItem(item as MyCollectionItem, index, onCollectionClick)
        )}

      <div ref={bottomRef} className="h-4" />

      {tabs.isLoading && tabs.data.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
            加载中...
          </div>
        </div>
      )}

      {!tabs.hasMore && tabs.data.length > 0 && (
        <div className="py-4 text-center text-gray-400 text-xs">
          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-px bg-gray-200" />
            <span>已加载全部</span>
            <div className="w-8 h-px bg-gray-200" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetTransactionContent;
