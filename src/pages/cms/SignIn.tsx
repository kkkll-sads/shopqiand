/**
 * SignIn - 签到页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, History, CalendarCheck, Users, Wallet, Info, Gift, X, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-react';
import {
    fetchSignInRules,
    fetchSignInInfo,
    fetchSignInProgress,
    fetchPromotionCard,
    doSignIn,
    SignInRulesData,
    SignInProgressData,
    fetchTeamMembers
} from '@/services/api';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
// ✅ 引入统一 API 处理工具
import { isSuccess, extractData, extractError } from '@/utils/apiHelpers';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { errorLog } from '@/utils/logger';

const SignIn: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const [balance, setBalance] = useState<number>(0);
    const [hasSignedIn, setHasSignedIn] = useState<boolean>(false);
    const [showRedPacket, setShowRedPacket] = useState<boolean>(false);
    const [showCalendar, setShowCalendar] = useState<boolean>(false);
    const [redPacketAmount, setRedPacketAmount] = useState<number>(0);
    const [inviteCount, setInviteCount] = useState<number>(0);
    const [signedInDates, setSignedInDates] = useState<string[]>([]);
    const [activityInfo, setActivityInfo] = useState<SignInRulesData | null>(null);
    const [progressInfo, setProgressInfo] = useState<SignInProgressData | null>(null);
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


    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());

    // Load data from API
    useEffect(() => {
        const loadData = async () => {
            loadMachine.send(LoadingEvent.LOAD);
            const token = getStoredToken();

            try {
                // 并行加载所有请求，显著减少加载时间
                const requests: Promise<any>[] = [
                    // 活动规则（不需要token）
                    fetchSignInRules()
                ];

                // 需要token的请求
                if (token) {
                    requests.push(
                        fetchSignInInfo(token),
                        fetchSignInProgress(token),
                        fetchPromotionCard(token).catch(() => ({ code: -1, data: null })),
                        fetchTeamMembers({ level: 1, page: 1, limit: 1 }).catch(() => ({ code: -1, data: null }))
                    );
                }

                // 并行执行所有请求
                const results = await Promise.all(requests);

                // 处理活动规则（第一个请求）
                const rulesRes = results[0];
                if ((isSuccess(rulesRes) || rulesRes.code === 0) && extractData(rulesRes)) {
                    setActivityInfo(extractData(rulesRes)!);
                }

                // 处理需要token的请求结果
                if (token && results.length > 1) {
                    const [infoRes, progressRes, promotionRes, teamRes] = results.slice(1);

                    // 处理签到信息
                    const infoData = extractData(infoRes) as { total_reward?: number; today_signed?: boolean; calendar?: { signed_dates?: string[] } } | null;
                    if ((isSuccess(infoRes) || infoRes.code === 0) && infoData) {
                        const data = infoData;
                        setBalance(data.total_reward || 0);
                        setHasSignedIn(data.today_signed || false);

                        // Convert signed dates from YYYY-MM-DD to DateString format for calendar
                        const dates = data.calendar?.signed_dates?.map((dateStr: string) => {
                            try {
                                const date = new Date(dateStr);
                                if (!isNaN(date.getTime())) {
                                    return date.toDateString();
                                }
                                return dateStr;
                            } catch {
                                return dateStr;
                            }
                        }) || [];
                        setSignedInDates(dates);

                        // 如果API确认已签到，更新本地存储
                        if (data.today_signed) {
                            const todayStr = new Date().toISOString().split('T')[0];
                            localStorage.setItem(STORAGE_KEYS.LAST_SIGN_IN_DATE_KEY, todayStr);
                        }
                    }

                    // 处理进度信息（优先级更高，会覆盖balance）
                    const progressData = extractData(progressRes) as SignInProgressData | null;
                    if (progressData) {
                        setProgressInfo(progressData);
                        // 使用 withdrawable_money 作为当前累计奖励（可提现金额）
                        if (progressData.withdrawable_money !== undefined) {
                            setBalance(progressData.withdrawable_money);
                        } else if (progressData.total_money !== undefined) {
                            setBalance(progressData.total_money);
                        }
                    }

                    // 处理邀请人数
                    if ((isSuccess(teamRes) || teamRes.code === 0) && teamRes.data) {
                        setInviteCount((teamRes.data as any).total || 0);
                    } else {
                        // Fallback to promotion card count if team fetch fails
                        const promotionData = extractData(promotionRes) as { team_count?: number } | null;
                        if (promotionData) {
                            setInviteCount(promotionData.team_count || 0);
                        }
                    }
                }
                loadMachine.send(LoadingEvent.SUCCESS);
            } catch (error: any) {
                errorLog('SignIn', '加载签到数据失败', error);
                showToast('error', '加载失败', '加载数据失败，请重试');
                loadMachine.send(LoadingEvent.ERROR);
            } finally {
                // 状态机已处理成功/失败
            }
        };

        loadData();
    }, []);

    const handleSignIn = async () => {
        if (hasSignedIn) {
            setShowCalendar(true);
            return;
        }

        const token = getStoredToken();
        if (!token) {
            showToast('warning', '请先登录');
            return;
        }

        try {
            const res = await doSignIn(token);
            // ✅ extractData 已支持 code=0
            const data = extractData(res);
            if (data) {
                const rewardAmount = data.daily_reward || 0;

                setRedPacketAmount(rewardAmount);
                setShowRedPacket(true);
                setBalance(data.total_reward || 0);
                setHasSignedIn(true);

                // 签到成功，更新本地存储
                const todayStr = new Date().toISOString().split('T')[0];
                localStorage.setItem(STORAGE_KEYS.LAST_SIGN_IN_DATE_KEY, todayStr);

                // Update signed dates
                const dates = data.calendar?.signed_dates?.map((dateStr: string) => {
                    try {
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                            return date.toDateString();
                        }
                        return dateStr; // Fallback to original format
                    } catch {
                        return dateStr;
                    }
                }) || [];
                setSignedInDates(dates);

                // Refresh progress info after sign in
                const token = getStoredToken();
                if (token) {
                    try {
                        const progressRes = await fetchSignInProgress(token);
                        // ✅ extractData 已支持 code=0
                        const refreshedProgressData = extractData(progressRes);
                        if (refreshedProgressData) {
                            setProgressInfo(refreshedProgressData);
                            // 使用 withdrawable_money 作为当前累计奖励（可提现金额）
                            if (refreshedProgressData.withdrawable_money !== undefined) {
                                setBalance(refreshedProgressData.withdrawable_money);
                            } else if (refreshedProgressData.total_money !== undefined) {
                                setBalance(refreshedProgressData.total_money);
                            }
                        }
                    } catch (error) {
                        errorLog('SignIn', '刷新进度信息失败', error);
                    }
                }
            } else {
                showToast('error', '签到失败', extractError(res, '请重试'));
            }
        } catch (error: any) {
            errorLog('SignIn', '签到失败', error);
            showToast('error', '签到失败', error?.msg || error?.message || '请重试');
        }
    };

    const handleInvite = () => {
        navigate('/invite-friends');
    };

    const handleWithdrawClick = () => {
        const minAmount = progressInfo?.withdraw_min_amount || activityInfo?.activity?.withdraw_min_amount || 10;
        const canWithdraw = progressInfo?.can_withdraw ?? (balance >= minAmount);

        if (!canWithdraw) {
            showToast('warning', '余额不足', `余额不足 ${minAmount.toFixed(2)} 元，暂不可提现`);
            return;
        }

        // 跳转到提现页面
        navigate('/balance-withdraw');
    };


    // Calendar Logic
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        return { days, firstDay };
    };

    const renderCalendar = () => {
        const { days, firstDay } = getDaysInMonth(currentDate);
        const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        const grid = [];
        // Empty cells for padding
        for (let i = 0; i < firstDay; i++) {
            grid.push(<div key={`empty-${i}`} className="h-10"></div>);
        }

        // Days
        for (let day = 1; day <= days; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = date.toDateString();
            // Check if this date is signed in
            const isSigned = signedInDates.some(signedDate => {
                try {
                    // Handle both DateString format and YYYY-MM-DD format
                    const signed = signedDate.includes('-') ? new Date(signedDate) : new Date(signedDate);
                    return signed.getFullYear() === currentYear &&
                        signed.getMonth() === currentMonth &&
                        signed.getDate() === day;
                } catch {
                    return false;
                }
            });
            const isToday = dateStr === new Date().toDateString();

            grid.push(
                <div key={day} className="h-10 flex items-center justify-center relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${isSigned ? 'bg-red-500 text-white shadow-md' : isToday ? 'border border-red-500 text-red-500' : 'text-gray-700'}
          `}>
                        {day}
                    </div>
                    {isSigned && (
                        <div className="absolute -bottom-1 text-[10px] text-red-500 font-bold">✓</div>
                    )}
                </div>
            );
        }

        return (
            <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="p-1 hover:bg-gray-100 rounded">
                        <ChevronLeftIcon size={20} className="text-gray-500" />
                    </button>
                    <div className="font-bold text-lg text-gray-800">{currentYear}年 {monthNames[currentMonth]}</div>
                    <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="p-1 hover:bg-gray-100 rounded">
                        <ChevronRightIcon size={20} className="text-gray-500" />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-gray-400 font-medium">
                    <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {grid}
                </div>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>已签到</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full border border-red-500"></div>
                        <span>今天</span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-red-50 pb-safe flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-500">加载中...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-red-50 pb-safe">
            {/* Custom Header */}
            <div className="relative bg-gradient-to-b from-red-600 to-red-500 text-white pb-24">
                <div className="flex items-center px-4 py-3">
                    <button onClick={() => navigate(-1)} className="p-1 -ml-2">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold flex-1 text-center pr-6">每日签到</h1>
                </div>

                <div className="px-6 pt-4 text-center">
                    <div className="text-xs opacity-80 mb-1">树拍·星火燎原</div>
                    <h2 className="text-2xl font-bold mb-2">
                        {activityInfo?.activity?.name || '共识建设与通道测试活动'}
                    </h2>
                    <div className="mt-2 text-xs opacity-75">
                        活动时间：{activityInfo?.activity?.start_time
                            ? new Date(activityInfo.activity.start_time).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
                            : '2025.11.29'} - {activityInfo?.activity?.end_time
                                ? new Date(activityInfo.activity.end_time).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
                                : '2025.12.04'}
                    </div>
                </div>
            </div>

            <div className="px-4 -mt-20 relative z-10 space-y-4">
                {/* Balance Card */}
                <div className="bg-white rounded-xl p-6 shadow-lg text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-bl-lg">
                        已邀请 {inviteCount} 人
                    </div>
                    <div className="text-gray-500 text-sm mb-2">当前累计奖励 (元)</div>
                    <div className="text-4xl font-bold text-red-600 mb-6">{balance.toFixed(2)}</div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleSignIn}
                            className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${hasSignedIn
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md active:scale-95'
                                }`}
                        >
                            {hasSignedIn ? <History size={18} /> : <CalendarCheck size={18} />}
                            {hasSignedIn ? '签到记录' : '每日签到'}
                        </button>
                        <button
                            onClick={handleInvite}
                            className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-lg font-bold text-sm border border-red-100 active:bg-red-100 transition-all"
                        >
                            <Users size={18} />
                            邀请好友
                        </button>
                    </div>
                </div>

                {/* Withdraw Section */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 font-bold text-gray-800">
                            <Wallet className="text-red-500" size={20} />
                            <span>提现申请</span>
                        </div>
                        <span className="text-xs text-gray-400">T+1 到账</span>
                    </div>

                    {/* 余额显示优化 */}
                    <div className="bg-gradient-to-br from-red-50 to-red-50/50 rounded-xl p-5 mb-4 relative overflow-hidden border border-red-100">
                        <div className="absolute -right-3 -top-3 opacity-5 transform rotate-12">
                            <Wallet size={80} className="text-red-500" />
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-sm mb-2 relative z-10">
                            <Wallet size={14} />
                            <span>当前余额</span>
                        </div>
                        <div className="relative z-10 flex items-baseline">
                            <span className="text-3xl font-bold text-gray-900 mr-1">
                                {(progressInfo?.withdrawable_money ?? progressInfo?.total_money ?? balance).toFixed(2)}
                            </span>
                            <span className="text-sm font-normal text-gray-500">元</span>
                        </div>
                    </div>

                    {/* 提现按钮 - 根据余额动态显示 */}
                    {(() => {
                        const currentBalance = progressInfo?.withdrawable_money ?? progressInfo?.total_money ?? balance;
                        const minAmount = 10;
                        const canWithdraw = currentBalance >= minAmount;

                        return (
                            <button
                                onClick={canWithdraw ? handleWithdrawClick : undefined}
                                disabled={!canWithdraw}
                                className={`w-full py-3 rounded-lg font-bold text-sm transition-all shadow-sm ${canWithdraw
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white active:scale-[0.98] active:opacity-90'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {canWithdraw ? '申请提现' : `余额不足10元，还差 ${(minAmount - currentBalance).toFixed(2)} 元`}
                            </button>
                        );
                    })()}
                </div>

                {/* Rules Section - 优化排版 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                        <Info className="text-blue-500" size={20} />
                        <span>活动规则</span>
                    </div>
                    <div className="space-y-3">
                        {activityInfo?.rules?.map((rule, index) => (
                            <div key={index} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                                <div className="w-24 shrink-0 flex justify-center">
                                    <span className={`text-xs px-2 py-0.5 rounded-md w-full text-center font-medium block ${rule.key === 'daily_reward' ? 'bg-red-100 text-red-600' :
                                        rule.key === 'register_reward' ? 'bg-green-100 text-green-600' :
                                            rule.key === 'invite_reward' ? 'bg-purple-100 text-purple-600' :
                                                'bg-blue-100 text-blue-600'
                                        }`}>
                                        {rule.title}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 flex-1 leading-relaxed">
                                    {rule.key === 'invite_reward'
                                        ? <>邀请好友注册可获得 <span className="text-red-500 font-bold">1.5 - 2.0 元随机金额奖励</span></>
                                        : rule.description}
                                </p>
                            </div>
                        ))}
                        {!activityInfo?.rules && (
                            <>
                                <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                                    <div className="w-24 shrink-0 flex justify-center">
                                        <span className="text-xs px-2 py-0.5 rounded-md w-full text-center font-medium block bg-red-100 text-red-600">每日签到奖励</span>
                                    </div>
                                    <p className="text-sm text-gray-600 flex-1 leading-relaxed">每日首次签到可获得 <span className="text-red-500 font-bold">0.20 - 0.50</span> 元随机金额奖励</p>
                                </div>
                                <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                                    <div className="w-24 shrink-0 flex justify-center">
                                        <span className="text-xs px-2 py-0.5 rounded-md w-full text-center font-medium block bg-green-100 text-green-600">注册奖励</span>
                                    </div>
                                    <p className="text-sm text-gray-600 flex-1 leading-relaxed">新用户注册/激活可获得 <span className="text-red-500 font-bold">2.88</span> 元奖励</p>
                                </div>
                                <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                                    <div className="w-24 shrink-0 flex justify-center">
                                        <span className="text-xs px-2 py-0.5 rounded-md w-full text-center font-medium block bg-purple-100 text-purple-600">邀请好友奖励</span>
                                    </div>
                                    <p className="text-sm text-gray-600 flex-1 leading-relaxed">邀请好友注册可获得 <span className="text-red-500 font-bold">1.5 元 - 2.0 元 / 人</span></p>
                                </div>
                                <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                                    <div className="w-24 shrink-0 flex justify-center">
                                        <span className="text-xs px-2 py-0.5 rounded-md w-full text-center font-medium block bg-blue-100 text-blue-600">提现规则</span>
                                    </div>
                                    <p className="text-sm text-gray-600 flex-1 leading-relaxed">账户余额满 <span className="font-bold">10.00</span> 元可申请提现，每人每天限提 1 次，24 小时内审核到账。</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Red Packet Modal */}
            {showRedPacket && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-red-500 w-72 rounded-2xl p-6 text-center relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowRedPacket(false)}
                            className="absolute top-2 right-2 text-white/60 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <Gift size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-yellow-100 text-lg font-bold mb-1">恭喜获得</h3>
                        <div className="text-4xl font-bold text-white mb-2">{redPacketAmount.toFixed(2)} <span className="text-lg">元</span></div>
                        <p className="text-white/80 text-sm mb-6">已存入您的活动账户</p>
                        <button
                            onClick={() => setShowRedPacket(false)}
                            className="w-full bg-yellow-400 text-red-600 font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
                        >
                            开心收下
                        </button>
                    </div>
                </div>
            )}

            {/* Calendar Modal */}
            {showCalendar && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-4 relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowCalendar(false)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10"
                        >
                            <X size={24} />
                        </button>
                        <h3 className="text-center font-bold text-lg mb-2">签到记录</h3>
                        {renderCalendar()}
                    </div>
                </div>
            )}

        </div>
    );
};

export default SignIn;
