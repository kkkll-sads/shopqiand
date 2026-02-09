/**
 * Settings - 设置页面
 *
 * 使用 PageContainer、ListItem 组件
 * 使用 React Router + useNavigate 进行导航
 * 集成版本检查功能
 *
 * @author 树交所前端团队
 * @version 3.0.0 - 迁移到新路由系统
 */

import React, { useState } from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { ListItem, UpdatePromptModal } from '@/components/common';
import { normalizeAssetUrl, checkAppUpdate } from '@/services';
import { formatPhone } from '@/utils/format';
import { AppVersionInfo } from '@/services/app';
import { APP_VERSION } from '@/constants';
import { extractData, extractError } from '@/utils/apiHelpers';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { debugLog, errorLog } from '@/utils/logger';

/**
 * Settings 设置页面组件
 */
const Settings: React.FC = () => {
  const navigate = useNavigate();
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
          debugLog('Settings', '已是最新版本');
        }
      } else {
        errorLog('Settings', '检查更新失败', extractError(response));
      }
    } catch (error) {
      errorLog('Settings', '检查更新出错', error);
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
    navigate('/login', { replace: true });
  };

  return (
    <PageContainer title="设置" onBack={() => navigate(-1)} bgColor="bg-gray-50" padding={false}>
      {/* 用户信息卡片 */}
      <div className="bg-white mt-2 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-lg font-bold text-red-600 overflow-hidden">
            {displayAvatarUrl ? (
              <img src={displayAvatarUrl} alt="用户头像" className="w-full h-full object-cover" />
            ) : (
              displayAvatarText
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900">{displayName}</span>
            {displayMobile && displayMobile !== '-' && (
              <span className="text-xs text-gray-400 mt-0.5">手机号：{displayMobile}</span>
            )}
          </div>
        </div>
        <button
          className="flex items-center text-xs text-red-600 font-medium active:opacity-70"
          onClick={() => navigate('/edit-profile')}
        >
          编辑
          <ChevronRight size={16} className="ml-0.5" />
        </button>
      </div>

      {/* 设置列表 */}
      <div className="mt-3 bg-white">
        <ListItem title="重置登录密码" onClick={() => navigate('/reset-login-password')} />
        <ListItem title="重置支付密码" onClick={() => navigate('/reset-pay-password')} />
        <ListItem title="新消息通知" onClick={() => navigate('/notification-settings')} />
        <ListItem title="账户注销" onClick={() => navigate('/account-deletion')} />
      </div>

      {/* 版本和政策 */}
      <div className="mt-3 bg-white">
        <ListItem
          title="当前版本号"
          extra={
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">{APP_VERSION}</span>
              {isCheckingUpdate && <RefreshCw size={14} className="text-red-600 animate-spin" />}
            </div>
          }
          onClick={handleCheckUpdate}
          arrow={!isCheckingUpdate}
        />
        <ListItem title="隐私政策" onClick={() => navigate('/privacy-policy')} />
        <ListItem title="关于我们" onClick={() => navigate('/about-us')} />
      </div>

      {/* 退出登录按钮 */}
      <div className="mt-8 px-4">
        <button
          className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-red-200"
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
