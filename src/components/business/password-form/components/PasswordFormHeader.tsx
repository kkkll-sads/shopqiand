import React from 'react';
import { ChevronLeft } from 'lucide-react';
import type { FormType } from '../types';

interface PasswordFormHeaderProps {
  title: string;
  currentType: FormType;
  onBack: () => void;
  onRightAction: () => void;
}

const PasswordFormHeader: React.FC<PasswordFormHeaderProps> = ({
  title,
  currentType,
  onBack,
  onRightAction,
}) => {
  const canShowRightAction = currentType === 'reset_login' || currentType === 'reset_pay';

  return (
    <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-gray-100">
      <div className="relative flex items-center justify-center w-full">
        <button
          className="absolute left-0 p-2 -ml-2 rounded-full active:bg-gray-100 transition-colors"
          onClick={onBack}
          aria-label="返回"
        >
          <ChevronLeft size={22} className="text-gray-900" />
        </button>

        <h1 className="text-lg font-bold text-gray-900">{title}</h1>

        {canShowRightAction && (
          <button
            type="button"
            className="absolute right-0 text-sm text-red-600 font-medium active:opacity-70"
            onClick={onRightAction}
          >
            {currentType === 'reset_pay' ? '短信重置' : '忘记密码？'}
          </button>
        )}
      </div>
    </header>
  );
};

export default PasswordFormHeader;
