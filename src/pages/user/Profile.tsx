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
    <div className="pb-24 min-h-screen bg-gray-100">
      {/* 京东风格红色渐变背景头部 */}
      <div className="bg-gradient-to-b from-[#e23c41] to-[#ff6034] relative">
        {/* 顶部操作栏 */}
        <div className="flex items-center justify-between px-4 pt-10 pb-2">
          <div className="flex items-center gap-1">
            <span className="text-white/80 text-xs flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center">
                <span className="text-[8px] text-white">✓</span>
              </span>
              点评
            </span>
            <span className="text-white text-xs ml-2">围观树交所真榜上榜好物</span>
            <ChevronRight size={12} className="text-white/60" />
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/online-service')} className="text-white/90 flex flex-col items-center">
              <HeadphonesIcon size={18} />
              <span className="text-[10px] mt-0.5">客户服务</span>
            </button>
            <button onClick={() => navigate('/address-list')} className="text-white/90 flex flex-col items-center">
              <MapPin size={18} />
              <span className="text-[10px] mt-0.5">地址</span>
            </button>
            <button onClick={() => navigate('/settings')} className="text-white/90 flex flex-col items-center">
              <Settings size={18} />
              <span className="text-[10px] mt-0.5">设置</span>
            </button>
          </div>
        </div>

        {/* 用户信息区 */}
        <div className="px-4 py-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden">
            {displayAvatarUrl ? (
              <img src={displayAvatarUrl} alt="用户头像" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{displayAvatarText || '用'}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-white text-lg font-bold">{displayName}</h2>
              <ChevronRight size={16} className="text-white/60" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Gem size={10} />
                {displayId}
              </span>
              <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">
                🎓 学生特权
              </span>
              {userInfo?.agent_review_status === 1 && (
                <span className="bg-red-700 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Award size={10} />
                  代理
                </span>
              )}
            </div>
          </div>
          {/* PLUS 会员入口 */}
          <div 
            className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl px-3 py-2 min-w-[100px]"
            onClick={() => navigate('/settings')}
          >
            <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
              <span>PLUS会员</span>
              <ChevronRight size={12} />
            </div>
            <div className="text-white/70 text-[10px] mt-0.5">享免费退换货</div>
          </div>
        </div>

        {/* 优惠入口（优惠券、豆子、红包等） */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center cursor-pointer" onClick={() => navigate('/asset-view?tab=0')}>
              <div className="flex items-baseline justify-center">
                <span className="text-red-200 text-[10px] px-1.5 py-0.5 rounded bg-red-800/50 mr-1">大额券</span>
                <span className="text-white text-lg font-bold">{userInfo?.coupon_count || 4}</span>
                <span className="text-white/70 text-xs">张</span>
              </div>
              <div className="text-white/70 text-[10px] mt-0.5">优惠券</div>
            </div>
            <div className="text-center cursor-pointer" onClick={() => navigate('/asset-view?tab=1')}>
              <div className="flex items-baseline justify-center">
                <span className="text-white/70 text-xs">领</span>
                <span className="text-white text-lg font-bold">{userInfo?.score || 88}</span>
                <span className="text-white/70 text-xs">豆</span>
              </div>
              <div className="text-white/70 text-[10px] mt-0.5">京豆</div>
            </div>
            <div className="text-center cursor-pointer" onClick={() => navigate('/asset-view?tab=1')}>
              <div className="flex items-baseline justify-center">
                <span className="text-white/70 text-xs">领¥</span>
                <span className="text-white text-lg font-bold">55</span>
              </div>
              <div className="text-white/70 text-[10px] mt-0.5">红包</div>
            </div>
            <div className="text-center cursor-pointer" onClick={() => navigate('/balance-recharge')}>
              <div className="text-white text-sm font-bold">限时返</div>
              <div className="text-white/70 text-[10px] mt-0.5">京东E卡</div>
            </div>
            <div className="text-center cursor-pointer">
              <div className="flex items-baseline justify-center">
                <span className="text-white/70 text-xs">抽¥</span>
                <span className="text-white text-lg font-bold">20</span>
              </div>
              <div className="text-white/70 text-[10px] mt-0.5 flex items-center gap-0.5">
                秒送 <span className="bg-yellow-400 text-black text-[8px] px-1 rounded">外卖</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-white text-sm">更多</div>
              <ChevronRight size={12} className="text-white/60 mx-auto" />
            </div>
          </div>
        </div>

        {/* 活动横幅 */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex-shrink-0 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl px-3 py-2 flex items-center gap-2 min-w-[140px]">
            <div className="text-red-600 text-xs font-bold">粮油秒杀</div>
            <div className="text-gray-500 text-[10px]">粮油年货节</div>
          </div>
          <div className="flex-shrink-0 bg-gradient-to-r from-red-600 to-red-500 rounded-xl px-3 py-2 flex items-center gap-2 min-w-[140px]">
            <div className="text-yellow-300 text-xs font-bold">新年购物季</div>
            <div className="text-white text-[10px]">直降5折起</div>
            <span className="text-yellow-300 text-[10px]">去抢购 &gt;</span>
          </div>
          <div className="flex-shrink-0 bg-gradient-to-r from-pink-100 to-pink-50 rounded-xl px-3 py-2 flex items-center gap-2 min-w-[120px]">
            <div className="text-red-500 text-xs font-bold">享85折</div>
            <div className="text-gray-500 text-[10px]">零食购物季</div>
          </div>
        </div>

        {/* 余额提醒 */}
        <div className="mx-4 mb-3 bg-blue-50 rounded-lg px-3 py-2 flex items-center justify-between border border-blue-100">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-xs font-medium">提醒</span>
            <span className="text-gray-600 text-xs">您有 ¥ {formatAmount(userInfo?.balance_available)} 余额待提取</span>
          </div>
          <button onClick={() => navigate('/balance-withdraw')} className="text-blue-500 text-xs font-medium">
            去提取 &gt;
          </button>
        </div>
      </div>

      {/* 统计信息栏 - 白色背景 */}
      <div className="bg-white mx-4 -mt-2 rounded-t-2xl relative z-10">
        <div className="flex items-center justify-around py-3 border-b border-gray-100">
          <div className="text-center cursor-pointer" onClick={() => navigate('/my-collection')}>
            <div className="text-gray-800 font-bold">{userInfo?.footprint_count || 28}</div>
            <div className="text-gray-400 text-xs">足迹</div>
          </div>
          <div className="text-center cursor-pointer" onClick={() => navigate('/my-collection')}>
            <div className="text-gray-800 font-bold">{userInfo?.collection_count || 1}</div>
            <div className="text-gray-400 text-xs">收藏</div>
          </div>
          <div className="text-center cursor-pointer" onClick={() => navigate('/my-friends')}>
            <div className="text-gray-800 font-bold">{userInfo?.follow_count || 5}</div>
            <div className="text-gray-400 text-xs">关注</div>
          </div>
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>种草</span>
            <span>发现</span>
          </div>
        </div>

        {/* 订单状态入口 */}
        <div className="flex items-center justify-around py-4">
          <div className="text-center cursor-pointer" onClick={() => navigate('/order-list?status=unpaid')}>
            <div className="relative">
              <Receipt size={22} className="text-gray-600 mx-auto" />
              {(orderStats?.unpaid_count ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {orderStats?.unpaid_count}
                </span>
              )}
            </div>
            <div className="text-gray-600 text-xs mt-1">待付款</div>
          </div>
          <div className="text-center cursor-pointer" onClick={() => navigate('/order-list?status=paid')}>
            <div className="relative">
              <Truck size={22} className="text-gray-600 mx-auto" />
              {(orderStats?.pending_shipment_count ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {orderStats?.pending_shipment_count}
                </span>
              )}
            </div>
            <div className="text-gray-600 text-xs mt-1">待收货</div>
          </div>
          <div className="text-center cursor-pointer" onClick={() => navigate('/order-list?status=shipped')}>
            <div className="relative">
              <Box size={22} className="text-gray-600 mx-auto" />
            </div>
            <div className="text-gray-600 text-xs mt-1">待使用</div>
          </div>
          <div className="text-center cursor-pointer" onClick={() => navigate('/order-list?status=completed')}>
            <div className="relative">
              <MessageSquare size={22} className="text-gray-600 mx-auto" />
            </div>
            <div className="text-gray-600 text-xs mt-1">待评价</div>
          </div>
          <div className="text-center cursor-pointer" onClick={() => navigate('/order-list')}>
            <div className="relative">
              <Package size={22} className="text-gray-600 mx-auto" />
            </div>
            <div className="text-gray-600 text-xs mt-1">退换/售后</div>
          </div>
          <div className="text-center cursor-pointer" onClick={() => navigate('/order-list')}>
            <div className="text-gray-600 text-xs flex items-center justify-center w-6 h-6 mx-auto border border-gray-300 rounded-full">
              <ChevronRight size={14} />
            </div>
            <div className="text-gray-600 text-xs mt-1">全部</div>
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
