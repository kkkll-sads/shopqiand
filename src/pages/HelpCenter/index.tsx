import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, HeadphonesIcon, Clock, ChevronDown, ChevronUp, FileText, MessageSquare, AlertCircle, WifiOff, RefreshCcw, ExternalLink, HelpCircle } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { helpApi, type HelpCategory, type HelpQuestion } from '../../api';

export const HelpCenterPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [questions, setQuestions] = useState<HelpQuestion[]>([]);
  const [activeCategory, setActiveCategory] = useSessionState<number | null>('help-center:active-cat', null);
  const [expandedFaq, setExpandedFaq] = useSessionState<number | null>('help-center:expanded-faq', null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = async () => {
    if (offline) return;
    setLoading(true);
    setError(false);

    try {
      const catData = await helpApi.getCategories();
      const cats = catData.list ?? [];
      setCategories(cats);

      if (cats.length > 0) {
        const firstCatId = activeCategory ?? cats[0].id;
        if (!activeCategory) setActiveCategory(firstCatId);
        const qData = await helpApi.getQuestions({ category_id: firstCatId });
        setQuestions(qData.list ?? []);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline]);

  const handleCategoryChange = async (catId: number) => {
    setActiveCategory(catId);
    setExpandedFaq(null);
    try {
      const qData = await helpApi.getQuestions({ category_id: catId });
      setQuestions(qData.list ?? []);
    } catch {
      setQuestions([]);
    }
  };

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'help-center-page',
    restoreDeps: [error, expandedFaq, loading],
    restoreWhen: !error && !loading,
  });

  const toggleFaq = (id: number) => {
    setExpandedFaq(prev => prev === id ? null : id);
  };

  const handleOpenCS = () => {
    goTo('live_webview');
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-hover dark:bg-bg-base h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 bg-white dark:bg-bg-card shrink-0 relative z-10">
        <button onClick={() => goBack()} className="p-2 -ml-2 text-text-main dark:text-text-main active:opacity-70">
          <ChevronLeft size={24} />
        </button>
        <span className="text-2xl font-medium text-text-main dark:text-text-main">客服与帮助</span>
        <div className="w-10" />
      </div>

      {/* Offline Banner */}
      {offline && (
        <div className="bg-[#FFF3F3] dark:bg-[#3A1E1E] px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center text-brand-start dark:text-brand-start">
            <WifiOff size={16} className="mr-2" />
            <span className="text-base">网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => fetchData()} className="text-base text-brand-start dark:text-brand-start px-2 py-1 active:opacity-70">
            刷新
          </button>
        </div>
      )}

      {/* Main Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 relative">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <AlertCircle size={64} className="text-text-aux dark:text-text-sub mb-4" />
            <h3 className="text-3xl font-medium text-text-main dark:text-text-main mb-2">加载失败</h3>
            <p className="text-md text-text-sub dark:text-text-aux text-center mb-8">网络不稳定或服务器繁忙，请稍后再试</p>
            <button
              onClick={() => fetchData()}
              className="w-[160px] h-[44px] rounded-3xl bg-gradient-to-r from-brand-start to-brand-end text-white font-medium text-lg active:opacity-80 flex items-center justify-center"
            >
              <RefreshCcw size={18} className="mr-2" />
              重新加载
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            <div className="bg-white dark:bg-bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-bg-hover dark:bg-bg-hover animate-pulse mr-3" />
                  <div>
                    <div className="w-24 h-5 bg-bg-hover dark:bg-bg-hover rounded animate-pulse mb-2" />
                    <div className="w-32 h-4 bg-bg-hover dark:bg-bg-hover rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="w-full h-10 bg-bg-hover dark:bg-bg-hover rounded-2xl animate-pulse" />
            </div>
            <div className="bg-white dark:bg-bg-card rounded-2xl p-4 shadow-sm">
              <div className="w-20 h-5 bg-bg-hover dark:bg-bg-hover rounded animate-pulse mb-4" />
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="py-4 border-b border-border-light dark:border-border-light last:border-0">
                  <div className="w-full h-5 bg-bg-hover dark:bg-bg-hover rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-8">
            {/* Online CS Card */}
            <div className="bg-white dark:bg-bg-card rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-[#FFF3F3] dark:bg-[#3A1E1E] flex items-center justify-center mr-3 shrink-0">
                    <HeadphonesIcon size={24} className="text-brand-start dark:text-brand-start" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-text-main dark:text-text-main mb-1">在线客服</h2>
                    <div className="flex items-center text-sm text-text-aux dark:text-text-sub">
                      <Clock size={12} className="mr-1" />
                      <span>工作时间：09:00 - 22:00</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleOpenCS}
                className="w-full h-[44px] rounded-3xl bg-gradient-to-r from-brand-start to-brand-end text-white font-medium text-lg active:opacity-80 flex items-center justify-center shadow-[0_4px_12px_rgba(226,35,26,0.2)]"
              >
                <MessageSquare size={18} className="mr-2" />
                立即咨询
              </button>
            </div>

            {/* Self-Service Card */}
            <div className="bg-white dark:bg-bg-card rounded-2xl p-4 shadow-sm">
              <h3 className="text-lg font-medium text-text-main dark:text-text-main mb-4 px-1">自助服务</h3>
              <div className="grid grid-cols-3 gap-2">
                <div
                  className="flex flex-col items-center justify-center py-3 active:bg-bg-hover dark:active:bg-[#2A2A2A] rounded-xl"
                  onClick={() => goTo('announcement')}
                >
                  <FileText size={24} className="text-text-sub dark:text-text-aux mb-2" />
                  <span className="text-base text-text-main dark:text-text-main">公告中心</span>
                </div>
                <div
                  className="flex flex-col items-center justify-center py-3 active:bg-bg-hover dark:active:bg-[#2A2A2A] rounded-xl"
                  onClick={() => goTo('message_center')}
                >
                  <MessageSquare size={24} className="text-text-sub dark:text-text-aux mb-2" />
                  <span className="text-base text-text-main dark:text-text-main">消息中心</span>
                </div>
                <div
                  className="flex flex-col items-center justify-center py-3 active:bg-bg-hover dark:active:bg-[#2A2A2A] rounded-xl"
                  onClick={() => goTo('announcement')}
                >
                  <HelpCircle size={24} className="text-text-sub dark:text-text-aux mb-2" />
                  <span className="text-base text-text-main dark:text-text-main">问题反馈</span>
                </div>
              </div>
            </div>

            {/* FAQ Card with Dynamic Categories */}
            <div className="bg-white dark:bg-bg-card rounded-2xl p-4 shadow-sm">
              <h3 className="text-lg font-medium text-text-main dark:text-text-main mb-2 px-1">常见问题</h3>

              {/* Category Tabs */}
              {categories.length > 1 && (
                <div className="flex overflow-x-auto no-scrollbar gap-2 mb-3 px-1">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`whitespace-nowrap px-3 py-1 rounded-full text-sm transition-colors shrink-0 ${
                        activeCategory === cat.id
                          ? 'bg-red-50 text-brand-start font-medium border border-brand-start/30'
                          : 'bg-bg-hover text-text-sub border border-transparent'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col">
                {questions.length === 0 ? (
                  <div className="py-8 text-center text-text-aux text-sm">暂无常见问题</div>
                ) : (
                  questions.map(faq => (
                    <div
                      key={faq.id}
                      className={`border-b border-border-light dark:border-border-light last:border-0 overflow-hidden transition-all duration-300 ${expandedFaq === faq.id ? 'bg-bg-hover dark:bg-bg-hover -mx-4 px-4' : ''}`}
                    >
                      <div
                        className="flex items-center justify-between py-4 active:opacity-70 cursor-pointer"
                        onClick={() => toggleFaq(faq.id)}
                      >
                        <span className={`text-md ${expandedFaq === faq.id ? 'text-brand-start dark:text-brand-start font-medium' : 'text-text-main dark:text-text-main'}`}>
                          {faq.title}
                        </span>
                        {expandedFaq === faq.id ? (
                          <ChevronUp size={18} className="text-brand-start dark:text-brand-start shrink-0 ml-2" />
                        ) : (
                          <ChevronDown size={18} className="text-text-aux dark:text-text-sub shrink-0 ml-2" />
                        )}
                      </div>
                      <div
                        className={`text-base text-text-sub dark:text-text-aux leading-relaxed transition-all duration-300 ease-in-out ${expandedFaq === faq.id ? 'max-h-[500px] pb-4 opacity-100' : 'max-h-0 opacity-0'}`}
                        dangerouslySetInnerHTML={{ __html: faq.content }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Hint */}
            <div className="flex items-center justify-center mt-6 mb-4 text-text-aux dark:text-text-sub">
              <ExternalLink size={12} className="mr-1" />
              <span className="text-sm">客服将以网页形式在App内打开</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
