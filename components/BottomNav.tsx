/**
 * BottomNav - 底部导航栏组件
 * 
 * 参考京东APP底部导航栏样式设计
 * 保持原有功能：首页、商城、数字确权、直播、我的
 */
import React from 'react';
import { Home, ShoppingBag, ShieldCheck, Tv, User } from 'lucide-react';
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
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 pb-safe z-[999]">
      <div className="flex justify-around items-center py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as Tab)}
              className="flex flex-col items-center justify-center py-1 min-w-[56px]"
            >
              <Icon 
                size={22} 
                className={isActive ? 'text-red-500' : 'text-gray-400'}
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className={`text-[10px] mt-0.5 font-medium ${
                isActive ? 'text-red-500' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
