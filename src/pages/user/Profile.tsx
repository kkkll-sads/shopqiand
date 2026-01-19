import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Settings,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  MapPin,
  Users,
  UserCheck,
  HelpCircle,
  FileText,
  HeadphonesIcon,
  Newspaper,
  Gift,
  Wallet,
  Receipt,
  Box,
  Gem,
  Sprout,
  Award,
  CalendarCheck,
  Leaf,
  ClipboardList,
  Coins,
  Package,
  Truck,
  CheckCircle,
} from 'lucide-react';
import { formatAmount } from '../../../utils/format';
import {
  fetchProfile,
  normalizeAssetUrl,
  fetchShopOrderStatistics,
  ShopOrderStatistics,
  fetchSignInInfo,
} from '../../../services/api';
import { getStoredToken } from '../../../services/client';
import { UserInfo } from '../../../types';
import { useAuthStore } from '../../stores/authStore';
import { STORAGE_KEYS } from '../../../constants/storageKeys';
import { isSuccess, extractData, extractError } from '../../../utils/apiHelpers';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useNavigate } from 'react-router-dom';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '../../../types/states';

// Helper for custom coin icon
const CoinsIcon = ({ size, className }: { size: number; className: string }) => (
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

const Profile: React.FC<{ unreadCount?: number }> = ({ unreadCount = 0 }) => {
  const navigate = useNavigate();
  // ✅ 使用统一错误处理Hook（持久化显示）
  const { errorMessage, hasError, handleError, clearError } = useErrorHandler();

  const storedUser = useAuthStore((state) => state.user);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(storedUser);
  const [orderStats, setOrderStats] = useState<ShopOrderStatistics | null>(null);
  const [hasSignedToday, setHasSignedToday] = useState<boolean>(false); // Default to false to ensure red dot is visible initially
  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });
  const loading = loadMachine.state === LoadingState.LOADING;

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      // ✅ 使用统一错误处理
      handleError('未检测到登录信息，请重新登录', {
        persist: true,
        showToast: false,
      });
      return;
    }

    let isMounted = true;
    const loadProfile = async () => {
      loadMachine.send(LoadingEvent.LOAD);
      try {
        const response = await fetchProfile(token);
        if (!isMounted) return;

        if (isSuccess(response) && response.data?.userInfo) {
          setUserInfo(response.data.userInfo);
          updateUser(response.data.userInfo);
          clearError(); // ✅ 使用统一错误清除
          loadMachine.send(LoadingEvent.SUCCESS);
        } else {
          // ✅ 使用统一错误处理
          handleError(response, {
            persist: true,
            showToast: false,
            customMessage: '获取用户信息失败',
          });
          loadMachine.send(LoadingEvent.ERROR);
        }
      } catch (err: any) {
        if (!isMounted) return;
        // ✅ 使用统一错误处理
        handleError(err, {
          persist: true,
          showToast: false,
          customMessage: '获取个人信息失败',
        });
        loadMachine.send(LoadingEvent.ERROR);
      } finally {
        if (isMounted) {
          // 状态机已处理成功/失败
        }
      }
    };

    loadProfile();

    const loadOrderStats = async () => {
      try {
        const res = await fetchShopOrderStatistics(token);
        if (isSuccess(res) && res.data) {
          setOrderStats(res.data);
        }
      } catch (e) {
        console.error('加载订单统计失败', e);
      }
    };
    loadOrderStats();

    const loadSignInStatus = async () => {
      try {
        console.log('[Profile] 开始加载签到状态...');

        // 1. 优先检查本地存储
        const todayStr = new Date().toISOString().split('T')[0];
        const lastSignedDate = localStorage.getItem(STORAGE_KEYS.LAST_SIGN_IN_DATE_KEY);

        if (lastSignedDate === todayStr) {
          console.log('[Profile] 本地缓存显示今日已签到，跳过API请求');
          setHasSignedToday(true);
          return;
        }

        // 2. 本地无记录或日期不匹配，才请求API
        const res = await fetchSignInInfo(token);
        console.log('[Profile] 签到状态API响应:', res);

        // 使用统一的API响应处理
        const signInData = extractData(res);
        if (signInData) {
          const hasSign = signInData.today_signed || false;
          console.log('[Profile] 今日是否已签到:', hasSign);
          setHasSignedToday(hasSign);

          // 如果API确认已签到，更新本地存储
          if (hasSign) {
            localStorage.setItem(STORAGE_KEYS.LAST_SIGN_IN_DATE_KEY, todayStr);
          }
        } else {
          console.warn('[Profile] 签到状态API返回异常:', res);
          // Default to false to show red dot (safer to show when uncertain)
          setHasSignedToday(false);
        }
      } catch (e) {
        console.error('[Profile] 加载签到状态失败:', e);
        // Default to false to show red dot on error
        setHasSignedToday(false);
      }
    };

    // Load initially
    loadSignInStatus();

    // Reload when window gets focus (handling return from other tabs/apps)
    const handleFocus = () => {
      loadSignInStatus();
    };
    window.addEventListener('focus', handleFocus);

    // Also reload periodically or when this component re-renders/mounts (which it does on tab switch)
    // The dependency array is empty, so it runs on mount.
    // If the component is kept alive (not unmounted), focus listener helps.
    // If we want to force check more often:
    // const interval = setInterval(loadSignInStatus, 10000);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      // clearInterval(interval);
    };
  }, []);

  const { realName, logout, updateUser } = useAuthStore();

  const handleLogout = () => {
    logout();
    // 稍微延迟一下跳转，让状态更新
    setTimeout(() => {
      navigate('/sign-in');
    }, 50);
  };
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

  const stats = useMemo(
    () => [
      { label: '供应链专项金', val: formatAmount(userInfo?.money) },
      { label: '可调度收益', val: formatAmount(userInfo?.withdrawable_money) },
      { label: '确权金', val: formatAmount(userInfo?.service_fee_balance) },
    ],
    [userInfo]
  );

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      {/* Top Background Gradient - Match Home Page (Pastel Orange) */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-[#FFD6A5] to-gray-50 z-0"></div>

      {/* User Header - 参考淘宝布局 */}
      <div className="pt-4 pb-2 px-6 relative z-10 text-gray-900">
        {/* 顶部操作栏：头像、名称、右侧按钮 */}
        <div className="flex items-center justify-between">
          {/* 左侧：头像 + 名称 + 标签 */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-xl font-bold text-orange-600 overflow-hidden shadow-sm">
              {displayAvatarUrl ? (
                <img src={displayAvatarUrl} alt="用户头像" className="w-full h-full object-cover" />
              ) : (
                displayAvatarText || '用'
              )}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{displayName}</h2>
              {/* 标签行：用户身份 + 代理状态 */}
              <div className="flex items-center gap-2">
                {/* 用户类型标签 - 胶囊样式 */}
                <div className="flex items-center bg-gray-900/5 backdrop-blur-sm rounded-full px-2 py-0.5 border border-gray-200/50">
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mr-1 shadow-sm">
                    {(() => {
                      const statusConfig = {
                        0: { icon: Sprout },
                        1: { icon: UserCheck },
                        2: { icon: Gem },
                      }[userInfo?.user_type ?? -1] || { icon: UserCheck };
                      const Icon = statusConfig.icon;
                      return <Icon size={8} className="text-white fill-current" />;
                    })()}
                  </div>
                  <span className="text-[10px] font-bold text-gray-700">{displayId}</span>
                </div>

                {/* 代理标签 - 仅在相关状态显示 */}
                {userInfo?.agent_review_status === 1 && (
                  <div className="flex items-center bg-red-50 rounded-full px-2 py-0.5 border border-red-100">
                    <Award size={10} className="text-red-500 mr-1" />
                    <span className="text-[10px] font-bold text-red-600">代理</span>
                  </div>
                )}
                {userInfo?.agent_review_status === 0 && (
                  <div className="flex items-center bg-yellow-50 rounded-full px-2 py-0.5 border border-yellow-100">
                    <Award size={10} className="text-yellow-600 mr-1" />
                    <span className="text-[10px] font-bold text-yellow-700">待审核</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 右侧：功能按钮组 - 图标放大, 间隔加大 */}
          <div className="flex items-center gap-5">
            {/* 客服 */}
            <button
              onClick={() => navigate('/online-service')}
              className="flex flex-col items-center text-gray-700 active:opacity-70"
            >
              <HeadphonesIcon size={26} strokeWidth={1.5} />
              <span className="text-[10px] mt-0.5 font-medium">客服</span>
            </button>

            {/* 消息 */}
            <button
              onClick={() => navigate('/message-center')}
              className="flex flex-col items-center text-gray-700 active:opacity-70 relative"
            >
              <MessageSquare size={26} strokeWidth={1.5} />
              <span className="text-[10px] mt-0.5 font-medium">消息</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white box-content"></span>
              )}
            </button>
            
            {/* 设置 */}
            <button
              onClick={() => navigate('/settings')}
              className="flex flex-col items-center text-gray-700 active:opacity-70"
            >
              <Settings size={26} strokeWidth={1.5} />
              <span className="text-[10px] mt-0.5 font-medium">设置</span>
            </button>
          </div>
        </div>
      </div>

      {/* Digital Rights Card - 独立区块，减少外边距增加显示区域 */}
      <div className="px-3 relative z-10">
        <div className="bg-white rounded-2xl px-5 py-5 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">供应链专项金</span>
                <span className="bg-orange-50 text-orange-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  采购本金
                </span>
              </div>
              <button
                onClick={() => navigate('/balance-recharge')}
                className="text-orange-600 text-sm font-medium flex items-center gap-1 active:opacity-70"
              >
                去充值 <ChevronRight size={14} />
              </button>
            </div>

            {/* Main Big Number: Supply Chain Special Fund (balance_available) */}
            <div
              className="text-3xl font-[DINAlternate-Bold,Roboto,sans-serif] font-bold text-gray-900 tracking-tight mb-5 cursor-pointer active:opacity-70 transition-opacity"
              onClick={() => navigate('/asset-view?tab=0')}
            >
              <span className="text-xl mr-1">¥</span>
              {/* Display balance_available without commas */}
              {String(userInfo?.balance_available || '0.00')}
            </div>

            {/* Bottom Grid: 2x2 Layout */}
            <div className="grid grid-cols-4 gap-x-2">
              {/* Withdrawable */}
              <div
                className="flex flex-col cursor-pointer active:opacity-70 transition-opacity"
                onClick={() => navigate('/asset-view?tab=1')}
              >
                <div className="text-xs text-gray-400 mb-1">可调度收益</div>
                <div className="text-sm font-bold text-gray-800 font-[DINAlternate-Bold,Roboto,sans-serif] leading-tight">
                  {formatAmount(userInfo?.withdrawable_money)}
                </div>
              </div>

              {/* Consumer Points */}
              <div
                className="flex flex-col cursor-pointer active:opacity-70 transition-opacity"
                onClick={() => navigate('/market')}
              >
                <div className="text-xs text-gray-400 mb-1">消费金</div>
                <div className="text-sm font-bold text-gray-800 font-[DINAlternate-Bold,Roboto,sans-serif] leading-tight">
                  {userInfo?.score || 0}
                </div>
              </div>

              {/* Green Power */}
              <div
                className="flex flex-col cursor-pointer active:opacity-70 transition-opacity"
                onClick={() => navigate('/hashrate-exchange')}
              >
                <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  绿色算力 <Leaf size={10} className="text-green-500" />
                </div>
                <div className="text-sm font-bold text-gray-800 font-[DINAlternate-Bold,Roboto,sans-serif] leading-tight">
                  {userInfo?.green_power || 0}
                </div>
              </div>

              {/* Rights Fund */}
              <div
                className="flex flex-col cursor-pointer active:opacity-70 transition-opacity"
                onClick={() => navigate('/asset-view?tab=3')}
              >
                <div className="text-xs text-gray-400 mb-1">确权金</div>
                <div className="text-sm font-bold text-gray-800 font-[DINAlternate-Bold,Roboto,sans-serif] leading-tight">
                  {formatAmount(userInfo?.service_fee_balance)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasError && !userInfo && !errorMessage.includes('登录态过期') && (
        <div className="mx-4 mt-4 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg shadow-sm">
          {errorMessage}
        </div>
      )}

      <div className="px-4 mt-2 relative z-10 space-y-4">
        {/* Convenient Services - Micro Texture Icons */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
            便捷服务
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: '专项金充值',
                icon: Wallet,
                color: 'text-orange-600',
                bg: 'bg-orange-50',
                action: () => navigate('/balance-recharge'),
              },
              {
                label: '每日签到',
                icon: CalendarCheck,
                color: 'text-red-500',
                bg: 'bg-red-50',
                action: () => navigate('/sign-in'),
              },
              {
                label: '收益提现',
                icon: Receipt,
                color: 'text-orange-500',
                bg: 'bg-orange-50',
                action: () => navigate('/balance-withdraw'),
              },
              {
                label: '消费金兑换',
                icon: CoinsIcon,
                color: 'text-yellow-600',
                bg: 'bg-yellow-50',
                action: () => navigate('/market'),
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center cursor-pointer active:opacity-60 group"
                onClick={item.action}
              >
                <div
                  className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center mb-2 transition-transform group-active:scale-95 relative`}
                >
                  <item.icon size={20} className={item.color} strokeWidth={2} />
                  {(item as any).badge && (item as any).badge > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white px-1">
                      {(item as any).badge > 99 ? '99+' : (item as any).badge}
                    </span>
                  ) : null}
                  {item.label === '每日签到' && !hasSignedToday && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
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
              {
                label: '资产明细',
                icon: FileText,
                color: 'text-purple-600',
                bg: 'bg-purple-50',
                action: () => navigate('/asset-view'),
              },
              {
                label: '累计权益',
                icon: ShieldCheck,
                color: 'text-green-600',
                bg: 'bg-green-50',
                action: () => navigate('/cumulative-rights'),
              },
              {
                label: '寄售券',
                icon: Receipt,
                color: 'text-pink-600',
                bg: 'bg-pink-50',
                action: () => navigate('/consignment-voucher'),
              },
              {
                label: '我的藏品',
                icon: Box,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                action: () => navigate('/my-collection'),
              },
              {
                label: '交易订单',
                icon: ClipboardList,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                action: () => navigate('/orders/transaction/0'),
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center cursor-pointer active:opacity-60 group"
                onClick={item.action}
              >
                <div
                  className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center mb-2 transition-transform group-active:scale-95`}
                >
                  <item.icon size={20} className={item.color} strokeWidth={2} />
                </div>
                <span className="text-xs text-gray-600 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 消费金订单 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
            消费金订单
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: '待付款',
                icon: Coins,
                color: 'text-orange-500',
                bg: 'bg-orange-50',
                action: () => navigate('/orders/points/0'),
                badge: orderStats?.pending_count || 0,
              },
              {
                label: '待发货',
                icon: Package,
                color: 'text-blue-500',
                bg: 'bg-blue-50',
                action: () => navigate('/orders/points/1'),
                badge: orderStats?.paid_count || 0,
              },
              {
                label: '待收货',
                icon: Truck,
                color: 'text-purple-500',
                bg: 'bg-purple-50',
                action: () => navigate('/orders/points/2'),
                badge: orderStats?.shipped_count || 0,
              },
              {
                label: '已完成',
                icon: CheckCircle,
                color: 'text-green-500',
                bg: 'bg-green-50',
                action: () => navigate('/orders/points/3'),
                badge: orderStats?.completed_count || 0,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center cursor-pointer active:opacity-60 group"
                onClick={item.action}
              >
                <div
                  className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center mb-2 transition-transform group-active:scale-95 relative`}
                >
                  <item.icon size={20} className={item.color} strokeWidth={2} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white px-1">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
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
              {
                label: '实名认证',
                icon: UserCheck,
                action: () => navigate('/real-name-auth'),
              },
              {
                label: '卡号管理',
                icon: CreditCard,
                action: () => navigate('/card-management'),
              },
              {
                label: '收货地址',
                icon: MapPin,
                action: () => navigate('/address-list'),
              },
              { label: '我的好友', icon: Users, action: () => navigate('/my-friends') },
              {
                label: '代理认证',
                icon: UserCheck,
                action: () => navigate('/agent-auth'),
              },
              {
                label: '帮助中心',
                icon: HelpCircle,
                action: () => navigate('/help-center'),
              },
              {
                label: '规则协议',
                icon: FileText,
                action: () => navigate('/user-agreement'),
              },
              {
                label: '用户问卷',
                icon: FileText,
                action: () => navigate('/user-survey'),
              },
              {
                label: '活动中心',
                icon: Gift,
                action: () => navigate('/activity-center'),
              },
              {
                label: '在线客服',
                icon: HeadphonesIcon,
                action: () => navigate('/online-service'),
              },
              { label: '平台资讯', icon: Newspaper, action: () => navigate('/news') },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center cursor-pointer active:opacity-60 group"
                onClick={item.action}
              >
                <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center mb-2 transition-transform group-active:scale-95">
                  <item.icon size={20} className="text-gray-600" strokeWidth={1.5} />
                </div>
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
