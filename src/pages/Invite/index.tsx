/**
 * @file Invite/index.tsx - 邀请推广页面
 * @description 展示用户专属邀请码、二维码、邀请链接，支持复制、分享、保存图片。
 */

import React, { useState, useEffect } from 'react'; // React 核心 Hook
import { ChevronLeft, WifiOff, Copy, QrCode, Download, Share2, Link as LinkIcon, Image as ImageIcon, MessageCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { copyToClipboard } from '../../lib/clipboard';
import { teamApi, type PromotionCardData } from '../../api';

/**
 * InvitePage - 邀请推广页面
 * 功能：展示邀请码/二维码 → 复制链接 → 分享至微信/朋友圈 → 保存图片
 */
export const InvitePage = () => {
  const { goBack } = useAppNavigate();
  const { showToast } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [cardData, setCardData] = useState<PromotionCardData | null>(null);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [saveError, setSaveError] = useState(false);

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

  const inviteCode = cardData?.invite_code ?? '';
  const inviteLink = cardData?.invite_link ?? '';
  const qrcodeUrl = cardData?.qrcode_url ?? '';

  const handleCopy = async (text: string, type: string) => {
    const ok = await copyToClipboard(text);
    showToast({ message: ok ? `${type}已复制` : '复制失败，请稍后重试', type: ok ? 'success' : 'error' });
  };

  const handleSaveImage = () => {
    if (qrcodeUrl) {
      window.open(qrcodeUrl, '_blank');
    } else {
      setSaveError(true);
    }
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-gray-100 dark:border-gray-800">
      {offline && (
        <div className="bg-red-50 dark:bg-red-900/30 text-brand-start dark:text-red-400 px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-800 rounded shadow-sm">刷新</button>
        </div>
      )}
      <div className="h-12 flex items-center justify-between px-3 pt-safe">
        <div className="flex items-center w-1/3">
          <button onClick={() => goBack()} className="p-1 -ml-1 text-gray-900 dark:text-gray-100 active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center w-1/3">邀请推广</h1>
        <div className="w-1/3" />
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-4 space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm animate-pulse flex flex-col items-center">
        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
        <div className="w-48 h-10 bg-gray-200 dark:bg-gray-800 rounded mb-6" />
        <div className="w-32 h-32 bg-gray-200 dark:bg-gray-800 rounded-xl mb-6" />
        <div className="w-full h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return <ErrorState onRetry={fetchData} />;

    return (
      <div className="p-4 pb-10 space-y-4">

        {/* Invite Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm dark:shadow-none border border-transparent dark:border-gray-800 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-red-50 dark:from-transparent to-transparent" />

          <div className="text-md text-gray-500 dark:text-gray-400 mb-2 relative z-10">我的专属邀请码</div>
          <div className="flex items-center justify-center mb-6 relative z-10">
            <span className="text-7xl font-bold text-brand-start tracking-wider leading-none mr-3">{inviteCode}</span>
            <button
              onClick={() => handleCopy(inviteCode, '邀请码')}
              className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-brand-start active:opacity-70"
            >
              <Copy size={16} />
            </button>
          </div>

          <div className="w-40 h-40 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 mb-6 relative z-10 border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden">
            {qrcodeUrl ? (
              <img src={qrcodeUrl} alt="QR Code" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <QrCode size={120} className="text-gray-800 dark:text-gray-200" strokeWidth={1} />
            )}
          </div>

          <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between relative z-10">
            <div className="flex-1 min-w-0 mr-3">
              <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">专属邀请链接</div>
              <div className="text-base text-gray-900 dark:text-gray-100 truncate">{inviteLink}</div>
            </div>
            <button
              onClick={() => handleCopy(inviteLink, '邀请链接')}
              className="px-4 py-1.5 rounded-full border border-[#FF4142] text-brand-start text-sm font-medium active:bg-red-50 dark:active:bg-red-900/20 whitespace-nowrap"
            >
              复制链接
            </button>
          </div>

          {/* Team stats */}
          {cardData && (
            <div className="w-full mt-4 flex justify-around text-center relative z-10">
              <div>
                <div className="text-2xl font-bold text-text-main">{cardData.team_count}</div>
                <div className="text-xs text-text-sub">团队人数</div>
              </div>
            </div>
          )}
        </div>

        {/* Save Error Banner */}
        {saveError && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 flex items-start">
            <AlertTriangle size={16} className="text-orange-500 mt-0.5 mr-2 shrink-0" />
            <div className="flex-1">
              <div className="text-base text-orange-700 dark:text-orange-400 font-medium mb-1">保存图片失败</div>
              <div className="text-sm text-orange-600/80 dark:text-orange-400/80 mb-2">请长按二维码图片保存</div>
            </div>
          </div>
        )}

        {/* Share Methods */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-none border border-transparent dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">分享至</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center cursor-pointer active:opacity-70">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success mb-2">
                <MessageCircle size={24} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">微信好友</span>
            </div>
            <div className="flex flex-col items-center cursor-pointer active:opacity-70">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success mb-2">
                <Share2 size={24} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">朋友圈</span>
            </div>
            <div
              className="flex flex-col items-center cursor-pointer active:opacity-70"
              onClick={() => handleCopy(inviteLink, '链接')}
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 mb-2">
                <LinkIcon size={24} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">复制链接</span>
            </div>
            <div
              className="flex flex-col items-center cursor-pointer active:opacity-70"
              onClick={handleSaveImage}
            >
              <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 mb-2">
                <Download size={24} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">保存图片</span>
            </div>
          </div>
        </div>

        {/* Rules Foldable Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-800 overflow-hidden">
          <div
            className="px-4 py-4 flex justify-between items-center cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
            onClick={() => setRulesExpanded(!rulesExpanded)}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">奖励说明与注意事项</h3>
            {rulesExpanded ? <ChevronUp size={20} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={20} className="text-gray-400 dark:text-gray-500" />}
          </div>

          {rulesExpanded && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800 text-base text-gray-500 dark:text-gray-400 leading-relaxed space-y-2">
              <p>1. 邀请好友注册并完成首次实名认证，您和好友各得相应奖励。</p>
              <p>2. 好友完成签到或首笔交易后，您将获得额外奖励，具体以当前活动规则为准。</p>
              <p>3. 邀请奖励将在满足条件后自动发放到您的账户。</p>
              <p>4. 严禁通过作弊手段获取奖励，一经发现将取消奖励并封禁账号。</p>
              <p>5. 本活动最终解释权归平台所有。</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FFF8F8] dark:bg-gray-950 relative h-full overflow-hidden">
      {renderHeader()}
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderContent()}
      </div>
    </div>
  );
};
