/**
 * ActivityCenter - 活动中心页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, ChevronRight, CheckCircle, ArrowRight, Zap, Trophy, Users, ShoppingBag, CreditCard, FileText, UserCheck } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { LoadingSpinner } from '@/components/common';
import { useNotification } from '@/context/NotificationContext';
import { getActivityList, ActivityItem } from '@/services/activity';
import { isSuccess } from '@/utils/apiHelpers';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { errorLog } from '@/utils/logger';

const ActivityCenter: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useNotification();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
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
        loadActivities();
    }, []);

    const loadActivities = async () => {
        try {
            loadMachine.send(LoadingEvent.LOAD);
            const res = await getActivityList();
            if (isSuccess(res) && res.data?.list) {
                setActivities(res.data.list);
                loadMachine.send(LoadingEvent.SUCCESS);
            } else {
                loadMachine.send(LoadingEvent.ERROR);
            }
        } catch (error) {
            errorLog('ActivityCenter', 'Failed to load activities', error);
            showToast('error', '加载失败', '无法获取活动列表');
            loadMachine.send(LoadingEvent.ERROR);
        } finally {
            // 状态机已处理成功/失败
        }
    };

    const handleAction = (item: ActivityItem) => {
        if (item.status === 2) return; // 已完成

        // 根据 key 跳转到对应页面
        switch (item.key) {
            case 'first_trade':
                navigate('/market');
                break;
            case 'invite':
                navigate('/my-friends');
                break;
            case 'recharge':
                navigate('/balance-recharge');
                break;
            case 'questionnaire':
                navigate('/user-survey');
                break;
            case 'real_name':
                navigate('/real-name-auth');
                break;
            default:
                // 如果没有匹配的跳转，或者状态是领取奖励(目前暂定只能跳去完成，具体看需求)
                // 如果是领取奖励逻辑，可能需要调用API，此处暂保留结构
                if (item.status === 1) {
                    showToast('success', '提示', '请联系客服或自动发放');
                } else {
                    showToast('info', '提示', '请前往对应功能区完成任务');
                }
                break;
        }
    };

    const getIcon = (key: string) => {
        switch (key) {
            case 'first_trade': return <ShoppingBag size={20} className="text-red-500" />;
            case 'invite': return <Users size={20} className="text-blue-500" />;
            case 'recharge': return <CreditCard size={20} className="text-purple-500" />;
            case 'questionnaire': return <FileText size={20} className="text-green-500" />;
            case 'real_name': return <UserCheck size={20} className="text-indigo-500" />;
            default: return <Gift size={20} className="text-red-500" />;
        }
    };

    return (
        <PageContainer title="活动中心" onBack={() => navigate(-1)}>
            <div className="p-4 space-y-4 pb-safe">
                {/* 顶部 Banner */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-red-200 mb-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                            <Trophy className="text-yellow-300" />
                            福利任务
                        </h1>
                        <p className="text-white/80 text-xs">完成任务获取丰厚奖励，助力财富增长</p>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                        <Gift size={120} />
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                ) : activities.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 text-sm">暂无活动</div>
                ) : (
                    activities.map((item) => (
                        <div key={item.key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                {getIcon(item.key)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {item.rewards.map((reward, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 font-medium">
                                            {reward.type === 'score' && <Zap size={10} />}
                                            {reward.name} +{reward.value}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => handleAction(item)}
                                disabled={item.status === 2}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${item.status === 2
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : item.status === 1
                                        ? 'bg-green-500 text-white shadow-md shadow-green-200 active:scale-95'
                                        : 'bg-red-500 text-white shadow-md shadow-red-200 active:scale-95'
                                    }`}
                            >
                                {item.status === 2 ? (
                                    <>已完成 <CheckCircle size={12} /></>
                                ) : (
                                    <>{item.btn_text || (item.status === 1 ? '领取奖励' : '去完成')} {item.status !== 2 && <ArrowRight size={12} />}</>
                                )}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </PageContainer>
    );
};

export default ActivityCenter;
