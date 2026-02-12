import React from 'react';

interface UserSurveyTabsProps {
  activeTab: 'submit' | 'history';
  onChange: (tab: 'submit' | 'history') => void;
}

const UserSurveyTabs: React.FC<UserSurveyTabsProps> = ({ activeTab, onChange }) => (
  <div className="bg-white border-b border-gray-100 px-4 flex gap-6 mb-4">
    <button
      className={`py-3 text-sm font-bold border-b-2 transition-all active:scale-95 ${
        activeTab === 'submit'
          ? 'border-red-500 text-red-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
      onClick={() => onChange('submit')}
    >
      提交反馈
    </button>
    <button
      className={`py-3 text-sm font-bold border-b-2 transition-all active:scale-95 ${
        activeTab === 'history'
          ? 'border-red-500 text-red-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
      onClick={() => onChange('history')}
    >
      我的反馈
    </button>
  </div>
);

export default UserSurveyTabs;
