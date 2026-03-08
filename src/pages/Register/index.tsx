import { useState } from 'react';
import { Eye, EyeOff, Headset } from 'lucide-react';
import { getErrorMessage } from '../../api/core/errors';
import { authApi } from '../../api/modules/auth';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Input } from '../../components/ui/Input';
import { useSmsCode } from '../../hooks/useSmsCode';
import {
  MOBILE_PATTERN,
  PASSWORD_PATTERN,
  createAuthSession,
  persistAuthSession,
  resolveAuthRedirectPath,
} from '../../lib/auth';
import { useAppNavigate } from '../../lib/navigation';

export const RegisterPage = () => {
  const { goTo, goBack, navigate } = useAppNavigate();
  const { showToast } = useFeedback();

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showPayPassword, setShowPayPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [mobile, setMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [payPassword, setPayPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { buttonText, canSend, message, sendCode } = useSmsCode({
    event: 'user_register',
  });

  const handleSendCode = async () => {
    await sendCode(mobile);
  };

  const handleSubmit = async () => {
    const normalizedMobile = mobile.trim();
    const normalizedPassword = loginPassword.trim();
    const normalizedPayPassword = payPassword.trim();
    const normalizedCode = verifyCode.trim();
    const normalizedInviteCode = inviteCode.trim();

    if (!MOBILE_PATTERN.test(normalizedMobile)) {
      showToast({ message: '请输入正确的手机号', type: 'warning' });
      return;
    }

    if (!PASSWORD_PATTERN.test(normalizedPassword)) {
      showToast({ message: '登录密码需为 6-32 位字母或数字', type: 'warning' });
      return;
    }

    if (!PASSWORD_PATTERN.test(normalizedPayPassword)) {
      showToast({ message: '支付密码需为 6-32 位字母或数字', type: 'warning' });
      return;
    }

    if (!normalizedCode) {
      showToast({ message: '请输入短信验证码', type: 'warning' });
      return;
    }

    if (!agree) {
      showToast({ message: '请先勾选用户协议与隐私政策', type: 'warning' });
      return;
    }

    setSubmitting(true);

    try {
      const response = await authApi.register({
        mobile: normalizedMobile,
        password: normalizedPassword,
        pay_password: normalizedPayPassword,
        captcha: normalizedCode,
        invite_code: normalizedInviteCode || undefined,
      });

      const session = createAuthSession(response, {
        mobile: normalizedMobile,
        username: normalizedMobile,
      });

      persistAuthSession(session, {
        persistent: true,
      });

      showToast({ message: '注册成功', type: 'success' });
      navigate(resolveAuthRedirectPath(session.routePath), { replace: true });
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-y-auto bg-bg-base no-scrollbar">
      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto px-4 pb-8 pt-12 no-scrollbar">
        <div className="absolute left-4 right-4 top-4 z-20 flex justify-between">
          <button
            type="button"
            className="-ml-2 p-2 text-text-main active:opacity-70"
            onClick={goBack}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            className="flex items-center rounded-full border border-border-light bg-bg-card/60 px-3 py-1.5 text-[12px] text-text-main shadow-sm backdrop-blur-md"
          >
            <Headset size={14} className="mr-1" />
            客服
          </button>
        </div>

        <div className="mb-10 mt-16">
          <h1 className="mb-2 text-[28px] font-bold text-text-main">Welcome!</h1>
          <p className="text-[18px] text-text-sub">欢迎注册树交所</p>
        </div>

        <div className="mb-4 space-y-4">
          <Input
            placeholder="请输入邀请码"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
          />
          <Input
            placeholder="请输入手机号"
            type="tel"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
          />
          <Input
            placeholder="请设置登录密码"
            type={showLoginPassword ? 'text' : 'password'}
            value={loginPassword}
            onChange={(event) => setLoginPassword(event.target.value)}
            rightIcon={
              <button
                type="button"
                className="focus:outline-none"
                onClick={() => setShowLoginPassword((current) => !current)}
              >
                {showLoginPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            }
          />
          <Input
            placeholder="请设置支付密码"
            type={showPayPassword ? 'text' : 'password'}
            value={payPassword}
            onChange={(event) => setPayPassword(event.target.value)}
            rightIcon={
              <button
                type="button"
                className="focus:outline-none"
                onClick={() => setShowPayPassword((current) => !current)}
              >
                {showPayPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            }
          />

          <div className="space-y-2">
            <div className="flex space-x-3">
              <Input
                placeholder="请输入验证码"
                className="flex-1"
                value={verifyCode}
                onChange={(event) => setVerifyCode(event.target.value)}
              />
              <button
                type="button"
                disabled={!canSend}
                onClick={handleSendCode}
                className="h-[48px] whitespace-nowrap rounded-[20px] border border-border-light bg-bg-card px-4 text-[15px] font-medium text-primary-start shadow-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                {buttonText}
              </button>
            </div>
            {message && <p className="px-1 text-[12px] text-primary-start">{message}</p>}
          </div>
        </div>



        <Button className="mb-4" disabled={submitting} onClick={handleSubmit}>
          {submitting ? '注册中...' : '注册'}
        </Button>

        <div className="mb-auto flex items-start justify-center">
          <Checkbox
            checked={agree}
            onChange={() => setAgree((current) => !current)}
            className="mt-0.5"
          />
          <div className="ml-2 text-[12px] leading-tight text-text-sub">
            注册即代表你已同意
            <a href="#" className="mx-1 text-primary-start">
              用户协议
            </a>
            和
            <a href="#" className="mx-1 text-primary-start">
              隐私政策
            </a>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            type="button"
            className="text-[15px] font-medium text-text-main"
            onClick={() => goTo('login')}
          >
            已有账户？去登录
          </button>
        </div>
      </div>
    </div>
  );
};
