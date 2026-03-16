import React from 'react';

export interface ProfileSectionItem {
  label: string;
  icon: React.ElementType;
  iconColorClass?: string;
  iconBgClass?: string;
  iconStrokeWidth?: number;
  labelClassName?: string;
  badge?: number;
  showDot?: boolean;
  action: () => void;
}

interface ProfileSectionGridProps {
  items: ProfileSectionItem[];
  columns?: 3 | 4 | 5;
  className?: string;
}

const ProfileSectionGrid: React.FC<ProfileSectionGridProps> = ({
  items,
  columns = 4,
  className = '',
}) => {
  const gridColsClass = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  }[columns];

  return (
    <div className={`grid ${gridColsClass} gap-y-4 ${className}`}>
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className="flex flex-col items-center cursor-pointer active:opacity-70 transition-opacity relative group"
            onClick={item.action}
          >
            <div className="relative mb-2">
              <div
                className={`w-10 h-10 rounded-xl flex justify-center items-center overflow-hidden transition-transform group-active:scale-95 ${
                  item.iconBgClass || 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={item.iconStrokeWidth ?? 2}
                  className={`${item.iconColorClass || 'text-gray-600 dark:text-gray-300'}`}
                />
              </div>

               {/* Badge */}
               {item.badge !== undefined && item.badge > 0 && (
                <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center px-1 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm z-10">
                  <span className="text-3xs font-bold text-white leading-none whitespace-nowrap">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                </div>
              )}

              {/* Red Dot */}
              {item.showDot && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 z-10"></div>
              )}
            </div>
            
            <span
              className={`text-xs font-medium leading-tight text-center ${
                item.labelClassName || 'text-text-main'
              }`}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileSectionGrid;
