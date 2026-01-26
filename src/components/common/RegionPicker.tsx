/**
 * 地区选择器组件
 * 使用 element-china-area-data npm 包提供完整的中国省市区数据
 * 已优化: 使用动态导入减少初始包体积
 */
import React, { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { errorLog } from '@/utils/logger';

interface RegionPickerProps {
  /** 是否显示 */
  visible: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 确认回调 - 返回选中的省份、城市和区县 */
  onConfirm: (province: string, city: string, district?: string) => void;
  /** 默认选中的省份 */
  initialProvince?: string;
  /** 默认选中的城市 */
  initialCity?: string;
  /** 默认选中的区县 */
  initialDistrict?: string;
}

interface DistrictData {
  [city: string]: string[];
}

interface ProvinceData {
  cities: string[];
  districts?: DistrictData;
}

/**
 * 动态加载并转换地区数据
 */
const loadRegionData = async (): Promise<Record<string, ProvinceData>> => {
  const { pcaTextArr } = await import('element-china-area-data');
  const result: Record<string, ProvinceData> = {};

  for (const province of pcaTextArr) {
    const provinceName = province.label;
    const cities: string[] = [];
    const districts: DistrictData = {};

    if (province.children) {
      for (const city of province.children) {
        const cityName = city.label;
        cities.push(cityName);

        if (city.children) {
          districts[cityName] = city.children.map((district: { label: string }) => district.label);
        }
      }
    }

    result[provinceName] = {
      cities,
      districts: Object.keys(districts).length > 0 ? districts : undefined,
    };
  }

  return result;
};

// 全局缓存
let cachedRegionData: Record<string, ProvinceData> | null = null;
let loadingPromise: Promise<Record<string, ProvinceData>> | null = null;

const RegionPicker: React.FC<RegionPickerProps> = ({
  visible,
  onClose,
  onConfirm,
  initialProvince = '',
  initialCity = '',
  initialDistrict = '',
}) => {
  const [animating, setAnimating] = useState(false);
  const [render, setRender] = useState(false);
  const [regionData, setRegionData] = useState<Record<string, ProvinceData>>(cachedRegionData || {});
  const [loading, setLoading] = useState(!cachedRegionData);

  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  // 加载地区数据
  useEffect(() => {
    if (cachedRegionData) {
      setRegionData(cachedRegionData);
      setLoading(false);
      return;
    }

    if (!loadingPromise) {
      loadingPromise = loadRegionData();
    }

    loadingPromise.then((data) => {
      cachedRegionData = data;
      setRegionData(data);
      setLoading(false);
    }).catch((error) => {
      errorLog('RegionPicker', '加载地区数据失败', error);
      setLoading(false);
    });
  }, []);

  const provinces = useMemo(() => Object.keys(regionData), [regionData]);

  const cities = useMemo(() => {
    if (!selectedProvince || !regionData[selectedProvince]) return [];
    return regionData[selectedProvince].cities || [];
  }, [selectedProvince, regionData]);

  const districts = useMemo(() => {
    if (!selectedProvince || !selectedCity || !regionData[selectedProvince]) return [];
    const provinceInfo = regionData[selectedProvince];
    if (!provinceInfo.districts) return [];
    return provinceInfo.districts[selectedCity] || [];
  }, [selectedProvince, selectedCity, regionData]);

  useEffect(() => {
    if (visible) {
      setRender(true);
      requestAnimationFrame(() => setAnimating(true));

      if (Object.keys(regionData).length > 0) {
        initSelection();
      }
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible, regionData]);

  const initSelection = () => {
    const validProvinces = Object.keys(regionData);
    if (validProvinces.length === 0) return;

    if (initialProvince && validProvinces.includes(initialProvince)) {
      setSelectedProvince(initialProvince);

      const availableCities = regionData[initialProvince]?.cities || [];
      if (initialCity && availableCities.includes(initialCity)) {
        setSelectedCity(initialCity);

        const availableDistricts = regionData[initialProvince]?.districts?.[initialCity] || [];
        if (initialDistrict && availableDistricts.includes(initialDistrict)) {
          setSelectedDistrict(initialDistrict);
        } else if (availableDistricts.length > 0) {
          setSelectedDistrict(availableDistricts[0]);
        } else {
          setSelectedDistrict('');
        }
      } else if (availableCities.length > 0) {
        setSelectedCity(availableCities[0]);
        const firstDistricts = regionData[initialProvince]?.districts?.[availableCities[0]] || [];
        setSelectedDistrict(firstDistricts.length > 0 ? firstDistricts[0] : '');
      }
    } else {
      const firstProvince = validProvinces[0];
      setSelectedProvince(firstProvince);
      const firstCities = regionData[firstProvince]?.cities || [];
      if (firstCities.length > 0) {
        setSelectedCity(firstCities[0]);
        const firstDistricts = regionData[firstProvince]?.districts?.[firstCities[0]] || [];
        setSelectedDistrict(firstDistricts.length > 0 ? firstDistricts[0] : '');
      }
    }
  };

  const handleProvinceSelect = (province: string) => {
    if (province === selectedProvince) return;

    setSelectedProvince(province);
    const newCities = regionData[province]?.cities || [];
    if (newCities.length > 0) {
      const firstCity = newCities[0];
      setSelectedCity(firstCity);
      const newDistricts = regionData[province]?.districts?.[firstCity] || [];
      setSelectedDistrict(newDistricts.length > 0 ? newDistricts[0] : '');
    } else {
      setSelectedCity('');
      setSelectedDistrict('');
    }
  };

  const handleCitySelect = (city: string) => {
    if (city === selectedCity) return;

    setSelectedCity(city);
    const newDistricts = regionData[selectedProvince]?.districts?.[city] || [];
    setSelectedDistrict(newDistricts.length > 0 ? newDistricts[0] : '');
  };

  const handleConfirm = () => {
    if (selectedProvince && selectedCity) {
      onConfirm(selectedProvince, selectedCity, selectedDistrict || undefined);
    }
  };

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative bg-white rounded-t-2xl w-full max-h-[70vh] flex flex-col transition-transform duration-300 ease-out ${
          animating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button
            onClick={onClose}
            className="text-gray-400 p-1 active:bg-gray-50 rounded-full"
          >
            <X size={20} />
          </button>
          <span className="text-base font-bold text-gray-800">选择所在地区</span>
          <button
            onClick={handleConfirm}
            className="text-orange-600 font-medium text-sm p-1 active:opacity-70"
          >
            确定
          </button>
        </div>

        <div className="px-4 py-2 bg-gray-50 flex items-center gap-2 text-sm flex-wrap">
          <span className={`px-3 py-1 rounded-full ${selectedProvince ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}>
            {selectedProvince || '请选择省份'}
          </span>
          <span className="text-gray-300">/</span>
          <span className={`px-3 py-1 rounded-full ${selectedCity ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}>
            {selectedCity || '请选择城市'}
          </span>
          {districts.length > 0 && (
            <>
              <span className="text-gray-300">/</span>
              <span className={`px-3 py-1 rounded-full ${selectedDistrict ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}>
                {selectedDistrict || '请选择区县'}
              </span>
            </>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className={`flex h-64 overflow-hidden ${districts.length > 0 ? 'divide-x' : ''}`}>
            <div className={`${districts.length > 0 ? 'flex-1' : 'w-1/2'} overflow-y-auto border-r border-gray-100 overscroll-contain bg-gray-50/50`}>
              {provinces.map(province => (
                <div
                  key={province}
                  onClick={() => handleProvinceSelect(province)}
                  className={`px-3 py-3 text-sm text-center cursor-pointer transition-colors ${
                    province === selectedProvince
                      ? 'bg-white text-orange-600 font-bold border-l-4 border-orange-500'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {province}
                </div>
              ))}
            </div>

            <div className={`${districts.length > 0 ? 'flex-1' : 'w-1/2'} overflow-y-auto overscroll-contain bg-white`}>
              {cities.map(city => (
                <div
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className={`px-3 py-3 text-sm text-center cursor-pointer transition-colors flex items-center justify-between ${
                    city === selectedCity
                      ? 'text-orange-600 font-bold bg-orange-50/20'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{city}</span>
                  {city === selectedCity && <Check size={16} className="text-orange-500" />}
                </div>
              ))}
              {cities.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                  暂无城市数据
                </div>
              )}
            </div>

            {districts.length > 0 && (
              <div className="flex-1 overflow-y-auto overscroll-contain bg-white/50">
                {districts.map(district => (
                  <div
                    key={district}
                    onClick={() => setSelectedDistrict(district)}
                    className={`px-3 py-3 text-sm text-center cursor-pointer transition-colors flex items-center justify-between ${
                      district === selectedDistrict
                        ? 'text-orange-600 font-bold bg-orange-50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{district}</span>
                    {district === selectedDistrict && <Check size={16} className="text-orange-500" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pb-safe bg-white" />
      </div>
    </div>
  );
};

export default RegionPicker;
