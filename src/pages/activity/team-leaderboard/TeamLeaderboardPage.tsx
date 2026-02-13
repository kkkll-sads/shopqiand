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
import { TeamRankItem, MyTeamStatus, fetchLeaderboardData } from './mockData';
import PullToRefresh from '@/components/common/PullToRefresh';

const TeamLeaderboardPage: React.FC = () => {
    const navigate = useNavigate();
    const rulesModal = useModal();
    const [leaderboard, setLeaderboard] = useState<TeamRankItem[]>([]);
    const [myTeam, setMyTeam] = useState<MyTeamStatus | null>(null);

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
        try {
            // Simulate network request
            await new Promise(resolve => setTimeout(resolve, 800));
            const data = await fetchLeaderboardData();
            setLeaderboard(data.list);
            setMyTeam(data.myTeam);
            loadMachine.send(LoadingEvent.SUCCESS);
        } catch (e) {
            loadMachine.send(LoadingEvent.ERROR);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const loading = loadMachine.state === LoadingState.LOADING;

    return (
        <PageContainer
            title="新春活跃榜"
            onBack={() => navigate(-1)}
            rightAction={
                <button onClick={rulesModal.show} className="text-white">
                    <HelpCircle size={20} />
                </button>
            }
            navBarClassName="bg-red-500 text-white border-none"
            backIconColor="white"
            titleClassName="text-white"
        >
            <PullToRefresh onRefresh={loadData}>
                <div className="min-h-screen bg-gray-50 pb-safe">
                    <LeaderboardHeader endDate="2026-02-15T24:00:00" />

                    <div className="relative -mt-4 px-4 pb-24 z-10">
                        <LeaderboardStats
                            participantCount={128}
                            myRank={myTeam?.rank || 0}
                        />

                        <div className="mt-4">
                            <LeaderboardList
                                items={leaderboard}
                                loading={loading}
                            />
                        </div>
                    </div>

                    {myTeam && (
                        <div className="fixed bottom-0 left-0 right-0 z-50">
                            <MyTeamCard status={myTeam} />
                        </div>
                    )}

                    <RulesModal
                        open={rulesModal.open}
                        onClose={rulesModal.hide}
                    />
                </div>
            </PullToRefresh>
        </PageContainer>
    );
};

export default TeamLeaderboardPage;
