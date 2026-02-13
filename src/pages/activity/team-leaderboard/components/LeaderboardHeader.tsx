import React, { useState, useEffect } from 'react';

interface LeaderboardHeaderProps {
    title: string;
    endTime: number;
}

const LeaderboardHeader: React.FC<LeaderboardHeaderProps> = ({ title, endTime }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number }>({ days: 0, hours: 0, minutes: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            const end = endTime > 0 ? endTime * 1000 : 0;
            const now = new Date().getTime();
            const diff = end - now;

            if (end <= 0 || diff <= 0) {
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
    }, [endTime]);

    return (
        <div className="bg-gradient-to-b from-red-500 to-red-600 text-white pt-2 pb-9 px-4 rounded-b-[1.5rem] shadow-md shadow-red-200">
            <div className="flex flex-col items-center justify-center text-center">
                <div className="text-xs font-medium bg-red-700/30 px-3 py-1 rounded-full mb-2 border border-red-400/30 backdrop-blur-sm">
                    距离结束 {timeLeft.days}天 {timeLeft.hours}小时 {timeLeft.minutes}分
                </div>
                <h1 className="text-[28px] font-black italic tracking-wide mb-1 drop-shadow-md leading-none">
                    {title || '新春荣耀榜'}
                </h1>
                <p className="text-xs text-red-100 opacity-90">
                    团队贡献排行前50
                </p>
            </div>
        </div>
    );
};

export default LeaderboardHeader;
