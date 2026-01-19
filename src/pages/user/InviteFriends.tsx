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
import PageContainer from '../../../components/layout/PageContainer';
import { LoadingSpinner } from '../../../components/common';
import { fetchPromotionCard } from '../../../services/api';
import { getStoredToken } from '../../../services/client';
import { useNotification } from '../../../context/NotificationContext';
import { extractData, extractError } from '../../../utils/apiHelpers';
import { useNavigate } from 'react-router-dom';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '../../../types/states';

/**
 * InviteFriends 邀请好友页面组件
 */
const InviteFriends: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });
  const loading = loadMachine.state === LoadingState.LOADING;

  /**
   * 根据邀请码构建注册链接
   */
  const buildInviteLink = (code: string) => {
    if (!code) return '';
    const origin = 'http://172.20.10.2:5657';
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
          console.log('后端返回的invite_link:', backendLink);
          console.log('前端构建的invite_link:', frontendLink);
          // 优先使用后端返回的链接，如果后端没有返回则使用前端构建的链接
          const finalLink = backendLink && backendLink.trim() ? backendLink : frontendLink;
          console.log('使用后端返回链接:', finalLink === backendLink);
          setInviteLink(finalLink);
          loadMachine.send(LoadingEvent.SUCCESS);
        } else {
          setError(extractError(response, '获取推广卡信息失败'));
          loadMachine.send(LoadingEvent.ERROR);
        }
      } catch (err: any) {
        console.error('加载推广卡信息失败:', err);
        setError(err.message || '获取推广卡信息失败，请稍后重试');
        loadMachine.send(LoadingEvent.ERROR);
      } finally {
        // 状态机已处理成功/失败
      }
    };

    loadPromotionCard();
  }, []);

  /**
   * 复制到剪贴板
   */
  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    console.log('Attempting to copy:', { text: text.substring(0, 50) + '...', type });

    if (!text || text.trim() === '') {
      console.error('Copy failed: text is empty');
      showToast('error', '内容为空，无法复制');
      return false;
    }

    // 方法0: 如果是移动设备，优先使用原生分享API
    if (navigator.share && type === 'link') {
      try {
        console.log('Using native share API');
        await navigator.share({
          title: '邀请好友',
          text: '加入我们一起投资文创资产！',
          url: text,
        });
        console.log('Native share success');
        showToast('success', '分享成功!');
        return;
      } catch (err: any) {
        console.log('Native share cancelled or failed:', err);
        // 用户取消分享，继续使用复制方法
      }
    }

    // 方法1: 尝试使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        console.log('Using modern Clipboard API');

        // 在某些浏览器中需要用户权限
        if (navigator.permissions) {
          try {
            const permission = await navigator.permissions.query({
              name: 'clipboard-write' as PermissionName,
            });
            console.log('Clipboard permission:', permission.state);
            if (permission.state === 'denied') {
              console.warn('Clipboard permission denied');
            }
          } catch (permErr) {
            console.log('Could not check clipboard permission');
          }
        }

        await navigator.clipboard.writeText(text);
        console.log('Modern clipboard API success');
        showToast('success', `${type === 'code' ? '邀请码' : '链接'}已复制!`);
        return;
      } catch (err: any) {
        console.warn('Modern clipboard API failed:', err);
      }
    } else {
      console.warn('Modern clipboard API not available');
    }

    // 方法2: 降级方案 - 使用传统方法
    try {
      console.log('Using fallback method');

      // 创建隐藏的文本区域
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'absolute';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.style.width = '1px';
      textArea.style.height = '1px';
      textArea.style.opacity = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.resize = 'none';
      textArea.style.overflow = 'hidden';
      textArea.setAttribute('readonly', '');

      // 添加到 body
      document.body.appendChild(textArea);

      // 确保元素在DOM中并可见
      textArea.style.display = 'block';
      textArea.focus({ preventScroll: true });

      // 选择所有文本
      textArea.select();
      textArea.setSelectionRange(0, text.length);

      // 双重检查选择
      if (textArea.selectionStart !== 0 || textArea.selectionEnd !== text.length) {
        console.warn('Selection range incorrect, retrying');
        textArea.setSelectionRange(0, text.length);
      }

      // 执行复制
      const successful = document.execCommand('copy');
      console.log('execCommand result:', successful);

      // 立即清理DOM
      document.body.removeChild(textArea);

      if (successful) {
        console.log('Fallback copy success');
        // 验证复制是否成功
        try {
          const pastedText = await navigator.clipboard.readText();
          if (pastedText === text) {
            console.log('Verification successful: text copied to clipboard');
            showToast('success', `${type === 'code' ? '邀请码' : '链接'}已复制!`);
            return;
          } else {
            console.warn('Verification failed: clipboard content differs');
          }
        } catch (verifyErr) {
          console.log('Could not verify clipboard content, assuming success');
          // 如果无法验证，假设复制成功
          showToast('success', `${type === 'code' ? '邀请码' : '链接'}已复制!`);
          return;
        }
      }

      // 如果execCommand失败或验证失败，显示手动复制界面
      throw new Error('execCommand failed');
    } catch (err: any) {
      console.error('Fallback copy failed:', err);
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
            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg"
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
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#FFD6A5]/30 to-transparent pointer-events-none" />

        {/* 二维码区域 */}
        <div className="relative bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center w-full max-w-xs mb-8 z-10 border border-orange-100">
          <div className="w-56 h-56 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 overflow-hidden p-2">
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
            onClick={() => copyToClipboard(inviteCode, 'code')}
            className="bg-white border border-orange-200 rounded-2xl p-5 flex items-center justify-between active:bg-orange-50 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <span className="text-3xl font-bold text-gray-800 tracking-widest font-mono">
              {inviteCode}
            </span>
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <Copy size={22} />
            </div>
          </div>
        </div>

        {/* 分享按钮 */}
        <button
          onClick={() => {
            console.log('Share button clicked, inviteLink:', inviteLink);
            if (inviteLink) {
              copyToClipboard(inviteLink, 'link');
            } else {
              showToast('warning', '邀请码加载中，请稍后再试');
            }
          }}
          disabled={!inviteLink}
          className="w-full max-w-xs bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 flex items-center justify-center gap-3 active:scale-95 transition-transform z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Share2 size={22} />
          <span>{navigator.share ? '分享' : '分享链接'}</span>
        </button>
      </div>
    </PageContainer>
  );
};

export default InviteFriends;
