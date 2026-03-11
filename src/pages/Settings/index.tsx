/**
 * @file Settings/index.tsx - 设置页面
 * @description 应用设置页面，包括主题切换、清除缓存、关于我们、退出登录等。
 */

import { useMemo, useState } from 'react'; // React 核心 Hook
import { Info, LogOut, Shield, Trash2 } from 'lucide-react';
import {
  SettingsActionItem,
  SettingsNotice,
  SettingsSection,
} from '../../components/biz/settings/SettingsSection';
import { PageHeader } from '../../components/layout/PageHeader';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { clearAuthSession } from '../../lib/auth';
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
  const { showToast } = useFeedback();
  const { theme, setTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [cacheSize, setCacheSize] = useState(() => readCacheSizeLabel());

  const themeOptions = useMemo(
    () => [
      { key: 'light', label: '浅色' },
      { key: 'dark', label: '深色' },
      { key: 'system', label: '跟随系统' },
    ] as const,
    [],
  );

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
      // ignore cache clean errors
    }
    setCacheSize('0KB');
    showToast({ message: '缓存清理成功', type: 'success' });
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="设置" onBack={goBack} />
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="space-y-4">
          <SettingsSection title="外观设置" description="统一当前设备内的主题显示方式。">
            <div className="px-4 pb-4 pt-4">
              <div className="flex gap-2 rounded-full bg-bg-base p-1">
                {themeOptions.map((option) => {
                  const active = theme === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setTheme(option.key)}
                      className={`flex-1 rounded-full px-3 py-2 text-[14px] ${
                        active ? 'bg-bg-card text-text-main shadow-soft' : 'text-text-sub'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </SettingsSection>

          <SettingsSection title="账号安全" description="密码、支付验证和账号恢复入口统一放在这里。">
            <SettingsActionItem
              label="修改登录密码"
              description="校验旧密码后修改，成功后需重新登录"
              icon={<Shield size={18} />}
              onClick={() => goTo('change_password')}
            />
            <SettingsActionItem
              label="修改支付密码"
              description="用于支付和资金验证"
              icon={<Shield size={18} />}
              onClick={() => goTo('change_pay_password')}
            />
            <SettingsActionItem
              label="验证码重置登录密码"
              description="通过短信验证码快速重置登录密码"
              icon={<Info size={18} />}
              onClick={() => goTo('reset_password')}
            />
          </SettingsSection>

          <SettingsSection>
            <SettingsActionItem
              label="账号与安全"
              description="查看绑定手机号、密码和安全说明"
              icon={<Shield size={18} />}
              onClick={() => goTo('security')}
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
              value={formatVersionLabel(CURRENT_APP_VERSION)}
              onClick={() => goTo('about')}
            />
          </SettingsSection>

          <SettingsNotice title="说明">
            清理缓存仅会移除本地临时数据。修改登录密码后，系统会要求重新登录。
          </SettingsNotice>

          <SettingsSection>
            <SettingsActionItem
              label="退出登录"
              description="退出当前账号，需要重新登录后才能继续查看订单与账户信息"
              icon={<LogOut size={18} />}
              variant="danger"
              borderless
              onClick={() => setShowLogoutModal(true)}
            />
          </SettingsSection>
        </div>
      </div>

      {showLogoutModal ? (
        <div className="absolute inset-0 z-[100] flex items-center justify-center px-4">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setShowLogoutModal(false)} />
          <div className="relative z-10 w-full max-w-[320px] rounded-[28px] bg-bg-card p-6 shadow-soft">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-primary-start">
              <LogOut size={22} />
            </div>
            <div className="text-[20px] font-semibold text-text-main">确认退出登录？</div>
            <div className="mt-2 text-[14px] leading-6 text-text-sub">退出后需要重新登录才能继续查看订单和账户信息。</div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-full bg-bg-base py-3 text-[15px] font-medium text-text-main"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  clearAuthSession();
                  goTo('login');
                }}
                className="flex-1 rounded-full bg-gradient-to-r from-primary-start to-primary-end py-3 text-[15px] font-medium text-white"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
