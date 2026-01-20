/**
 * BottomNav - 底部导航栏组件
 * 
 * 参考淘宝风格：未选中深灰色，选中橙色
 * 保持原有功能：首页、商城、数字确权、直播、我的
 */
import React from 'react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

// 线条风格图标（参考淘宝）
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1V9.5z" />
  </svg>
);

const ShopIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
    <path d="M3 6h18" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" fill="none" />
  </svg>
);

const ShieldIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    {active && <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />}
    {!active && <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" fill="none" />}
  </svg>
);

const TvIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
    <polyline points="17 2 12 7 7 2" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 10-16 0" />
  </svg>
);

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'home', label: '首页', Icon: HomeIcon },
    { id: 'market', label: '商城', Icon: ShopIcon },
    { id: 'rights', label: '数字确权', Icon: ShieldIcon },
    { id: 'live', label: '直播', Icon: TvIcon },
    { id: 'profile', label: '我的', Icon: UserIcon },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 pb-safe z-[999]">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as Tab)}
              className={`flex flex-col items-center justify-center py-0.5 min-w-[56px] transition-colors ${
                isActive ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              <item.Icon active={isActive} />
              <span className={`text-[10px] mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
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
