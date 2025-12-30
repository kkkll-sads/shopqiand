
import React, { useEffect, useMemo, useState } from 'react';
import { Settings, MessageSquare, ShieldCheck, CreditCard, MapPin, Users, UserCheck, HelpCircle, FileText, HeadphonesIcon, ChevronRight, Wallet, Receipt, Box, Gem, Sprout, Award, CalendarCheck, Newspaper, Leaf, ClipboardList } from 'lucide-react';
import { formatAmount } from '../../utils/format';
import { AUTH_TOKEN_KEY, USER_INFO_KEY, fetchProfile, normalizeAssetUrl } from '../../services/api';
import { UserInfo } from '../../types';
import useAuth from '../../hooks/useAuth';
import { isSuccess, extractError } from '../../utils/apiHelpers';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Route } from '../../router/routes';

// Helper for custom coin icon
const CoinsIcon = ({ size, className }: { size: number, className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="m16.71 13.88.7.71-2.82 2.82" />
  </svg>
);

interface ProfileProps {
  onNavigate: (route: Route) => void;
  unreadCount?: number;
}

const Profile: React.FC<ProfileProps> = ({ onNavigate, unreadCount = 0 }) => {
  // ✅ 使用统一错误处理Hook（持久化显示）
  const {
    errorMessage,
    hasError,
    handleError,
    clearError
  } = useErrorHandler();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    try {
      const cached = localStorage.getItem(USER_INFO_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('解析本地用户信息失败:', error);
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      // ✅ 使用统一错误处理
      handleError('未检测到登录信息，请重新登录', {
        persist: true,
        showToast: false
      });
      return;
    }

    let isMounted = true;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await fetchProfile(token);
        if (!isMounted) return;

        if (isSuccess(response) && response.data?.userInfo) {
          setUserInfo(response.data.userInfo);
          localStorage.setItem(USER_INFO_KEY, JSON.stringify(response.data.userInfo));
          clearError(); // ✅ 使用统一错误清除
        } else {
          // ✅ 使用统一错误处理
          handleError(response, {
            persist: true,
            showToast: false,
            customMessage: '获取用户信息失败'
          });
        }
      } catch (err: any) {
        if (!isMounted) return;
        // ✅ 使用统一错误处理
        handleError(err, {
          persist: true,
          showToast: false,
          customMessage: '获取个人信息失败'
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);


  const { realName } = useAuth();
  const displayName = realName || userInfo?.nickname || userInfo?.username || '用户';
  const displayAvatarText = displayName.slice(0, 1).toUpperCase();
  const displayAvatarUrl = normalizeAssetUrl(userInfo?.avatar);

  // 根据 user_type 显示用户类型
  const getUserTypeLabel = (userType?: number): string => {
    if (userType === undefined || userType === null) return '--';
    switch (userType) {
      case 0:
        return '新用户';
      case 1:
        return '普通用户';
      case 2:
        return '交易用户';
      default:
        return '--';
    }
  };
  const displayId = getUserTypeLabel(userInfo?.user_type);


  const stats = useMemo(() => ([
    { label: '供应链专项金', val: formatAmount(userInfo?.money) },
    { label: '可调度收益', val: formatAmount(userInfo?.withdrawable_money) },
    { label: '确权金', val: formatAmount(userInfo?.service_fee_balance) },
  ]), [userInfo]);

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      {/* Top Background Gradient - Match Home Page (Pastel Orange) */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-[#FFD6A5] to-gray-50 z-0">
      </div>

      {/* User Header */}
      <div className="pt-12 pb-6 px-4 relative z-10 text-gray-900">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-xl font-bold text-orange-600 overflow-hidden shadow-sm">
              {displayAvatarUrl ? (
                <img
                  src={displayAvatarUrl}
                  alt="用户头像"
                  className="w-full h-full object-cover"
                />
              ) : (
                displayAvatarText || '用'
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
              <div className="flex items-center gap-2 mt-1">
                {/* User Status Badge */}
                <div className="flex items-center bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-full px-2 py-0.5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mr-1 shadow-inner">
                    {(() => {
                      const statusConfig = {
                        0: { icon: Sprout, color: 'text-green-600' },
                        1: { icon: UserCheck, color: 'text-blue-600' },
                        2: { icon: Gem, color: 'text-yellow-600' }
                      }[userInfo?.user_type ?? -1] || { icon: UserCheck, color: 'text-gray-500' };
                      const Icon = statusConfig.icon;
                      return <Icon size={10} className={`${statusConfig.color} fill-current`} />;
                    })()}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{displayId}</span>
                </div>

                {/* Agent Badge - 根据 agent_review_status 显示 */}
                {(() => {
                  const agentStatus = userInfo?.agent_review_status;
                  // 只有已通过(1)时才显示代理标签
                  if (agentStatus === 1) {
                    return (
                      <div className="flex items-center bg-white/60 backdrop-blur-md border border-red-200 rounded-full px-2 py-0.5 ml-1">
                        <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mr-1">
                          <Award size={10} className="text-red-500 fill-red-500" />
                        </div>
                        <span className="text-xs font-medium text-red-600">代理</span>
                      </div>
                    );
                  }
                  // 待审核(0)
                  if (agentStatus === 0) {
                    return (
                      <div className="flex items-center bg-white/60 backdrop-blur-md border border-yellow-200 rounded-full px-2 py-0.5 ml-1">
                        <div className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center mr-1">
                          <Award size={10} className="text-yellow-600 fill-yellow-600" />
                        </div>
                        <span className="text-xs font-medium text-yellow-700">待审核</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => onNavigate('service-center:message')} className="text-gray-600 hover:text-gray-900 transition-colors relative">
              <MessageSquare size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white box-content"></span>
              )}
            </button>
            <button onClick={() => onNavigate('service-center:settings')} className="text-gray-600 hover:text-gray-900 transition-colors"><Settings size={22} /></button>
          </div>
        </div>

        {/* Digital Rights Card - Smooth Floating Style */}
        <div className="bg-white mx-2 rounded-3xl px-8 py-6 shadow-sm relative overflow-hidden mb-3">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">供应链专项金</span>
                <span className="bg-orange-50 text-orange-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  采购本金
                </span>
              </div>
              <button
                onClick={() => onNavigate('asset:balance-recharge:profile')}
                className="text-orange-600 text-sm font-medium flex items-center gap-1 active:opacity-70"
              >
                去充值 <ChevronRight size={14} />
              </button>
            </div>

            {/* Main Big Number: Supply Chain Special Fund (balance_available) */}
            <div
              className="text-3xl font-[DINAlternate-Bold,Roboto,sans-serif] font-bold text-gray-900 tracking-tight mb-6 cursor-pointer active:opacity-70 transition-opacity"
              onClick={() => onNavigate('asset-view:0')}
            >
              <span className="text-xl mr-1">¥</span>
              {/* Display balance_available without commas */}
              {String(userInfo?.balance_available || '0.00')}
            </div>

            {/* Bottom Grid: 2x2 Layout */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-2 mt-2">
              {/* Row 1, Col 1: Withdrawable */}
              <div
                className="flex flex-col cursor-pointer active:opacity-70 transition-opacity"
                onClick={() => onNavigate('asset-view:1')}
              >
                <div className="text-xs text-gray-400 mb-1">可调度收益</div>
                <div className="text-[15px] font-bold text-gray-800 font-[DINAlternate-Bold,Roboto,sans-serif] leading-tight">
                  {formatAmount(userInfo?.withdrawable_money)}
                </div>
              </div>

              {/* Row 1, Col 2: Consumer Points */}
              <div
                className="flex flex-col items-end cursor-pointer active:opacity-70 transition-opacity"
                onClick={() => onNavigate('switch-to-market')}
              >
                <div className="text-xs text-gray-400 mb-1">消费金</div>
                <div className="text-[15px] font-bold text-gray-800 font-[DINAlternate-Bold,Roboto,sans-serif] leading-tight">
                  {userInfo?.score || 0}
                </div>
              </div>

              {/* Row 2, Col 1: Green Power */}
              <div
                className="flex flex-col cursor-pointer active:opacity-70 transition-opacity"
                onClick={() => onNavigate('wallet:hashrate_exchange:profile')}
              >
                <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  绿色算力 <Leaf size={10} className="text-green-500" />
                </div>
                <div className="text-[15px] font-bold text-gray-800 font-[DINAlternate-Bold,Roboto,sans-serif] leading-tight">
                  {userInfo?.green_power || 0}
                </div>
              </div>

              {/* Row 2, Col 2: Rights Fund */}
              <div
                className="flex flex-col items-end cursor-pointer active:opacity-70 transition-opacity"
                onClick={() => onNavigate('asset-view:3')}
              >
                <div className="text-xs text-gray-400 mb-1">确权金</div>
                <div className="text-[15px] font-bold text-gray-800 font-[DINAlternate-Bold,Roboto,sans-serif] leading-tight">
                  {formatAmount(userInfo?.service_fee_balance)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {
        hasError && !userInfo && !errorMessage.includes('登录态过期') && (
          <div className="mx-4 mt-4 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg shadow-sm">
            {errorMessage}
          </div>
        )
      }

      <div className="px-4 mt-2 relative z-10 space-y-4">

        {/* Convenient Services - Micro Texture Icons */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
            便捷服务
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: '专项金充值', icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50', action: () => onNavigate({ name: 'balance-recharge', source: 'asset-view' }) },
              { label: '每日签到', icon: CalendarCheck, color: 'text-red-500', bg: 'bg-red-50', action: () => onNavigate({ name: 'sign-in' }) },
              { label: '收益提现', icon: Receipt, color: 'text-orange-500', bg: 'bg-orange-50', action: () => onNavigate({ name: 'balance-withdraw', source: 'asset-view' }) },
              { label: '商品寄售', icon: Receipt, color: 'text-blue-500', bg: 'bg-blue-50', action: () => onNavigate({ name: 'order-list', orderType: 'transaction', tabIndex: 0 }) },
              { label: '消费金兑换', icon: CoinsIcon, color: 'text-yellow-600', bg: 'bg-yellow-50', action: () => onNavigate({ name: 'switch-to-market' }) },
              { label: '消费金订单', icon: ClipboardList, color: 'text-emerald-500', bg: 'bg-emerald-50', action: () => onNavigate({ name: 'order-list', orderType: 'points', tabIndex: 0 }) },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center cursor-pointer active:opacity-60 group" onClick={item.action}>
                <div className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center mb-2 transition-transform group-active:scale-95`}>
                  <item.icon size={20} className={item.color} strokeWidth={2} />
                </div>
                <span className="text-xs text-gray-600 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rights Management */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
            权益管理
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: '资产明细', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', action: () => onNavigate({ name: 'asset-view' }) },
              { label: '累计权益', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', action: () => onNavigate({ name: 'cumulative-rights' }) },
              { label: '寄售券', icon: Receipt, color: 'text-pink-600', bg: 'bg-pink-50', action: () => onNavigate({ name: 'consignment-voucher' }) },
              { label: '我的藏品', icon: Box, color: 'text-indigo-600', bg: 'bg-indigo-50', action: () => onNavigate({ name: 'my-collection' }) },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center cursor-pointer active:opacity-60 group" onClick={item.action}>
                <div className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center mb-2 transition-transform group-active:scale-95`}>
                  <item.icon size={20} className={item.color} strokeWidth={2} />
                </div>
                <span className="text-xs text-gray-600 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Service Management */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
            服务管理
          </div>
          <div className="grid grid-cols-4 gap-y-6 gap-x-4">
            {[
              { label: '实名认证', icon: UserCheck, action: () => onNavigate({ name: 'real-name-auth' }) },
              { label: '卡号管理', icon: CreditCard, action: () => onNavigate({ name: 'card-management' }) },
              { label: '收货地址', icon: MapPin, action: () => onNavigate({ name: 'address-list' }) },
              { label: '我的好友', icon: Users, action: () => onNavigate({ name: 'my-friends' }) },
              { label: '代理认证', icon: UserCheck, action: () => onNavigate({ name: 'agent-auth' }) },
              { label: '帮助中心', icon: HelpCircle, action: () => onNavigate({ name: 'help-center' }) },
              { label: '规则协议', icon: FileText, action: () => onNavigate({ name: 'user-agreement' }) },
              { label: '用户问卷', icon: FileText, action: () => onNavigate({ name: 'user-survey' }) },
              { label: '在线客服', icon: HeadphonesIcon, action: () => onNavigate({ name: 'online-service' }) },
              { label: '平台资讯', icon: Newspaper, action: () => onNavigate({ name: 'news' }) },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center cursor-pointer active:opacity-60 group" onClick={item.action}>
                <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center mb-2 transition-transform group-active:scale-95">
                  <item.icon size={20} className="text-gray-600" strokeWidth={1.5} />
                </div>
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div >
  );
};

export default Profile;
