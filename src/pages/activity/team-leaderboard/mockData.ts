export interface TeamRankItem {
    rank: number;
    team_name: string;
    leader_name?: string;
    active_score: number;
    reward_tier: 1 | 2 | 3; // 1: 3000, 2: 2500, 3: 2000
    rank_change: number; // +1, -1, 0
}

export interface MyTeamStatus {
    rank: number;
    active_score: number;
    gap_to_top50: number; // 0 if in top 50
    today_new: number;
}

export interface LeaderboardData {
    list: TeamRankItem[];
    myTeam: MyTeamStatus;
}

export const fetchLeaderboardData = async (): Promise<LeaderboardData> => {
    // Generate mock data
    const list: TeamRankItem[] = Array.from({ length: 50 }, (_, i) => {
        const rank = i + 1;
        let reward_tier: 1 | 2 | 3 = 3;
        if (rank <= 10) reward_tier = 1;
        else if (rank <= 30) reward_tier = 2;

        return {
            rank,
            team_name: `新春冲刺${rank}队`,
            leader_name: rank <= 5 ? `队长${rank}号` : undefined,
            active_score: 50000 - (rank * 500) + Math.floor(Math.random() * 200),
            reward_tier,
            rank_change: Math.floor(Math.random() * 3) - 1,
        };
    });

    return {
        list,
        myTeam: {
            rank: 12,
            active_score: 44200,
            gap_to_top50: 0,
            today_new: 1200
        }
    };
};
