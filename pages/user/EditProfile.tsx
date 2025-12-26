/**
 * EditProfile - 编辑资料页面
 * 
 * 使用 PageContainer 布局组件重构
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */


import React, { useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { AUTH_TOKEN_KEY, USER_INFO_KEY, uploadImage, updateAvatar, updateNickname } from '../../services/api';
import { UserInfo } from '../../types';
import { useNotification } from '../../context/NotificationContext';

/**
 * EditProfile 组件属性接口
 */
interface EditProfileProps {
  onBack: () => void;
  onLogout: () => void;
}

/**
 * EditProfile 编辑资料页面组件
 */
const EditProfile: React.FC<EditProfileProps> = ({ onBack, onLogout }) => {
  const { showToast } = useNotification();
  // 从本地存储获取用户信息
  const cachedUser: UserInfo | null = useMemo(() => {
    try {
      const cached = localStorage.getItem(USER_INFO_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.warn('解析本地用户信息失败:', e);
      return null;
    }
  }, []);

  const [userInfo, setUserInfo] = useState<UserInfo | null>(cachedUser);
  const [nickname, setNickname] = useState<string>(cachedUser?.nickname || cachedUser?.username || '');
  const [avatarPreview, setAvatarPreview] = useState<string>(cachedUser?.avatar || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = nickname || userInfo?.nickname || userInfo?.username || '用户';
  const displayAvatarText = displayName.slice(0, 1).toUpperCase();

  /**
   * 保存昵称
   */
  const handleSave = async () => {
    if (!userInfo) {
      onBack();
      return;
    }

    const finalNickname = nickname.trim() || userInfo.nickname;
    setSaving(true);

    try {
      const res = await updateNickname({
        nickname: finalNickname,
        token: userInfo.token || localStorage.getItem(AUTH_TOKEN_KEY) || '',
      });

      const updated: UserInfo = {
        ...userInfo,
        nickname: finalNickname,
      };

      setUserInfo(updated);
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(updated));
      showToast('success', res?.msg || '保存成功');
      onBack();
    } catch (error: any) {
      console.error('昵称更新失败:', error);
      showToast('error', '保存失败', error?.message || '昵称保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  /**
   * 点击头像触发文件选择
   */
  const handleAvatarClick = () => {
    if (!userInfo) {
      showToast('warning', '请先登录', '请先登录后再修改头像');
      return;
    }
    fileInputRef.current?.click();
  };

  /**
   * 处理头像文件变化
   */
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !userInfo) {
      event.target.value = '';
      return;
    }

    setAvatarUploading(true);

    try {
      const uploadRes = await uploadImage(file);
      const avatarPath =
        uploadRes.data?.url ||
        uploadRes.data?.path ||
        uploadRes.data?.filepath ||
        '';
      const avatarUrl =
        uploadRes.data?.fullurl ||
        uploadRes.data?.fullUrl ||
        uploadRes.data?.url ||
        '';

      if (!avatarPath && !avatarUrl) {
        throw new Error('上传返回结果为空，请重试');
      }

      const token = userInfo.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';

      const avatarRes = await updateAvatar({
        avatar: avatarPath || avatarUrl,
        avatar_url: avatarUrl,
        token,
      });

      const updatedUser: UserInfo = {
        ...userInfo,
        avatar: avatarUrl || avatarPath,
      };

      setUserInfo(updatedUser);
      setAvatarPreview(updatedUser.avatar || '');
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(updatedUser));
      showToast('success', avatarRes?.msg || '头像更新成功');
    } catch (error: any) {
      console.error('修改头像失败:', error);
      showToast('error', '修改失败', error?.message || '头像修改失败，请稍后重试');
    } finally {
      setAvatarUploading(false);
      event.target.value = '';
    }
  };

  return (
    <PageContainer title="编辑资料" onBack={onBack} bgColor="bg-gray-100" padding={false}>
      {/* 头像行 */}
      <div className="bg-white mt-2">
        <button
          className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-50 disabled:opacity-50"
          onClick={handleAvatarClick}
          disabled={avatarUploading}
        >
          <span className="text-sm text-gray-800">头像</span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-200 overflow-hidden flex items-center justify-center text-base font-bold text-orange-700">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="用户头像"
                  className="w-full h-full object-cover"
                />
              ) : (
                displayAvatarText
              )}
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* 昵称行 */}
      <div className="bg-white mt-2">
        <div className="px-4 py-3 flex items-center border-t border-gray-100">
          <span className="text-sm text-gray-800 w-14">昵称</span>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="请输入昵称"
            className="flex-1 text-sm text-gray-900 outline-none bg-transparent"
          />
        </div>
      </div>

      {/* 按钮区域 */}
      <div className="mt-8 px-4 space-y-3">
        <button
          className="w-full bg-orange-500 text-white text-sm font-semibold py-3 rounded-md active:opacity-80 shadow-sm disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存'}
        </button>
        <button
          className="w-full bg-white text-orange-500 border border-orange-400 text-sm font-semibold py-3 rounded-md active:bg-orange-50"
          onClick={onLogout}
        >
          退出登录
        </button>
      </div>
    </PageContainer>
  );
};

export default EditProfile;
