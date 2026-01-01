import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, X, Clock, ExternalLink } from 'lucide-react';
import { queryCollectionByCode, CollectionItemDetail } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { LoadingSpinner } from '../../components/common';
import ProductDetail from './ProductDetail';
import { Route } from '../../router/routes';
import { Product } from '../../types';
import { isSuccess, extractError } from '../../utils/apiHelpers';

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_COUNT = 10;

interface SearchPageProps {
    onBack: () => void;
    onNavigate: (route: Route) => void;
    initialCode?: string; // 从外部传入的初始搜索码（如从详情页"去查证"按钮）
}

const SearchPage: React.FC<SearchPageProps> = ({ onBack, onNavigate, initialCode }) => {
    const { showToast } = useNotification();
    const [searchCode, setSearchCode] = useState<string>(initialCode || '');
    const [searching, setSearching] = useState<boolean>(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [searchResult, setSearchResult] = useState<CollectionItemDetail | null>(null);
    const [showResult, setShowResult] = useState<boolean>(false);

    // 加载搜索历史
    useEffect(() => {
        loadSearchHistory();
    }, []);

    // 如果有初始搜索码，自动执行搜索
    useEffect(() => {
        if (initialCode) {
            handleSearch(initialCode);
        }
    }, [initialCode]);

    const loadSearchHistory = () => {
        try {
            const history = localStorage.getItem(SEARCH_HISTORY_KEY);
            if (history) {
                setSearchHistory(JSON.parse(history));
            }
        } catch (error) {
            console.error('加载搜索历史失败:', error);
        }
    };

    const saveSearchHistory = (code: string) => {
        try {
            const history = [...searchHistory];
            // 移除重复项
            const index = history.indexOf(code);
            if (index > -1) {
                history.splice(index, 1);
            }
            // 添加到开头
            history.unshift(code);
            // 限制数量
            const newHistory = history.slice(0, MAX_HISTORY_COUNT);
            setSearchHistory(newHistory);
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error('保存搜索历史失败:', error);
        }
    };

    const clearSearchHistory = () => {
        try {
            localStorage.removeItem(SEARCH_HISTORY_KEY);
            setSearchHistory([]);
            showToast('success', '已清空搜索历史');
        } catch (error) {
            console.error('清空搜索历史失败:', error);
        }
    };

    const handleSearch = async (code?: string) => {
        const searchValue = code || searchCode.trim();
        if (!searchValue) {
            showToast('warning', '提示', '请输入确权编号或MD5指纹');
            return;
        }

        setSearching(true);
        try {
            const response = await queryCollectionByCode({ code: searchValue });
            if (isSuccess(response) && response.data) {
                setSearchResult(response.data);
                setShowResult(true);
                saveSearchHistory(searchValue);
            } else {
                showToast('error', '查询失败', extractError(response, '未找到匹配的藏品'));
            }
        } catch (error: any) {
            console.error('搜索失败:', error);
            showToast('error', '查询失败', error.message || '网络错误，请稍后重试');
        } finally {
            setSearching(false);
        }
    };

    const handleHistoryClick = (code: string) => {
        setSearchCode(code);
        handleSearch(code);
    };

    const convertToProduct = (item: CollectionItemDetail): Product => {
        return {
            id: String(item.id),
            title: item.title,
            artist: item.core_enterprise || '未知',
            price: item.price,
            image: item.image,
            category: 'collection',
            productType: 'collection',
            sessionId: item.session_id,
            zoneId: item.zone_id,
        };
    };

    // 如果正在展示搜索结果，使用 ProductDetail 组件
    if (showResult && searchResult) {
        return (
            <ProductDetail
                product={convertToProduct(searchResult)}
                onBack={() => {
                    setShowResult(false);
                    setSearchResult(null);
                }}
                onNavigate={onNavigate}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* 顶部搜索栏 */}
            <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft size={20} className="text-gray-700" />
                    </button>
                    
                    <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                            placeholder="输入确权编号或MD5指纹"
                            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
                        />
                        {searchCode && (
                            <button
                                onClick={() => setSearchCode('')}
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X size={16} className="text-gray-500" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => handleSearch()}
                        disabled={searching}
                        className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                        {searching ? <LoadingSpinner size="sm" color="white" /> : '搜索'}
                    </button>
                </div>
            </div>

            {/* 搜索历史 */}
            <div className="flex-1 p-4">
                {searchHistory.length > 0 && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-gray-400" />
                                <h3 className="text-sm font-medium text-gray-900">搜索历史</h3>
                            </div>
                            <button
                                onClick={clearSearchHistory}
                                className="text-xs text-gray-400 hover:text-gray-600"
                            >
                                清空
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            {searchHistory.map((code, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleHistoryClick(code)}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                >
                                    <span className="text-sm text-gray-700 font-mono truncate">
                                        {code}
                                    </span>
                                    <ExternalLink size={14} className="text-gray-400" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {searchHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">暂无搜索历史</p>
                        <p className="text-xs mt-2">输入确权编号或MD5指纹开始查询</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;

