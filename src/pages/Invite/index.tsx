/**
 * @file Invite/index.tsx - 推广名片 / 邀请推广页面
 * @description 展示推广名片卡片：头像、邀请码、二维码、团队数据，支持复制链接、保存图片。
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Copy, Download, Share2 } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { copyToClipboard } from '../../lib/clipboard';
import { teamApi, type PromotionCardData } from '../../api';
import { Skeleton } from '../../components/ui/Skeleton';

export const InvitePage = () => {
  const { goBack } = useAppNavigate();
  const { showToast } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cardData, setCardData] = useState<PromotionCardData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await teamApi.getPromotionCard();
      setCardData(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleCopy = async (text: string, type: string) => {
    const ok = await copyToClipboard(text);
    showToast({ message: ok ? `${type}已复制` : '复制失败，请稍后重试', type: ok ? 'success' : 'error' });
  };

  const handleSaveImage = () => {
    const qrcodeUrl = cardData?.qrcode_url;
    if (qrcodeUrl) {
      window.open(qrcodeUrl, '_blank');
    } else {
      showToast({ message: '请长按二维码图片保存', type: 'info' });
    }
  };

  if (loading) {
    return (
      <div className="relative flex flex-1 flex-col bg-bg-base">
        <div className="flex h-12 items-center justify-between border-b border-border-light bg-white px-4 dark:bg-gray-900">
          <button type="button" onClick={() => goBack()} className="-ml-2 p-2 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
          <span className="text-[17px] font-medium text-text-main">推广名片</span>
          <div className="w-8" />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <Skeleton className="h-[480px] w-full max-w-sm rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex flex-1 flex-col bg-bg-base">
        <div className="flex h-12 items-center border-b border-border-light bg-white px-4 dark:bg-gray-900">
          <button type="button" onClick={() => goBack()} className="-ml-2 p-2 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
          <span className="ml-2 text-[17px] font-medium text-text-main">推广名片</span>
        </div>
        <div className="flex-1">
          <ErrorState onRetry={fetchData} />
        </div>
      </div>
    );
  }

  if (!cardData) return null;

  const { user_info, invite_code, invite_link, qrcode_url, team_count, total_performance } = cardData;
  const displayName = user_info?.nickname || user_info?.username || '邀请您';

  return (
    <div className="relative flex flex-1 flex-col">
      {/* 透明头部 */}
      <div className="absolute left-0 right-0 top-0 z-20 flex h-12 items-center justify-between px-4">
        <button type="button" onClick={() => goBack()} className="-ml-2 p-2 text-white active:opacity-70">
          <ChevronLeft size={24} />
        </button>
        <span className="text-[17px] font-medium text-white">推广名片</span>
        <button type="button" className="-mr-2 p-2 text-white active:opacity-70" aria-label="分享">
          <Share2 size={20} />
        </button>
      </div>

      {/* 渐变背景 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-start via-red-500 to-orange-500" />

      {/* 装饰元素 */}
      <div className="absolute top-20 left-10 z-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-40 right-10 z-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 pt-16">
        {/* 名片卡片 */}
        <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl dark:bg-gray-900">
          {/* 顶部：头像 + 昵称 */}
          <div className="relative flex items-center space-x-4 border-b border-border-light p-6 pb-4">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-[100px] bg-primary-start/5" />
            <div className="relative flex h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white bg-gray-100 shadow-sm dark:bg-gray-800">
              {user_info?.avatar ? (
                <img
                  src={user_info.avatar}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-text-aux">
                  <span className="text-2xl font-bold">{displayName.slice(0, 1)}</span>
                </div>
              )}
            </div>
            <div className="relative z-10">
              <h2 className="mb-1 text-[18px] font-bold text-text-main">{displayName}</h2>
              <div className="text-[12px] text-text-sub">邀请您加入数字藏品平台</div>
            </div>
          </div>

          {/* 中部：二维码 + 邀请码 */}
          <div className="flex flex-1 flex-col items-center justify-center p-8">
            <div className="relative mb-6 flex h-48 w-48 items-center justify-center rounded-xl border border-border-light bg-white p-2 shadow-sm">
              {qrcode_url ? (
                <img
                  src={qrcode_url}
                  alt="邀请二维码"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-text-aux">二维码加载中</div>
              )}
              <img
                src="/img/photo_2025-12-29_21-08-24%20(2).jpg"
                alt="品牌LOGO"
                className="absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-lg object-contain bg-white p-1 shadow-md"
              />
            </div>

            <div className="w-full space-y-2 text-center">
              <div className="text-[13px] text-text-sub">我的邀请码</div>
              <div className="flex items-center justify-center space-x-2 rounded-xl bg-gray-50 py-2 px-4 dark:bg-gray-800">
                <span className="tracking-widest text-[24px] font-bold text-primary-start">{invite_code}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(invite_code, '邀请码')}
                  className="p-1 active:opacity-70"
                  aria-label="复制邀请码"
                >
                  <Copy size={16} className="text-text-aux" />
                </button>
              </div>
            </div>
          </div>

          {/* 底部：团队数据 */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 dark:bg-gray-800">
            <div className="text-center">
              <div className="mb-1 text-[11px] text-text-sub">团队人数</div>
              <div className="text-[16px] font-bold text-text-main">{team_count ?? 0}</div>
            </div>
            <div className="border-l border-border-light text-center">
              <div className="mb-1 text-[11px] text-text-sub">总业绩</div>
              <div className="text-[16px] font-bold text-text-main">
                ¥{Number(total_performance ?? 0).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleCopy(invite_link || '', '邀请链接')}
            className="flex items-center justify-center space-x-2 rounded-full bg-white/20 py-3 font-medium text-white backdrop-blur-md transition-colors active:bg-white/30"
          >
            <Copy size={18} />
            <span>复制链接</span>
          </button>
          <button
            type="button"
            onClick={handleSaveImage}
            className="flex items-center justify-center space-x-2 rounded-full bg-white py-3 font-medium text-primary-start shadow-lg transition-colors active:bg-gray-50"
          >
            <Download size={18} />
            <span>保存图片</span>
          </button>
        </div>
      </div>
    </div>
  );
};
