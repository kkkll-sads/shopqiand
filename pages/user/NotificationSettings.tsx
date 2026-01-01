/**
 * NotificationSettings - 通知设置页面
 * 
 * 使用 PageContainer 布局组件重构
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */

import React, { useEffect, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';

/**
 * NotificationSettings 组件属性接口
 */
interface NotificationSettingsProps {
  onBack: () => void;
}

/**
 * 通知设置键类型
 */
type NotificationSettingKey = 'banner' | 'sound' | 'vibration';

/**
 * 通知设置状态接口
 */
interface NotificationSettingState {
  banner: boolean;
  sound: boolean;
  vibration: boolean;
}

/** 本地存储键名 */
const STORAGE_KEY = 'cat_notification_settings';

/** 默认设置 */
const defaultState: NotificationSettingState = {
  banner: true,
  sound: true,
  vibration: true,
};

/**
 * NotificationSettings 通知设置页面组件
 */
const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onBack }) => {
  // 从本地存储初始化设置
  const [settings, setSettings] = useState<NotificationSettingState>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return { ...defaultState, ...JSON.parse(cached) };
      }
    } catch (error) {
      console.warn('读取通知设置失败:', error);
    }
    return defaultState;
  });

  // 保存设置到本地存储
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('保存通知设置失败:', error);
    }
  }, [settings]);

  /**
   * 切换设置开关
   */
  const toggleSetting = (key: NotificationSettingKey) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * 渲染开关组件
   */
  const renderSwitch = (enabled: boolean) => (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'
        }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${enabled ? 'translate-x-5' : 'translate-x-1'
          }`}
      />
    </span>
  );

  // 设置项列表
  const rows = [
    { key: 'banner' as const, label: '横幅消息通知' },
    { key: 'sound' as const, label: '系统声音' },
    { key: 'vibration' as const, label: '系统震动' },
  ];

  return (
    <PageContainer title="新消息通知" onBack={onBack} padding={false}>
      {/* 设置列表 */}
      <div className="mt-3 bg-white divide-y divide-gray-100">
        {rows.map(({ key, label }) => (
          <button
            key={key}
            className="w-full px-4 py-4 flex items-center justify-between text-sm text-gray-900 active:bg-gray-50"
            onClick={() => toggleSetting(key)}
            aria-pressed={settings[key]}
          >
            <span>{label}</span>
            {renderSwitch(settings[key])}
          </button>
        ))}
      </div>

      {/* 提示文字 */}
      <p className="px-4 pt-4 text-xs text-gray-400 leading-relaxed">
        开启后可第一时间掌握最新交易提醒、活动资讯。您可随时在此处调整通知方式。
      </p>
    </PageContainer>
  );
};

export default NotificationSettings;
