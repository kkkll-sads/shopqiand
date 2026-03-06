/**
 * @file BottomTab - 底部标签导航栏
 * @description 使用 React Router 的 useNavigate 实现 Tab 切换，
 *              替代旧版 CustomEvent('change-view') 机制。
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Store, ShieldCheck, FileText, User } from 'lucide-react';
import { VIEW_TO_PATH } from '../../lib/navigation';

export const BottomTab = ({ active = 'home', absolute = false }: any) => {
  const navigate = useNavigate();

  /** Tab 配置列表 */
  const tabs = [
    { id: 'home', icon: Home, label: '首页' },
    { id: 'store', icon: Store, label: '商城' },
    { id: 'shield', icon: ShieldCheck, label: '确权中心' },
    { id: 'order', icon: FileText, label: '订单' },
    { id: 'user', icon: User, label: '我的' },
  ];

  /** 使用 navigate 替代 CustomEvent 进行 Tab 切换 */
  const handleTabClick = (id: string) => {
    const path = VIEW_TO_PATH[id] || '/';
    navigate(path);
  };

  return (
    <div className={`${absolute ? 'absolute bottom-0 left-0 right-0' : 'w-full shrink-0'} h-[83px] bg-bg-card border-t border-border-light flex justify-around items-start pt-2 px-2 pb-safe z-50`}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <div 
            key={tab.id} 
            className={`flex flex-col items-center cursor-pointer transition-colors ${isActive ? 'text-primary-start' : 'text-text-aux hover:text-text-main'}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] mt-1 ${isActive ? 'font-medium' : ''}`}>{tab.label}</span>
          </div>
        );
      })}
    </div>
  );
};
