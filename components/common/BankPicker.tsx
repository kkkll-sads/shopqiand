import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Building2, Search, PlusCircle } from 'lucide-react';
import { getBanks, getBankCodeByName } from '../../utils/banks';
import { getBankIconUrl } from '../../utils/bankIcons';

interface BankPickerProps {
    /** 是否显示 */
    visible: boolean;
    /** 关闭回调 */
    onClose: () => void;
    /** 确认回调 - 返回选中的银行名称 */
    onConfirm: (bankName: string) => void;
    /** 默认选中的银行 */
    initialBank?: string;
}

/**
 * 银行选择器组件
 * 
 * 包含搜索和手动输入功能
 */
const BankPicker: React.FC<BankPickerProps> = ({
    visible,
    onClose,
    onConfirm,
    initialBank = '',
}) => {
    // 动画状态
    const [animating, setAnimating] = useState(false);
    const [render, setRender] = useState(false);

    // 选择状态
    const [selectedBank, setSelectedBank] = useState<string>('');
    const [searchText, setSearchText] = useState('');
    const [isCustomMode, setIsCustomMode] = useState(false); // 是否处于手动输入模式

    // 数据源
    const allBanks = useMemo(() => getBanks(), []);

    // 过滤后的银行列表
    const filteredBanks = useMemo(() => {
        if (!searchText.trim()) return allBanks;
        return allBanks.filter(bank =>
            bank.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [allBanks, searchText]);

    // 处理显示/隐藏动画
    useEffect(() => {
        if (visible) {
            setRender(true);
            requestAnimationFrame(() => setAnimating(true));
            setSearchText('');
            setIsCustomMode(false);

            if (initialBank) {
                // 判断是否是列表中的银行
                const inList = allBanks.includes(initialBank);
                setSelectedBank(initialBank);
                if (!inList && initialBank.trim()) {
                    // 如果不在列表中且有值，可能是之前手动输入的，或者是特殊的
                    // 这里简单处理：只要 initialBank 有值就设为选中，
                    // 如果它不在列表中，我们也可以在 UI 上体现，或者就默认当做普通选中
                }
            }
        } else {
            setAnimating(false);
            const timer = setTimeout(() => setRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [visible, initialBank, allBanks]);

    // 处理点击确认
    const handleConfirm = () => {
        if (isCustomMode) {
            if (searchText.trim()) {
                onConfirm(searchText.trim());
            }
        } else {
            if (selectedBank) {
                onConfirm(selectedBank);
            }
        }
    };

    // 使用手动输入的银行
    const handleUseCustom = () => {
        if (searchText.trim()) {
            onConfirm(searchText.trim());
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
                className={`relative bg-white rounded-t-2xl w-full max-h-[85vh] flex flex-col transition-transform duration-300 ease-out ${animating ? 'translate-y-0' : 'translate-y-full'
                    }`}
            >
                {/* 标题栏 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="text-gray-400 p-1 active:bg-gray-50 rounded-full"
                    >
                        <X size={20} />
                    </button>
                    <span className="text-base font-bold text-gray-800">
                        {isCustomMode ? '手动输入银行' : '选择银行'}
                    </span>
                    {!isCustomMode && (
                        <button
                            onClick={handleConfirm}
                            className="text-orange-600 font-medium text-sm p-1 active:opacity-70"
                        >
                            确定
                        </button>
                    )}
                    {isCustomMode && (
                        <div className="w-8"></div> // 占位
                    )}
                </div>

                {/* 搜索栏 */}
                <div className="px-4 py-3 border-b border-gray-50 bg-white flex-shrink-0">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="搜索或输入银行名称"
                            className="w-full bg-gray-100 text-sm text-gray-900 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all"
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                if (isCustomMode && !e.target.value) setIsCustomMode(false);
                            }}
                            onFocus={() => {
                                // 聚焦时如果不完全匹配任何银行，可以提示手动输入
                            }}
                        />
                        {searchText && (
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                                onClick={() => setSearchText('')}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* 列表区域 */}
                <div className="flex-1 overflow-y-auto min-h-[300px] overscroll-contain bg-white pb-safe">
                    {/* 手动输入选项 - 当搜索无果或用户想手动输入时 */}
                    {searchText && !filteredBanks.some(b => b === searchText) && (
                        <div
                            onClick={handleUseCustom}
                            className="px-5 py-4 text-sm flex items-center gap-3 cursor-pointer border-b border-gray-50 active:bg-gray-50 transition-colors text-orange-600 bg-orange-50/10"
                        >
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                                <PlusCircle size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">使用 "{searchText}"</span>
                                <span className="text-xs text-gray-500 mt-0.5">找不到银行？点击直接使用输入名称</span>
                            </div>
                        </div>
                    )}

                    {filteredBanks.map(bank => {
                        const bankCode = getBankCodeByName(bank);
                        const iconUrl = bankCode ? getBankIconUrl(bankCode) : '/images/banks/default.png';

                        return (
                            <div
                                key={bank}
                                onClick={() => {
                                    setSelectedBank(bank);
                                    setIsCustomMode(false);
                                }}
                                className={`px-5 py-3.5 text-sm flex items-center justify-between cursor-pointer border-b border-gray-50 active:bg-gray-50 transition-colors ${bank === selectedBank
                                    ? 'text-orange-600 font-medium bg-orange-50/20'
                                    : 'text-gray-700'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={iconUrl}
                                        alt={bank}
                                        className="w-6 h-6 object-contain rounded"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/banks/default.png';
                                        }}
                                    />
                                    <span>{bank}</span>
                                </div>
                                {bank === selectedBank && <Check size={18} className="text-orange-500" />}
                            </div>
                        );
                    })}

                    {filteredBanks.length === 0 && !searchText && (
                        <div className="py-12 text-center text-gray-400 text-xs">
                            暂无银行数据
                        </div>
                    )}

                    {filteredBanks.length === 0 && searchText && (
                        <div className="py-8 text-center text-gray-400 text-xs">
                            没有找到匹配的银行，请使用上方"手动输入"
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BankPicker;
