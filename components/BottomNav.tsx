/**
 * BottomNav - 底部导航栏组件
 * 
 * 参考京东APP底部导航栏设计
 * 五个Tab：首页、商城、消息、购物车、我的
 * 购物车和消息显示角标
 */
import React from 'react';
import { Home, ShoppingBag, MessageCircle, ShoppingCart, User } from 'lucide-react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  cartCount?: number;
  messageCount?: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ 
  activeTab, 
  onTabChange,
  cartCount = 2,
  messageCount = 4,
}) => {
  const navItems = [
    { 
      id: 'home', 
      label: '首页', 
      icon: Home,
      badge: null,
    },
    { 
      id: 'market', 
      label: '国补', 
      icon: ShoppingBag,
      badge: null,
      special: true, // 特殊样式（红色背景）
    },
    { 
      id: 'rights', 
      label: '消息', 
      icon: MessageCircle,
      badge: messageCount > 0 ? messageCount : null,
    },
    { 
      id: 'live', 
      label: '购物车', 
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : null,
    },
    { 
      id: 'profile', 
      label: '我的', 
      icon: User,
      badge: null,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 pb-safe z-[999]">
      <div className="flex justify-around items-end px-2 pt-1 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          // 特殊样式的Tab（国补/商城）
          if (item.special) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as Tab)}
                className="flex flex-col items-center justify-center relative -mt-3"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : 'bg-gradient-to-r from-red-400 to-red-500'
                }`}>
                  <Icon size={22} className="text-white" strokeWidth={2} />
                </div>
                <span className={`text-[10px] mt-0.5 font-medium ${
                  isActive ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as Tab)}
              className="flex flex-col items-center justify-center py-1 relative min-w-[50px]"
            >
              <div className="relative">
                <Icon 
                  size={22} 
                  className={isActive ? 'text-red-500' : 'text-gray-400'}
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                {/* 角标 */}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
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
