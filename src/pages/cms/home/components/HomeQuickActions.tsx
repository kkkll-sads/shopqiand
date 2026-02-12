import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface QuickActionItem {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  action: () => void;
}

interface HomeQuickActionsProps {
  actions: QuickActionItem[];
}

const HomeQuickActions: React.FC<HomeQuickActionsProps> = ({ actions }) => (
  <div className="py-4 px-4 relative z-0">
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="grid grid-cols-4 gap-3">
        {actions.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
            onClick={item.action}
          >
            <div
              className={`w-12 h-12 rounded-2xl ${item.bgColor} flex items-center justify-center mb-2 ${item.color} shadow-sm`}
            >
              <item.icon size={22} strokeWidth={1.8} />
            </div>
            <span className="text-[11px] text-gray-700 font-medium whitespace-nowrap">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default HomeQuickActions;
