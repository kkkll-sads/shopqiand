/**
 * MediaBrowser - 媒体浏览器组件（用于直播/视频）
 * 独立于支付收银台的 EmbeddedBrowser
 */
import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ExternalLink, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface MediaBrowserProps {
  url: string;
  title?: string;
  onClose: () => void;
  isOpen: boolean;
  type?: 'live' | 'video' | 'default';
}

export const MediaBrowser: React.FC<MediaBrowserProps> = ({
  url,
  title = '媒体播放',
  onClose,
  isOpen,
  type = 'default'
}) => {
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
    }
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleReload = () => {
    setLoading(true);
    setKey(prev => prev + 1);
  };

  const handleOpenInBrowser = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFullscreen = () => {
    const iframe = document.querySelector('.media-iframe') as HTMLIFrameElement;
    if (iframe) {
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      }
    }
  };

  // 根据类型获取主题色
  const getThemeColors = () => {
    switch (type) {
      case 'live':
        return {
          gradient: 'from-red-500 to-red-600',
          bg: 'bg-red-500',
          badge: 'bg-red-500',
          text: 'text-red-500',
        };
      case 'video':
        return {
          gradient: 'from-blue-500 to-indigo-600',
          bg: 'bg-blue-500',
          badge: 'bg-blue-500',
          text: 'text-blue-500',
        };
      default:
        return {
          gradient: 'from-gray-700 to-gray-900',
          bg: 'bg-gray-700',
          badge: 'bg-gray-700',
          text: 'text-gray-700',
        };
    }
  };

  const theme = getThemeColors();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black animate-in slide-in-from-bottom duration-300">
      {/* Header - 深色主题 */}
      <div className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r ${theme.gradient} shrink-0`}>
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex-1 text-center mx-2 truncate flex items-center justify-center gap-2">
          {type === 'live' && (
            <span className="flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-full text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              直播中
            </span>
          )}
          <span className="font-bold text-white">{title}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleFullscreen}
            className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="全屏"
          >
            <Maximize2 size={20} />
          </button>
          <button
            onClick={handleOpenInBrowser}
            className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="在浏览器中打开"
          >
            <ExternalLink size={20} />
          </button>
          <button
            onClick={handleReload}
            className="p-2 -mr-1 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="刷新"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Content - 黑色背景适合媒体播放 */}
      <div className="flex-1 relative bg-black">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/90">
            <div className={`w-16 h-16 rounded-full ${theme.bg}/20 flex items-center justify-center mb-4`}>
              <LoadingSpinner size="lg" color="white" />
            </div>
            <span className="text-white/70 font-medium">
              {type === 'live' ? '连接直播间...' : '加载视频...'}
            </span>
          </div>
        )}

        <iframe
          key={key}
          src={url}
          className="media-iframe w-full h-full border-none bg-black"
          onLoad={() => setLoading(false)}
          allow="accelerometer; autoplay; camera; microphone; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* 底部提示 */}
      <div className="bg-gray-900 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <span>
          {type === 'live' ? '实时直播，请保持网络稳定' : '视频播放中'}
        </span>
        <button
          onClick={handleOpenInBrowser}
          className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
        >
          <ExternalLink size={12} />
          浏览器打开
        </button>
      </div>
    </div>
  );
};

export default MediaBrowser;
