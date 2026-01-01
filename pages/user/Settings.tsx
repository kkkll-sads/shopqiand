/**
 * Settings - 设置页面
 * 
 * 使用 PageContainer、ListItem 组件重构
 * 使用 formatPhone 工具函数
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */

import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { ListItem } from '../../components/common';
import { USER_INFO_KEY, normalizeAssetUrl } from '../../services/api';
import { UserInfo } from '../../types';
import { formatPhone } from '../../utils/format';
import { Route } from '../../router/routes';

/**
 * Settings 组件属性接口
 */
interface SettingsProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigate: (route: Route) => void;
}

/**
 * Settings 设置页面组件
 */
const Settings: React.FC<SettingsProps> = ({ onBack, onLogout, onNavigate }) => {
  // 从本地存储获取用户信息
  const userInfo: UserInfo | null = useMemo(() => {
    try {
      const cached = localStorage.getItem(USER_INFO_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.warn('解析本地用户信息失败:', e);
      return null;
    }
  }, []);

  const displayName = userInfo?.nickname || userInfo?.username || '用户';
  const displayAvatarText = displayName.slice(0, 1).toUpperCase();
  const displayAvatarUrl = normalizeAssetUrl(userInfo?.avatar);
  const displayMobile = formatPhone(userInfo?.mobile);

  return (
    <PageContainer title="设置" onBack={onBack} bgColor="bg-gray-100" padding={false}>
      {/* 用户信息卡片 */}
      <div className="bg-white mt-2 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-yellow-200 flex items-center justify-center text-lg font-bold text-yellow-700 overflow-hidden">
            {displayAvatarUrl ? (
              <img
                src={displayAvatarUrl}
                alt="用户头像"
                className="w-full h-full object-cover"
              />
            ) : (
              displayAvatarText
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{displayName}</span>
            {displayMobile && displayMobile !== '-' && (
              <span className="text-xs text-gray-400 mt-0.5">
                手机号：{displayMobile}
              </span>
            )}
          </div>
        </div>
        <button
          className="flex items-center text-xs text-gray-500 active:opacity-70"
          onClick={() => onNavigate({ name: 'edit-profile' })}
        >
          编辑
          <ChevronRight size={16} className="ml-0.5" />
        </button>
      </div>

      {/* 设置列表 */}
      <div className="mt-3 bg-white">
        <ListItem
          title="重置登录密码"
          onClick={() => onNavigate({ name: 'reset-login-password', from: 'settings' })}
        />
        <ListItem
          title="重置支付密码"
          onClick={() => onNavigate({ name: 'reset-pay-password', from: 'settings' })}
        />
        <ListItem
          title="新消息通知"
          onClick={() => onNavigate({ name: 'notification-settings' })}
        />
        <ListItem
          title="账户注销"
          onClick={() => onNavigate({ name: 'account-deletion' })}
        />
      </div>

      {/* 版本和政策 */}
      <div className="mt-3 bg-white">
        <ListItem
          title="当前版本号"
          extra={<span className="text-gray-400 text-xs">2.2.1</span>}
          arrow={false}
        />
        <ListItem
          title="隐私政策"
          onClick={() => onNavigate({ name: 'privacy-policy', from: 'settings' })}
        />
        <ListItem
          title="关于我们"
          onClick={() => onNavigate({ name: 'about-us', from: 'settings' })}
        />
      </div>

      {/* 退出登录按钮 */}
      <div className="mt-8 px-4">
        <button
          className="w-full bg-orange-500 text-white text-sm font-semibold py-3 rounded-md active:opacity-80 shadow-sm"
          onClick={onLogout}
        >
          退出登录
        </button>
      </div>
    </PageContainer>
  );
};

export default Settings;
