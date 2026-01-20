/**
 * ChatWidget - 在线客服组件
 * 
 * 集成第三方客服系统，支持：
 * - 自动加载客服 widget
 * - 传递用户信息
 * - 提供打开/关闭窗口的方法
 * - 隐藏默认浮动按钮，使用自定义触发
 * 
 * @version 1.0.0
 */
import React, { useEffect } from 'react';
import { getStoredToken } from '../../services/client';
import { fetchProfile, fetchRealNameStatus } from '../../services/user';
import { extractData, isSuccess } from '../../utils/apiHelpers';
import { debugLog, warnLog, errorLog } from '../../utils/logger';

// 客服渠道ID
const CHANNEL_ID = '040a7b31e2734c1f8a33f71c7dfe8e5c';

// 扩展 Window 接口
declare global {
  interface Window {
    ChatWidget?: {
      init: (config: ChatWidgetConfig) => void;
      open: () => void;
      close: () => void;
      toggle: () => void;
      getStatus: () => 'uninitialized' | 'loading' | 'opened' | 'closed';
      isOpen: () => boolean;
    };
  }
}

interface ChatWidgetConfig {
  channelId: string;
  useCustomButton?: boolean;
  autoOpen?: number;
  userInfo?: {
    userName?: string;
    email?: string;
    pid?: string;
    phone?: string;
    groupId?: string;
    adminId?: string;
    params?: string;
  };
  onStatusChange?: (status: 'opened' | 'closed') => void;
  onReady?: () => void;
}

interface ChatWidgetProps {
  /** 是否使用自定义按钮（隐藏默认按钮），默认 true */
  useCustomButton?: boolean;
  /** 自动打开延迟（秒），0 表示不自动打开 */
  autoOpen?: number;
  /** 窗口状态变化回调 */
  onStatusChange?: (status: 'opened' | 'closed') => void;
}

/**
 * 加载客服 widget 脚本
 */
const loadChatWidgetScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 如果已经加载过，直接返回
    if (window.ChatWidget) {
      resolve();
      return;
    }

    // 检查是否已存在脚本
    const existingScript = document.querySelector('script[src*="chat.bskhu.cn"]');
    if (existingScript) {
      // 等待脚本加载完成
      const checkInterval = setInterval(() => {
        if (window.ChatWidget) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // 超时处理
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.ChatWidget) {
          resolve();
        } else {
          reject(new Error('ChatWidget 加载超时'));
        }
      }, 10000);
      return;
    }

    // 创建并加载脚本
    const script = document.createElement('script');
    script.src = 'https://chat.bskhu.cn/chat/widget.js';
    script.async = true;
    
    script.onload = () => {
      // 等待 ChatWidget 对象可用
      const checkInterval = setInterval(() => {
        if (window.ChatWidget) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.ChatWidget) {
          resolve();
        } else {
          reject(new Error('ChatWidget 初始化失败'));
        }
      }, 5000);
    };
    
    script.onerror = () => {
      reject(new Error('ChatWidget 脚本加载失败'));
    };

    document.body.appendChild(script);
  });
};

/**
 * 获取当前用户信息
 * 优先使用实名认证的 real_name，其次使用昵称/用户名
 */
const getCurrentUserInfo = async (): Promise<ChatWidgetConfig['userInfo']> => {
  try {
    const token = getStoredToken();
    if (!token) {
      return undefined;
    }

    // 并行获取用户信息和实名认证信息
    const [profileRes, realNameRes] = await Promise.all([
      fetchProfile(token),
      fetchRealNameStatus(token),
    ]);
    
    const profileData = extractData(profileRes);
    const realNameData = isSuccess(realNameRes) ? realNameRes.data : null;
    
    if (profileData?.userInfo) {
      const user = profileData.userInfo;
      
      // 优先使用实名认证的 real_name
      let userName = '用户';
      if (realNameData?.real_name && realNameData.real_name_status === 2) {
        // 实名已通过，使用真实姓名
        userName = realNameData.real_name;
      } else if (user.nickname) {
        userName = user.nickname;
      } else if (user.username) {
        userName = user.username;
      }
      
      return {
        userName,
        phone: user.mobile || undefined,
        pid: String(user.id || ''),
        params: JSON.stringify({
          source: 'app',
          platform: 'web',
          userId: user.id,
          realNameVerified: realNameData?.real_name_status === 2,
        }),
      };
    }
  } catch (error) {
    warnLog('ChatWidget', '获取用户信息失败', error);
  }
  return undefined;
};

/**
 * ChatWidget 组件
 * 不显示浮动按钮，通过 openChatWidget() 打开
 */
const ChatWidget: React.FC<ChatWidgetProps> = ({
  useCustomButton = true, // 默认隐藏浮动按钮
  autoOpen = 0,
  onStatusChange,
}) => {
  // 初始化客服 widget
  useEffect(() => {
    let mounted = true;

    const initWidget = async () => {
      try {
        // 加载脚本
        await loadChatWidgetScript();
        
        if (!mounted || !window.ChatWidget) return;

        // 获取用户信息
        const userInfo = await getCurrentUserInfo();
        
        if (!mounted) return;

        // 初始化配置
        window.ChatWidget.init({
          channelId: CHANNEL_ID,
          useCustomButton, // 隐藏默认按钮
          autoOpen,
          userInfo,
          onStatusChange: (status) => {
            debugLog('ChatWidget', '状态变化', status);
            onStatusChange?.(status);
          },
          onReady: () => {
            debugLog('ChatWidget', '配置加载完成');
          },
        });
      } catch (error) {
        errorLog('ChatWidget', '初始化失败', error);
      }
    };

    initWidget();

    return () => {
      mounted = false;
    };
  }, [useCustomButton, autoOpen, onStatusChange]);

  // 不渲染任何 DOM，widget 自己管理 UI
  return null;
};

// 导出工具函数，方便其他组件调用
export const openChatWidget = () => {
  if (window.ChatWidget) {
    window.ChatWidget.open();
  } else {
    warnLog('ChatWidget', '客服组件未初始化');
  }
};

export const closeChatWidget = () => {
  if (window.ChatWidget) {
    window.ChatWidget.close();
  }
};

export const toggleChatWidget = () => {
  if (window.ChatWidget) {
    window.ChatWidget.toggle();
  }
};

export const isChatWidgetOpen = (): boolean => {
  return window.ChatWidget?.isOpen() ?? false;
};

export default ChatWidget;
