import React, { useEffect } from 'react';
import PageContainer from '../../components/layout/PageContainer';

interface OnlineServiceProps {
  onBack: () => void;
}

/**
 * OnlineService 在线客服页面组件
 * 
 * 使用聊天组件脚本
 */
const OnlineService: React.FC<OnlineServiceProps> = ({ onBack }) => {
  useEffect(() => {
    // 加载聊天组件脚本
    const script = document.createElement('script');
    script.src = 'https://www.axd01kp.cfd/chat/widget.js';
    script.async = true;
    script.onload = function() {
      // 初始化聊天组件
      if ((window as any).ChatWidget) {
        (window as any).ChatWidget.init({
          channelId: '040a7b31e2734c1f8a33f71c7dfe8e5c'
        });
        
        // 自动打开聊天窗口
        setTimeout(() => {
          if ((window as any).ChatWidget && (window as any).ChatWidget.open) {
            (window as any).ChatWidget.open();
          } else if ((window as any).ChatWidget && (window as any).ChatWidget.show) {
            (window as any).ChatWidget.show();
          }
        }, 500); // 延迟500ms确保组件完全初始化
      }
    };
    
    // 检查脚本是否已存在
    const existingScript = document.querySelector('script[src="https://www.axd01kp.cfd/chat/widget.js"]');
    if (!existingScript) {
      document.body.appendChild(script);
    } else {
      // 如果脚本已存在，直接初始化并打开
      if ((window as any).ChatWidget) {
        (window as any).ChatWidget.init({
          channelId: '040a7b31e2734c1f8a33f71c7dfe8e5c'
        });
        
        // 自动打开聊天窗口
        setTimeout(() => {
          if ((window as any).ChatWidget && (window as any).ChatWidget.open) {
            (window as any).ChatWidget.open();
          } else if ((window as any).ChatWidget && (window as any).ChatWidget.show) {
            (window as any).ChatWidget.show();
          }
        }, 500);
      }
    }

    // 清理函数：组件卸载时移除脚本（可选）
    return () => {
      // 注意：通常不需要移除脚本，因为聊天组件可能需要持续运行
      // 如果需要移除，可以在这里处理
    };
  }, []);

  return (
    <PageContainer title="在线客服" onBack={onBack} padding={false}>
      <div className="flex flex-col h-[calc(100vh-56px)] bg-white items-center justify-center">
        <div className="text-gray-500 text-sm">
          聊天组件正在加载中...
        </div>
      </div>
    </PageContainer>
  );
};

export default OnlineService;
