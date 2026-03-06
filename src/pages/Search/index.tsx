import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Search as SearchIcon, XCircle, Trash2, Clock, ArrowUpLeft, Flame, WifiOff, RefreshCcw, FileX } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

export const SearchPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(true);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  const [emptyResult, setEmptyResult] = useState(false);
  const [history, setHistory] = useState(['iPhone 15 Pro', '华为Mate 60', '机械键盘', '咖啡豆', '洗发水']);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const hotSearches = [
    { id: 1, text: 'Apple iPhone 15', hot: true },
    { id: 2, text: '小米14', hot: true },
    { id: 3, text: '华为Mate 60 Pro', hot: true },
    { id: 4, text: '大疆无人机', hot: false },
    { id: 5, text: '索尼微单', hot: false },
    { id: 6, text: '任天堂 Switch', hot: false },
    { id: 7, text: '戴森吹风机', hot: false },
    { id: 8, text: '飞利浦电动牙刷', hot: false },
    { id: 9, text: '三只松鼠坚果', hot: false },
    { id: 10, text: '蒙牛纯牛奶', hot: false },
  ];

  const suggestions = [
    '苹果手机',
    '苹果耳机',
    '苹果平板',
    '苹果手表',
    '苹果充电器'
  ];

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    goBack();
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.trim() === '') return;
    
    // Add to history
    if (!history.includes(text)) {
      setHistory([text, ...history].slice(0, 10));
    }
    
    // Navigate to search result page
    goTo('search_result');
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative border-b border-border-light pb-2">
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}
      <div className="h-12 flex items-center px-3 pt-safe">
        <button onClick={handleBack} className="p-1 mr-1 text-text-main active:opacity-70">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 flex items-center bg-bg-base h-8 rounded-full px-3 mr-3 border border-border-light focus-within:border-primary-start/50 transition-colors">
          <SearchIcon size={16} className="text-text-aux mr-2 shrink-0" />
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="搜索商品/SKU" 
            className="bg-transparent border-none outline-none text-base text-text-main w-full placeholder:text-text-aux"
          />
          {query && (
            <button 
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="p-1 text-text-aux hover:text-text-sub active:opacity-70 shrink-0"
            >
              <XCircle size={14} className="fill-text-aux text-white" />
            </button>
          )}
        </div>
        <button 
          onClick={() => handleSearch(query)}
          className="bg-gradient-to-r from-primary-start to-primary-end text-white text-base font-medium px-3.5 py-1.5 rounded-full shadow-sm active:opacity-80 shrink-0"
        >
          搜索
        </button>
      </div>
    </div>
  );

  const renderSuggestions = () => {
    if (!query || !isFocused) return null;

    return (
      <div className="absolute top-[calc(env(safe-area-inset-top)+48px)] left-0 right-0 bottom-0 bg-bg-base z-30 overflow-y-auto">
        <div className="bg-white dark:bg-gray-900">
          {suggestions.map((item, index) => (
            <div 
              key={index}
              onClick={() => handleSearch(item)}
              className="flex items-center justify-between px-4 py-3 border-b border-border-light active:bg-bg-base cursor-pointer"
            >
              <div className="flex items-center text-md">
                <span className="text-primary-start">{query}</span>
                <span className="text-text-main">{item.replace('苹果', '')}</span>
              </div>
              <ArrowUpLeft size={16} className="text-text-aux" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    if (history.length === 0) return null;
    
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-md font-bold text-text-main">历史搜索</h3>
          <button onClick={handleClearHistory} className="p-1 text-text-aux active:opacity-70">
            <Trash2 size={14} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {history.map((item, index) => (
            <div 
              key={index}
              onClick={() => handleSearch(item)}
              className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full text-sm text-text-main border border-border-light shadow-sm active:bg-bg-base cursor-pointer"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHotSearches = () => {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-border-light">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-bold text-text-main flex items-center">
            树交所热搜
            <Flame size={14} className="text-primary-start ml-1" />
          </h3>
          <span className="text-s text-text-aux">实时更新</span>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="w-4 h-4 rounded mr-2 shrink-0" />
                <Skeleton className="w-24 h-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            {hotSearches.map((item, index) => {
              const isTop3 = index < 3;
              return (
                <div 
                  key={item.id} 
                  onClick={() => handleSearch(item.text)}
                  className="flex items-center cursor-pointer active:opacity-70"
                >
                  <span className={`w-4 text-center text-base font-bold mr-2 shrink-0 ${
                    isTop3 ? 'text-primary-start' : 'text-text-aux'
                  }`}>
                    {index + 1}
                  </span>
                  <span className={`text-base truncate flex-1 ${
                    isTop3 ? 'text-text-main font-medium' : 'text-text-sub'
                  }`}>
                    {item.text}
                  </span>
                  {item.hot && (
                    <span className="text-2xs text-primary-start bg-red-50 px-1 rounded-sm ml-1 shrink-0">热</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (moduleError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <RefreshCcw size={32} className="text-text-aux mb-3" />
          <p className="text-md text-text-sub mb-4">搜索服务暂时不可用</p>
          <button 
            onClick={() => { setLoading(true); setModuleError(false); }} 
            className="px-6 py-2 border border-border-light rounded-full text-base text-text-main bg-white dark:bg-gray-900 shadow-sm active:bg-bg-base"
          >
            重试
          </button>
        </div>
      );
    }

    if (emptyResult && !isFocused && query) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <FileX size={48} className="text-text-aux mb-4 opacity-50" strokeWidth={1.5} />
          <p className="text-lg font-medium text-text-main mb-1">没找到相关商品</p>
          <p className="text-base text-text-sub mb-6">换个词搜搜，或者去分类看看</p>
          <button 
            onClick={() => goTo('category')}
            className="px-6 py-2 bg-white dark:bg-gray-900 border border-border-light rounded-full text-base text-text-main shadow-sm active:bg-bg-base"
          >
            去分类逛逛
          </button>
        </div>
      );
    }

    if (!isFocused && query && !emptyResult) {
      // Simulate search results view
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-md text-text-sub mb-4">正在搜索: <span className="text-primary-start font-bold">{query}</span></p>
          <p className="text-sm text-text-aux">（此处应展示搜索结果列表）</p>
          <button 
            onClick={() => setIsFocused(true)}
            className="mt-4 px-4 py-1.5 bg-white dark:bg-gray-900 border border-border-light rounded-full text-sm text-text-main shadow-sm"
          >
            重新搜索
          </button>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        {renderHistory()}
        {renderHotSearches()}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative h-full">
      

      {renderHeader()}
      {renderSuggestions()}
      {renderContent()}
    </div>
  );
};
