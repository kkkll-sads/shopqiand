import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, MessageCircleQuestion, WifiOff, X } from 'lucide-react';
import { shopProductQaApi, type ShopProductQaItem, type ShopProductQaSort } from '../../api';
import { getErrorMessage, isAbortError } from '../../api/core/errors';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';

const FILTER_OPTIONS: Array<{ id: ShopProductQaSort; label: string }> = [
  { id: 'hottest', label: '最热' },
  { id: 'latest', label: '最新' },
];

const MIN_QUESTION_LENGTH = 4;
const MAX_QUESTION_LENGTH = 200;

export const ProductQAPage = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showToast } = useFeedback();

  const [activeFilter, setActiveFilter] = useSessionState<ShopProductQaSort>(
    'product-qa:filter',
    'hottest',
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [questions, setQuestions] = useState<ShopProductQaItem[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const loadQuestions = async (signal?: AbortSignal, sort: ShopProductQaSort = activeFilter) => {
    if (!Number.isFinite(productId) || productId <= 0) {
      setQuestions([]);
      setError(new Error('商品参数错误'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await shopProductQaApi.list(productId, sort, { signal });
      setQuestions(response.list);
    } catch (nextError) {
      if (isAbortError(nextError)) {
        return;
      }
      setQuestions([]);
      setError(nextError instanceof Error ? nextError : new Error('加载问答失败'));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadQuestions(controller.signal);
    return () => controller.abort();
  }, [productId, activeFilter]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: `product-qa:${productId}:${activeFilter}`,
    restoreDeps: [productId, activeFilter, loading, Boolean(error), questions.length],
    restoreWhen: !loading && !error && !showComposer,
    enabled: Number.isFinite(productId) && productId > 0,
  });

  const handleRefresh = async () => {
    refreshStatus();
    await loadQuestions();
  };

  const handleOpenComposer = () => {
    if (!isAuthenticated) {
      goTo('login');
      return;
    }
    setShowComposer(true);
  };

  const handleSubmitQuestion = async () => {
    const content = questionText.trim();
    if (submitting) {
      return;
    }

    if (content.length < MIN_QUESTION_LENGTH) {
      showToast({ message: `问题内容至少 ${MIN_QUESTION_LENGTH} 个字`, type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await shopProductQaApi.ask({ productId, content });
      showToast({ message: '提问成功，已提交审核', type: 'success' });
      setQuestionText('');
      setShowComposer(false);
      if (activeFilter !== 'latest') {
        setActiveFilter('latest');
      } else {
        await loadQuestions(undefined, 'latest');
      }
    } catch (nextError) {
      showToast({ message: getErrorMessage(nextError), type: 'error', duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = () => (
    <div className="relative z-40 shrink-0 border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
      {isOffline ? (
        <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-primary-start dark:border-red-500/15 dark:bg-red-500/12 dark:text-red-300">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络连接不稳定，请检查后重试</span>
          </div>
          <button
            type="button"
            onClick={() => {
              void handleRefresh();
            }}
            className="rounded bg-bg-card px-2 py-1 font-medium text-text-main shadow-soft"
          >
            刷新
          </button>
        </div>
      ) : null}

      <div className="flex h-11 items-center justify-between px-3">
        <div className="flex w-1/3 items-center">
          <button type="button" onClick={goBack} className="p-1 -ml-1 text-gray-900 active:opacity-70 dark:text-gray-100">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="w-1/3 text-center text-2xl font-medium text-gray-900 dark:text-gray-100">问大家</h1>
        <div className="w-1/3" />
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center space-x-6">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActiveFilter(option.id)}
            className={`relative pb-1 text-md font-medium transition-colors ${
              activeFilter === option.id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {option.label}
            {activeFilter === option.id ? (
              <div className="absolute bottom-0 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-brand-start" />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-3 p-3">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="rounded-xl bg-white p-4 animate-pulse dark:bg-gray-900">
          <div className="mb-3 flex items-start">
            <div className="mr-2 h-5 w-5 shrink-0 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="flex items-start">
            <div className="mr-2 h-5 w-5 shrink-0 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return renderSkeleton();
    }

    if (error) {
      return <ErrorState message={getErrorMessage(error)} onRetry={() => void handleRefresh()} />;
    }

    if (questions.length === 0) {
      return <EmptyState icon={<MessageCircleQuestion size={48} />} message="还没有人提问，来发第一个问题吧" />;
    }

    return (
      <div className="space-y-3 p-3 pb-24">
        {questions.map((item) => (
          <div key={item.id} className="rounded-xl bg-white p-4 dark:bg-gray-900">
            <div className="mb-3 flex items-start">
              <span className="mr-2 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-[#ff9600] text-sm font-bold text-white">
                问
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium leading-snug text-gray-900 dark:text-gray-100">
                    {item.question}
                  </h3>
                  {item.isHot ? (
                    <span className="ml-2 shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">
                      热门
                    </span>
                  ) : null}
                </div>
                {item.asker ? (
                  <div className="mt-1 text-sm text-text-sub">提问者：{item.asker}</div>
                ) : null}
              </div>
            </div>

            <div className="mb-3 flex items-start">
              <span
                className={`mr-2 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-sm font-bold text-white ${
                  item.hasAnswer ? 'bg-[#25b513]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                答
              </span>
              <div className="flex-1">
                <p
                  className={`text-md leading-relaxed ${
                    item.hasAnswer ? 'text-gray-600 dark:text-gray-400' : 'text-text-sub'
                  }`}
                >
                  {item.answer}
                </p>
                {item.answerer ? (
                  <div className="mt-2 text-sm text-text-sub">回复方：{item.answerer}</div>
                ) : null}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-3 text-sm text-gray-400 dark:border-gray-800 dark:text-gray-500">
              <span>{item.time || '刚刚'}</span>
              <span>{item.answerCount > 0 ? `共 ${item.answerCount} 条回复` : '等待回复中'}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const currentLength = questionText.trim().length;

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-bg-hover dark:bg-gray-950">
      {renderHeader()}
      {renderFilters()}

      <PullToRefreshContainer className="flex-1" onRefresh={handleRefresh} disabled={loading || showComposer}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          {renderContent()}
        </div>
      </PullToRefreshContainer>

      {!loading && !error ? (
        <div className="absolute right-0 bottom-0 left-0 z-40 border-t border-gray-100 bg-white px-4 py-3 pb-safe dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={handleOpenComposer}
            className="h-[40px] w-full rounded-full bg-gradient-to-r from-brand-start to-brand-end text-lg font-medium text-white shadow-sm transition-opacity active:opacity-80"
          >
            {isAuthenticated ? '向买过的人提问' : '登录后提问'}
          </button>
        </div>
      ) : null}

      {showComposer ? (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowComposer(false)} />
          <div className="relative z-10 rounded-t-2xl bg-white pb-safe animate-in slide-in-from-bottom-full duration-300 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-border-light p-4">
              <h3 className="text-xl font-medium text-text-main">发起提问</h3>
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="p-1 text-text-sub active:text-text-main"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="rounded-2xl border border-border-light bg-bg-card p-3">
                <textarea
                  value={questionText}
                  onChange={(event) => {
                    const nextValue = event.target.value.slice(0, MAX_QUESTION_LENGTH);
                    setQuestionText(nextValue);
                  }}
                  placeholder="请输入你想了解的问题，至少 4 个字"
                  rows={5}
                  className="w-full resize-none bg-transparent text-base leading-7 text-text-main outline-none placeholder:text-text-aux"
                />
                <div className="mt-3 flex items-center justify-between text-sm text-text-sub">
                  <span>问题会公开展示，请避免填写隐私信息</span>
                  <span>{currentLength}/{MAX_QUESTION_LENGTH}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-4 pb-4">
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="h-11 flex-1 rounded-full border border-border-main bg-bg-card text-lg font-medium text-text-main active:bg-gray-50 dark:bg-gray-800 dark:active:bg-gray-700"
              >
                取消
              </button>
              <button
                type="button"
                disabled={submitting || currentLength < MIN_QUESTION_LENGTH}
                onClick={() => void handleSubmitQuestion()}
                className={`h-11 flex-1 rounded-full text-lg font-medium ${
                  submitting || currentLength < MIN_QUESTION_LENGTH
                    ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    : 'bg-gradient-to-r from-brand-start to-brand-end text-white active:opacity-80'
                }`}
              >
                {submitting ? '提交中' : '提交问题'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
