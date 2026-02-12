/**
 * InviteFriends - 邀请好友页面（新路由系统版）
 *
 * ✅ 已迁移：使用 React Router + useNavigate
 *
 * @author 树交所前端团队
 * @version 3.0.0（新路由版）
 * @refactored 2026-01-14
 */

import React, { useState, useEffect } from 'react';
import { Copy, Share2 } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { LoadingSpinner } from '@/components/common';
import { fetchPromotionCard } from '@/services';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { extractData, extractError } from '@/utils/apiHelpers';
import { useNavigate } from 'react-router-dom';
import { useLoadingMachine, LoadingEvent, LoadingState } from '@/hooks';
import { debugLog, errorLog } from '@/utils/logger';
import { copyToClipboard } from '@/utils/clipboard';

/**
 * InviteFriends 邀请好友页面组件
 */
const InviteFriends: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loadMachine = useLoadingMachine();
  const loading = loadMachine.state === LoadingState.LOADING;

  /**
   * 根据邀请码构建注册链接
   */
  const buildInviteLink = (code: string) => {
    if (!code) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (!origin) return `/register?invite_code=${encodeURIComponent(code)}`;
    return `${origin}/register?invite_code=${encodeURIComponent(code)}`;
  };

  // 加载推广卡信息
  useEffect(() => {
    const loadPromotionCard = async () => {
      try {
        loadMachine.send(LoadingEvent.LOAD);
        setError(null);
        const token = getStoredToken() || '';
        if (!token) {
          setError('请先登录');
          loadMachine.send(LoadingEvent.ERROR);
          return;
        }
        const response = await fetchPromotionCard(token);
        const data = extractData(response);
        if (data) {
          setInviteCode(data.invite_code);
          const backendLink = data.invite_link;
          const frontendLink = buildInviteLink(data.invite_code);
          debugLog('InviteFriends', '后端返回的invite_link', backendLink);
          debugLog('InviteFriends', '前端构建的invite_link', frontendLink);
          // 优先使用后端返回的链接，如果后端没有返回则使用前端构建的链接
          const finalLink = backendLink && backendLink.trim() ? backendLink : frontendLink;
          debugLog('InviteFriends', '使用后端返回链接', finalLink === backendLink);
          setInviteLink(finalLink);
          loadMachine.send(LoadingEvent.SUCCESS);
        } else {
          setError(extractError(response, '获取推广卡信息失败'));
          loadMachine.send(LoadingEvent.ERROR);
        }
      } catch (err: any) {
        errorLog('InviteFriends', '加载推广卡信息失败', err);
        setError(err.message || '获取推广卡信息失败，请稍后重试');
        loadMachine.send(LoadingEvent.ERROR);
      } finally {
        // 状态机已处理成功/失败
      }
    };

    loadPromotionCard();
  }, []);

  /**
   * 复制到剪贴板（支持原生分享）
   */
  const handleCopy = async (text: string, type: 'code' | 'link') => {
    debugLog('InviteFriends', 'Attempting to copy', { text: text.substring(0, 50) + '...', type });

    if (!text || text.trim() === '') {
      errorLog('InviteFriends', 'Copy failed: text is empty');
      showToast('error', '内容为空，无法复制');
      return;
    }

    // 如果是移动设备，优先使用原生分享API
    if (navigator.share && type === 'link') {
      try {
        debugLog('InviteFriends', 'Using native share API');
        await navigator.share({
          title: '邀请好友',
          text: '加入我们一起投资文创资产！',
          url: text,
        });
        debugLog('InviteFriends', 'Native share success');
        showToast('success', '分享成功!');
        return;
      } catch (err: any) {
        debugLog('InviteFriends', 'Native share cancelled or failed', err);
        // 用户取消分享，继续使用复制方法
      }
    }

    // 使用统一的剪贴板工具函数
    const success = await copyToClipboard(text);
    if (success) {
      showToast('success', `${type === 'code' ? '邀请码' : '链接'}已复制!`);
    } else {
      showToast('error', '复制失败，请重试或手动复制');
    }
  };

  // 加载状态
  if (loading) {
    return (
      <PageContainer title="邀请好友" onBack={() => navigate(-1)}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner text="加载中..." />
        </div>
      </PageContainer>
    );
  }

  // 错误状态
  if (error) {
    return (
      <PageContainer title="邀请好友" onBack={() => navigate(-1)}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="text-red-500 text-center px-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg"
          >
            重试
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="邀请好友" onBack={() => navigate(-1)}>
      <div className="relative min-h-[70vh] flex flex-col items-center">
        {/* 顶部渐变背景 */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-red-100/30 to-transparent pointer-events-none" />

        {/* 二维码区域 */}
        <div className="relative bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center w-full max-w-xs mb-8 z-10 border border-red-100">
          <div className="w-56 h-56 bg-red-50 rounded-2xl flex items-center justify-center mb-6 overflow-hidden p-2">
            {inviteLink && (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`}
                alt="邀请二维码"
                className="w-full h-full object-cover rounded-xl mix-blend-multiply"
              />
            )}
          </div>
          <p className="text-gray-500 text-sm text-center font-medium">扫码注册，加入我们</p>
        </div>

        {/* 邀请码区域 */}
        <div className="w-full max-w-xs mb-10 z-10">
          <div className="text-sm text-gray-500 mb-3 font-medium ml-2">我的邀请码</div>
          <div
            onClick={() => handleCopy(inviteCode, 'code')}
            className="bg-white border border-red-200 rounded-2xl p-5 flex items-center justify-between active:bg-red-50 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <span className="text-3xl font-bold text-gray-800 tracking-widest font-mono">
              {inviteCode}
            </span>
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Copy size={22} />
            </div>
          </div>
        </div>

        {/* 分享按钮 */}
        <button
          onClick={() => {
            debugLog('InviteFriends', 'Share button clicked', { inviteLink });
            if (inviteLink) {
              handleCopy(inviteLink, 'link');
            } else {
              showToast('warning', '邀请码加载中，请稍后再试');
            }
          }}
          disabled={!inviteLink}
          className="w-full max-w-xs bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-red-200 flex items-center justify-center gap-3 active:scale-95 transition-transform z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Share2 size={22} />
          <span>{navigator.share ? '分享' : '分享链接'}</span>
        </button>
      </div>
    </PageContainer>
  );
};

export default InviteFriends;
