import React, { useEffect } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import { openChatWidget } from '../../components/common';

interface OnlineServiceProps {
  onBack: () => void;
}

/**
 * OnlineService 在线客服页面组件
 * 
 * 使用全局 ChatWidget 组件打开客服窗口
 */
const OnlineService: React.FC<OnlineServiceProps> = ({ onBack }) => {
  useEffect(() => {
    // 延迟打开客服窗口，确保全局 ChatWidget 已初始化
    const timer = setTimeout(() => {
      openChatWidget();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <PageContainer title="在线客服" onBack={onBack} padding={false}>
      <div className="flex flex-col h-[calc(100vh-56px)] bg-white items-center justify-center">
        <div className="text-gray-500 text-sm">
          正在打开客服窗口...
        </div>
      </div>
    </PageContainer>
  );
};

export default OnlineService;
