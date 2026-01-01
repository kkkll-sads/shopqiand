import React from 'react';
import Home from '../cms/Home';
import { type NewsItem, type Tab } from '../../types';
import { Route } from '../../router/routes';

interface HomeEntryProps {
  announcements: NewsItem[];
  onNavigate: (route: Route) => void;
  onSwitchTab: (tab: Tab) => void;
}

const HomeEntry: React.FC<HomeEntryProps> = ({ announcements, onNavigate, onSwitchTab }) => {
  return (
    <Home
      onNavigate={onNavigate}
      onSwitchTab={onSwitchTab}
      announcements={announcements}
    />
  );
};

export default HomeEntry;

