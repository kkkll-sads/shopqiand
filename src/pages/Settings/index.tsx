/**
 * @file Settings/index.tsx
 * @description 应用设置页面，包括主题切换、缓存清理、账户安全、注销与退出登录。
 */

import { useState } from 'react';
import { Check, Info, LogOut, Moon, Shield, Sun, Trash2, Type, User } from 'lucide-react';
import {
  SettingsActionItem,
  SettingsSection,
} from '../../components/biz/settings/SettingsSection';
import { PageHeader } from '../../components/layout/PageHeader';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import type { FontScale } from '../../contexts/FontScaleContext';
import { useFontScale } from '../../contexts/FontScaleContext';
import { useTheme } from '../../contexts/ThemeContext';
import { clearAuthSession } from '../../lib/auth';
import { CURRENT_APP_VERSION, formatVersionLabel } from '../../lib/appVersion';
import { clearRequestCache } from '../../hooks/useRequest';
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

const FONT_SCALE_STORAGE_KEY = 'app-font-scale';

const FONT_SCALE_PREVIEW_CLASS: Record<FontScale, string> = {
  normal: 'text-base',
  large: 'text-lg',
  xlarge: 'text-xl',
  xxlarge: 'text-2xl',
};

const FONT_SCALE_OPTIONS: Array<{ value: FontScale; label: string }> = [
  { value: 'normal', label: '标准' },
  { value: 'large', label: '大' },
  { value: 'xlarge', label: '特大' },
  { value: 'xxlarge', label: '超大' },
];

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' },
];

export const SettingsPage = () => {
  const { goBack, goTo } = useAppNavigate();
  const { showToast } = useFeedback();
  const { theme, isDark, setTheme } = useTheme();
  const { fontScale, setFontScale } = useFontScale();
  const scaleLabel = FONT_SCALE_OPTIONS.find((option) => option.value === fontScale)?.label ?? '标准';

  const [cacheSize, setCacheSize] = useState(() => readCacheSizeLabel());
  const [showFontScaleSheet, setShowFontScaleSheet] = useState(false);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearCache = () => {
    try {
      const keysToKeep = [
        'member_auth_session',
        'access_token',
        'ba-token',
        'ba-user-token',
        'app-theme',
        FONT_SCALE_STORAGE_KEY,
      ];
      const keysToRemove: string[] = [];

      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key && !keysToKeep.includes(key)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      sessionStorage.clear();
      clearRequestCache();
    } catch {
      // Ignore cache cleanup failures.
    }

    setCacheSize('0KB');
    showToast({ message: '缓存清理成功', type: 'success' });
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

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="设置" onBack={goBack} />
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="space-y-4">

          <SettingsSection>
            <div className="border-b border-border-light/80 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-bg-base text-text-sub">
                  {isDark ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg text-text-main">外观模式</div>
                  <div className="mt-1 text-s leading-5 text-text-sub">浅色、深色或跟随系统</div>
                </div>
                <div className="text-sm text-text-aux">{theme === 'system' ? '跟随系统' : isDark ? '深色生效' : '浅色生效'}</div>
              </div>
              <div className="mt-3 rounded-2xl bg-bg-base p-1">
                <div className="grid grid-cols-3 gap-1">
                  {THEME_OPTIONS.map((option) => {
                    const active = theme === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`rounded-xl px-2 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-bg-card text-text-main shadow-soft'
                            : 'text-text-sub active:bg-bg-hover'
                        }`}
                        onClick={() => setTheme(option.value)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <SettingsActionItem
              label="编辑资料"
              description="修改 APP 昵称和头像"
              icon={<User size={18} />}
              onClick={() => goTo('edit_profile')}
            />
            <SettingsActionItem
              label="账户与安全"
              description="查看绑定手机号、密码和安全说明"
              icon={<Shield size={18} />}
              onClick={() => goTo('security')}
            />
            <SettingsActionItem
              label="字体大小"
              description="调整全局文字显示大小"
              icon={<Type size={18} />}
              value={scaleLabel}
              variant="secondary"
              onClick={() => setShowFontScaleSheet(true)}
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
        isOpen={showFontScaleSheet}
        onClose={() => setShowFontScaleSheet(false)}
        title="字体大小"
        groups={[
          {
            options: FONT_SCALE_OPTIONS.map((option) => {
              const isSelected = fontScale === option.value;
              return {
                label: option.label,
                icon: isSelected ? <Check size={18} /> : undefined,
                desc: <span className={FONT_SCALE_PREVIEW_CLASS[option.value]}>字体预览</span>,
                onClick: () => {
                  setFontScale(option.value);
                  setShowFontScaleSheet(false);
                },
              };
            }),
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
