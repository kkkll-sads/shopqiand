/**
 * Settings - 设置页面
 *
 * 使用 PageContainer、ListItem 组件
 * 使用 usePageNavigation Hook 进行导航
 * 集成版本检查功能
 *
 * @author 树交所前端团队
 * @version 3.0.0 - 迁移到新路由系统
 */

import React, { useMemo, useState } from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import { ListItem, UpdatePromptModal } from '../../../components/common';
import { normalizeAssetUrl, checkAppUpdate } from '../../../services/api';
import { UserInfo } from '../../../types';
import { formatPhone } from '../../../utils/format';
import { AppVersionInfo } from '../../../services/app';
import { APP_VERSION } from '../../../constants';
import { usePageNavigation } from '../../hooks/usePageNavigation';
import { useAuthStore } from '../../stores/authStore';

/**
 * Settings 设置页面组件
 */
const Settings: React.FC = () => {
  const { goBack, navigateTo } = usePageNavigation();
  const { logout } = useAuthStore();

  // 版本检查相关状态
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);

  // 从 authStore 获取用户信息
  const userInfo = useAuthStore((state) => state.user);

  const displayName = userInfo?.nickname || userInfo?.username || '用户';
  const displayAvatarText = displayName.slice(0, 1).toUpperCase();
  const displayAvatarUrl = normalizeAssetUrl(userInfo?.avatar);
  const displayMobile = formatPhone(userInfo?.mobile);

  /**
   * 检查应用版本更新
   */
  const handleCheckUpdate = async () => {
    if (isCheckingUpdate) return;

    setIsCheckingUpdate(true);
    try {
      const platform = 'android';
      const currentVersion = APP_VERSION;

      const response = await checkAppUpdate({
        platform,
        current_version: currentVersion,
      });

      const data = extractData(response);
      if (data) {
        if (data.need_update && data.data) {
          setVersionInfo(data.data);
          setUpdateModalVisible(true);
        } else {
          console.log('已是最新版本');
        }
      } else {
        console.error('检查更新失败:', extractError(response));
      }
    } catch (error) {
      console.error('检查更新出错:', error);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleUpdateConfirm = () => {
    setUpdateModalVisible(false);
    setVersionInfo(null);
  };

  const handleUpdateCancel = () => {
    setUpdateModalVisible(false);
    setVersionInfo(null);
  };

  /**
   * 处理退出登录
   */
  const handleLogout = () => {
    logout();
    navigateTo('login', undefined, { replace: true });
  };

  return (
    <PageContainer title="设置" onBack={goBack} bgColor="bg-gray-100" padding={false}>
      {/* 用户信息卡片 */}
      <div className="bg-white mt-2 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-yellow-200 flex items-center justify-center text-lg font-bold text-yellow-700 overflow-hidden">
            {displayAvatarUrl ? (
              <img src={displayAvatarUrl} alt="用户头像" className="w-full h-full object-cover" />
            ) : (
              displayAvatarText
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{displayName}</span>
            {displayMobile && displayMobile !== '-' && (
              <span className="text-xs text-gray-400 mt-0.5">手机号：{displayMobile}</span>
            )}
          </div>
        </div>
        <button
          className="flex items-center text-xs text-gray-500 active:opacity-70"
          onClick={() => navigateTo('edit-profile')}
        >
          编辑
          <ChevronRight size={16} className="ml-0.5" />
        </button>
      </div>

      {/* 设置列表 */}
      <div className="mt-3 bg-white">
        <ListItem
          title="重置登录密码"
          onClick={() => navigateTo('reset-login-password', { from: 'settings' })}
        />
        <ListItem
          title="重置支付密码"
          onClick={() => navigateTo('reset-pay-password', { from: 'settings' })}
        />
        <ListItem
          title="新消息通知"
          onClick={() => navigateTo('notification-settings', { from: 'settings' })}
        />
        <ListItem
          title="账户注销"
          onClick={() => navigateTo('account-deletion', { from: 'settings' })}
        />
      </div>

      {/* 版本和政策 */}
      <div className="mt-3 bg-white">
        <ListItem
          title="当前版本号"
          extra={
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">{APP_VERSION}</span>
              {isCheckingUpdate && <RefreshCw size={14} className="text-gray-400 animate-spin" />}
            </div>
          }
          onClick={handleCheckUpdate}
          arrow={!isCheckingUpdate}
        />
        <ListItem
          title="隐私政策"
          onClick={() => navigateTo('privacy-policy', { from: 'settings' })}
        />
        <ListItem
          title="关于我们"
          onClick={() => navigateTo('about-us', { from: 'settings' })}
        />
      </div>

      {/* 退出登录按钮 */}
      <div className="mt-8 px-4">
        <button
          className="w-full bg-orange-500 text-white text-sm font-semibold py-3 rounded-md active:opacity-80 shadow-sm"
          onClick={handleLogout}
        >
          退出登录
        </button>
      </div>

      {/* 版本更新提示模态框 */}
      <UpdatePromptModal
        visible={updateModalVisible}
        versionInfo={versionInfo!}
        onCancel={handleUpdateCancel}
        onConfirm={handleUpdateConfirm}
      />
    </PageContainer>
  );
};

export default Settings;
