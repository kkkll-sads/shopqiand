import {
  Wallet,
  CalendarCheck,
  Receipt,
  FileText,
  ShieldCheck,
  Box,
  ClipboardList,
  Coins,
  Package,
  Truck,
  CheckCircle,
  UserCheck,
  CreditCard,
  MapPin,
  Users,
  HelpCircle,
  HeadphonesIcon,
  Newspaper,
  Gift,
  Layers,
  Zap,
} from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';
import CoinsIcon from './components/CoinsIcon';
import type { ProfileSectionItem } from './components/ProfileSectionGrid';

interface BuildConvenientServicesParams {
  navigate: NavigateFunction;
  hasSignedToday: boolean;
}

interface BuildServiceManagementParams {
  navigate: NavigateFunction;
  openSupport: () => void;
}

export const buildConvenientServices = ({
  navigate,
  hasSignedToday,
}: BuildConvenientServicesParams): ProfileSectionItem[] => {
  return [
    {
      label: '专项金充值',
      icon: Wallet,
      iconColorClass: 'text-red-600',
      iconBgClass: 'bg-red-50',
      action: () => navigate('/recharge'),
    },
    {
      label: '确权金充值',
      icon: ShieldCheck,
      iconColorClass: 'text-emerald-600',
      iconBgClass: 'bg-emerald-50',
      action: () => navigate('/service-recharge'),
    },
    {
      label: '每日签到',
      icon: CalendarCheck,
      iconColorClass: 'text-red-500',
      iconBgClass: 'bg-red-50',
      action: () => navigate('/sign-in'),
      showDot: !hasSignedToday,
    },
    {
      label: '收益提现',
      icon: Receipt,
      iconColorClass: 'text-red-500',
      iconBgClass: 'bg-red-50',
      action: () => navigate('/withdraw'),
    },
    {
      label: '算力补充',
      icon: Zap,
      iconColorClass: 'text-emerald-600',
      iconBgClass: 'bg-emerald-50',
      action: () => navigate('/hashrate-exchange'),
    },
  ];
};

export const buildRightsManagement = (navigate: NavigateFunction): ProfileSectionItem[] => {
  return [
    {
      label: '账单明细',
      icon: FileText,
      iconColorClass: 'text-purple-600',
      iconBgClass: 'bg-purple-50',
      action: () => navigate('/billing'),
    },
    {
      label: '累计确权',
      icon: ShieldCheck,
      iconColorClass: 'text-green-600',
      iconBgClass: 'bg-green-50',
      action: () => navigate('/accumulated-rights'),
    },
    {
      label: '寄售券',
      icon: Receipt,
      iconColorClass: 'text-pink-600',
      iconBgClass: 'bg-pink-50',
      action: () => navigate('/consignment-voucher'),
    },
    {
      label: '我的藏品',
      icon: Box,
      iconColorClass: 'text-indigo-600',
      iconBgClass: 'bg-indigo-50',
      action: () => navigate('/my-collection'),
    },
    {
      label: '我的卡包',
      icon: Layers,
      iconColorClass: 'text-orange-600',
      iconBgClass: 'bg-orange-50',
      action: () => navigate('/my-card-packs'),
    },
    {
      label: '藏品预约券',
      icon: ClipboardList,
      iconColorClass: 'text-blue-600',
      iconBgClass: 'bg-blue-50',
      action: () => navigate('/reservations'),
    },
  ];
};

export const buildPointsOrder = (
  navigate: NavigateFunction,
  orderStats: any
): ProfileSectionItem[] => {
  return [
    {
      label: '待付款',
      icon: Coins,
      iconColorClass: 'text-red-500',
      iconBgClass: 'bg-red-50',
      action: () => navigate('/order?tab=unpaid'),
      badge: orderStats?.pending_count || 0,
    },
    {
      label: '待发货',
      icon: Package,
      iconColorClass: 'text-blue-500',
      iconBgClass: 'bg-blue-50',
      action: () => navigate('/order?tab=toship'),
      badge: orderStats?.paid_count || 0,
    },
    {
      label: '待收货',
      icon: Truck,
      iconColorClass: 'text-purple-500',
      iconBgClass: 'bg-purple-50',
      action: () => navigate('/order?tab=toreceive'),
      badge: orderStats?.shipped_count || 0,
    },
    {
      label: '已完成',
      icon: CheckCircle,
      iconColorClass: 'text-green-500',
      iconBgClass: 'bg-green-50',
      action: () => navigate('/order?tab=completed'),
      badge: orderStats?.completed_count || 0,
    },
  ];
};

export const buildServiceManagement = ({
  navigate,
  openSupport,
}: BuildServiceManagementParams): ProfileSectionItem[] => {
  return [
    { label: '实名认证', icon: UserCheck, action: () => navigate('/auth/real-name') },
    { label: '代理认证', icon: UserCheck, action: () => navigate('/agent-auth') },
    { label: '收款账号', icon: CreditCard, action: () => navigate('/payment-accounts') },
    { label: '地址管理', icon: MapPin, action: () => navigate('/address') },
    { label: '我的好友', icon: Users, action: () => navigate('/friends') },
    { label: '帮助中心', icon: HelpCircle, action: () => navigate('/help_center') },
    { label: '用户协议', icon: FileText, action: () => navigate('/user_agreement') },
    { label: '隐私政策', icon: ShieldCheck, action: () => navigate('/privacy_policy') },
    { label: '活动中心', icon: Gift, action: () => navigate('/activity-center') },
    { label: '在线客服', icon: HeadphonesIcon, action: openSupport },
    { label: '平台公告', icon: Newspaper, action: () => navigate('/announcement') },
  ].map((item) => ({
    ...item,
    iconBgClass: 'bg-gray-50',
    iconColorClass: 'text-gray-600',
    iconStrokeWidth: 1.5,
    labelClassName: 'text-xs text-gray-500 dark:text-gray-400',
  }));
};
