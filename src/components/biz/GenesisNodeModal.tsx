import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Zap, Clock, ChevronRight, Loader2, RefreshCcw } from 'lucide-react';
import type { GenesisNodeActivity } from '../../api/modules/genesisNode';
import { formatCountdown, getGenesisActivityPhase } from '../../features/node-purchase/genesis';

interface GenesisNodeModalProps {
  activity?: GenesisNodeActivity | null;
  error?: boolean;
  isOpen: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRetry?: () => void;
}

function trimTimeLabel(value?: string): string {
  if (!value) {
    return '--';
  }

  return value.length >= 5 ? value.slice(0, 5) : value;
}

export const GenesisNodeModal: React.FC<GenesisNodeModalProps> = ({
  activity,
  error = false,
  isOpen,
  loading = false,
  onClose,
  onConfirm,
  onRetry,
}) => {
  const [now, setNow] = useState(() => new Date());
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isOpen]);

  const phase = getGenesisActivityPhase(activity);
  const countdown = useMemo(
    () => formatCountdown(activity?.countdownTargetTime, now),
    [activity?.countdownTargetTime, now],
  );

  const progressWidth = phase === 'selling' ? '76%' : phase === 'drawing' ? '92%' : phase === 'settled' ? '100%' : '36%';
  const rushStartTime = trimTimeLabel(activity?.rushStartTime ?? '17:00:00');
  const drawTime = trimTimeLabel(activity?.drawTime ?? '20:00:00');
  const amountText = activity?.fixedAmounts?.length
    ? `${activity.fixedAmounts[0]}-${activity.fixedAmounts[activity.fixedAmounts.length - 1]}`
    : '1000-5000';

  const handleConfirm = () => {
    setIsVerifying(true);
    window.setTimeout(() => {
      onConfirm();
      setIsVerifying(false);
    }, 600);
  };

  if (!isOpen || (!loading && !error && !activity)) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <div key="genesis-node-modal" className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-[12px]"
            onClick={onClose}
            role="presentation"
          />

          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotateX: 45 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            className="relative w-full max-w-[340px] overflow-visible rounded-[24px] border border-[#E6B800]/40 bg-[#111318] shadow-[0_0_50px_rgba(230,184,0,0.2)]"
          >
            <div className="absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 pointer-events-none">
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotateY: [0, 360],
                  filter: [
                    'drop-shadow(0 0 10px #E6B800)',
                    'drop-shadow(0 0 20px #E6B800)',
                    'drop-shadow(0 0 10px #E6B800)',
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="flex h-full w-full items-center justify-center"
              >
                <div className="genesis-prism relative h-24 w-16 bg-gradient-to-b from-[#FFE066] via-[#E6B800] to-[#B38F00] shadow-inner">
                  <div className="absolute inset-0 bg-white/20 opacity-50 blur-[1px]" />
                  <Zap className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-lg" />
                </div>
              </motion.div>
            </div>

            <div className="flex flex-col items-center px-6 pb-8 pt-20">
              <div className="absolute left-0 top-4 rounded-r-full bg-gradient-to-r from-[#FF4142] to-[#FF8E8F] px-3 py-1 text-[10px] font-bold tracking-wider text-white shadow-lg">
                创世节点活动
              </div>

              <h2 className="mb-2 bg-gradient-to-b from-[#FFE066] to-[#E6B800] bg-clip-text text-center text-[22px] font-serif font-bold leading-tight text-transparent">
                创世共识节点 · 固定档位抢购
              </h2>
              <p className="mb-6 px-2 text-center text-[12px] text-[#8E9299]">
                每日 {rushStartTime} 开抢，{drawTime} 开奖，中签后直接进入权益节点。
              </p>

              <div className="relative mb-6 w-full overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4">
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#E6B800]/5 blur-2xl" />
                <div className="mb-3 flex items-center space-x-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E6B800]/20">
                    <Lock size={12} className="text-[#E6B800]" />
                  </div>
                  <span className="text-[13px] font-bold tracking-wide text-white">
                    9:1 混合支付直通权益节点
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-[12px] text-[#8E9299]">
                    固定金额档位 <span className="font-bold text-white">{amountText}</span>，每人每天仅可参与 1 份。
                  </p>
                  <p className="text-[12px] leading-relaxed text-[#8E9299]">
                    使用 <span className="text-[14px] font-bold text-[#FF7700]">专项金 9</span> +
                    <span className="mx-1 text-[14px] font-bold text-[#FF7700]">待激活确权金 1</span>
                    下单冻结，未中签异步退回。
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="mb-8 flex w-full items-center justify-center rounded-2xl border border-white/5 bg-black/30 px-4 py-6 text-[13px] text-[#c6c8cc]">
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  正在加载活动信息...
                </div>
              ) : error && !activity ? (
                <div className="mb-8 w-full rounded-2xl border border-white/5 bg-black/30 px-4 py-5 text-center">
                  <div className="text-[13px] text-[#c6c8cc]">活动信息加载失败</div>
                  {onRetry ? (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="mt-4 inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-[12px] text-white"
                    >
                      <RefreshCcw size={14} className="mr-2" />
                      重新加载
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="mb-8 w-full space-y-4">
                  <div className="text-center text-[11px] text-[#8E9299]">
                    {activity?.stageText || '未开抢'}
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: progressWidth }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="genesis-progress-bar relative h-full bg-gradient-to-r from-[#FF4142] to-[#FF8E8F]"
                    />
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-[#8E9299]">
                    <Clock size={12} />
                    <span className="text-[11px]">
                      {phase === 'selling'
                        ? '距开奖剩余'
                        : phase === 'drawing'
                          ? '等待开奖回写'
                          : phase === 'settled'
                            ? '下一轮开抢倒计时'
                            : '距开抢剩余'}
                    </span>
                    <div className="flex items-center space-x-1 font-mono text-[13px] text-white">
                      <span className="rounded bg-white/10 px-1">{countdown.hours}</span>
                      <span className="text-[#E6B800]">:</span>
                      <span className="rounded bg-white/10 px-1">{countdown.minutes}</span>
                      <span className="text-[#E6B800]">:</span>
                      <span className="rounded bg-white/10 px-1">{countdown.seconds}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isVerifying}
                className="genesis-cta-btn relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#FF7700] to-[#FF4D00] text-[15px] font-bold text-white shadow-[0_4px_20px_rgba(255,77,0,0.3)] transition-transform active:scale-95 disabled:opacity-70"
              >
                <div className="genesis-sweep absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="relative z-10 flex items-center justify-center space-x-2">
                  {isVerifying ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>正在打开活动页...</span>
                    </>
                  ) : (
                    <>
                      <span>{phase === 'settled' ? '【 查看我的记录 】' : '【 立即参与抢购 】'}</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="absolute -bottom-12 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 text-white/40 transition-colors hover:text-white"
              aria-label="关闭"
            >
              <X size={24} />
            </button>
          </motion.div>
        </div>
      ) : null}

      <style>{`
        .genesis-prism {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        .genesis-progress-bar {
          background-image: linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent);
          background-size: 20px 20px;
          animation: genesis-progress-stripe 1s linear infinite;
        }
        @keyframes genesis-progress-stripe {
          from { background-position: 0 0; }
          to { background-position: 20px 0; }
        }
        .genesis-sweep {
          animation: genesis-sweep 3s infinite;
        }
        @keyframes genesis-sweep {
          0% { transform: translateX(-100%); }
          20% { transform: translateX(200%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </AnimatePresence>
  );
};
