import { debugLog, warnLog, errorLog } from '@/utils/logger';
import { fetchChatConfig } from '@/services/common';
import { isSuccess } from '@/utils/apiHelpers';
import type { WidgetLoadState } from './types';

// ========================================
// 硬编码兜底值（后端不可用时使用）
// ========================================
const FALLBACK_CHANNEL_ID = '040a7b31e2734c1f8a33f71c7dfe8e5c';
const FALLBACK_CHAT_URLS = [
  'https://www.axd01kp.cfd/chat/index',
  'https://cdn.bot05pi.cfd/chat/index',
];
const FALLBACK_WIDGET_SCRIPT_URL = 'https://chat.bskhu.cn/chat/widget.js';

// ========================================
// 动态配置（后端获取后覆盖）
// ========================================
let chatConfig = {
  channelId: FALLBACK_CHANNEL_ID,
  chatUrls: [...FALLBACK_CHAT_URLS],
  widgetScriptUrl: FALLBACK_WIDGET_SCRIPT_URL,
};

let configLoaded = false;

/**
 * 从后端获取客服配置，覆盖硬编码兜底值。
 * 应在 App 启动时调用（非阻塞 fire-and-forget）。
 */
export const initChatConfig = async (): Promise<void> => {
  if (configLoaded) return;

  try {
    const res = await fetchChatConfig();
    if (isSuccess(res) && res.data) {
      const { channel_id, chat_url, chat_backup_url, widget_script_url } = res.data;

      if (channel_id) {
        chatConfig.channelId = channel_id;
      }

      const urls: string[] = [];
      if (chat_url) urls.push(chat_url);
      if (chat_backup_url) urls.push(chat_backup_url);
      if (urls.length > 0) {
        chatConfig.chatUrls = urls;
      }

      if (widget_script_url) {
        chatConfig.widgetScriptUrl = widget_script_url;
      }

      // 同步写入 window，供 ChatWidget 初始化时使用
      if (typeof window !== 'undefined') {
        window.CHAT_CHANNEL_ID = chatConfig.channelId;
        window.CHAT_BASE_URLS = chatConfig.chatUrls.map(
          (url) => `${url}${url.includes('?') ? '&' : '?'}channelId=${chatConfig.channelId}`,
        );
        if (widget_script_url) {
          window.CHAT_WIDGET_SCRIPT_URL = widget_script_url;
        }
      }

      configLoaded = true;
      debugLog('ChatWidget', '客服配置已从后端加载', chatConfig);
    } else {
      warnLog('ChatWidget', '后端客服配置接口返回失败，使用兜底值');
    }
  } catch (error) {
    warnLog('ChatWidget', '获取客服配置失败，使用兜底值', error);
  }
};

/** 获取当前生效的 CHANNEL_ID */
export const getChannelId = (): string => chatConfig.channelId;

let widgetLoadState: WidgetLoadState = 'idle';

const getChatPageFallbackUrls = (): string[] => {
  if (typeof window === 'undefined') return [];

  const channelId = chatConfig.channelId;

  // 优先使用 window 上的动态 URL（可能由 initChatConfig 或外部注入）
  const dynamicUrls = Array.isArray(window.CHAT_BASE_URLS)
    ? window.CHAT_BASE_URLS
    : [window.CHAT_BASE_URL, window.CHAT_BACKUP_BASE_URL];

  // 用 chatConfig.chatUrls 构建带 channelId 的完整 URL
  const configUrls = chatConfig.chatUrls.map(
    (url) => `${url}${url.includes('?') ? '&' : '?'}channelId=${channelId}`,
  );

  return Array.from(
    new Set(
      [...dynamicUrls, ...configUrls]
        .filter((url): url is string => Boolean(url))
        .map((url) => url.trim())
        .filter(Boolean),
    ),
  );
};

const buildChatFallbackUrl = (baseUrl: string): string => {
  if (typeof window === 'undefined') return baseUrl;

  try {
    const currentUrl = new URL(window.location.href);
    const params = currentUrl.searchParams.toString();
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}isBack=true${params ? `&${params}` : ''}`;
  } catch {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}isBack=true`;
  }
};

const openChatPageFallback = (): boolean => {
  if (typeof window === 'undefined') return false;

  const fallbackUrls = getChatPageFallbackUrls().map(buildChatFallbackUrl);
  for (const url of fallbackUrls) {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (opened) {
      debugLog('ChatWidget', '已使用客服链接兜底打开', url);
      return true;
    }
  }

  return false;
};

export const markWidgetLoadFailed = () => {
  widgetLoadState = 'failed';
};

export const loadChatWidgetScript = (retryCount: number = 0): Promise<void> => {
  const maxRetries = 3;

  return new Promise((resolve, reject) => {
    if (window.ChatWidget) {
      widgetLoadState = 'ready';
      debugLog('ChatWidget', 'ChatWidget 已加载');
      resolve();
      return;
    }

    // 使用动态脚本 URL
    const scriptUrl = window.CHAT_WIDGET_SCRIPT_URL || chatConfig.widgetScriptUrl;
    const scriptSelector = `script[src="${scriptUrl}"]`;

    const existingScript = document.querySelector(scriptSelector);
    if (existingScript) {
      debugLog('ChatWidget', '等待已存在的脚本加载完成');

      const checkInterval = setInterval(() => {
        if (window.ChatWidget) {
          widgetLoadState = 'ready';
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.ChatWidget) {
          widgetLoadState = 'ready';
          resolve();
        } else {
          widgetLoadState = 'failed';
          errorLog('ChatWidget', '等待现有脚本加载超时');
          reject(new Error('ChatWidget 加载超时'));
        }
      }, 10000);

      return;
    }

    debugLog('ChatWidget', `开始加载客服脚本 (尝试 ${retryCount + 1}/${maxRetries + 1})`, scriptUrl);
    widgetLoadState = 'loading';

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;

    script.onload = () => {
      debugLog('ChatWidget', '脚本加载完成，等待初始化');

      const checkInterval = setInterval(() => {
        if (window.ChatWidget) {
          widgetLoadState = 'ready';
          clearInterval(checkInterval);
          debugLog('ChatWidget', 'ChatWidget 对象可用');
          resolve();
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.ChatWidget) {
          widgetLoadState = 'ready';
          resolve();
          return;
        }

        errorLog('ChatWidget', 'ChatWidget 初始化超时');
        if (retryCount < maxRetries) {
          warnLog('ChatWidget', '初始化失败，2000ms 后重试...');
          setTimeout(() => {
            loadChatWidgetScript(retryCount + 1).then(resolve).catch(reject);
          }, 2000);
          return;
        }

        widgetLoadState = 'failed';
        reject(new Error('ChatWidget 初始化失败（已达最大重试次数）'));
      }, 5000);
    };

    script.onerror = () => {
      errorLog('ChatWidget', '脚本加载失败');
      if (retryCount < maxRetries) {
        warnLog('ChatWidget', '加载失败，2000ms 后重试...');
        setTimeout(() => {
          script.remove();
          loadChatWidgetScript(retryCount + 1).then(resolve).catch(reject);
        }, 2000);
        return;
      }

      widgetLoadState = 'failed';
      reject(new Error('ChatWidget 脚本加载失败（已达最大重试次数）'));
    };

    document.body.appendChild(script);
  });
};

export const openChatWidget = (): boolean => {
  if (typeof window === 'undefined') return false;

  if (window.ChatWidget) {
    widgetLoadState = 'ready';
    debugLog('ChatWidget', '打开客服窗口');
    window.ChatWidget.open();
    return true;
  }

  warnLog('ChatWidget', `客服组件未初始化，当前状态: ${widgetLoadState}`);
  if (widgetLoadState === 'failed') {
    const opened = openChatPageFallback();
    if (opened) return true;

    alert('客服系统暂不可用，请稍后再试');
    return false;
  }

  alert('客服系统正在加载中，请稍后再试');
  return false;
};

export const closeChatWidget = (): void => {
  if (typeof window !== 'undefined' && window.ChatWidget) {
    window.ChatWidget.close();
  }
};

export const toggleChatWidget = (): void => {
  if (typeof window !== 'undefined' && window.ChatWidget) {
    window.ChatWidget.toggle();
  }
};

export const isChatWidgetOpen = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.ChatWidget?.isOpen() ?? false;
};
