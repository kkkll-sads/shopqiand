/**
 * OrderListLayout - 订单列表通用布局组件
 * 
 * 提供可复用的订单列表UI组件和逻辑抽象：
 * - OrderListContainer: 列表容器
 * - OrderListHeader: 列表头部（带返回按钮和标题）
 * - OrderListTabs: 标签筛选器
 * - OrderCard: 订单卡片
 * - OrderListEmpty: 空状态
 * - OrderListFooter: 列表底部（加载更多/已加载全部）
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */
import React from 'react';
import { ChevronLeft, FileText, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

// ============================================================
// 类型定义
// ============================================================

export interface TabItem {
  label: string;
  value: string | number | undefined;
}

export interface OrderListHeaderProps {
  title: string;
  onBack?: () => void;
}

export interface OrderListTabsProps {
  tabs: TabItem[];
  activeTab: string | number | undefined;
  onTabChange: (value: string | number | undefined) => void;
}

export interface OrderCardProps {
  /** 主标题 */
  title: React.ReactNode;
  /** 副标题 */
  subtitle?: string;
  /** 金额 */
  amount: string | number;
  /** 金额后缀标签 */
  amountSuffix?: React.ReactNode;
  /** 状态文本 */
  statusText: string;
  /** 状态颜色类名 */
  statusColor: string;
  /** 状态图标 */
  StatusIcon?: React.ReactNode;
  /** 创建时间 */
  createTime: string;
  /** 备注/拒绝原因 */
  remark?: string;
  /** 点击事件 */
  onClick?: () => void;
}

export interface OrderListFooterProps {
  loading: boolean;
  hasMore: boolean;
  ordersCount: number;
  onLoadMore: () => void;
}

// ============================================================
// 组件
// ============================================================

/**
 * 订单列表容器
 */
export const OrderListContainer: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {children}
    </div>
  );
};

/**
 * 订单列表头部
 */
export const OrderListHeader: React.FC<OrderListHeaderProps & {
  children?: React.ReactNode;
}> = ({ title, onBack, children }) => {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-100">
      <div className="px-4 py-4 pt-4 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full text-gray-700 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      </div>
      {children}
    </div>
  );
};

/**
 * 订单列表标签筛选器
 */
export const OrderListTabs: React.FC<OrderListTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex px-4 border-b border-gray-100 overflow-x-auto hide-scrollbar">
      {tabs.map((tab) => (
        <button
          key={String(tab.value)}
          onClick={() => onTabChange(tab.value)}
          className={`flex-1 py-3 text-sm font-medium relative whitespace-nowrap transition-colors ${
            activeTab === tab.value
              ? 'text-red-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
          {activeTab === tab.value && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-red-600 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

/**
 * 订单卡片组件
 */
export const OrderCard: React.FC<OrderCardProps> = ({
  title,
  subtitle,
  amount,
  amountSuffix,
  statusText,
  statusColor,
  StatusIcon,
  createTime,
  remark,
  onClick,
}) => {
  return (
    <div
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          {subtitle && (
            <div className="text-xs text-gray-400 mb-1">{subtitle}</div>
          )}
          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <span className="font-bold text-lg">¥{amount}</span>
            {amountSuffix}
          </div>
          {typeof title === 'string' ? (
            <div className="text-sm text-gray-600 mt-1">{title}</div>
          ) : (
            title
          )}
        </div>
        <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${statusColor}`}>
          {StatusIcon}
          {statusText}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-3 mt-1">
        <span>{createTime}</span>
        {remark && (
          <span className="flex items-center gap-1 text-red-400 max-w-[60%] truncate">
            <AlertTriangle size={12} />
            {remark}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * 订单列表空状态
 */
export const OrderListEmpty: React.FC<{
  text?: string;
  Icon?: React.FC<{ size?: number; className?: string }>;
}> = ({ text = '暂无订单记录', Icon = FileText }) => {
  return (
    <div className="py-20 text-center text-gray-400">
      <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
        <Icon size={32} className="text-gray-300" />
      </div>
      <div>{text}</div>
    </div>
  );
};

/**
 * 订单列表底部
 */
export const OrderListFooter: React.FC<OrderListFooterProps> = ({
  loading,
  hasMore,
  ordersCount,
  onLoadMore,
}) => {
  if (loading) {
    return (
      <div className="py-8">
        <LoadingSpinner text="加载中..." />
      </div>
    );
  }

  if (ordersCount === 0) {
    return null;
  }

  if (hasMore) {
    return (
      <button
        onClick={onLoadMore}
        className="w-full py-3 text-sm text-gray-500 hover:text-gray-700"
      >
        加载更多
      </button>
    );
  }

  return (
    <div className="py-4 text-center text-xs text-gray-400">
      --- 已加载全部 ---
    </div>
  );
};

/**
 * 订单列表内容区域
 */
export const OrderListContent: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="flex-1 p-4 pb-safe space-y-3">
      {children}
    </div>
  );
};

// 默认导出所有组件
export default {
  OrderListContainer,
  OrderListHeader,
  OrderListTabs,
  OrderCard,
  OrderListEmpty,
  OrderListFooter,
  OrderListContent,
};
