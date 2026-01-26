/**
 * MatchingView - 匹配中视图组件
 */
import React from 'react';
import { Radar } from 'lucide-react';

const MatchingView: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black"></div>

      <div className="relative z-10 text-center flex flex-col items-center w-full max-w-sm">
        {/* Radar Animation */}
        <div className="relative w-64 h-64 mb-12">
          <div className="absolute inset-0 bg-red-600/10 rounded-full animate-ping [animation-duration:2s]"></div>
          <div className="absolute inset-0 border border-red-600/20 rounded-full"></div>
          <div className="absolute inset-[15%] border border-red-600/30 rounded-full"></div>
          <div className="absolute inset-[30%] border border-red-600/40 rounded-full"></div>
          <div className="absolute inset-[45%] bg-red-600/10 rounded-full blur-xl"></div>

          {/* Scanning Line */}
          <div className="absolute top-1/2 left-1/2 w-[50%] h-[2px] bg-gradient-to-r from-transparent via-red-400 to-red-600 origin-left animate-[spin_1.5s_linear_infinite] shadow-[0_0_15px_rgba(220,38,38,0.8)]"></div>

          <div className="absolute inset-0 flex items-center justify-center">
            <Radar size={64} className="text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
          </div>

          {/* Decorative particles */}
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-red-300 rounded-full animate-pulse [animation-delay:0.5s]"></div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-3 tracking-wide">正在接入区域结算...</h3>
        <p className="text-sm text-gray-400 border border-gray-800 bg-gray-900/50 px-4 py-2 rounded-full backdrop-blur-sm">
          智能匹配最优资金通道 (权重优先)
        </p>
      </div>
    </div>
  );
};

export default MatchingView;
