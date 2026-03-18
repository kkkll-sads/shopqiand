/**
 * @file GenesisNodeModal.tsx - 创世共识节点活动弹窗
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Zap, Clock, ChevronRight, Loader2 } from 'lucide-react';

interface GenesisNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const GenesisNodeModal: React.FC<GenesisNodeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [remainingSeats, setRemainingSeats] = useState(128);
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 14, seconds: 59 });
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const target = Math.floor(Math.random() * 15) + 5;
      const timer = window.setTimeout(() => {
        setRemainingSeats(target);
      }, 800);
      return () => window.clearTimeout(timer);
    } else {
      setRemainingSeats(128);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  const handleConfirm = () => {
    setIsVerifying(true);
    window.setTimeout(() => {
      onConfirm();
      setIsVerifying(false);
    }, 1500);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
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
            className="relative w-full max-w-[340px] bg-[#111318] border border-[#E6B800]/40 rounded-[24px] shadow-[0_0_50px_rgba(230,184,0,0.2)] overflow-visible"
          >
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 pointer-events-none">
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
                className="w-full h-full flex items-center justify-center"
              >
                <div className="genesis-prism relative w-16 h-24 bg-gradient-to-b from-[#FFE066] via-[#E6B800] to-[#B38F00] shadow-inner">
                  <div className="absolute inset-0 bg-white/20 blur-[1px] opacity-50" />
                  <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white w-8 h-8 drop-shadow-lg" />
                </div>
              </motion.div>
            </div>

            <div className="pt-20 pb-8 px-6 flex flex-col items-center">
              <div className="absolute top-4 left-0 bg-gradient-to-r from-[#FF4142] to-[#FF8E8F] text-white text-[10px] px-3 py-1 rounded-r-full font-bold tracking-wider shadow-lg">
                内部定向配售
              </div>

              <h2 className="text-[22px] font-serif font-bold text-center leading-tight mb-2 bg-gradient-to-b from-[#FFE066] to-[#E6B800] bg-clip-text text-transparent">
                创世共识节点 · 全球限额认购
              </h2>
              <p className="text-[#8E9299] text-[12px] text-center mb-6 px-2">
                打破算力边界，畅享全网每日 Gas 费管道分红。
              </p>

              <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 mb-6 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#E6B800]/5 blur-2xl rounded-full" />
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-[#E6B800]/20 flex items-center justify-center">
                    <Lock size={12} className="text-[#E6B800]" />
                  </div>
                  <span className="text-white text-[13px] font-bold tracking-wide">
                    【历史权益穿透】特权已就绪！
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-[#8E9299] text-[12px]">
                    本期节点认购，独享 <span className="text-white font-bold">9:1 混合支付</span> 通道：
                  </p>
                  <p className="text-[#8E9299] text-[12px] leading-relaxed">
                    支持使用 <span className="text-[#FF7700] font-bold text-[14px]">10%</span> 待激活确权金
                    <span className="text-[#FF7700] font-bold mx-1 underline underline-offset-4">直接抵扣</span> 现金！
                  </p>
                </div>
              </div>

              <div className="w-full space-y-4 mb-8">
                <div className="flex justify-between items-end text-[11px]">
                  <span className="text-[#8E9299]">全网今日配额：500 席</span>
                  <span className="text-[#8E9299]">
                    当前剩余：<span className="text-[#FF4142] font-bold text-[14px] animate-pulse">{remainingSeats} 席</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '97%' }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#FF4142] to-[#FF8E8F] relative genesis-progress-bar"
                  />
                </div>
                <div className="flex items-center justify-center space-x-2 text-[#8E9299]">
                  <Clock size={12} />
                  <span className="text-[11px]">距通道开启仅剩：</span>
                  <div className="flex items-center space-x-1 font-mono text-white text-[13px]">
                    <span className="bg-white/10 px-1 rounded">{pad(countdown.hours)}</span>
                    <span className="text-[#E6B800]">:</span>
                    <span className="bg-white/10 px-1 rounded">{pad(countdown.minutes)}</span>
                    <span className="text-[#E6B800]">:</span>
                    <span className="bg-white/10 px-1 rounded animate-pulse">{pad(countdown.seconds)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isVerifying}
                className="relative w-full h-12 rounded-xl bg-gradient-to-r from-[#FF7700] to-[#FF4D00] text-white font-bold text-[15px] shadow-[0_4px_20px_rgba(255,77,0,0.3)] overflow-hidden genesis-cta-btn active:scale-95 transition-transform disabled:opacity-70"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent genesis-sweep" />
                <div className="flex items-center justify-center space-x-2 relative z-10">
                  {isVerifying ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>正在校验算力资格...</span>
                    </>
                  ) : (
                    <>
                      <span>【 立即锁定节点名额 】</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              aria-label="关闭"
            >
              <X size={24} />
            </button>
          </motion.div>
        </div>
      )}

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
