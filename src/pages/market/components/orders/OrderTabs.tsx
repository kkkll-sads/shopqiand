import React from 'react';

interface OrderTabsProps {
  tabs: string[];
  activeTab: number;
  onChange: (index: number) => void;
}

const OrderTabs: React.FC<OrderTabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
      <div className="flex overflow-x-auto no-scrollbar">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => onChange(index)}
            className={`flex-1 min-w-[80px] py-3 text-sm font-medium relative whitespace-nowrap transition-colors ${activeTab === index ? 'text-red-600 font-bold' : 'text-gray-500'
              }`}
          >
            {tab}
            {activeTab === index && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-red-600 rounded-full shadow-sm shadow-red-500/50"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OrderTabs;

