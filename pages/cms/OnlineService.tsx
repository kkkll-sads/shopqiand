import React from 'react';
import PageContainer from '../../components/layout/PageContainer';

interface OnlineServiceProps {
  onBack: () => void;
}

/**
 * OnlineService 在线客服页面组件
 * 
 * 集成美洽（MEIQIA）在线客服系统
 */
const OnlineService: React.FC<OnlineServiceProps> = ({ onBack }) => {
  return (
    <PageContainer title="在线客服" onBack={onBack} padding={false}>
      <div className="flex flex-col h-[calc(100vh-56px)] bg-white">
        {/* 使用 iframe 加载美洽客服系统 */}
        <iframe
          src="/chatlink.html"
          className="w-full h-full border-0"
          title="在线客服"
          allow="camera;microphone"
        />
      </div>
    </PageContainer>
  );
};

export default OnlineService;
