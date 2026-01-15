import React from 'react';
import { useNavigate } from 'react-router-dom';
import Home from '../../pages/cms/Home';
import type { Route } from '../../router/routes';

// 路由映射函数
const routeToPath = (route: Route): string => {
  if (typeof route === 'string') {
    const simpleRoutes: Record<string, string> = {
      'trading-zone': '/trading-zone',
      'search': '/search',
      'balance-recharge': '/balance-recharge',
      'balance-withdraw': '/balance-withdraw',
      'hashrate-exchange': '/hashrate-exchange',
      'cumulative-rights': '/cumulative-rights',
      'reservation-record': '/reservation-record',
      'invite-friends': '/invite-friends',
    };
    return simpleRoutes[route] || '/';
  }
  
  const mapping: Record<string, string | ((r: Route) => string)> = {
    'trading-zone': '/trading-zone',
    'search': '/search',
    'balance-recharge': '/balance-recharge',
    'balance-withdraw': '/balance-withdraw',
    'hashrate-exchange': '/hashrate-exchange',
    'cumulative-rights': '/cumulative-rights',
    'reservation-record': '/reservation-record',
    'news-detail': (r) => `/news/${(r as any).id || ''}`,
    'invite-friends': '/invite-friends',
  };

  const result = mapping[route.name];
  if (typeof result === 'function') return result(route);
  return result || '/';
};

const HomeEntryWrapper: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (route: Route) => {
    navigate(routeToPath(route));
  };

  const handleSwitchTab = (tab: string) => {
    const tabPaths: Record<string, string> = {
      home: '/',
      market: '/market',
      rights: '/rights',
      live: '/live',
      profile: '/profile',
    };
    navigate(tabPaths[tab] || '/');
  };

  return (
    <Home 
      onNavigate={handleNavigate} 
      onSwitchTab={handleSwitchTab}
    />
  );
};

export default HomeEntryWrapper;
