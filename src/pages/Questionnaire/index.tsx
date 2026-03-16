import { useMemo, useRef, useState } from 'react';
import { ClipboardList, FileText, Sparkles } from 'lucide-react';
import { questionnaireApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useAppNavigate } from '../../lib/navigation';

const DAILY_LIMIT = 3;
const TITLE_MAX = 30;
const CONTENT_MAX = 500;

function formatDate(value: string, fallbackTimestamp: number) {
  if (value.trim()) {
    return value;
  }

  if (!Number.isFinite(fallbackTimestamp) || fallbackTimestamp <= 0) {
    return '--';
  }

  return new Date(fallbackTimestamp * 1000).toLocaleString('zh-CN', {
    hour12: false,
  });
}

function getStatusClassName(status: number) {
  switch (status) {
    case 1:
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    case 2:
      return 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200';
    default:
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
  }
}

export function QuestionnairePage() {
  const { goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showToast } = useFeedback();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    data,
    error,
    loading,
    reload,
  } = useRequest((signal) => questionnaireApi.myList({ page: 1, limit: 10 }, { signal }), {
    cacheKey: 'questionnaire:my-list',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });

  const records = data?.list ?? [];
  const todayStart = useMemo(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return Math.floor(current.getTime() / 1000);
  }, []);
  const todayCount = useMemo(
    () => records.filter((item) => item.createTime >= todayStart).length,
    [records, todayStart],
  );
  const remainingCount = Math.max(0, DAILY_LIMIT - todayCount);
  const titleLength = title.trim().length;
  const contentLength = content.trim().length;
  const canSubmit =
    isAuthenticated &&
    !isOffline &&
    !submitting &&
    titleLength > 0 &&
    contentLength > 0 &&
    remainingCount > 0;

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated,
    namespace: 'questionnaire-page',
    restoreDeps: [isAuthenticated, loading, records.length, Boolean(error)],
    restoreWhen: isAuthenticated && !loading,
  });

  const handleRefresh = async () => {
    refreshStatus();
    await reload().catch(() => undefined);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      goTo('login');
      return;
    }

    if (submitting) {
      return;
    }

    if (!titleLength) {
      showToast({ message: '请填写问卷标题', type: 'warning' });
      return;
    }

    if (!contentLength) {
      showToast({ message: '请填写问卷内容', type: 'warning' });
      return;
    }

    if (remainingCount <= 0) {
      showToast({ message: '今日问卷提交次数已达上限', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await questionnaireApi.submit({
        title: title.trim(),
        content: content.trim(),
      });
      showToast({ message: '提交成功，请等待审核', type: 'success' });
      setTitle('');
      setContent('');
      await reload().catch(() => undefined);
    } catch (submitError) {
      showToast({ message: getErrorMessage(submitError), type: 'error', duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const renderForm = () => (
    <Card className="overflow-hidden border-none bg-white/95 p-5 shadow-[0_16px_40px_rgba(145,84,36,0.08)] dark:bg-gray-900/95 dark:shadow-[0_20px_48px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-main">提交问卷</h2>
          <p className="mt-1 text-sm leading-6 text-text-sub">填写你的建议、反馈或调研内容，审核通过后发放算力奖励。</p>
        </div>
        <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-500/15 dark:text-orange-200">
          今日剩余 {remainingCount}/{DAILY_LIMIT}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-2 text-sm font-medium text-text-main">标题</div>
          <div className="rounded-2xl border border-border-light bg-bg-card px-4 py-3">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, TITLE_MAX))}
              placeholder="请输入问卷标题"
                    className="w-full bg-transparent text-lg text-text-main outline-none placeholder:text-text-aux"
            />
          </div>
          <div className="mt-2 text-right text-xs text-text-aux">{title.length}/{TITLE_MAX}</div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-text-main">内容</div>
          <div className="rounded-2xl border border-border-light bg-bg-card px-4 py-3">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value.slice(0, CONTENT_MAX))}
              rows={6}
              placeholder="请详细描述你的建议或反馈内容"
                    className="w-full resize-none bg-transparent text-lg leading-7 text-text-main outline-none placeholder:text-text-aux"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-text-aux">
            <span>每日最多提交 3 份，提交后等待后台审核</span>
            <span>{content.length}/{CONTENT_MAX}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => {
            void handleSubmit();
          }}
          className={`h-12 w-full rounded-full text-lg font-medium transition ${
            canSubmit
              ? 'bg-gradient-to-r from-[#ff7a30] via-[#ff5b3d] to-[#e73c3c] text-white shadow-[0_10px_22px_rgba(231,60,60,0.25)] active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
          }`}
        >
          {submitting ? '提交中...' : '提交问卷'}
        </button>
      </div>
    </Card>
  );

  const renderRecords = () => {
    if (loading && records.length === 0) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="animate-pulse p-4">
              <div className="mb-3 h-5 w-32 rounded-full bg-border-light" />
              <div className="mb-2 h-4 w-full rounded-full bg-border-light" />
              <div className="h-4 w-2/3 rounded-full bg-border-light" />
            </Card>
          ))}
        </div>
      );
    }

    if (error && records.length === 0) {
      return <ErrorState message={getErrorMessage(error)} onRetry={() => void handleRefresh()} />;
    }

    if (records.length === 0) {
      return (
        <EmptyState
          icon={<ClipboardList size={44} />}
          message="还没有提交记录"
        />
      );
    }

    return (
      <div className="space-y-3">
        {records.map((item) => (
          <Card key={item.id} className="overflow-hidden p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-semibold text-text-main">{item.title || '未命名问卷'}</div>
                <div className="mt-1 text-xs text-text-aux">
                  {formatDate(item.createTimeText, item.createTime)}
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClassName(item.status)}`}>
                {item.statusText || '待审核'}
              </span>
            </div>

            <div className="whitespace-pre-wrap text-sm leading-6 text-text-sub">{item.content}</div>

            {item.rewardPower > 0 ? (
              <div className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                已奖励算力 {item.rewardPower}
              </div>
            ) : null}

            {item.adminRemark ? (
              <div className="mt-3 rounded-2xl bg-bg-card px-3 py-2 text-sm text-text-sub">
                后台备注：{item.adminRemark}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
        <PageHeader title="每日问卷" offline={isOffline} onRefresh={() => void handleRefresh()} />
        <div className="flex-1 overflow-y-auto no-scrollbar px-4">
          <EmptyState
            icon={<ClipboardList size={44} />}
            message="登录后参与每日问卷活动"
            actionText="去登录"
            actionVariant="primary"
            onAction={() => goTo('login')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#f8f1e8] dark:bg-gray-950">
      <PageHeader
        title="每日问卷"
        offline={isOffline}
        onRefresh={() => void handleRefresh()}
        rightAction={
          <div className="inline-flex items-center rounded-full border border-[#ffd4b3] bg-white/80 px-3 py-1 text-xs font-medium text-[#b86633] dark:border-orange-500/30 dark:bg-gray-900/80 dark:text-orange-200">
            <Sparkles size={14} className="mr-1.5" />
            今日剩余 {remainingCount}
          </div>
        }
      />

      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-4 pb-6">
            <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#20150f_0%,#8c4f25_48%,#ff8b42_100%)] p-5 text-white shadow-[0_20px_44px_rgba(140,79,37,0.28)]">
              <div className="absolute -top-10 right-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-[#ffd2a3]/20 blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.26em] text-white/80">
                  Questionnaire
                </div>
                <h1 className="mt-4 text-5_5xl font-semibold leading-tight">参与问卷，赢取每日算力奖励</h1>
                <p className="mt-2 max-w-[280px] text-sm leading-6 text-white/78">
                  每日最多提交 3 份问卷，审核通过后发放奖励。建议内容越具体，越方便后台处理。
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/60">Today</div>
                    <div className="mt-2 text-3xl font-semibold">{todayCount}</div>
                    <div className="mt-1 text-sm text-white/72">今日已提交</div>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-black/10 p-4 backdrop-blur-sm">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/60">History</div>
                    <div className="mt-2 text-3xl font-semibold">{data?.total ?? 0}</div>
                    <div className="mt-1 text-sm text-white/72">累计提交记录</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4 px-4 pb-8">
            {renderForm()}

            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center text-lg font-semibold text-text-main">
                  <FileText size={18} className="mr-2 text-[#d16a30]" />
                  我的提交记录
                </div>
              </div>
              {renderRecords()}
            </section>
          </div>
        </div>
      </PullToRefreshContainer>
    </div>
  );
}

export default QuestionnairePage;
