import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Copy,
  HeadphonesIcon,
  Loader2,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { shopOrderApi, rechargeApi } from '../../api';
import { getBillingPath } from '../../lib/billing';
import { useAppNavigate } from '../../lib/navigation';
import { copyToClipboard } from '../../lib/clipboard';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { openCustomerServiceLink } from '../../lib/customerService';

type CommonStatus = 'pending' | 'success' | 'failure';

interface RechargeResultInfo {
  scene: 'recharge';
  status: CommonStatus;
  orderNo: string;
  orderId: number;
  amount: number;
  errorMessage: string;
}

interface MallResultInfo {
  scene: 'mall';
  status: CommonStatus;
  orderNo: string;
  orderId: number;
  amount: number;
  totalScore: number;
  payType: string;
  errorMessage: string;
}

type ResultInfo = RechargeResultInfo | MallResultInfo;

function formatMoney(value: number) {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}

export const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const { goTo, goBack, navigate } = useAppNavigate();
  const { showToast } = useFeedback();
  const [offline, setOffline] = useState(false);
  const [polling, setPolling] = useState(false);

  /** 后端查询覆盖后的状态（仅用于覆盖 URL params 的 status） */
  const [backendStatus, setBackendStatus] = useState<CommonStatus | null>(null);
  const [backendOrderId, setBackendOrderId] = useState<number>(0);

  const handleOpenSupport = () => {
    void openCustomerServiceLink(({ duration, message, type }) => {
      showToast({ duration, message, type });
    });
  };

  /** 从 URL params 解析初始信息 */
  const orderInfoFromParams = useMemo<ResultInfo>(() => {
    const scene = searchParams.get('scene') === 'recharge' ? 'recharge' : 'mall';
    const statusParam = searchParams.get('status');
    const orderNo = searchParams.get('order_no') ?? '';
    const orderId = Number(searchParams.get('order_id') ?? '0');
    const amount = Number(searchParams.get('amount') ?? '0');
    const errorMessage = searchParams.get('error') ?? '支付失败，请稍后重试或联系客服。';

    if (scene === 'recharge') {
      const status: CommonStatus =
        statusParam === 'success'
          ? 'success'
          : statusParam === 'failure'
            ? 'failure'
            : 'pending';

      return {
        scene,
        status,
        orderNo,
        orderId,
        amount: Number.isFinite(amount) ? amount : 0,
        errorMessage,
      };
    }

    const totalScore = Number(searchParams.get('total_score') ?? '0');
    const payType = searchParams.get('pay_type') ?? '';
    const status: CommonStatus =
      statusParam === 'success'
        ? 'success'
        : statusParam === 'failure'
          ? 'failure'
          : 'pending';

    return {
      scene,
      status,
      orderNo,
      orderId,
      amount: Number.isFinite(amount) ? amount : 0,
      totalScore: Number.isFinite(totalScore) ? totalScore : 0,
      payType,
      errorMessage,
    };
  }, [searchParams]);

  /** 综合后的 orderInfo（backendStatus 覆盖 URL status） */
  const orderInfo: ResultInfo = useMemo(() => {
    const base = { ...orderInfoFromParams };
    if (backendStatus) {
      base.status = backendStatus;
    }
    if (backendOrderId) {
      base.orderId = backendOrderId;
    }
    return base;
  }, [orderInfoFromParams, backendStatus, backendOrderId]);

  /** 查询后端获取权威状态 */
  const pollBackendStatus = useCallback(async () => {
    const { scene, orderNo, orderId } = orderInfoFromParams;
    if (!orderNo && !orderId) return;

    setPolling(true);
    try {
      if (scene === 'mall') {
        const detail = await shopOrderApi.detail(
          orderId ? { id: orderId } : { order_no: orderNo },
        );
        setBackendOrderId(detail.id ?? 0);
        // 映射后端 status → 前端 CommonStatus
        const statusMap: Record<string, CommonStatus> = {
          pending: 'pending',
          paid: 'success',
          shipped: 'success',
          completed: 'success',
          cancelled: 'failure',
          refunded: 'failure',
        };
        setBackendStatus(statusMap[detail.status] ?? 'pending');
      } else {
        const detail = await rechargeApi.detail(
          orderId ? { id: orderId } : { order_no: orderNo },
        );
        setBackendOrderId(detail.id ?? 0);
        // 充值: 0=待审核(pending), 1=已通过(success), 2=已拒绝(failure)
        const rechargeStatusMap: Record<number, CommonStatus> = {
          0: 'pending',
          1: 'success',
          2: 'failure',
        };
        setBackendStatus(rechargeStatusMap[detail.status] ?? 'pending');
      }
    } catch {
      // 查询失败不覆盖，保持 URL 状态
    } finally {
      setPolling(false);
    }
  }, [orderInfoFromParams]);

  /** 页面加载时自动查询，pending 状态下每 5s 轮询 */
  useEffect(() => {
    void pollBackendStatus();
  }, [pollBackendStatus]);

  useEffect(() => {
    // 只有 pending 状态才持续轮询
    if (orderInfo.status !== 'pending') return undefined;

    const timer = window.setInterval(() => {
      void pollBackendStatus();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [orderInfo.status, pollBackendStatus]);

  const handleBack = () => {
    if (orderInfo.scene === 'recharge') {
      navigate('/recharge', { replace: true });
      return;
    }

    goTo('home');
  };

  const handleCopy = (text: string, successMessage = '已复制') => {
    if (!text) {
      return;
    }

    copyToClipboard(text).then((ok) => {
      showToast({
        message: ok ? successMessage : '复制失败，请稍后重试',
        type: ok ? 'success' : 'error',
      });
    });
  };

  /** 跳转到收银台重新支付（带 order_id） */
  const handleRetryPay = () => {
    if (orderInfo.scene === 'mall' && orderInfo.orderId) {
      const params = new URLSearchParams({
        scene: 'mall',
        order_id: String(orderInfo.orderId),
      });
      navigate(`/cashier?${params.toString()}`, { replace: true });
    } else if (orderInfo.scene === 'recharge') {
      goTo('recharge');
    } else {
      goTo('cashier');
    }
  };

  const renderHeader = (title: string) => (
    <div className="relative z-40 shrink-0 border-b border-border-light bg-bg-card">
      {offline ? (
        <div className="flex items-center justify-between bg-primary-start/10 px-4 py-2 text-sm text-primary-start">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button
            type="button"
            onClick={() => setOffline(false)}
            className="rounded border border-border-light bg-bg-card px-2 py-1 font-medium text-text-main shadow-sm"
          >
            刷新
          </button>
        </div>
      ) : null}
      <div className="flex h-12 items-center justify-between px-3 pt-safe">
        <div className="flex w-1/3 items-center">
          <button type="button" onClick={goBack} className="p-1 -ml-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="w-1/3 text-center text-xl font-bold text-text-main">{title}</h1>
        <div className="w-1/3" />
      </div>
    </div>
  );

  const renderRechargeResult = () => {
    const statusMeta: Record<
      CommonStatus,
      {
        title: string;
        description: string;
        icon: React.ReactNode;
        accentClass: string;
        amountClass: string;
        primaryText: string;
        primaryAction: () => void;
        secondaryText: string;
        secondaryAction: () => void;
      }
    > = {
      pending: {
        title: '支付状态已提交',
        description: '请等待系统确认，支付成功后可在资产明细查看订单。',
        icon: (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/12">
            <Clock3 size={40} className="text-amber-500 dark:text-amber-300" />
          </div>
        ),
        accentClass: 'text-amber-500 dark:text-amber-300',
        amountClass: 'text-primary-start',
        primaryText: '查看充值记录',
        primaryAction: () => goTo(getBillingPath('recharge')),
        secondaryText: '返回专项金',
        secondaryAction: () => goTo('recharge'),
      },
      success: {
        title: '支付成功',
        description: '订单已提交成功，到账后可在资产明细中查看。',
        icon: (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/12">
            <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-300" />
          </div>
        ),
        accentClass: 'text-emerald-600 dark:text-emerald-300',
        amountClass: 'text-primary-start',
        primaryText: '查看充值记录',
        primaryAction: () => goTo(getBillingPath('recharge')),
        secondaryText: '继续充值',
        secondaryAction: () => goTo('recharge'),
      },
      failure: {
        title: '支付未完成',
        description: orderInfo.errorMessage,
        icon: (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-start/10">
            <AlertCircle size={40} className="text-primary-start" />
          </div>
        ),
        accentClass: 'text-primary-start',
        amountClass: 'text-text-main',
        primaryText: '重新发起支付',
        primaryAction: () => goTo('recharge'),
        secondaryText: '联系客服',
        secondaryAction: handleOpenSupport,
      },
    };

    const meta = statusMeta[orderInfo.status];

    return (
      <div className="flex flex-1 flex-col bg-bg-base">
        {renderHeader('支付结果')}
        <div className="flex-1 overflow-y-auto px-4 pb-10 pt-10">
          <div className="rounded-[28px] border border-border-light bg-bg-card px-5 pb-6 pt-8 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col items-center text-center">
              {polling ? (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-info/10 dark:bg-info/20">
                  <Loader2 size={40} className="animate-spin text-info" />
                </div>
              ) : (
                meta.icon
              )}
              <h2 className={`mt-5 text-[28px] font-semibold ${polling ? 'text-text-sub' : meta.accentClass}`}>
                {polling ? '查询中...' : meta.title}
              </h2>
              <p className="mt-3 max-w-[280px] text-[14px] leading-6 text-text-sub">{meta.description}</p>
            </div>

            <div className="mt-8 rounded-[22px] border border-border-light bg-bg-base px-5 py-5">
              <div className="text-center text-[14px] text-text-sub">支付金额</div>
              <div className={`mt-3 flex items-end justify-center ${meta.amountClass}`}>
                <span className="mr-1 pb-1 text-[22px] font-semibold text-text-main">¥</span>
                <span className="text-[44px] font-bold leading-none">
                  {Number.isFinite(orderInfo.amount) ? Math.round(orderInfo.amount).toString() : '0'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(orderInfo.orderNo, '已复制订单号')}
                className="mx-auto mt-4 flex items-center text-[13px] text-text-aux active:opacity-70"
              >
                <span>订单号：{orderInfo.orderNo || '--'}</span>
                <Copy size={13} className="ml-1.5" />
              </button>
            </div>

            <div className="mt-6 rounded-[20px] border border-border-light bg-bg-base px-4 py-4 text-[13px] leading-6 text-text-sub">
              <div className="mb-1 flex items-center text-[14px] font-medium text-text-main">
                <ShieldCheck size={14} className="mr-2 text-text-aux" />
                支付提示
              </div>
              <div>支付成功后，返回 APP 查看订单。</div>
              <div>如果支付状态未更新，可稍后在资产明细中刷新查看。</div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={meta.primaryAction}
                disabled={polling}
                className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff1530] to-[#ff0019] text-[17px] font-semibold text-white shadow-[0_14px_28px_rgba(255,0,25,0.18)] active:scale-[0.99] disabled:opacity-50"
              >
                {meta.primaryText}
              </button>
              <button
                type="button"
                onClick={meta.secondaryAction}
                className="flex h-12 w-full items-center justify-center rounded-full border border-border-light bg-bg-card text-[16px] font-medium text-text-main active:bg-bg-hover"
              >
                {meta.secondaryText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMallPending = () => (
    <div className="flex flex-col items-center px-6 pt-12">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/12">
        {polling ? (
          <Loader2 size={48} className="animate-spin text-amber-500 dark:text-amber-300" />
        ) : (
          <Clock3 size={48} className="text-amber-500 dark:text-amber-300" />
        )}
      </div>
      <h2 className="mb-2 text-4xl font-bold text-amber-500 dark:text-amber-300">{polling ? '查询中...' : '待支付'}</h2>
      <p className="mb-6 text-base text-text-sub">订单尚未支付，请前往收银台完成支付。</p>

      <div className="mb-10 flex items-center text-base text-text-sub">
        <span className="mr-2">订单号：{orderInfo.orderNo || '--'}</span>
        {orderInfo.orderNo ? (
          <button type="button" onClick={() => handleCopy(orderInfo.orderNo, '已复制订单号')} className="active:opacity-70">
            <Copy size={14} />
          </button>
        ) : null}
      </div>

      <div className="flex w-full space-x-4">
        <button
          type="button"
          onClick={() => goTo('home')}
          className="h-11 flex-1 rounded-full border border-primary-start text-lg font-medium text-primary-start active:bg-primary-start/5"
        >
          返回首页
        </button>
        <button
          type="button"
          onClick={handleRetryPay}
          disabled={polling}
          className="h-11 flex-1 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-lg font-medium text-white shadow-sm active:opacity-80 disabled:opacity-50"
        >
          去支付
        </button>
      </div>
    </div>
  );

  const renderMallSuccess = (info: MallResultInfo) => (
    <div className="flex flex-col items-center px-6 pt-12">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 dark:bg-success/20">
        <CheckCircle2 size={48} className="text-success" />
      </div>
      <h2 className="mb-2 text-4xl font-bold text-text-main">支付成功</h2>
      {(info.payType === 'combined' || info.payType === 'both') && info.totalScore > 0 ? (
        <div className="mb-4 flex flex-col items-center gap-1">
          <div className="flex items-baseline font-bold text-primary-start">
            <span className="mr-0.5 text-2xl">¥</span>
            <span className="text-5xl leading-none">{formatMoney(info.amount).split('.')[0]}</span>
            <span className="text-2xl">.{formatMoney(info.amount).split('.')[1]}</span>
          </div>
          <div className="flex items-baseline font-bold text-orange-500">
            <span className="text-3xl leading-none">+{info.totalScore}</span>
            <span className="ml-1 text-lg">消费金</span>
          </div>
        </div>
      ) : info.payType === 'score' ? (
        <div className="mb-1 flex items-baseline text-6xl font-bold text-text-main">
          <span>{info.amount > 0 ? info.amount : 0}</span>
          <span className="ml-1 text-2xl">消费金</span>
        </div>
      ) : (
        <div className="mb-1 flex items-baseline text-6xl font-bold text-text-main">
          <span className="mr-1 text-3xl">¥</span>
          {formatMoney(info.amount)}
        </div>
      )}
      <div className="mb-10 flex items-center text-base text-text-sub">
        <span className="mr-2">订单号：{info.orderNo || '--'}</span>
        {info.orderNo ? (
          <button type="button" onClick={() => handleCopy(info.orderNo, '已复制订单号')} className="active:opacity-70">
            <Copy size={14} />
          </button>
        ) : null}
      </div>

      <div className="flex w-full space-x-4">
        <button
          type="button"
          onClick={() => goTo('home')}
          className="h-11 flex-1 rounded-full border border-primary-start text-lg font-medium text-primary-start active:bg-primary-start/5"
        >
          继续逛逛
        </button>
        <button
          type="button"
          onClick={() => goTo('order')}
          className="h-11 flex-1 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-lg font-medium text-white shadow-sm active:opacity-80"
        >
          查看订单
        </button>
      </div>
    </div>
  );

  const renderMallFailure = (info: MallResultInfo) => (
    <div className="flex flex-col items-center px-6 pt-12">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-start/10">
        <AlertCircle size={48} className="text-primary-start" />
      </div>
      <h2 className="mb-6 text-4xl font-bold text-text-main">支付失败</h2>

      <div className="relative mb-10 w-full rounded-xl bg-bg-base p-4">
        <div className="pr-8 text-base leading-relaxed text-text-sub">{info.errorMessage}</div>
        <button
          type="button"
          onClick={() => handleCopy(info.errorMessage, '已复制错误信息')}
          className="absolute right-4 top-4 text-text-aux active:text-text-main"
          title="复制错误信息"
        >
          <Copy size={16} />
        </button>
      </div>

      <div className="mb-6 flex w-full space-x-4">
        <button
          type="button"
          onClick={() => goTo('order')}
          className="h-11 flex-1 rounded-full border border-primary-start text-lg font-medium text-primary-start active:bg-primary-start/5"
        >
          查看订单
        </button>
        <button
          type="button"
          onClick={handleRetryPay}
          className="h-11 flex-1 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-lg font-medium text-white shadow-sm active:opacity-80"
        >
          重新支付
        </button>
      </div>

      <button type="button" className="flex items-center text-base text-text-sub active:opacity-70" onClick={handleOpenSupport}>
        <HeadphonesIcon size={14} className="mr-1" />
        联系客服
      </button>
    </div>
  );

  if (orderInfo.scene === 'recharge') {
    return renderRechargeResult();
  }

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      {renderHeader('支付结果')}
      <div className="no-scrollbar flex-1 overflow-y-auto">
        {orderInfo.status === 'pending'
          ? renderMallPending()
          : orderInfo.status === 'success'
            ? renderMallSuccess(orderInfo)
            : renderMallFailure(orderInfo)}
      </div>
    </div>
  );
};

export default PaymentResultPage;
