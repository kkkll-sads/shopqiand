import { useMemo, useState, type ReactNode } from 'react';
import { ChevronRight, LogOut, Shield, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppNavigate } from '../../lib/navigation';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { CURRENT_APP_VERSION, formatVersionLabel } from '../../lib/appVersion';
import { clearAuthSession } from '../../lib/auth';

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

  const renderRow = (
    label: string,
    action: () => void,
    description?: string,
    icon?: ReactNode,
  ) => (
    <button
      type="button"
      onClick={action}
      className="flex w-full items-center justify-between px-4 py-4 text-left active:bg-bg-hover"
    >
      <div className="flex items-center gap-3">
        {icon ? <div className="text-text-sub">{icon}</div> : null}
        <div>
          <div className="text-[16px] text-text-main">{label}</div>
          {description ? <div className="mt-1 text-[12px] text-text-sub">{description}</div> : null}
        </div>
      </div>
      <ChevronRight size={16} className="text-text-aux" />
    </button>
  );

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="设置" onBack={goBack} />
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="space-y-4">
          <section className="overflow-hidden rounded-[24px] bg-bg-card shadow-soft">
            <div className="px-4 py-4 text-[16px] font-medium text-text-main">外观设置</div>
            <div className="px-4 pb-4">
              <div className="flex gap-2 rounded-full bg-bg-base p-1">
                {themeOptions.map((option) => {
                  const active = theme === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setTheme(option.key)}
                      className={`flex-1 rounded-full px-3 py-2 text-[14px] ${active ? 'bg-bg-card text-text-main shadow-soft' : 'text-text-sub'}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] bg-bg-card shadow-soft">
            <div className="px-4 py-4 text-[16px] font-medium text-text-main">账号安全</div>
            {renderRow('修改登录密码', () => goTo('change_password'), '修改后需要重新登录', <Shield size={18} />)}
            <div className="border-t border-border-light" />
            {renderRow('修改支付密码', () => goTo('change_pay_password'), '修改支付验证密码', <Shield size={18} />)}
            <div className="border-t border-border-light" />
            {renderRow('验证码重置登录密码', () => goTo('reset_password'), '通过短信验证码重置登录密码', <Shield size={18} />)}
          </section>

          <section className="overflow-hidden rounded-[24px] bg-bg-card shadow-soft">
            {renderRow('账号与安全', () => goTo('security'), '查看绑定手机和密码入口', <Shield size={18} />)}
            <div className="border-t border-border-light" />
            {renderRow('清理缓存', clearCache, `当前缓存 ${cacheSize}`, <Trash2 size={18} />)}
            <div className="border-t border-border-light" />
            {renderRow('关于我们', () => goTo('about'), formatVersionLabel(CURRENT_APP_VERSION))}
          </section>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex h-[48px] w-full items-center justify-center rounded-[24px] bg-bg-card text-[16px] font-medium text-text-main shadow-soft"
          >
            退出登录
          </button>
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

