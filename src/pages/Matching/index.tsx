/**
 * @file Matching/index.tsx - 充值匹配动画页
 * @description 展示匹配动画，并在动画期间自动完成在线充值提单。
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Radar } from 'lucide-react';
import { rechargeApi } from '../../api';
import { useAppNavigate } from '../../lib/navigation';

const MAX_ONLINE_CHANNEL_ATTEMPTS = 3;
const RETRYABLE_RECHARGE_ERROR_KEYWORDS = [
  '获取支付链接失败',
  '未获取到支付地址',
  'Exception:',
  'Stack trace:',
  'Failed to fetch',
  'NetworkError',
  'network',
];

interface MatchingLocationState {
  nextPath?: string;
  delayMs?: number;
  rechargeTask?: {
    amount: number;
    candidateAccountIds?: number[];
    matchedAccountId?: number;
    paymentType: string;
  };
}

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function shouldRetryRechargeSubmit(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (!message) {
    return false;
  }

  return RETRYABLE_RECHARGE_ERROR_KEYWORDS.some((keyword) => message.includes(keyword));
}

function getRechargeSubmitErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '提交订单失败';
  return shouldRetryRechargeSubmit(error) ? '当前支付通道暂时不可用，请稍后重试' : message;
}

export const MatchingPage = () => {
  const location = useLocation();
  const { navigate } = useAppNavigate();
  const [statusText, setStatusText] = useState('正在接入区域结算...');
  const [subText, setSubText] = useState('智能匹配最优资金通道 (权重优先)');
  const submitted = useRef(false);

  useEffect(() => {
    const state = (location.state ?? {}) as MatchingLocationState;

    if (state.nextPath && !state.rechargeTask) {
      const timer = window.setTimeout(() => {
        navigate(state.nextPath!, { replace: true });
      }, Math.max(600, state.delayMs ?? 1800));

      return () => window.clearTimeout(timer);
    }

    if (state.rechargeTask && !submitted.current) {
      submitted.current = true;
      const task = state.rechargeTask;
      const candidateAccountIds = (task.candidateAccountIds ?? []).filter((id) => Number.isFinite(id) && id > 0);
      const minDelay = wait(1200);

      const submitOrder = async () => {
        try {
          const submitResult = candidateAccountIds.length
            ? await (async () => {
                const attempts = Math.min(candidateAccountIds.length, MAX_ONLINE_CHANNEL_ATTEMPTS);
                let lastError: unknown;

                for (let index = 0; index < attempts; index += 1) {
                  const companyAccountId = candidateAccountIds[index];

                  if (index === 0) {
                    setStatusText('正在创建支付订单...');
                    setSubText('请稍候，正在提交充值请求');
                  } else {
                    setStatusText('正在切换支付通道...');
                    setSubText(`当前通道异常，正在尝试第 ${index + 1} 个通道`);
                    await wait(500);
                  }

                  try {
                    const submitPromise = rechargeApi.submitOrder({
                      amount: task.amount,
                      companyAccountId,
                      paymentMethod: 'online',
                      paymentType: task.paymentType,
                    });

                    return index === 0 ? (await Promise.all([submitPromise, minDelay]))[0] : await submitPromise;
                  } catch (error) {
                    lastError = error;

                    if (!shouldRetryRechargeSubmit(error) || index === attempts - 1) {
                      throw error;
                    }
                  }
                }

                throw lastError ?? new Error('提交订单失败');
              })()
            : (
                await Promise.all([
                  rechargeApi.submitOrder({
                    amount: task.amount,
                    matchedAccountId: task.matchedAccountId,
                    paymentMethod: 'online',
                    paymentType: task.paymentType,
                  }),
                  minDelay,
                ])
              )[0];

          const cashierParams = new URLSearchParams({
            scene: 'recharge',
            amount: String(task.amount),
            order_no: submitResult.orderNo || String(submitResult.orderId || ''),
            order_id: String(submitResult.orderId || 0),
            expire_seconds: '300',
            ...(submitResult.payUrl ? { pay_url: submitResult.payUrl } : {}),
          });

          setStatusText('匹配成功，正在跳转...');
          await wait(400);
          navigate(`/cashier?${cashierParams.toString()}`, { replace: true });
        } catch (error) {
          setStatusText('提交失败');
          setSubText(getRechargeSubmitErrorMessage(error));

          window.setTimeout(() => {
            navigate('/recharge', { replace: true });
          }, 2500);
        }
      };

      void submitOrder();
    }

    return undefined;
  }, [location.state, navigate]);

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

        <h3 className="mb-3 text-2xl font-bold tracking-wide text-white">{statusText}</h3>
        <p className="rounded-full border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-400 backdrop-blur-sm">
          {subText}
        </p>
      </div>
    </div>
  );
};

export default MatchingPage;
