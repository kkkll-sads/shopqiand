import React, { useState, useEffect } from 'react';

interface LeaderboardHeaderProps {
    endDate: string;
}

const LeaderboardHeader: React.FC<LeaderboardHeaderProps> = ({ endDate }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number }>({ days: 0, hours: 0, minutes: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            const end = new Date(endDate).getTime();
            const now = new Date().getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0 });
                clearInterval(timer);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft({ days, hours, minutes });
        }, 1000);

        return () => clearInterval(timer);
    }, [endDate]);

    return (
        <div className="bg-gradient-to-b from-red-500 to-red-600 text-white pt-2 pb-12 px-6 rounded-b-[2rem] shadow-lg shadow-red-200">
            <div className="flex flex-col items-center justify-center text-center">
                <div className="text-xs font-medium bg-red-700/30 px-3 py-1 rounded-full mb-2 border border-red-400/30 backdrop-blur-sm">
                    距离结束 {timeLeft.days}天 {timeLeft.hours}小时 {timeLeft.minutes}分
                </div>
                <h1 className="text-3xl font-black italic tracking-wide mb-1 drop-shadow-md">
                    新春活跃榜
                </h1>
                <p className="text-sm text-red-100 opacity-90">
                    前50名团队锁定团建奖励资格
                </p>
            </div>
        </div>
    );
};

export default LeaderboardHeader;
