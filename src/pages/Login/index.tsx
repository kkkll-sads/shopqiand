/**
 * @file Login/index.tsx
 * @description 用户登录页，支持密码登录与短信登录。
 */

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getErrorMessage } from '../../api/core/errors';
import {
  authApi,
  getCheckInResponseMessage,
  isCheckInSuccessCode,
  resolveCheckInCode,
  type CheckInConfig,
  type CheckInEnvelope,
  type CheckInResponseData,
  type LoginTab,
} from '../../api/modules/auth';
import {
  AuthAgreement,
  AuthFooterLink,
  AuthFormSection,
  AuthPasswordToggle,
  AuthSmsField,
  AuthTabs,
  AuthTopBar,
} from '../../components/biz/auth';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useSmsCode } from '../../hooks/useSmsCode';
import {
  MOBILE_PATTERN,
  PASSWORD_PATTERN,
  createAuthSession,
  persistAuthSession,
  resolveAuthRedirectPath,
} from '../../lib/auth';
import { useAppNavigate } from '../../lib/navigation';

const SAVED_CREDENTIALS_KEY = 'saved_login_credentials';

function loadSavedCredentials(): { username: string; password: string } | null {
  try {
    const raw = localStorage.getItem(SAVED_CREDENTIALS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.username === 'string' && typeof parsed.password === 'string') {
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

function saveCred(username: string, password: string) {
  try {
    localStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify({ username, password }));
  } catch { /* ignore */ }
}

function clearSavedCredentials() {
  try {
    localStorage.removeItem(SAVED_CREDENTIALS_KEY);
  } catch { /* ignore */ }
}

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

function readRedirectFromState(state: unknown) {
  return typeof (state as { from?: unknown } | null)?.from === 'string'
    ? (state as { from: string }).from
    : undefined;
}

export const LoginPage = () => {
  const { goTo, goBack, navigate } = useAppNavigate();
  const location = useLocation();
  const { showToast } = useFeedback();

  const saved = useMemo(() => loadSavedCredentials(), []);

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(!!saved);
  const [agree, setAgree] = useState(false);
  const [currentTab, setCurrentTab] = useState<LoginTab>('login');
  const [username, setUsername] = useState(saved?.username ?? '');
  const [password, setPassword] = useState(saved?.password ?? '');
  const [mobile, setMobile] = useState(
    saved && !saved.password && saved.username ? saved.username : '',
  );
  const [verifyCode, setVerifyCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState<CheckInConfig | null>(null);

  const { buttonText, canSend, message, sendCode, sending } = useSmsCode({
    event: 'user_login',
  });

  const availableTabs = useMemo(() => resolveLoginTabs(config?.loginTabs), [config?.loginTabs]);
  const tabItems = useMemo(
    () => availableTabs.map((tab) => ({ key: tab, label: TAB_LABELS[tab] })),
    [availableTabs],
  );

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

  const handleTabChange = (tab: LoginTab) => {
    if (tab === 'sms_login' && MOBILE_PATTERN.test(username.trim())) {
      setMobile(username.trim());
    } else if (tab === 'login' && mobile.trim()) {
      setUsername(mobile.trim());
    }

    setCurrentTab(tab);
  };

  const handleSubmit = async () => {
    if (!agree) {
      showToast({ message: '请先勾选用户协议与隐私政策', type: 'warning' });
      return;
    }

    setSubmitting(true);

    try {
      let response: CheckInEnvelope<CheckInResponseData | null>;
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

      if (!isCheckInSuccessCode(resolveCheckInCode(response))) {
        showToast({
          message: getCheckInResponseMessage(response, '登录失败，请重试'),
          type: 'error',
        });
        return;
      }

      const session = createAuthSession(response.data, sessionIdentity);

      const didPersistSession = persistAuthSession(session, {
        persistent: true,
      });
      if (!didPersistSession) {
        showToast({
          message: getCheckInResponseMessage(response, '登录状态获取失败，请重试'),
          type: 'error',
        });
        return;
      }

      if (remember) {
        if (currentTab === 'login') {
          saveCred(username.trim(), password.trim());
        } else {
          saveCred(mobile.trim(), '');
        }
      } else {
        clearSavedCredentials();
      }

      showToast({ message: '登录成功', type: 'success' });
      navigate(resolveAuthRedirectPath(readRedirectFromState(location.state) ?? session.routePath), {
        replace: true,
      });
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-y-auto bg-bg-base no-scrollbar">
      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto px-4 pb-8 pt-12 no-scrollbar">
        <AuthTopBar onBack={goBack} />

        <AuthFormSection
          className="mt-16"
          title="Hello!"
          description="欢迎登录树交所"
          headerExtra={
            tabItems.length > 0 ? (
              <AuthTabs items={tabItems} value={currentTab} onChange={handleTabChange} />
            ) : null
          }
          auxiliary={
            <div className="flex items-center justify-between">
              <Checkbox
                checked={remember}
                onChange={() => setRemember((current) => !current)}
                label="记住密码"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth={false}
                className="px-0 text-[12px] text-text-sub"
                onClick={() => navigate('/forgot-password')}
              >
                忘记密码
              </Button>
            </div>
          }
          actions={
            <Button
              loading={submitting}
              onClick={handleSubmit}
              className="auth-submit-gradient"
            >
              登录
            </Button>
          }
          footer={
            <>
              <AuthAgreement
                checked={agree}
                onChange={() => setAgree((current) => !current)}
                onOpenAgreement={() => navigate('/user_agreement')}
                onOpenPrivacy={() => navigate('/privacy_policy')}
                mode="login"
              />
              <AuthFooterLink
                text="没有账户？"
                accentText="点击注册"
                onClick={() => goTo('register')}
              />
            </>
          }
        >
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
                  <AuthPasswordToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((current) => !current)}
                  />
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
              <AuthSmsField
                value={verifyCode}
                onChange={(event) => setVerifyCode(event.target.value)}
                buttonText={buttonText}
                canSend={canSend}
                message={message}
                sending={sending}
                onSend={() => void sendCode(mobile)}
              />
            </>
          )}
        </AuthFormSection>
      </div>
    </div>
  );
};

export default LoginPage;
