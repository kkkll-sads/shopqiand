/**
 * EditProfile - 编辑资料页面（新路由系统版）
 * 
 * ✅ 已迁移：使用 usePageNavigation 替代 Props
 * 
 * @author 树交所前端团队
 * @version 3.0.0（新路由版）
 * @refactored 2026-01-14
 */

import React, { useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import { uploadImage, updateAvatar, updateNickname } from '../../../services/api';
import { getStoredToken } from '../../../services/client';
import { useAuthStore } from '../../stores/authStore';
import { UserInfo } from '../../../types';
import { useNotification } from '../../../context/NotificationContext';
import { usePageNavigation } from '../../hooks/usePageNavigation';

/**
 * EditProfile 编辑资料页面组件
 */
const EditProfile: React.FC = () => {
  const { goBack, onLogout } = usePageNavigation();
  const { showToast } = useNotification();
  // 从 authStore 获取用户信息
  const cachedUser = useAuthStore((state) => state.user);

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
      goBack();
      return;
    }

    const finalNickname = nickname.trim() || userInfo.nickname;
    setSaving(true);

    try {
      const res = await updateNickname({
        nickname: finalNickname,
        token: userInfo.token || getStoredToken() || '',
      });

      const updated: UserInfo = {
        ...userInfo,
        nickname: finalNickname,
      };

      setUserInfo(updated);
      useAuthStore.getState().updateUser(updated);
      showToast('success', res?.msg || '保存成功');
      goBack();
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

      const token = userInfo.token || getStoredToken() || '';

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
      useAuthStore.getState().updateUser(updatedUser);
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
    <PageContainer title="编辑资料" onBack={goBack} bgColor="bg-gray-100" padding={false}>
      {/* 表单区域 */}
      <div className="bg-white mt-2 px-4">
        {/* 头像行 */}
        <button
          className="w-full py-4 flex items-center justify-between border-b border-gray-100 active:opacity-70 disabled:opacity-50"
          onClick={handleAvatarClick}
          disabled={avatarUploading}
        >
          <span className="text-base text-gray-800">头像</span>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 overflow-hidden flex items-center justify-center text-lg font-bold text-orange-600">
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
            <ChevronRight size={18} className="text-gray-300" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />

        {/* 昵称行 */}
        <div className="py-4 flex items-center border-b border-gray-100">
          <span className="text-base text-gray-800 w-20">昵称</span>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="请输入昵称"
            className="flex-1 text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
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
