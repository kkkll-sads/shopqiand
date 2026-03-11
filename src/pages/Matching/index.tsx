/**
 * @file Matching/index.tsx - 匹配等待页面
 * @description 展示交易匹配中的等待动画与状态。
 */

import { Radar } from 'lucide-react';

/**
 * MatchingView - 匹配中视图组件
 */
export const MatchingPage = () => {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 to-black p-6">
      <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="relative mb-12 h-64 w-64">
          <div className="absolute inset-0 animate-ping rounded-full bg-red-600/10 [animation-duration:2s]" />
          <div className="absolute inset-0 rounded-full border border-red-600/20" />
          <div className="absolute inset-[15%] rounded-full border border-red-600/30" />
          <div className="absolute inset-[30%] rounded-full border border-red-600/40" />
          <div className="absolute inset-[45%] rounded-full bg-red-600/10 blur-xl" />

          <div className="absolute left-1/2 top-1/2 h-[2px] w-[50%] origin-left animate-[spin_1.5s_linear_infinite] bg-gradient-to-r from-transparent via-red-400 to-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]" />

          <div className="absolute inset-0 flex items-center justify-center">
            <Radar size={64} className="animate-pulse text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
          </div>

          <div className="absolute left-1/4 top-1/4 h-1 w-1 animate-pulse rounded-full bg-red-400" />
          <div className="absolute bottom-1/3 right-1/4 h-1.5 w-1.5 animate-pulse rounded-full bg-red-300 [animation-delay:0.5s]" />
        </div>

        <h3 className="mb-3 text-2xl font-bold tracking-wide text-white">正在接入区域结算...</h3>
        <p className="rounded-full border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-400 backdrop-blur-sm">
          智能匹配最优资金通道 (权重优先)
        </p>
      </div>
    </div>
  );
};

export default MatchingPage;
