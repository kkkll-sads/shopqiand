/**
 * 地区选择器组件
 * 使用 element-china-area-data npm 包提供完整的中国省市区数据
 */
import React, { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { pcaTextArr } from 'element-china-area-data';

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
 * 将 element-china-area-data 的级联格式转换为组件期望的扁平格式
 * 从 { label, value, children: [...] } 转换为 { [省]: { cities: [...], districts: { [市]: [...] } } }
 */
const convertToFlatFormat = (): Record<string, ProvinceData> => {
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

// 缓存转换后的数据
const cachedRegionData: Record<string, ProvinceData> = convertToFlatFormat();

const RegionPicker: React.FC<RegionPickerProps> = ({
    visible,
    onClose,
    onConfirm,
    initialProvince = '',
    initialCity = '',
    initialDistrict = '',
}) => {
    // 动画状态
    const [animating, setAnimating] = useState(false);
    const [render, setRender] = useState(false);

    // 直接使用缓存数据，无需异步加载
    const regionData = cachedRegionData;

    // 选择状态
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');

    // 计算衍生数据
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

    // 处理显示/隐藏动画及初始化
    useEffect(() => {
        if (visible) {
            setRender(true);
            requestAnimationFrame(() => setAnimating(true));

            // 如果数据已加载，进行初始化选中
            if (Object.keys(regionData).length > 0) {
                initSelection();
            }
        } else {
            setAnimating(false);
            const timer = setTimeout(() => setRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [visible, regionData]); // 添加 regionData 依赖，确保数据加载后能初始化

    // 初始化选中逻辑抽离
    const initSelection = () => {
        // 如果已经有选中值且在新的打开行为中我们想保留，可以不重置。
        // 但通常 region picker 每次打开可能希望回显 initialProps。

        // 只有当当前没有有效选中 或者 需要强制回显 initial 时执行
        // 这里简单处理：优先回显 initial

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
                // 级联选择第一个区
                const firstDistricts = regionData[initialProvince]?.districts?.[availableCities[0]] || [];
                setSelectedDistrict(firstDistricts.length > 0 ? firstDistricts[0] : '');
            }
        } else {
            // 默认选中第一个
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

    // 如果 visible 且数据刚加载完，也尝试初始化 (在 useEffect [visible, regionData] 中处理了)

    // 处理省份变化
    const handleProvinceSelect = (province: string) => {
        if (province === selectedProvince) return;

        setSelectedProvince(province);
        // 自动选中第一个城市
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

    // 处理城市变化
    const handleCitySelect = (city: string) => {
        if (city === selectedCity) return;

        setSelectedCity(city);
        // 自动选中第一个区县
        const newDistricts = regionData[selectedProvince]?.districts?.[city] || [];
        setSelectedDistrict(newDistricts.length > 0 ? newDistricts[0] : '');
    };


    // 处理点击确认
    const handleConfirm = () => {
        if (selectedProvince && selectedCity) {
            onConfirm(selectedProvince, selectedCity, selectedDistrict || undefined);
        }
    };

    if (!render) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
            {/* 遮罩层 */}
            <div
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${animating ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* 内容区域 */}
            <div
                className={`relative bg-white rounded-t-2xl w-full max-h-[70vh] flex flex-col transition-transform duration-300 ease-out ${animating ? 'translate-y-0' : 'translate-y-full'
                    }`}
            >
                {/* 标题栏 */}
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

                {/* 现在的选择展示 */}
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

                {/* 滚动选择区域 */}
                <div className={`flex h-64 overflow-hidden ${districts.length > 0 ? 'divide-x' : ''}`}>
                    {/* 左侧：省份列表 */}
                    <div className={`${districts.length > 0 ? 'flex-1' : 'w-1/2'} overflow-y-auto border-r border-gray-100 overscroll-contain bg-gray-50/50`}>
                        {provinces.map(province => (
                            <div
                                key={province}
                                onClick={() => handleProvinceSelect(province)}
                                className={`px-3 py-3 text-sm text-center cursor-pointer transition-colors ${province === selectedProvince
                                    ? 'bg-white text-orange-600 font-bold border-l-4 border-orange-500'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {province}
                            </div>
                        ))}
                    </div>

                    {/* 中间：城市列表 */}
                    <div className={`${districts.length > 0 ? 'flex-1' : 'w-1/2'} overflow-y-auto overscroll-contain bg-white`}>
                        {cities.map(city => (
                            <div
                                key={city}
                                onClick={() => handleCitySelect(city)}
                                className={`px-3 py-3 text-sm text-center cursor-pointer transition-colors flex items-center justify-between ${city === selectedCity
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

                    {/* 右侧：区县列表 (仅在有数据时显示) */}
                    {districts.length > 0 && (
                        <div className="flex-1 overflow-y-auto overscroll-contain bg-white/50">
                            {districts.map(district => (
                                <div
                                    key={district}
                                    onClick={() => setSelectedDistrict(district)}
                                    className={`px-3 py-3 text-sm text-center cursor-pointer transition-colors flex items-center justify-between ${district === selectedDistrict
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

                {/* 底部安全区 */}
                <div className="pb-safe bg-white" />
            </div>
        </div>
    );
};

export default RegionPicker;
