/**
 * ChatWidget - 在线客服组件
 *
 * 不渲染浮动按钮，通过 openChatWidget() 打开。
 */
import React, { useEffect } from 'react';
import { debugLog, errorLog } from '@/utils/logger';
import {
  CHANNEL_ID,
  closeChatWidget as closeChatWidgetCore,
  isChatWidgetOpen as isChatWidgetOpenCore,
  loadChatWidgetScript,
  markWidgetLoadFailed,
  openChatWidget as openChatWidgetCore,
  toggleChatWidget as toggleChatWidgetCore,
} from './chat-widget/core';
import type { ChatWidgetProps } from './chat-widget/types';
import { getCurrentUserInfo } from './chat-widget/userInfo';

const ChatWidget: React.FC<ChatWidgetProps> = ({
  useCustomButton = true,
  autoOpen = 0,
  onStatusChange,
}) => {
  useEffect(() => {
    let mounted = true;

    const initWidget = async () => {
      try {
        await loadChatWidgetScript();
        if (!mounted || !window.ChatWidget) return;

        const userInfo = await getCurrentUserInfo();
        if (!mounted) return;

        window.ChatWidget.init({
          channelId: CHANNEL_ID,
          useCustomButton,
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
        markWidgetLoadFailed();
        errorLog('ChatWidget', '初始化失败', error);
      }
    };

    void initWidget();
    return () => {
      mounted = false;
    };
  }, [useCustomButton, autoOpen, onStatusChange]);

  return null;
};

export const openChatWidget = () => openChatWidgetCore();
export const closeChatWidget = () => closeChatWidgetCore();
export const toggleChatWidget = () => toggleChatWidgetCore();
export const isChatWidgetOpen = () => isChatWidgetOpenCore();

export default ChatWidget;
