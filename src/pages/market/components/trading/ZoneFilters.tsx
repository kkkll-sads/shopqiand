/**
 * ZoneFilters - 价格分区筛选组件
 */
import React from 'react';

interface ZoneFiltersProps {
  priceZones: string[];
  activeZone: string;
  onZoneChange: (zone: string) => void;
}

const ZoneFilters: React.FC<ZoneFiltersProps> = ({
  priceZones,
  activeZone,
  onZoneChange,
}) => {
  return (
    <div className="flex gap-2 mb-5 px-2 overflow-x-auto pb-1 scrollbar-none">
      {priceZones.map((zone) => (
        <button
          type="button"
          key={zone}
          onClick={() => onZoneChange(zone)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
            activeZone === zone
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          {zone === 'all' ? '全部' : zone}
        </button>
      ))}
    </div>
  );
};

export default ZoneFilters;
