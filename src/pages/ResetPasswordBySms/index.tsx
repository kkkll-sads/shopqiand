import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { Button } from '../../components/ui/Button';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Input } from '../../components/ui/Input';
import { useSmsCode } from '../../hooks/useSmsCode';
import { MOBILE_PATTERN, PASSWORD_PATTERN } from '../../lib/auth';
import { useAppNavigate } from '../../lib/navigation';

export const ResetPasswordBySmsPage = () => {
  const { goBackOr, goTo } = useAppNavigate();
  const { showToast } = useFeedback();
  const [mobile, setMobile] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { buttonText, canSend, message, sendCode } = useSmsCode({
    event: 'user_retrieve_pwd',
  });

  const handleSubmit = async () => {
    const normalizedMobile = mobile.trim();
    const normalizedCode = verifyCode.trim();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (!MOBILE_PATTERN.test(normalizedMobile)) {
      showToast({ message: '请输入正确的手机号', type: 'warning' });
      return;
    }

    if (!normalizedCode) {
      showToast({ message: '请输入短信验证码', type: 'warning' });
      return;
    }

    if (!PASSWORD_PATTERN.test(normalizedPassword)) {
      showToast({ message: '新密码需为 6-32 位字母或数字', type: 'warning' });
      return;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      showToast({ message: '两次输入的新密码不一致', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await authApi.retrievePassword({
        type: 'mobile',
        account: normalizedMobile,
        captcha: normalizedCode,
        password: normalizedPassword,
      });
      showToast({ message: '登录密码已重置，请使用新密码登录', type: 'success' });
      goTo('login');
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto px-4 pb-8 pt-4 no-scrollbar">
        <div className="mb-6">
          <button
            type="button"
            className="-ml-2 p-2 text-text-main active:opacity-70"
            onClick={() => goBackOr('login')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="mb-10">
          <h1 className="mb-2 text-[28px] font-bold text-text-main">验证码重置登录密码</h1>
          <p className="text-[15px] text-text-sub">通过手机验证码重新设置新的登录密码</p>
        </div>

        <div className="space-y-4">
          <Input placeholder="请输入手机号" type="tel" value={mobile} onChange={(event) => setMobile(event.target.value)} />

          <div className="space-y-2">
            <div className="flex space-x-3">
              <Input placeholder="请输入验证码" className="flex-1" value={verifyCode} onChange={(event) => setVerifyCode(event.target.value)} />
              <button
                type="button"
                disabled={!canSend}
                onClick={() => void sendCode(mobile)}
                className="h-[48px] whitespace-nowrap rounded-[20px] border border-border-light bg-bg-card px-4 text-[15px] font-medium text-primary-start shadow-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                {buttonText}
              </button>
            </div>
            {message ? <p className="px-1 text-[12px] text-primary-start">{message}</p> : null}
          </div>

          <Input
            placeholder="请输入新登录密码"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            rightIcon={<button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <Eye size={18} /> : <EyeOff size={18} />}</button>}
          />

          <Input
            placeholder="请再次输入新登录密码"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            rightIcon={<button type="button" onClick={() => setShowConfirmPassword((value) => !value)}>{showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}</button>}
          />
        </div>

        <Button className="mt-6" disabled={submitting} onClick={handleSubmit}>
          {submitting ? '提交中...' : '重置登录密码'}
        </Button>
      </div>
    </div>
  );
};

export default ResetPasswordBySmsPage;
