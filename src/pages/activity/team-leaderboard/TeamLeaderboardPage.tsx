import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/layouts/PageContainer';
import { HelpCircle } from 'lucide-react';
import LeaderboardHeader from './components/LeaderboardHeader';
import LeaderboardStats from './components/LeaderboardStats';
import MyTeamCard from './components/MyTeamCard';
import LeaderboardList from './components/LeaderboardList';
import RulesModal from './components/RulesModal';
import { useModal } from '@/hooks';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { useNotification } from '@/context/NotificationContext';
import {
    fetchActiveRankOverview,
    fetchActiveRankRules,
    type ActiveRankEvent,
    type ActiveRankMyData,
    type ActiveRankTopItem,
} from '@/services/activeRank';
import { extractData, extractError } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';

const SPRING_HONOR_EXPLANATION_TEXT = `【新春荣耀榜（团队贡献排行）正式启动公告】
各位代理：

为进一步增强团队凝聚力，激发团队活力，公司决定正式启动“新春荣耀榜（团队贡献排行）”活动。

本次活动以团队活动期间有效充值表现为评选依据，最终评选前50名团队授予新春团建奖励资格。

请各代理认真阅读活动规则。

一、活动时间
统计周期：明日起至18日24:00截止
最终排名以截止时间系统统计数据为准。

二、评选规则
活动期间统计团队有效充值总额；
团队须满足有效充值人数不少于5人；
符合最低条件后，按团队充值总额由高到低排序；
仅前50名团队获得团建奖励资格；
未达到最低人数标准的团队不参与本次排名。

三、奖励标准
根据最终排名给予团建报销资格：
第1-10名：团建报销封顶3000元
第11-30名：团建报销封顶2500元
第31-50名：团建报销封顶2000元

具体报销流程及材料要求另行通知。

四、数据说明
仅统计活动期间成功到账的有效充值；
已退款、异常订单不计入统计；
榜单数据系统自动更新；
公司保留最终解释权。

请各团队合理组织团队成员参与，共同冲刺新春荣耀。

《新春荣耀榜活动说明》
为保障公平、公正、公开，本次活动采用系统自动统计机制。

一、有效充值定义
有效充值指：
活动期间成功到账的充值订单；
无退款、无异常状态；
经系统审核确认有效。

二、有效充值人数定义
有效充值人数指：
活动期间至少完成一笔有效充值的团队成员；
同一成员仅计为1人；
人数不足5人的团队不参与排名。

三、排名原则
按团队充值总额由高到低排序；
若总额相同，按达成时间先后排序；
仅展示前50名团队；
截止时间后统一锁榜。

《新春荣耀榜团建物料准备规范》
获得团建奖励资格的团队，须按照以下规范组织团建活动并申请报销。

一、必备物料
活动横幅一条
内容须包含：
“新春团建·共创未来”
团队名称
活动日期

全员合影照片
横幅需在照片中清晰可见；
所有参与成员须在画面内。

参会人员名单
名单人数须与合影人数一致。

二、报销标准
每人补贴150元
单团队最多20人
单团队最高报销3000元
物料费用不超过餐费总额20%
超出部分由团队自行承担。

三、不予报销项目
娱乐消费
高端酒水
舞台搭建
无发票支出
与团建无关的支出

四、报销期限
聚餐结束后7日内提交报销材料；
逾期视为自动放弃；
审核通过后统一安排打款。`;
const TEAM_LEADERBOARD_RULES_SEEN_KEY = 'team_leaderboard_rules_seen_v1';

const TeamLeaderboardPage: React.FC = () => {
    const navigate = useNavigate();
    const rulesModal = useModal();
    const { showToast } = useNotification();
    const pageTitle = '新春荣耀榜';
    const [event, setEvent] = useState<ActiveRankEvent | null>(null);
    const [leaderboard, setLeaderboard] = useState<ActiveRankTopItem[]>([]);
    const [myTeam, setMyTeam] = useState<ActiveRankMyData | null>(null);
    const [updatedAt, setUpdatedAt] = useState(0);
    const [rulesText, setRulesText] = useState('');
    const [rulesLoading, setRulesLoading] = useState(false);

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

    const loadData = useCallback(async () => {
        loadMachine.send(LoadingEvent.LOAD);
        setRulesLoading(true);
        try {
            const [overviewResult, rulesResult] = await Promise.allSettled([
                fetchActiveRankOverview(),
                fetchActiveRankRules(),
            ]);

            if (rulesResult.status === 'fulfilled') {
                const rulesData = extractData(rulesResult.value);
                setRulesText(rulesData?.rules_text || '');
            } else {
                errorLog('TeamLeaderboardPage', '加载规则失败', rulesResult.reason);
            }

            if (overviewResult.status === 'rejected') {
                throw overviewResult.reason;
            }

            const overviewData = extractData(overviewResult.value);
            if (!overviewData) {
                throw new Error(extractError(overviewResult.value, '加载荣耀榜失败'));
            }

            setEvent(overviewData.event ?? null);
            setLeaderboard(Array.isArray(overviewData.top) ? overviewData.top : []);
            setMyTeam(overviewData.my ?? null);
            setUpdatedAt(Number(overviewData.updated_at || 0));
            loadMachine.send(LoadingEvent.SUCCESS);
        } catch (error: any) {
            errorLog('TeamLeaderboardPage', '加载荣耀榜失败', error);
            showToast('error', '加载失败', error?.message || '暂时无法获取荣耀榜数据');
            loadMachine.send(LoadingEvent.ERROR);
        } finally {
            setRulesLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        try {
            const hasSeenRules = window.localStorage.getItem(TEAM_LEADERBOARD_RULES_SEEN_KEY) === '1';
            if (!hasSeenRules) {
                rulesModal.show();
                window.localStorage.setItem(TEAM_LEADERBOARD_RULES_SEEN_KEY, '1');
            }
        } catch {
            rulesModal.show();
        }
    }, [rulesModal.show]);

    const loading = loadMachine.state === LoadingState.LOADING;
    const resolvedRulesText = rulesText.trim()
        ? `${SPRING_HONOR_EXPLANATION_TEXT}\n\n【系统补充说明】\n${rulesText.trim()}`
        : SPRING_HONOR_EXPLANATION_TEXT;

    return (
        <PageContainer
            title={pageTitle}
            onBack={() => navigate(-1)}
            rightAction={
                <button
                    type="button"
                    onClick={() => rulesModal.show()}
                    aria-label="查看活动说明"
                    className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[12px] font-semibold text-red-600 active:scale-95 transition-transform"
                >
                    <HelpCircle size={14} />
                    说明
                </button>
            }
            padding={false}
        >
            <div className="relative min-h-[calc(100vh-52px)] bg-gray-50">
                <div className="fixed top-[52px] left-1/2 w-full max-w-md -translate-x-1/2 z-30 bg-gray-50">
                    <LeaderboardHeader
                        title={pageTitle}
                        endTime={event?.end_time || 0}
                    />
                    <div className="relative -mt-3 px-2 pb-2 z-10">
                        {event ? (
                            <LeaderboardStats
                                endTime={event.end_time}
                                rankedCount={leaderboard.length}
                                myRank={myTeam?.rank || 0}
                                updatedAt={updatedAt}
                            />
                        ) : !loading ? (
                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-center text-sm text-gray-500">
                                当前暂无进行中的荣耀榜活动
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="px-2 pt-[220px] pb-[122px]">
                    <LeaderboardList
                        items={leaderboard}
                        loading={loading}
                    />
                </div>

                {myTeam && event && (
                    <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 z-50">
                        <MyTeamCard
                            status={myTeam}
                            onAction={() => navigate('/my-friends')}
                        />
                    </div>
                )}

                <RulesModal
                    open={rulesModal.open}
                    onClose={rulesModal.hide}
                    eventTitle={pageTitle}
                    rulesText={resolvedRulesText}
                    loading={rulesLoading && resolvedRulesText.trim().length === 0}
                />
            </div>
        </PageContainer>
    );
};

export default TeamLeaderboardPage;
