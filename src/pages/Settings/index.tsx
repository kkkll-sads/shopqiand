/**
 * @file Settings/index.tsx
 * @description 应用设置页面，包括主题切换、缓存清理、账户安全、注销与退出登录。
 */

import { useState } from 'react';
import { AlertTriangle, Info, LogOut, Moon, Shield, Sun, Trash2, UserX } from 'lucide-react';
import { accountApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { AuthPasswordToggle } from '../../components/biz/auth';
import {
  SettingsActionItem,
  SettingsNotice,
  SettingsSection,
} from '../../components/biz/settings/SettingsSection';
import { PageHeader } from '../../components/layout/PageHeader';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { Button } from '../../components/ui/Button';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Input } from '../../components/ui/Input';
import { useTheme } from '../../contexts/ThemeContext';
import { clearAuthSession, PASSWORD_PATTERN } from '../../lib/auth';
import { CURRENT_APP_VERSION, formatVersionLabel } from '../../lib/appVersion';
import { useAppNavigate } from '../../lib/navigation';

function readCacheSizeLabel() {
  try {
    let total = 0;
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key) {
        total += (localStorage.getItem(key) ?? '').length;
      }
    }

    return total > 1024 * 1024 ? `${(total / (1024 * 1024)).toFixed(1)}MB` : `${(total / 1024).toFixed(1)}KB`;
  } catch {
    return '0KB';
  }
}

export const SettingsPage = () => {
  const { goBack, goTo } = useAppNavigate();
  const { showToast, showLoading, hideLoading } = useFeedback();
  const { isDark, setTheme } = useTheme();

  const [cacheSize, setCacheSize] = useState(() => readCacheSizeLabel());
  const [showCancelAccountForm, setShowCancelAccountForm] = useState(false);
  const [cancelPassword, setCancelPassword] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPassword, setShowCancelPassword] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [showCancelAccountSheet, setShowCancelAccountSheet] = useState(false);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearCache = () => {
    try {
      const keysToKeep = ['member_auth_session', 'access_token', 'ba-token', 'ba-user-token', 'app-theme'];
      const keysToRemove: string[] = [];

      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key && !keysToKeep.includes(key)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      sessionStorage.clear();
    } catch {
      // Ignore cache cleanup failures.
    }

    setCacheSize('0KB');
    showToast({ message: '缓存清理成功', type: 'success' });
  };

  const resetCancelAccountForm = () => {
    setShowCancelAccountForm(false);
    setShowCancelAccountSheet(false);
    setCancelPassword('');
    setCancelReason('');
    setShowCancelPassword(false);
  };

  const openCancelAccountForm = () => {
    setShowCancelAccountSheet(false);
    setShowCancelAccountForm(true);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    window.setTimeout(() => {
      clearAuthSession();
      setIsLoggingOut(false);
      setShowLogoutSheet(false);
      goTo('login');
    }, 300);
  };

  const handleCancelAccount = async () => {
    const password = cancelPassword.trim();
    const reason = cancelReason.trim();

    if (!password) {
      showToast({ message: '请输入账户密码', type: 'warning' });
      return;
    }

    if (!PASSWORD_PATTERN.test(password)) {
      showToast({ message: '账户密码需为 6-32 位字母或数字', type: 'warning' });
      return;
    }

    setCancelSubmitting(true);
    showLoading({ message: '正在提交注销申请...', subMessage: '提交成功后当前账号将退出登录' });

    try {
      await accountApi.cancelAccount({
        password,
        reason: reason || undefined,
      });
      hideLoading();
      clearAuthSession();
      resetCancelAccountForm();
      showToast({ message: '账户已注销', type: 'success' });
      goTo('login');
    } catch (error) {
      hideLoading();
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setCancelSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="设置" onBack={goBack} />
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="space-y-4">
          <SettingsSection title="账户安全" description="密码修改和安全入口统一放在这里。">
            <SettingsActionItem
              label="修改登录密码"
              description="校验旧密码后修改，成功后需要重新登录"
              icon={<Shield size={18} />}
              onClick={() => goTo('change_password')}
            />
            <SettingsActionItem
              label="修改支付密码"
              description="用于支付和资金验证"
              icon={<Shield size={18} />}
              onClick={() => goTo('change_pay_password')}
            />
          </SettingsSection>

          <SettingsSection>
            <SettingsActionItem
              label="账户与安全"
              description="查看绑定手机号、密码和安全说明"
              icon={<Shield size={18} />}
              onClick={() => goTo('security')}
            />
            <SettingsActionItem
              label={isDark ? '浅色模式' : '深色模式'}
              description="切换应用的深浅色外观"
              icon={isDark ? <Sun size={18} /> : <Moon size={18} />}
              value={isDark ? '已开启' : '已关闭'}
              variant="secondary"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
            />
            <SettingsActionItem
              label="清理缓存"
              description="清理本地缓存，不影响登录状态"
              icon={<Trash2 size={18} />}
              value={cacheSize}
              variant="secondary"
              onClick={clearCache}
            />
            <SettingsActionItem
              label="关于我们"
              description="当前应用版本"
              icon={<Info size={18} />}
              value={formatVersionLabel(CURRENT_APP_VERSION)}
              onClick={() => goTo('about')}
            />
          </SettingsSection>


          <SettingsSection>
            <SettingsActionItem
              label="注销账户"
              icon={<UserX size={18} />}
              variant="danger"
              hideChevron={showCancelAccountForm}
              onClick={() => {
                if (showCancelAccountForm) {
                  resetCancelAccountForm();
                  return;
                }
                setShowCancelAccountSheet(true);
              }}
            />
            {showCancelAccountForm ? (
              <div className="space-y-3 border-b border-border-light/80 px-4 py-4">
                <Input
                  placeholder="请输入账户密码"
                  type={showCancelPassword ? 'text' : 'password'}
                  value={cancelPassword}
                  onChange={(event) => setCancelPassword(event.target.value)}
                  rightIcon={
                    <AuthPasswordToggle
                      visible={showCancelPassword}
                      onToggle={() => setShowCancelPassword((value) => !value)}
                    />
                  }
                />
                <Input
                  placeholder="请输入注销原因（选填）"
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetCancelAccountForm}
                    className="flex-1 rounded-full bg-bg-base py-3 text-[15px] font-medium text-text-main"
                    disabled={cancelSubmitting}
                  >
                    取消
                  </button>
                  <Button className="flex-1" loading={cancelSubmitting} onClick={handleCancelAccount}>
                    确认注销
                  </Button>
                </div>
              </div>
            ) : null}
            <SettingsActionItem
              label="退出登录"
              icon={<LogOut size={18} />}
              variant="danger"
              borderless
              onClick={() => setShowLogoutSheet(true)}
            />
          </SettingsSection>


        </div>
      </div>

      <ActionSheet
        isOpen={showCancelAccountSheet}
        onClose={() => {
          if (cancelSubmitting) {
            return;
          }
          setShowCancelAccountSheet(false);
        }}
        title="确认注销账户？"
        groups={[
          {
            options: [
              {
                label: '继续注销',
                icon: <UserX size={18} />,
                danger: true,
                onClick: openCancelAccountForm,
              },
            ],
          },
        ]}
      />

      <ActionSheet
        isOpen={showLogoutSheet}
        onClose={() => {
          if (isLoggingOut) {
            return;
          }
          setShowLogoutSheet(false);
        }}
        title="确认退出登录？"
        groups={[
          {
            options: [
              {
                label: '退出登录',
                icon: <LogOut size={18} />,
                danger: true,
                loading: isLoggingOut,
                onClick: handleLogout,
              },
            ],
          },
        ]}
      />
    </div>
  );
};
