import React, { useEffect, useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';

export interface ActionSheetOption {
  label: string;
  icon?: React.ReactNode;
  desc?: string;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  showArrow?: boolean;
  onClick?: () => void;
  onDisabledClick?: () => void;
}

export interface ActionSheetGroup {
  options: ActionSheetOption[];
}

export interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  groups: ActionSheetGroup[];
  showCancel?: boolean;
  cancelText?: string;
  maskClosable?: boolean;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  groups,
  showCancel = true,
  cancelText = '取消',
  maskClosable = true,
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // Small delay to allow DOM to render before starting animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 300); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const handleMaskClick = () => {
    if (maskClosable) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleMaskClick}
      ></div>

      {/* Panel */}
      <div 
        className={`relative w-full max-w-[390px] mx-auto px-4 pb-safe transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Main Options Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg mb-3 overflow-hidden flex flex-col max-h-[70vh]">
          {/* Drag Handle & Title */}
          <div className="shrink-0 pt-3 pb-2 flex flex-col items-center relative bg-white dark:bg-gray-900 z-10">
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-3"></div>
            {title && (
              <h3 className="text-md font-medium text-gray-500 dark:text-gray-400 px-4 text-center w-full truncate">
                {title}
              </h3>
            )}
          </div>

          {/* Scrollable Groups */}
          <div className="overflow-y-auto no-scrollbar flex-1 pb-2">
            {groups.map((group, groupIndex) => (
              <div key={groupIndex} className="flex flex-col">
                {group.options.map((option, optionIndex) => (
                  <button
                    key={optionIndex}
                    onClick={() => {
                      if (option.disabled || option.loading) {
                        if (option.onDisabledClick) {
                          option.onDisabledClick();
                        }
                        return;
                      }
                      if (option.onClick) {
                        option.onClick();
                      }
                    }}
                    className={`
                      w-full min-h-[52px] px-4 flex items-center justify-between
                      bg-white dark:bg-gray-900 transition-colors
                      ${option.disabled ? 'opacity-50' : 'active:bg-gray-50 dark:active:bg-gray-800 cursor-pointer'}
                      ${optionIndex < group.options.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}
                    `}
                  >
                    <div className="flex items-center flex-1 min-w-0 mr-3">
                      {option.icon && (
                        <div className={`mr-3 shrink-0 ${option.danger ? 'text-text-price dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {option.icon}
                        </div>
                      )}
                      <span className={`text-xl truncate ${option.danger ? 'text-text-price dark:text-red-400 font-medium' : 'text-gray-900 dark:text-gray-100'}`}>
                        {option.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center shrink-0">
                      {option.desc && (
                        <span className="text-base text-gray-400 dark:text-gray-500 mr-1">
                          {option.desc}
                        </span>
                      )}
                      {option.loading ? (
                        <Loader2 size={16} className="text-gray-400 dark:text-gray-500 animate-spin ml-1" />
                      ) : option.showArrow ? (
                        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 ml-1" />
                      ) : null}
                    </div>
                  </button>
                ))}
                {/* Group Divider */}
                {groupIndex < groups.length - 1 && (
                  <div className="h-2 bg-bg-hover dark:bg-gray-950 w-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cancel Button */}
        {showCancel && (
          <button
            onClick={onClose}
            className="w-full h-[52px] bg-white dark:bg-gray-900 rounded-2xl shadow-sm flex items-center justify-center text-xl font-medium text-gray-900 dark:text-gray-100 active:bg-gray-50 dark:active:bg-gray-800 transition-colors mb-4"
          >
            {cancelText}
          </button>
        )}
      </div>
    </div>
  );
};
