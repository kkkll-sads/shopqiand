/**
 * PaymentRedirect - 第三方支付跳转组件
 * 
 * 解决 iframe 无法加载支付宝/微信等第三方支付页面的问题
 * 使用新窗口打开的方案，不会离开当前页面
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, ExternalLink, CreditCard, ShieldCheck, ArrowRight, RefreshCw, CheckCircle, Copy, AlertCircle, Clock, AlertTriangle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { errorLog } from '../../utils/logger';

interface PaymentRedirectProps {
  url: string;
  title?: string;
  amount?: string | number;
  orderNo?: string;
  onClose: () => void;
  onSuccess?: () => void;
  /** 重新获取支付链接的回调 */
  onRefreshUrl?: () => Promise<string | null>;
  isOpen: boolean;
  /** 支付超时时间（秒），默认300秒（5分钟） */
  timeout?: number;
}

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
  const [step, setStep] = useState<'ready' | 'paying' | 'checking' | 'blocked'>('ready');
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [refreshing, setRefreshing] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timeout);
  const [isExpired, setIsExpired] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 更新当前 URL
  useEffect(() => {
    setCurrentUrl(url);
  }, [url]);

  // 倒计时逻辑
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
      setRefreshing(false);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    }
  }, [isOpen]);

  // 清理函数
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

  // 格式化倒计时
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 刷新支付链接
  const handleRefreshUrl = async () => {
    if (!onRefreshUrl || refreshing) return;
    
    setRefreshing(true);
    try {
      const newUrl = await onRefreshUrl();
      if (newUrl) {
        setCurrentUrl(newUrl);
        // 重置倒计时
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

  // 复制链接到剪贴板
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenPayment = () => {
    if (isExpired) {
      // 链接已过期，需要刷新
      handleRefreshUrl();
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
      } catch (e) {
        // 跨域情况下无法检测
      }
    }, 500);
  };

  // 支付成功
  const handlePaymentComplete = () => {
    onSuccess?.();
  };

  // 重试支付（获取新链接）
  const handleRetry = async () => {
    if (onRefreshUrl) {
      await handleRefreshUrl();
    } else {
      setStep('ready');
    }
  };

  // 关闭（不显示确认弹窗）
  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm shrink-0">
        <button
          onClick={handleClose}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex-1 text-center mx-2">
          <span className="font-bold text-gray-900">{title}</span>
        </div>

        {/* 倒计时显示 */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono ${
          isExpired ? 'bg-red-100 text-red-600' : 
          remainingTime <= 60 ? 'bg-amber-100 text-amber-600' : 
          'bg-gray-100 text-gray-600'
        }`}>
          <Clock size={12} />
          {isExpired ? '已超时' : formatTime(remainingTime)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        {step === 'ready' && (
          <div className="w-full max-w-sm text-center">
            {/* 金额展示 */}
            {amount && (
              <div className="mb-6">
                <p className="text-gray-500 text-sm mb-2">支付金额</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-gray-900 text-xl font-bold">¥</span>
                  <span className="text-5xl font-bold text-red-600 font-[DINAlternate-Bold]">
                    {typeof amount === 'number' ? amount.toFixed(2) : amount}
                  </span>
                </div>
                {orderNo && (
                  <p className="text-gray-400 text-xs mt-3 font-mono">订单号：{orderNo}</p>
                )}
              </div>
            )}

            {/* 重要提醒 */}
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 space-y-1">
                  <p className="font-bold">重要提醒：</p>
                  <p>• 请勿修改支付金额，否则无法到账</p>
                  <p>• 请勿保存二维码稍后支付</p>
                  <p>• 支付链接 {Math.floor(timeout / 60)} 分钟内有效</p>
                </div>
              </div>
            </div>

            {/* 支付按钮 */}
            <button
              onClick={handleOpenPayment}
              disabled={isExpired}
              className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                isExpired 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200 active:scale-[0.98]'
              }`}
            >
              {isExpired ? (
                <>
                  <Clock size={20} />
                  链接已过期
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  去支付
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* 过期后显示刷新按钮 */}
            {isExpired && onRefreshUrl && (
              <button
                onClick={handleRefreshUrl}
                disabled={refreshing}
                className="mt-3 w-full py-3 rounded-xl font-medium bg-gray-100 text-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {refreshing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    获取新链接...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    获取新支付链接
                  </>
                )}
              </button>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-xs">
              <ShieldCheck size={14} />
              <span>安全支付保障</span>
            </div>
          </div>
        )}

        {step === 'paying' && (
          <div className="w-full max-w-sm text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <LoadingSpinner size="lg" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">已打开支付页面</h3>
            <p className="text-gray-500 text-sm mb-6">请在新打开的标签页中完成支付</p>
            
            {/* 重要提醒 */}
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 space-y-1">
                  <p className="font-bold">请注意：</p>
                  <p>• 请勿修改支付金额</p>
                  <p>• 请勿保存二维码稍后支付</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setStep('checking')}
                className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white active:scale-[0.98] transition-all"
              >
                我已完成支付
              </button>
              
              {onRefreshUrl && (
                <button
                  onClick={handleRetry}
                  disabled={refreshing}
                  className="flex items-center justify-center gap-2 text-red-600 font-medium mx-auto"
                >
                  {refreshing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      获取新链接...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      获取新支付链接
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'blocked' && (
          <div className="w-full max-w-sm text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">浏览器拦截了弹窗</h3>
            <p className="text-gray-500 text-sm mb-6">请手动复制链接到浏览器打开</p>
            
            {/* 链接显示框 */}
            <div className="bg-gray-100 rounded-xl p-3 mb-4 text-left">
              <p className="text-xs text-gray-500 mb-1">支付链接</p>
              <p className="text-sm text-gray-700 break-all line-clamp-2">{currentUrl}</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleCopyLink}
                className={`w-full py-3 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white active:scale-[0.98]'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle size={18} />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    复制链接
                  </>
                )}
              </button>
              
              {onRefreshUrl && (
                <button
                  onClick={handleRetry}
                  disabled={refreshing}
                  className="w-full py-3 rounded-xl font-medium text-base bg-gray-100 text-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {refreshing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      获取新链接...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      获取新支付链接
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={() => setStep('checking')}
                className="text-gray-500 text-sm font-medium"
              >
                我已完成支付
              </button>
            </div>
          </div>
        )}

        {step === 'checking' && (
          <div className="w-full max-w-sm text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">请确认支付结果</h3>
            <p className="text-gray-500 text-sm mb-8">如果您已在支付页面完成付款，请点击下方按钮</p>
            
            <div className="space-y-3">
              <button
                onClick={handlePaymentComplete}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-200 active:scale-[0.98] transition-all"
              >
                ✓ 已完成支付
              </button>
              
              {onRefreshUrl && (
                <button
                  onClick={handleRetry}
                  disabled={refreshing}
                  className="w-full bg-gray-100 text-gray-600 font-medium py-4 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {refreshing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      获取新链接...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      支付遇到问题，获取新链接
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentRedirect;
