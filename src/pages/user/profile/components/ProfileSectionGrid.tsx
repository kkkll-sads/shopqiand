import React from 'react';

export interface ProfileSectionItem {
  label: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
    strokeWidth?: number;
  }>;
  action: () => void;
  iconColorClass?: string;
  iconBgClass?: string;
  iconStrokeWidth?: number;
  badge?: number;
  showDot?: boolean;
  labelClassName?: string;
}

interface ProfileSectionGridProps {
  title: string;
  items: ProfileSectionItem[];
  gridClassName?: string;
  defaultLabelClassName?: string;
  defaultIconStrokeWidth?: number;
}

const ProfileSectionGrid: React.FC<ProfileSectionGridProps> = ({
  title,
  items,
  gridClassName = 'grid grid-cols-4 gap-4',
  defaultLabelClassName = 'text-xs text-gray-600 font-medium',
  defaultIconStrokeWidth = 2,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
        <div className="w-1 h-4 bg-red-500 rounded-full"></div>
        {title}
      </div>

      <div className={gridClassName}>
        {items.map((item, idx) => {
          const Icon = item.icon;
          const badge = item.badge || 0;
          const iconBgClass = item.iconBgClass || 'bg-gray-50';
          const iconColorClass = item.iconColorClass || 'text-gray-600';
          const labelClassName = item.labelClassName || defaultLabelClassName;
          const iconStrokeWidth = item.iconStrokeWidth ?? defaultIconStrokeWidth;

          return (
            <div
              key={`${title}-${idx}-${item.label}`}
              className="flex flex-col items-center cursor-pointer active:opacity-60 group"
              onClick={item.action}
            >
              <div
                className={`w-11 h-11 rounded-2xl ${iconBgClass} flex items-center justify-center mb-2 transition-transform group-active:scale-95 relative`}
              >
                <Icon size={20} className={iconColorClass} strokeWidth={iconStrokeWidth} />

                {badge > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                ) : item.showDot ? (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                ) : null}
              </div>

              <span className={labelClassName}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileSectionGrid;
