/**
 * InviteFriends - 邀请好友页面
 * 
 * 使用 PageContainer、LoadingSpinner 组件重构
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */


import React, { useState, useEffect } from 'react';
import { Copy, Share2 } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { LoadingSpinner } from '../../components/common';
import { fetchPromotionCard, AUTH_TOKEN_KEY } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { isSuccess, extractError } from '../../utils/apiHelpers';

/**
 * InviteFriends 组件属性接口
 */
interface InviteFriendsProps {
    onBack: () => void;
}

/**
 * InviteFriends 邀请好友页面组件
 */
const InviteFriends: React.FC<InviteFriendsProps> = ({ onBack }) => {
    const { showToast } = useNotification();
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * 根据邀请码构建注册链接
     */
    const buildInviteLink = (code: string) => {
        if (!code) return '';
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}/register?invite_code=${encodeURIComponent(code)}`;
    };

    // 加载推广卡信息
    useEffect(() => {
        const loadPromotionCard = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
                if (!token) {
                    setError('请先登录');
                    return;
                }
                const response = await fetchPromotionCard(token);
                if ((isSuccess(response) || response.code === 0) && response.data) {
                    setInviteCode(response.data.invite_code);
                } else {
                    setError(extractError(response, '获取推广卡信息失败'));
                }
            } catch (err: any) {
                console.error('加载推广卡信息失败:', err);
                setError(err.message || '获取推广卡信息失败，请稍后重试');
            } finally {
                setLoading(false);
            }
        };

        loadPromotionCard();
    }, []);

    const inviteLink = buildInviteLink(inviteCode);

    /**
     * 复制到剪贴板
     */
    const copyToClipboard = async (text: string, type: 'code' | 'link') => {
        try {
            await navigator.clipboard.writeText(text);
            showToast('success', `${type === 'code' ? '邀请码' : '链接'}已复制!`);
        } catch (err) {
            console.error('Failed to copy:', err);
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast('success', `${type === 'code' ? '邀请码' : '链接'}已复制!`);
            } catch (err) {
                console.error('Fallback copy failed', err);
                showToast('error', '复制失败，请手动复制');
            }
            document.body.removeChild(textArea);
        }
    };

    // 加载状态
    if (loading) {
        return (
            <PageContainer title="邀请好友" onBack={onBack}>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <LoadingSpinner text="加载中..." />
                </div>
            </PageContainer>
        );
    }

    // 错误状态
    if (error) {
        return (
            <PageContainer title="邀请好友" onBack={onBack}>
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
        <PageContainer title="邀请好友" onBack={onBack}>
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
                    <p className="text-gray-500 text-sm text-center font-medium">
                        扫码注册，加入我们
                    </p>
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
                    <span>分享链接</span>
                </button>
            </div>
        </PageContainer>
    );
};

export default InviteFriends;
