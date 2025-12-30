import React from 'react';
import { Home, ShoppingBag, MessageSquareText, ClipboardList, User, ShieldCheck, Tv } from 'lucide-react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'market', label: '商城', icon: ShoppingBag },
    { id: 'rights', label: '数字确权', icon: ShieldCheck },
    { id: 'live', label: '直播', icon: Tv },
    { id: 'profile', label: '我的', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 pb-safe pt-2 px-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-between items-center pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as Tab)}
              className={`flex flex-col items-center justify-center w-14 transition-colors duration-200 ${isActive ? 'text-orange-600' : 'text-gray-400'
                }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;