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
    <div className={`h-screen flex flex-col ${bgColor} pb-safe overflow-hidden`}>
      <header className="bg-white px-4 py-3 flex items-center shadow-sm shrink-0 z-30">
        <button
          onClick={onBack}
          className="absolute left-4 p-1 text-gray-600 active:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-800 w-full text-center">{title}</h1>
        {rightAction && <div className="absolute right-4">{rightAction}</div>}
      </header>

      <div className="flex-1 overflow-y-auto relative flex flex-col scrollbar-hide">
        {children}
      </div>
    </div>
  );
};

export default SubPageLayout;