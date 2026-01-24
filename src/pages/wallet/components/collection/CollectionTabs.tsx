/**
 * 藏品分类 Tab 组件
 */
import React from 'react';

export type CategoryTab = 'hold' | 'consign' | 'sold' | 'dividend';

interface Tab {
  id: CategoryTab;
  label: string;
}

const TABS: Tab[] = [
  { id: 'hold', label: '持仓中' },
  { id: 'consign', label: '寄售中' },
  { id: 'sold', label: '已流转' },
  { id: 'dividend', label: '权益节点' },
];

interface CollectionTabsProps {
  activeTab: CategoryTab;
  onChange: (tab: CategoryTab) => void;
}

export const CollectionTabs: React.FC<CollectionTabsProps> = ({ activeTab, onChange }) => {
  return (
    <div className="px-3 py-2 border-b border-gray-100/50">
      <div className="flex bg-gray-100/80 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === tab.id ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CollectionTabs;
