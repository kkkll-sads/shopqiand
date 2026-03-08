import React, { useState } from 'react';
import { RefreshCcw, Copy, ExternalLink, Headset, Trash2 } from 'lucide-react';
import { copyToClipboard } from '../../lib/clipboard';
import { ActionSheet, ActionSheetGroup } from '../ui/ActionSheet';

interface WebViewActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  url?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  onOpenBrowser?: () => void;
  onFeedback?: () => void;
  onClearCache?: () => void;
}

export const WebViewActionSheet: React.FC<WebViewActionSheetProps> = ({
  isOpen,
  onClose,
  url = window.location.href,
  isLoading = false,
  onRefresh,
  onOpenBrowser,
  onFeedback,
  onClearCache
}) => {
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg('');
      onClose();
    }, 1500);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    showToast(ok ? '已复制' : '复制失败');
  };

  const groups: ActionSheetGroup[] = [
    {
      options: [
        {
          label: '刷新页面',
          icon: <RefreshCcw size={18} />,
          loading: isLoading,
          disabled: isLoading,
          onClick: () => {
            if (onRefresh) onRefresh();
            onClose();
          }
        },
        {
          label: '复制链接',
          icon: <Copy size={18} />,
          onClick: handleCopy
        },
        {
          label: '在系统浏览器打开',
          icon: <ExternalLink size={18} />,
          onClick: () => {
            if (onOpenBrowser) onOpenBrowser();
            onClose();
          }
        },
        {
          label: '问题反馈',
          icon: <Headset size={18} />,
          onClick: () => {
            if (onFeedback) onFeedback();
            onClose();
          }
        }
      ]
    },
    {
      options: [
        {
          label: '清除缓存并重试',
          icon: <Trash2 size={18} />,
          onClick: () => {
            if (onClearCache) onClearCache();
            onClose();
          }
        }
      ]
    }
  ];

  return (
    <>
      <ActionSheet
        isOpen={isOpen}
        onClose={onClose}
        title="更多操作"
        groups={groups}
      />
      
      {/* Simple Toast for Copy Action */}
      {toastMsg && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] bg-black/70 text-white text-md px-4 py-2 rounded-lg animate-in fade-in zoom-in duration-200">
          {toastMsg}
        </div>
      )}
    </>
  );
};
