import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SubPageLayoutProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
  bgColor?: string;
}

const SubPageLayout: React.FC<SubPageLayoutProps> = ({
  title,
  onBack,
  children,
  rightAction,
  bgColor = "bg-gray-50"
}) => {
  return (
    <div className={`min-h-screen ${bgColor} pb-safe`}>
      {/* 固定头部 */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white px-4 py-3 flex items-center shadow-sm z-40">
        <button
          onClick={onBack}
          className="absolute left-4 p-2 -ml-2 text-gray-600 active:bg-gray-100 active:scale-95 rounded-full transition-all"
          aria-label="返回"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-800 w-full text-center">{title}</h1>
        {rightAction && <div className="absolute right-4">{rightAction}</div>}
      </header>

      {/* 内容区域 - 为固定头部留出空间 */}
      <div className="pt-[52px] min-h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto relative flex flex-col scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SubPageLayout;