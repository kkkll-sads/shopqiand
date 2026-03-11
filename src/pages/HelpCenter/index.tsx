import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  HeadphonesIcon,
  HelpCircle,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { helpApi, type HelpCategory, type HelpQuestion } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';
import { openCustomerServiceLink } from '../../lib/customerService';

const EMPTY_CATEGORIES = { list: [] as HelpCategory[] };
const EMPTY_QUESTIONS = { list: [] as HelpQuestion[] };

function HelpCenterSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Card className="space-y-4 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-full" />
      </Card>

      <Card className="p-4 shadow-sm">
        <Skeleton className="mb-4 h-5 w-24" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-2xl bg-bg-base px-3 py-4 text-center">
              <Skeleton className="mx-auto mb-3 h-6 w-6 rounded-full" />
              <Skeleton className="mx-auto h-4 w-16" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 shadow-sm">
        <Skeleton className="mb-4 h-5 w-24" />
        <div className="mb-3 flex gap-2">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-14 rounded-2xl" />
          ))}
        </div>
      </Card>
    </div>
  );
}

export const HelpCenterPage = () => {
  const { goBackOr, goTo } = useAppNavigate();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showToast } = useFeedback();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeCategory, setActiveCategory] = useSessionState<number | null>(
    'help-center:active-cat',
    null,
  );
  const [expandedFaq, setExpandedFaq] = useSessionState<number | null>(
    'help-center:expanded-faq',
    null,
  );

  const categoriesRequest = useRequest((signal) => helpApi.getCategories(signal), {
    initialData: EMPTY_CATEGORIES,
  });

  const categories = categoriesRequest.data?.list ?? [];
  const selectedCategoryId = activeCategory ?? categories[0]?.id ?? null;

  useEffect(() => {
    if (categories.length === 0) {
      if (activeCategory != null) {
        setActiveCategory(null);
      }
      return;
    }

    const exists = categories.some((item) => item.id === activeCategory);
    if (!exists) {
      setActiveCategory(categories[0].id);
    }
  }, [activeCategory, categories, setActiveCategory]);

  const questionsRequest = useRequest(
    (signal) => {
      if (!selectedCategoryId) {
        return Promise.resolve(EMPTY_QUESTIONS);
      }

      return helpApi.getQuestions({ category_id: selectedCategoryId }, signal);
    },
    {
      deps: [selectedCategoryId],
      initialData: EMPTY_QUESTIONS,
      keepPreviousData: false,
    },
  );

  const questions = questionsRequest.data?.list ?? [];
  const isInitialLoading = categoriesRequest.loading && categories.length === 0;

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'help-center-page',
    restoreDeps: [selectedCategoryId, expandedFaq, categories.length, questions.length],
    restoreWhen: !isInitialLoading,
  });

  useEffect(() => {
    setExpandedFaq(null);
  }, [selectedCategoryId, setExpandedFaq]);

  const handleRefresh = useCallback(async () => {
    await categoriesRequest.reload().catch(() => undefined);
    await questionsRequest.reload().catch(() => undefined);
  }, [categoriesRequest, questionsRequest]);

  const handleCategoryChange = useCallback(
    (categoryId: number) => {
      setActiveCategory(categoryId);
    },
    [setActiveCategory],
  );

  const toggleFaq = useCallback(
    (faqId: number) => {
      setExpandedFaq((current) => (current === faqId ? null : faqId));
    },
    [setExpandedFaq],
  );

  const handleOpenCS = useCallback(async () => {
    await openCustomerServiceLink(showToast);
  }, [showToast]);

  const renderFaqBody = () => {
    if (questionsRequest.loading && questions.length === 0) {
      return (
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-14 rounded-2xl" />
          ))}
        </div>
      );
    }

    if (questionsRequest.error) {
      return (
        <div className="py-6">
          <ErrorState
            message={getErrorMessage(questionsRequest.error)}
            onRetry={() => void questionsRequest.reload()}
          />
        </div>
      );
    }

    if (questions.length === 0) {
      return (
        <div className="py-8">
          <EmptyState
            icon={<HelpCircle size={40} />}
            message={selectedCategoryId ? '该分类下暂无常见问题' : '暂无帮助内容'}
          />
        </div>
      );
    }

    return (
      <div className="mt-2 flex flex-col">
        {questions.map((faq) => {
          const expanded = expandedFaq === faq.id;

          return (
            <div
              key={faq.id}
              className={`overflow-hidden border-b border-border-light last:border-0 ${
                expanded ? 'mx-[-16px] bg-bg-base px-4' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                className="flex w-full items-center justify-between gap-3 py-4 text-left"
              >
                <span className={`text-[15px] ${expanded ? 'font-medium text-primary-start' : 'text-text-main'}`}>
                  {faq.title}
                </span>
                {expanded ? (
                  <ChevronUp size={18} className="shrink-0 text-primary-start" />
                ) : (
                  <ChevronDown size={18} className="shrink-0 text-text-aux" />
                )}
              </button>

              <div
                className={`overflow-hidden text-[13px] leading-6 text-text-sub transition-all duration-300 ${
                  expanded ? 'max-h-[640px] pb-4 opacity-100' : 'max-h-0 opacity-0'
                }`}
                dangerouslySetInnerHTML={{ __html: faq.content }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-bg-base">
        <PageHeader title="客服与帮助" onBack={() => goBackOr('user')} />
        <HelpCenterSkeleton />
      </div>
    );
  }

  if (categoriesRequest.error && categories.length === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-bg-base">
        <PageHeader title="客服与帮助" onBack={() => goBackOr('user')} />
        <div className="flex-1 overflow-y-auto">
          <ErrorState
            message={getErrorMessage(categoriesRequest.error)}
            onRetry={() => void categoriesRequest.reload()}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden bg-bg-base">
        {isOffline && <OfflineBanner onAction={refreshStatus} />}

        <PageHeader title="客服与帮助" onBack={() => goBackOr('user')} />

        <PullToRefreshContainer onRefresh={handleRefresh} disabled={isOffline}>
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-4">
            <div className="space-y-4 pb-8">
              <Card className="p-5 shadow-sm">
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-primary-start">
                      <HeadphonesIcon size={24} />
                    </div>
                    <div>
                      <h2 className="mb-1 text-[18px] font-medium text-text-main">在线客服</h2>
                      <div className="flex items-center text-[12px] text-text-aux">
                        <Clock size={12} className="mr-1" />
                        <span>工作时间：9:00 - 22:00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleOpenCS()}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-primary-start to-primary-end text-[15px] font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <MessageSquare size={18} className="mr-2" />
                  立即咨询
                </button>
              </Card>

              <Card className="p-4 shadow-sm">
                <h3 className="mb-4 px-1 text-[16px] font-medium text-text-main">自助服务</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className="rounded-2xl py-3 text-center active:bg-bg-base"
                    onClick={() => goTo('announcement')}
                  >
                    <FileText size={24} className="mx-auto mb-2 text-text-sub" />
                    <span className="text-[13px] text-text-main">公告中心</span>
                  </button>

                  <button
                    type="button"
                    className="rounded-2xl py-3 text-center active:bg-bg-base"
                    onClick={() => goTo('message_center')}
                  >
                    <MessageSquare size={24} className="mx-auto mb-2 text-text-sub" />
                    <span className="text-[13px] text-text-main">消息中心</span>
                  </button>

                  <button
                    type="button"
                    className="rounded-2xl py-3 text-center active:bg-bg-base"
                    onClick={() => goTo('announcement')}
                  >
                    <HelpCircle size={24} className="mx-auto mb-2 text-text-sub" />
                    <span className="text-[13px] text-text-main">问题反馈</span>
                  </button>
                </div>
              </Card>

              <Card className="p-4 shadow-sm">
                <h3 className="mb-2 px-1 text-[16px] font-medium text-text-main">常见问题</h3>

                {categories.length > 1 ? (
                  <div className="mb-3 flex gap-2 overflow-x-auto px-1 no-scrollbar">
                    {categories.map((category) => {
                      const active = category.id === selectedCategoryId;

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategoryChange(category.id)}
                          className={`shrink-0 rounded-full border px-3 py-1 text-[12px] transition ${
                            active
                              ? 'border-primary-start/30 bg-red-50 text-primary-start'
                              : 'border-transparent bg-bg-base text-text-sub'
                          }`}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {renderFaqBody()}
              </Card>

              <div className="mb-4 mt-6 flex items-center justify-center text-text-aux">
                <ExternalLink size={12} className="mr-1" />
                <span className="text-[12px]">客服将直接跳转到第三方链接</span>
              </div>
            </div>
          </div>
        </PullToRefreshContainer>
      </div>
    </>
  );
};
