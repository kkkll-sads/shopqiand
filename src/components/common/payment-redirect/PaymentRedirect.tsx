/**
 * PaymentRedirect - 第三方支付跳转组件
 *
 * 解决 iframe 无法加载支付宝/微信等第三方支付页面的问题
 * 使用新窗口打开的方案，不会离开当前页面
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { copyToClipboard } from '@/utils/clipboard';
import { copyWithToast } from '@/utils/copyWithToast';
import { errorLog } from '@/utils/logger';
import PaymentBlockedStep from './components/PaymentBlockedStep';
import PaymentCheckingStep from './components/PaymentCheckingStep';
import PaymentPayingStep from './components/PaymentPayingStep';
import PaymentReadyStep from './components/PaymentReadyStep';
import PaymentRedirectHeader from './components/PaymentRedirectHeader';
import type { PaymentRedirectProps, PaymentStep } from './types';

export const PaymentRedirect: React.FC<PaymentRedirectProps> = ({
  url,
  title = '收银台',
  amount,
  orderNo,
  onClose,
  onSuccess,
  onRefreshUrl,
  isOpen,
  timeout = 300,
}) => {
  const { showToast } = useNotification();
  const [step, setStep] = useState<PaymentStep>('ready');
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [refreshing, setRefreshing] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timeout);
  const [isExpired, setIsExpired] = useState(false);

  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setCurrentUrl(url);
  }, [url]);

  useEffect(() => {
    if (!isOpen) {
      setRemainingTime(timeout);
      setIsExpired(false);
      startTimeRef.current = 0;
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      return;
    }

    startTimeRef.current = Date.now();
    setRemainingTime(timeout);
    setIsExpired(false);

    countdownRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, timeout - elapsed);
      setRemainingTime(remaining);

      if (remaining <= 0) {
        setIsExpired(true);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      }
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isOpen, timeout]);

  useEffect(() => {
    if (!isOpen) {
      setStep('ready');
      setCopied(false);
      setCopiedOrderNo(false);
      setRefreshing(false);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRefreshUrl = async () => {
    if (!onRefreshUrl || refreshing) return;

    setRefreshing(true);
    try {
      const newUrl = await onRefreshUrl();
      if (newUrl) {
        setCurrentUrl(newUrl);
        startTimeRef.current = Date.now();
        setRemainingTime(timeout);
        setIsExpired(false);
        setStep('ready');
      }
    } catch (error) {
      errorLog('PaymentRedirect', '刷新支付链接失败', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(currentUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyOrderNo = async () => {
    if (!orderNo) return;
    const success = await copyWithToast(orderNo, showToast, {
      successDescription: '订单号已复制到剪贴板',
    });
    if (success) {
      setCopiedOrderNo(true);
      setTimeout(() => setCopiedOrderNo(false), 2000);
    }
  };

  const handleOpenPayment = () => {
    if (isExpired) {
      void handleRefreshUrl();
      return;
    }

    const newWindow = window.open(currentUrl, '_blank');

    if (!newWindow || newWindow.closed) {
      setStep('blocked');
      return;
    }

    setStep('paying');
    setPaymentWindow(newWindow);

    checkIntervalRef.current = setInterval(() => {
      try {
        if (newWindow.closed) {
          setStep('checking');
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
          }
        }
      } catch {
        // 跨域情况下无法检测
      }
    }, 500);
  };

  const handlePaymentComplete = () => {
    onSuccess?.();
  };

  const handleRetry = async () => {
    if (onRefreshUrl) {
      await handleRefreshUrl();
      return;
    }

    setStep('ready');
  };

  const handleClose = () => {
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 animate-in slide-in-from-bottom duration-300">
      <PaymentRedirectHeader
        title={title}
        isExpired={isExpired}
        remainingTime={remainingTime}
        formatTime={formatTime}
        onClose={handleClose}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        {step === 'ready' && (
          <PaymentReadyStep
            amount={amount}
            orderNo={orderNo}
            copiedOrderNo={copiedOrderNo}
            timeout={timeout}
            isExpired={isExpired}
            refreshing={refreshing}
            onCopyOrderNo={orderNo ? handleCopyOrderNo : undefined}
            onRefreshUrl={onRefreshUrl ? handleRefreshUrl : undefined}
            onOpenPayment={handleOpenPayment}
          />
        )}

        {step === 'paying' && (
          <PaymentPayingStep
            refreshing={refreshing}
            onDone={() => setStep('checking')}
            onRefreshUrl={onRefreshUrl ? handleRetry : undefined}
          />
        )}

        {step === 'blocked' && (
          <PaymentBlockedStep
            currentUrl={currentUrl}
            copied={copied}
            refreshing={refreshing}
            onCopyLink={handleCopyLink}
            onRefreshUrl={onRefreshUrl ? handleRetry : undefined}
            onDone={() => setStep('checking')}
          />
        )}

        {step === 'checking' && (
          <PaymentCheckingStep
            refreshing={refreshing}
            onComplete={handlePaymentComplete}
            onRefreshUrl={onRefreshUrl ? handleRetry : undefined}
          />
        )}
      </div>
    </div>
  );
};

export default PaymentRedirect;
