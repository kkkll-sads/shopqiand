import { useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '../api/core/errors';
import { smsApi, type SmsEvent } from '../api/modules/sms';
import { useFeedback } from '../components/ui/FeedbackProvider';

const MOBILE_PATTERN = /^1\d{10}$/;

interface UseSmsCodeOptions {
  countdownSeconds?: number;
  event: SmsEvent;
}

export function useSmsCode({ countdownSeconds = 60, event }: UseSmsCodeOptions) {
  const { showToast } = useFeedback();
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  const buttonText = useMemo(() => {
    if (sending) {
      return '发送中...';
    }

    if (countdown > 0) {
      return `${countdown}s`;
    }

    return '获取验证码';
  }, [countdown, sending]);

  const sendCode = async (mobile: string) => {
    const normalizedMobile = mobile.trim();

    if (!MOBILE_PATTERN.test(normalizedMobile)) {
      setMessage('请输入正确的手机号');
      return false;
    }

    if (sending || countdown > 0) {
      return false;
    }

    setSending(true);
    setMessage('');

    try {
      await smsApi.send({
        mobile: normalizedMobile,
        event,
      });
      setCountdown(countdownSeconds);
      setMessage('');
      showToast({ message: '验证码已发送，请注意查收', type: 'success' });
      return true;
    } catch (error) {
      setMessage(getErrorMessage(error));
      return false;
    } finally {
      setSending(false);
    }
  };

  return {
    buttonText,
    canSend: !sending && countdown === 0,
    message,
    sendCode,
    sending,
    setMessage,
  };
}
