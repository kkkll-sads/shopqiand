import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Headset } from 'lucide-react';
import { getErrorMessage } from '../../api/core/errors';
import { authApi, type CheckInConfig, type LoginTab } from '../../api/modules/auth';
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

const TAB_LABELS: Record<LoginTab, string> = {
  login: '密码登录',
  sms_login: '验证码登录',
};

function isLoginTab(value: string): value is LoginTab {
  return value === 'login' || value === 'sms_login';
}

function resolveLoginTabs(value: CheckInConfig['loginTabs']): LoginTab[] {
  const rawTabs = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : ['login'];

  const tabs = rawTabs
    .map((item) => item.trim())
    .filter(isLoginTab)
    .filter((item, index, items) => items.indexOf(item) === index);

  return tabs.length > 0 ? tabs : ['login'];
}

function resolveDefaultTab(value: CheckInConfig['defaultTab']): LoginTab | null {
  return typeof value === 'string' && isLoginTab(value) ? value : null;
}

export const LoginPage = () => {
  const { goTo, goBack, navigate } = useAppNavigate();
  const { showToast } = useFeedback();

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [agree, setAgree] = useState(false);
  const [currentTab, setCurrentTab] = useState<LoginTab>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState<CheckInConfig | null>(null);

  const { buttonText, canSend, message, sendCode } = useSmsCode({
    event: 'user_login',
  });

  const availableTabs = useMemo(() => resolveLoginTabs(config?.loginTabs), [config?.loginTabs]);

  useEffect(() => {
    let active = true;

    const loadConfig = async () => {
      try {
        const response = await authApi.getCheckInConfig();
        if (active) {
          setConfig(response);
        }
      } catch {
        if (active) {
          setConfig(null);
        }
      }
    };

    void loadConfig();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const defaultTab = resolveDefaultTab(config?.defaultTab);

    setCurrentTab((current) => {
      if (availableTabs.includes(current)) {
        return current;
      }

      if (defaultTab && availableTabs.includes(defaultTab)) {
        return defaultTab;
      }

      return availableTabs[0];
    });
  }, [availableTabs, config?.defaultTab]);

  const handleSendCode = async () => {
    await sendCode(mobile);
  };

  const handleSubmit = async () => {
    if (!agree) {
      showToast({ message: '请先勾选用户协议与隐私政策', type: 'warning' });
      return;
    }

    setSubmitting(true);

    try {
      let response;
      let sessionIdentity: { mobile?: string; username?: string };

      if (currentTab === 'login') {
        const normalizedUsername = username.trim();
        const normalizedPassword = password.trim();

        if (!normalizedUsername) {
          showToast({ message: '请输入用户名或手机号', type: 'warning' });
          return;
        }

        if (!PASSWORD_PATTERN.test(normalizedPassword)) {
          showToast({ message: '登录密码需为 6-32 位字母或数字', type: 'warning' });
          return;
        }

        response = await authApi.login({
          username: normalizedUsername,
          password: normalizedPassword,
          keep: remember ? 1 : 0,
        });

        sessionIdentity = {
          mobile: MOBILE_PATTERN.test(normalizedUsername) ? normalizedUsername : undefined,
          username: normalizedUsername,
        };
      } else {
        const normalizedMobile = mobile.trim();
        const normalizedCode = verifyCode.trim();

        if (!MOBILE_PATTERN.test(normalizedMobile)) {
          showToast({ message: '请输入正确的手机号', type: 'warning' });
          return;
        }

        if (!normalizedCode) {
          showToast({ message: '请输入短信验证码', type: 'warning' });
          return;
        }

        response = await authApi.smsLogin({
          mobile: normalizedMobile,
          captcha: normalizedCode,
          keep: remember ? 1 : 0,
        });

        sessionIdentity = {
          mobile: normalizedMobile,
          username: normalizedMobile,
        };
      }

      const session = createAuthSession(response, sessionIdentity);

      persistAuthSession(session, {
        persistent: remember,
      });

      showToast({ message: '登录成功', type: 'success' });
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
          <h1 className="mb-2 text-[28px] font-bold text-text-main">Hello!</h1>
          <p className="text-[18px] text-text-sub">欢迎登录树交所</p>
        </div>

        {availableTabs.length > 0 && (
          <div className="mb-6 flex space-x-6">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`relative pb-1 text-[18px] font-medium ${
                  currentTab === tab ? 'text-text-main' : 'text-text-aux'
                }`}
                onClick={() => {
                  /* 切换 tab 时保留手机号：密码登录 ↔ 验证码登录 */
                  if (tab === 'sms_login' && MOBILE_PATTERN.test(username.trim())) {
                    setMobile(username.trim());
                  } else if (tab === 'login' && mobile.trim()) {
                    setUsername(mobile.trim());
                  }
                  setCurrentTab(tab);
                }}
              >
                {TAB_LABELS[tab]}
                {currentTab === tab && (
                  <div className="absolute bottom-0 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-primary-start" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mb-4 space-y-4">
          {currentTab === 'login' ? (
            <>
              <Input
                placeholder="请输入用户名或手机号"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
              <Input
                placeholder="请输入登录密码"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="focus:outline-none"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                }
              />
            </>
          ) : (
            <>
              <Input
                placeholder="请输入手机号"
                type="tel"
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
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
            </>
          )}
        </div>

        <div className="mb-8 flex items-center justify-between">
          <Checkbox checked={remember} onChange={() => setRemember((current) => !current)} label="记住密码" />
          <button type="button" className="text-[12px] text-text-sub" onClick={() => navigate('/forgot-password')}>
            忘记密码
          </button>
        </div>

        <Button className="mb-4" disabled={submitting} onClick={handleSubmit}>
          {submitting ? '登录中...' : '登录'}
        </Button>

        <div className="mb-auto flex items-start justify-center">
          <Checkbox
            checked={agree}
            onChange={() => setAgree((current) => !current)}
            className="mt-0.5"
          />
          <div className="ml-2 text-[12px] leading-tight text-text-sub">
            登录即代表你已同意
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
            onClick={() => goTo('register')}
          >
            没有账户？点击注册
          </button>
        </div>
      </div>
    </div>
  );
};
