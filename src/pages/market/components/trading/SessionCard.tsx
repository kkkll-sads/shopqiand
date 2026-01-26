/**
 * SessionCard - 场次卡片组件
 */
import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { TradingSession } from '../../hooks/useTradingZone';

interface SessionCardProps {
  session: TradingSession;
  status: 'active' | 'waiting' | 'ended';
  target: Date | null;
  now: Date;
  navigating: boolean;
  config: any;
  formatDuration: (ms: number) => string;
  onSelect: (session: TradingSession) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  status,
  target,
  now,
  navigating,
  config,
  formatDuration,
  onSelect,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden transition-all duration-300 active:scale-[0.99] hover:shadow-xl">
      {/* 水印图标 */}
      <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none">
        <config.icon size={180} />
      </div>

      {/* 头部区域 */}
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
          <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.softBg} ${config.themeColor} mb-2.5 border border-transparent`}>
            {config.code}
          </div>
          <h2 className="text-xl font-bold text-gray-900 leading-none mb-2">{config.name}</h2>
          <p className="text-xs text-gray-400 font-medium">{config.subName}</p>
        </div>

        {/* 状态胶囊 */}
        {status === 'active' ? (
          <div className="flex flex-col items-end">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 mb-2 shadow-lg shadow-red-200 animate-[pulse_2s_infinite]">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span className="animate-bounce">🔥</span> 正在抢购
            </span>
            {target && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-red-500 font-bold mb-0.5">距结束仅剩</span>
                <span className="font-mono text-2xl font-black text-red-600 tracking-tighter tabular-nums drop-shadow-sm">
                  {formatDuration(target.getTime() - now.getTime())}
                </span>
              </div>
            )}
          </div>
        ) : (
          <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full border ${
            status === 'waiting'
              ? 'bg-orange-50 border-orange-100 text-orange-500'
              : 'bg-gray-50 border-gray-100 text-gray-400'
          }`}>
            {status === 'waiting' ? '即将开始' : '已结束'}
          </span>
        )}
      </div>

      {/* 数据展示区 */}
      <div className={`relative z-10 flex items-stretch rounded-2xl ${config.dataBg} p-4 mb-5 border border-black/[0.02]`}>
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-bold mb-1">预期收益率</div>
          <div className={`text-2xl font-black ${config.themeColor} tracking-tight leading-none pt-1`}>
            {config.roi}
          </div>
        </div>
        <div className="w-px bg-black/[0.06] mx-4 self-center h-8"></div>
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-bold mb-1">本期额度</div>
          <div className="text-lg font-extrabold text-gray-700 leading-none pt-1">
            {config.quota}
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="relative z-10">
        <button
          type="button"
          onClick={() => status === 'active' && onSelect(session)}
          disabled={status !== 'active' || navigating}
          className={`w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
            status === 'active' && !navigating
              ? `${config.buttonClass} text-white`
              : 'bg-gray-100 text-gray-400 border border-gray-200 shadow-none cursor-not-allowed'
          }`}
        >
          {navigating
            ? '跳转中...'
            : status === 'active'
              ? '立即抢购 · ACCESS'
              : status === 'waiting'
                ? '即将开始 · COMING SOON'
                : '本场结束 · CLOSED'
          }
          {status === 'active' && !navigating && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
};

export default SessionCard;
