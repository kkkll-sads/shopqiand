/**
 * @file HashrateExchange/index.tsx
 * @description 算力补充页面 — 消费金兑换绿色算力（GH/s）。
 *   用户输入兑换数量或选择快捷金额，按补贴汇率兑换。
 *   兑换成功后即时更新余额。
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Zap,
  Server,
  Shield,
  Leaf,
  Activity,
  Loader2,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { accountApi } from '../../api';
import { useFeedback } from '../../components/ui/FeedbackProvider';

/** 汇率配置 */
const STANDARD_RATE = 5;   // 标准价：5 消费金 / GH/s
const SUBSIDIZED_RATE = 2; // 补贴价：2 消费金 / GH/s

/** 快捷金额 */
const QUICK_AMOUNTS = [10, 50, 100, 500];

export const HashrateExchangePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useFeedback();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [score, setScore] = useState(0);
  const [greenPower, setGreenPower] = useState('0');

  /** 加载用户余额 */
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await accountApi.getProfile();
      if (profile.userInfo) {
        setScore(profile.userInfo.score);
        setGreenPower(profile.userInfo.greenPower);
      }
    } catch {
      showToast({ type: 'error', message: '余额加载失败' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const numAmount = parseFloat(amount) || 0;
  const cost = numAmount * SUBSIDIZED_RATE;
  const hasEnough = score >= cost;

  /** 执行兑换 */
  const handleExchange = async () => {
    if (numAmount <= 0) {
      showToast({ type: 'warning', message: '请输入兑换数量' });
      return;
    }
    if (!hasEnough) {
      showToast({ type: 'warning', message: `消费金不足，当前余额: ${score}` });
      return;
    }

    try {
      setConfirming(true);
      const result = await accountApi.exchangeScoreToGreenPower({ score: cost });
      showToast({
        type: 'success',
        message: `消耗 ${result.scoreConsumed} 消费金，获得 ${result.greenPowerGained} 绿色算力`,
      });
      setScore(result.afterScore);
      setGreenPower(String(result.afterGreenPower));
      setAmount('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '兑换失败，请重试';
      showToast({ type: 'error', message: msg });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-bg-base">
      {/* ====== Header ====== */}
      <div className="shrink-0 bg-gradient-to-b from-emerald-50 to-bg-base p-5 pt-4 dark:from-emerald-950/20">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm active:scale-95 dark:bg-bg-card"
          >
            <ChevronLeft size={20} className="text-text-main" />
          </button>
          <h1 className="text-xl font-bold text-text-main">算力补充</h1>
          <div className="ml-auto flex items-center gap-1 rounded-full border border-emerald-100/50 bg-white/50 px-3 py-1 text-xs font-medium text-emerald-600 backdrop-blur-sm dark:border-emerald-800/30 dark:bg-emerald-900/20 dark:text-emerald-400">
            <Shield size={12} fill="currentColor" />
            绿色金融补贴
          </div>
        </div>

        {/* ====== 输入卡片 ====== */}
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-emerald-50 bg-white p-6 shadow-xl shadow-emerald-100/30 dark:border-emerald-800/20 dark:bg-bg-card dark:shadow-none">
          <div className="absolute right-0 top-0 -z-0 h-24 w-24 rounded-bl-[100px] bg-emerald-50/50 dark:bg-emerald-800/10" />

          <div className="relative z-10">
            {/* 余额信息 */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-text-aux">
                <Server size={14} />
                补充额度 (GH/s)
              </div>
              <div className="text-xs text-text-aux">
                当前持有:{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {loading ? '--' : greenPower}
                </span>{' '}
                GHs
              </div>
            </div>

            {/* 输入框 */}
            <div className="border-b-2 border-emerald-50 pb-3 transition-colors focus-within:border-emerald-500 dark:border-emerald-800/30 dark:focus-within:border-emerald-600">
              <div className="mb-3 flex items-baseline gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="点击输入兑换数量"
                  className="flex-1 bg-transparent text-4xl font-black text-text-main outline-none placeholder:text-text-aux/20"
                />
              </div>
              <div className="flex items-center justify-center sm:justify-end">
                <div className="whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-100 px-4 py-2 text-base font-bold text-emerald-700 shadow-sm dark:border-emerald-800/40 dark:bg-emerald-900/30 dark:text-emerald-400">
                  1 GHs = {SUBSIDIZED_RATE} 消费金
                </div>
              </div>
            </div>

            {/* 快捷金额 */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(String(val))}
                  className="rounded-lg border border-transparent bg-bg-base py-1.5 text-xs font-bold text-text-sub transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 dark:bg-bg-card dark:hover:bg-emerald-900/20"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ====== 兑换详情 ====== */}
      <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+8.5rem)]">
        <div className="space-y-4 pb-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-text-main">
            <span className="h-4 w-1 rounded-full bg-emerald-500" />
            兑换详情
          </h2>

          <div className="space-y-3 rounded-2xl border border-border-light bg-white p-4 shadow-sm dark:border-border-light dark:bg-bg-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-sub">标准算力成本</span>
              <span className="text-sm font-medium text-text-aux line-through">
                {STANDARD_RATE} 消费金 / GHs
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-sub">当前补贴价</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {SUBSIDIZED_RATE} 消费金 / GHs
              </span>
            </div>
            <div className="h-px w-full bg-border-light" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-text-main">预计消耗</span>
              <span className="text-lg font-bold text-red-600">
                {cost}{' '}
                <span className="text-xs font-normal text-text-aux">消费金</span>
              </span>
            </div>
          </div>

          {/* 余额提示 */}
          <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 dark:bg-red-900/10">
            <Activity size={16} className="mt-0.5 shrink-0 text-red-500" />
            <p className="text-xs leading-tight text-red-600 dark:text-red-400">
              您的当前消费金余额为{' '}
              <span className="font-bold">{loading ? '--' : score}</span>
              。算力补充后即时生效，可提升您的每日产出效率。
            </p>
          </div>

          {/* 兑换优势 */}
          <div className="rounded-2xl border border-border-light bg-white p-4 shadow-sm dark:bg-bg-card">
            <h3 className="mb-3 text-sm font-bold text-text-main">补充算力优势</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <TrendingUp size={14} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-main">提升产出</p>
                  <p className="text-2xs text-text-aux">增加每日收益效率</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <Zap size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-main">即时生效</p>
                  <p className="text-2xs text-text-aux">兑换后立即可用</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <Shield size={14} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-main">绿色补贴</p>
                  <p className="text-2xs text-text-aux">享受60%优惠折扣</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <Leaf size={14} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-main">绿色能源</p>
                  <p className="text-2xs text-text-aux">清洁环保可持续</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====== 底部操作 ====== */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border-light bg-white/90 p-4 pb-safe backdrop-blur-md dark:bg-bg-card/90">
        <div className="mx-auto flex w-full max-w-[480px] items-center gap-3">
          <div className="min-w-0 flex-1 rounded-xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-900/20">
            <div className="text-xs text-emerald-700/80 dark:text-emerald-300/80">预计消耗</div>
            <div className="truncate text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {cost} 消费金
            </div>
          </div>
          <button
            onClick={handleExchange}
            disabled={confirming || !hasEnough || numAmount <= 0}
            className={`flex min-h-12 flex-[1.35] items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-bold shadow-lg transition-transform active:scale-[0.98] ${
              confirming || !hasEnough || numAmount <= 0
                ? 'cursor-not-allowed bg-gray-200 text-gray-400 shadow-none dark:bg-gray-800 dark:text-gray-600'
                : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-200 dark:shadow-none'
            }`}
          >
            {confirming ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Zap size={20} fill="currentColor" />
                确认兑换
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HashrateExchangePage;
