import React from 'react';

interface AssetTabSwitcherProps {
  tabs: string[];
  activeTab: number;
  onChange: (idx: number) => void;
}

const AssetTabSwitcher: React.FC<AssetTabSwitcherProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="overflow-x-auto scrollbar-hide mb-4">
      <div className="flex gap-2 p-1 bg-gray-50 rounded-xl inline-flex min-w-full">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => onChange(idx)}
            className={`
              flex-shrink-0 px-4 py-2.5 text-xs font-medium rounded-lg 
              transition-all duration-300 whitespace-nowrap
              ${idx === activeTab
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200 scale-105 border border-orange-400'
                : 'bg-white text-gray-600 hover:text-orange-500 hover:bg-orange-50 border border-transparent'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AssetTabSwitcher;

