import React, { useEffect, useMemo, useState } from 'react';
import { WheelPicker, type WheelPickerItem } from '../ui/WheelPicker';
import chinaAreaData from '../../data/chinaAreaData';

interface RegionPickerState {
  provinceCode: string;
  cityCode: string;
  districtCode: string;
}

interface RegionPickerSheetProps {
  isOpen: boolean;
  title?: string;
  value?: string;
  onCancel: () => void;
  onConfirm: (region: string) => void;
}

const rootAreaMap = chinaAreaData as Record<string, Record<string, string>>;
const COUNTRY_CODE = '86';

const getEntries = (code: string): [string, string][] => Object.entries(rootAreaMap[code] ?? {});

const toPickerItems = (entries: [string, string][]): WheelPickerItem[] =>
  entries.map(([value, label]) => ({ value, label }));

const getInitialRegionPickerState = (region: string): RegionPickerState => {
  const [provinceName, cityName, districtName] = region.trim().split(/\s+/).filter(Boolean);
  const provinceEntries = getEntries(COUNTRY_CODE);
  const provinceCode =
    provinceEntries.find(([, label]) => label === provinceName)?.[0] ?? provinceEntries[0]?.[0] ?? '';
  const cityEntries = getEntries(provinceCode);
  const cityCode = cityEntries.find(([, label]) => label === cityName)?.[0] ?? cityEntries[0]?.[0] ?? '';
  const districtEntries = getEntries(cityCode);
  const districtCode =
    districtEntries.find(([, label]) => label === districtName)?.[0] ?? districtEntries[0]?.[0] ?? '';

  return { provinceCode, cityCode, districtCode };
};

const buildRegionLabel = (provinceCode: string, cityCode: string, districtCode: string) => {
  const province = rootAreaMap[COUNTRY_CODE]?.[provinceCode] ?? '';
  const city = rootAreaMap[provinceCode]?.[cityCode] ?? '';
  const district = rootAreaMap[cityCode]?.[districtCode] ?? '';
  return [province, city, district].filter(Boolean).join(' ');
};

export const RegionPickerSheet: React.FC<RegionPickerSheetProps> = ({
  isOpen,
  title = '选择所在地区',
  value = '',
  onCancel,
  onConfirm,
}) => {
  const [pickerState, setPickerState] = useState<RegionPickerState>(() => getInitialRegionPickerState(value));

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setPickerState(getInitialRegionPickerState(value));
  }, [isOpen, value]);

  const provinceItems = useMemo(() => toPickerItems(getEntries(COUNTRY_CODE)), []);
  const cityItems = useMemo(
    () => toPickerItems(getEntries(pickerState.provinceCode)),
    [pickerState.provinceCode],
  );
  const districtItems = useMemo(
    () => toPickerItems(getEntries(pickerState.cityCode)),
    [pickerState.cityCode],
  );

  if (!isOpen) {
    return null;
  }

  const handleProvinceChange = (nextValue: string | number) => {
    const provinceCode = String(nextValue);
    const nextCityCode = getEntries(provinceCode)[0]?.[0] ?? '';
    const nextDistrictCode = getEntries(nextCityCode)[0]?.[0] ?? '';
    setPickerState({ provinceCode, cityCode: nextCityCode, districtCode: nextDistrictCode });
  };

  const handleCityChange = (nextValue: string | number) => {
    const cityCode = String(nextValue);
    const nextDistrictCode = getEntries(cityCode)[0]?.[0] ?? '';
    setPickerState((prev) => ({ ...prev, cityCode, districtCode: nextDistrictCode }));
  };

  const handleDistrictChange = (nextValue: string | number) => {
    setPickerState((prev) => ({ ...prev, districtCode: String(nextValue) }));
  };

  const handleConfirm = () => {
    onConfirm(
      buildRegionLabel(pickerState.provinceCode, pickerState.cityCode, pickerState.districtCode),
    );
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end">
      <button
        type="button"
        aria-label="关闭地区选择"
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full rounded-t-[24px] bg-white dark:bg-gray-900 pb-safe">
        <div className="flex items-center justify-between border-b border-border-light px-4 py-4">
          <button type="button" onClick={onCancel} className="text-base text-text-sub active:opacity-70">
            取消
          </button>
          <div className="text-lg font-semibold text-text-main">{title}</div>
          <button
            type="button"
            onClick={handleConfirm}
            className="text-base font-medium text-primary-start active:opacity-70"
          >
            确定
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 px-3 py-4">
          <WheelPicker items={provinceItems} value={pickerState.provinceCode} onChange={handleProvinceChange} />
          <WheelPicker items={cityItems} value={pickerState.cityCode} onChange={handleCityChange} />
          <WheelPicker items={districtItems} value={pickerState.districtCode} onChange={handleDistrictChange} />
        </div>
      </div>
    </div>
  );
};

