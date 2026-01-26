/**
 * OrderDetailLayout - 订单详情通用布局组件
 * 
 * 提供可复用的订单详情UI组件：
 * - StatusBanner: 状态横幅组件
 * - AmountCard: 金额显示卡片
 * - InfoCard: 信息卡片组件
 * - InfoRow: 信息行组件
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */
import React from 'react';
import { Copy, CheckCircle, XCircle, Clock, AlertTriangle, LucideIcon } from 'lucide-react';
import { copyToClipboard } from '@/utils/clipboard';
import { useNotification } from '@/context/NotificationContext';

// ============================================================
// 类型定义
// ============================================================

export interface StatusBannerProps {
  /** 状态文本 */
  statusText: string;
  /** 状态颜色类名 */
  color?: string;
  /** 背景渐变类名 */
  bgColor: string;
  /** 图标名称 */
  iconName?: 'clock' | 'check-circle' | 'x-circle' | 'alert-triangle';
  /** 自定义图标组件 */
  IconComponent?: LucideIcon;
  /** 描述文字 */
  description?: string;
}

export interface AmountCardProps {
  /** 标签 */
  label: string;
  /** 金额 */
  amount: string | number;
  /** 金额颜色类名 */
  amountColor?: string;
  /** 副标题 */
  subtitle?: string;
}

export interface InfoCardProps {
  /** 卡片标题 */
  title: string;
  /** 标题图标 */
  TitleIcon?: LucideIcon;
  /** 图标颜色类名 */
  iconColor?: string;
  /** 子元素 */
  children: React.ReactNode;
}

export interface InfoRowProps {
  /** 左侧图标 */
  Icon?: LucideIcon;
  /** 图标背景颜色类名 */
  iconBg?: string;
  /** 图标颜色类名 */
  iconColor?: string;
  /** 标签 */
  label: string;
  /** 值 */
  value: React.ReactNode;
  /** 是否显示复制按钮 */
  copyable?: boolean;
  /** 复制的文本 */
  copyText?: string;
  /** 值的额外类名 */
  valueClassName?: string;
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 根据图标名称获取图标组件
 */
const getIconByName = (iconName?: string): LucideIcon => {
  switch (iconName) {
    case 'check-circle': return CheckCircle;
    case 'x-circle': return XCircle;
    case 'alert-triangle': return AlertTriangle;
    default: return Clock;
  }
};

// ============================================================
// 组件
// ============================================================

/**
 * 状态横幅组件
 */
export const StatusBanner: React.FC<StatusBannerProps> = ({
  statusText,
  bgColor,
  iconName,
  IconComponent,
  description,
}) => {
  const Icon = IconComponent || getIconByName(iconName);

  return (
    <div className={`${bgColor} rounded-xl p-6 text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <Icon size={28} className="opacity-90" />
          <div className="text-2xl font-bold">{statusText}</div>
        </div>
        {description && (
          <div className="text-white/90 text-sm">{description}</div>
        )}
      </div>
    </div>
  );
};

/**
 * 金额显示卡片
 */
export const AmountCard: React.FC<AmountCardProps> = ({
  label,
  amount,
  amountColor = 'text-orange-600',
  subtitle,
}) => {
  const formattedAmount = typeof amount === 'number'
    ? amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
    : amount;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-50">
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-2">{label}</div>
        <div className={`text-4xl font-bold font-mono ${amountColor}`}>
          ¥{formattedAmount}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
        )}
      </div>
    </div>
  );
};

/**
 * 信息卡片组件
 */
export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  TitleIcon,
  iconColor = 'text-orange-600',
  children,
}) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 space-y-3">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
        {TitleIcon && <TitleIcon size={16} className={iconColor} />}
        <span className="text-sm font-bold text-gray-700">{title}</span>
      </div>
      {children}
    </div>
  );
};

/**
 * 信息行组件
 */
export const InfoRow: React.FC<InfoRowProps> = ({
  Icon,
  iconBg = 'bg-blue-100',
  iconColor = 'text-blue-600',
  label,
  value,
  copyable = false,
  copyText,
  valueClassName = 'text-sm text-gray-800',
}) => {
  const { showToast } = useNotification();

  const handleCopy = async () => {
    if (!copyText) return;
    const success = await copyToClipboard(copyText);
    if (success) {
      showToast('success', '复制成功');
    } else {
      showToast('error', '复制失败', '请手动复制');
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className={`${iconBg} ${iconColor} p-1 rounded-md`}>
            <Icon size={14} />
          </span>
        )}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={valueClassName}>{value}</span>
        {copyable && copyText && (
          <button
            onClick={handleCopy}
            className="text-orange-600 hover:text-orange-700 active:scale-95 transition-transform"
          >
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * 时间信息卡片
 */
export const TimeInfoCard: React.FC<{
  items: Array<{ label: string; time: string }>;
}> = ({ items }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between text-xs text-gray-500">
          <span>{item.label}</span>
          <span>{item.time}</span>
        </div>
      ))}
    </div>
  );
};

// 默认导出所有组件
export default {
  StatusBanner,
  AmountCard,
  InfoCard,
  InfoRow,
  TimeInfoCard,
};
