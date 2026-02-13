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
} from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';
import type { ShopOrderStatistics } from '@/services';
import CoinsIcon from './components/CoinsIcon';
import type { ProfileSectionItem } from './components/ProfileSectionGrid';

interface BuildConvenientServicesParams {
  navigate: NavigateFunction;
  hasSignedToday: boolean;
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
      action: () => navigate('/balance-recharge'),
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
      action: () => navigate('/balance-withdraw'),
    },
    {
      label: '消费金兑换',
      icon: CoinsIcon,
      iconColorClass: 'text-yellow-600',
      iconBgClass: 'bg-yellow-50',
      action: () => navigate('/market'),
    },
    {
      label: '新春荣耀榜',
      icon: Gift,
      iconColorClass: 'text-red-500',
      iconBgClass: 'bg-red-50',
      action: () => navigate('/activity/team-leaderboard'),
    },
  ];
};

export const buildRightsManagement = (navigate: NavigateFunction): ProfileSectionItem[] => {
  return [
    {
      label: '资产明细',
      icon: FileText,
      iconColorClass: 'text-purple-600',
      iconBgClass: 'bg-purple-50',
      action: () => navigate('/asset-view'),
    },
    {
      label: '累计权益',
      icon: ShieldCheck,
      iconColorClass: 'text-green-600',
      iconBgClass: 'bg-green-50',
      action: () => navigate('/cumulative-rights'),
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
      label: '藏品订单',
      icon: ClipboardList,
      iconColorClass: 'text-blue-600',
      iconBgClass: 'bg-blue-50',
      action: () => navigate('/orders/product/0'),
    },
  ];
};

export const buildPointsOrder = (
  navigate: NavigateFunction,
  orderStats: ShopOrderStatistics | null
): ProfileSectionItem[] => {
  return [
    {
      label: '待付款',
      icon: Coins,
      iconColorClass: 'text-red-500',
      iconBgClass: 'bg-red-50',
      action: () => navigate('/orders/points/0'),
      badge: orderStats?.pending_count || 0,
    },
    {
      label: '待发货',
      icon: Package,
      iconColorClass: 'text-blue-500',
      iconBgClass: 'bg-blue-50',
      action: () => navigate('/orders/points/1'),
      badge: orderStats?.paid_count || 0,
    },
    {
      label: '待收货',
      icon: Truck,
      iconColorClass: 'text-purple-500',
      iconBgClass: 'bg-purple-50',
      action: () => navigate('/orders/points/2'),
      badge: orderStats?.shipped_count || 0,
    },
    {
      label: '已完成',
      icon: CheckCircle,
      iconColorClass: 'text-green-500',
      iconBgClass: 'bg-green-50',
      action: () => navigate('/orders/points/3'),
      badge: orderStats?.completed_count || 0,
    },
  ];
};

export const buildServiceManagement = (navigate: NavigateFunction): ProfileSectionItem[] => {
  return [
    { label: '实名认证', icon: UserCheck, action: () => navigate('/real-name-auth') },
    { label: '卡号管理', icon: CreditCard, action: () => navigate('/card-management') },
    { label: '收货地址', icon: MapPin, action: () => navigate('/address-list') },
    { label: '我的好友', icon: Users, action: () => navigate('/my-friends') },
    { label: '代理认证', icon: UserCheck, action: () => navigate('/agent-auth') },
    { label: '帮助中心', icon: HelpCircle, action: () => navigate('/help-center') },
    { label: '规则协议', icon: FileText, action: () => navigate('/user-agreement') },
    { label: '用户问卷', icon: FileText, action: () => navigate('/user-survey') },
    { label: '活动中心', icon: Gift, action: () => navigate('/activity-center') },
    { label: '在线客服', icon: HeadphonesIcon, action: () => navigate('/online-service') },
    { label: '平台资讯', icon: Newspaper, action: () => navigate('/news') },
  ].map((item) => ({
    ...item,
    iconBgClass: 'bg-gray-50',
    iconColorClass: 'text-gray-600',
    iconStrokeWidth: 1.5,
    labelClassName: 'text-xs text-gray-500',
  }));
};
