import React, { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { getProvinces, getCities, getDistricts } from '../../utils/regions';

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

/**
 * 地区选择器组件
 * 
 * 底部弹出的滚动选择器，用于选择省份、城市和区县
 * 
 * @example
 * ```tsx
 * <RegionPicker
 *   visible={showPicker}
 *   onClose={() => setShowPicker(false)}
 *   onConfirm={(province, city, district) => {
 *     setAddress(prev => ({ ...prev, province, city, district }));
 *     setShowPicker(false);
 *   }}
 *   initialProvince={address.province}
 *   initialCity={address.city}
 *   initialDistrict={address.district}
 * />
 * ```
 */
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

    // 选择状态
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');

    // 数据源
    const provinces = useMemo(() => getProvinces(), []);
    const cities = useMemo(() => getCities(selectedProvince), [selectedProvince]);
    const districts = useMemo(() => getDistricts(selectedProvince, selectedCity), [selectedProvince, selectedCity]);

    // 处理显示/隐藏动画
    useEffect(() => {
        if (visible) {
            setRender(true);
            // 下一帧开始动画
            requestAnimationFrame(() => setAnimating(true));

            // 初始化选中状态
            if (initialProvince && provinces.includes(initialProvince)) {
                setSelectedProvince(initialProvince);
                const availableCities = getCities(initialProvince);
                if (initialCity && availableCities.includes(initialCity)) {
                    setSelectedCity(initialCity);
                    const availableDistricts = getDistricts(initialProvince, initialCity);
                    if (initialDistrict && availableDistricts.includes(initialDistrict)) {
                        setSelectedDistrict(initialDistrict);
                    } else if (availableDistricts.length > 0) {
                        setSelectedDistrict(availableDistricts[0]);
                    } else {
                        setSelectedDistrict('');
                    }
                } else if (availableCities.length > 0) {
                    setSelectedCity(availableCities[0]);
                    const firstDistricts = getDistricts(initialProvince, availableCities[0]);
                    setSelectedDistrict(firstDistricts.length > 0 ? firstDistricts[0] : '');
                }
            } else if (provinces.length > 0) {
                // 默认选中第一个
                const firstProvince = provinces[0];
                setSelectedProvince(firstProvince);
                const firstCities = getCities(firstProvince);
                if (firstCities.length > 0) {
                    setSelectedCity(firstCities[0]);
                    const firstDistricts = getDistricts(firstProvince, firstCities[0]);
                    setSelectedDistrict(firstDistricts.length > 0 ? firstDistricts[0] : '');
                }
            }
        } else {
            setAnimating(false);
            // 动画结束后移除 DOM
            const timer = setTimeout(() => setRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [visible, initialProvince, initialCity, initialDistrict, provinces]);

    // 处理省份变化
    const handleProvinceSelect = (province: string) => {
        if (province === selectedProvince) return;

        setSelectedProvince(province);
        // 自动选中第一个城市
        const newCities = getCities(province);
        if (newCities.length > 0) {
            setSelectedCity(newCities[0]);
            const newDistricts = getDistricts(province, newCities[0]);
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
        const newDistricts = getDistricts(selectedProvince, city);
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
