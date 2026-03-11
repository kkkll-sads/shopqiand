/**
 * @file CommonPage/index.tsx - 通用内容页面
 * @description 用于展示用户协议、隐私政策、关于我们等通用图文内容，支持 HTML 和纯文本渲染。
 */

import { useMemo } from 'react'; // React 核心 Hook
import { commonApi, type CommonPageType } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';

/** 页面类型元数据（标题映射） */
const PAGE_META: Record<CommonPageType, { title: string }> = {
  user_agreement: { title: '用户协议' },
  privacy_policy: { title: '隐私政策' },
  about_us: { title: '关于我们' },
};

export interface CommonPageProps {
  pageType: CommonPageType;
}

/** 解析页面内容：支持字符串/数组/对象多种格式 */
function resolvePageContent(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolvePageContent(item)).filter(Boolean).join('\n');
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nextValue = record.content ?? record.value ?? record.html ?? record.text;
    if (nextValue !== undefined) {
      return resolvePageContent(nextValue);
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '';
    }
  }

  return '';
}

/** 检测内容是否包含 HTML 标签 */
function hasHtmlMarkup(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

/**
 * CommonPage - 通用内容页面组件
 * 根据 pageType 加载对应内容（用户协议/隐私政策/关于我们）
 */
export function CommonPage({ pageType }: CommonPageProps) {
  const { isOffline } = useNetworkStatus();
  const pageMeta = PAGE_META[pageType];

  const {
    data,
    error,
    loading,
    reload,
  } = useRequest((signal) => commonApi.getPage({ type: pageType }, signal), {
    cacheKey: `common:page:${pageType}`,
    deps: [pageType],
  });

  const pageTitle = data?.title?.trim() || pageMeta.title;
  const pageContent = useMemo(() => resolvePageContent(data?.content), [data?.content]);
  const renderAsHtml = hasHtmlMarkup(pageContent);

  const renderSkeleton = () => (
    <div className="space-y-4 px-4 py-5">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="animate-pulse rounded-2xl bg-bg-card p-4 shadow-soft">
          <div className="mb-3 h-5 w-2/5 rounded-lg bg-border-light" />
          <div className="mb-2 h-4 w-full rounded-lg bg-border-light" />
          <div className="mb-2 h-4 w-full rounded-lg bg-border-light" />
          <div className="h-4 w-4/5 rounded-lg bg-border-light" />
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return renderSkeleton();
    }

    if (error) {
      return <ErrorState message={getErrorMessage(error)} onRetry={() => void reload().catch(() => undefined)} />;
    }

    if (!pageContent) {
      return <EmptyState message="暂无内容" />;
    }

    return (
      <div className="px-4 py-5">
        <article className="rounded-3xl bg-bg-card px-5 py-6 shadow-soft">
          <h2 className="mb-5 text-2xl font-bold text-text-main">{pageTitle}</h2>
          {renderAsHtml ? (
            <div
              className="text-sm leading-7 text-text-main [&_a]:break-all [&_a]:text-primary-start [&_img]:mx-auto [&_img]:max-w-full [&_p]:mb-4 [&_table]:w-full [&_td]:border [&_td]:border-border-light [&_td]:p-2 [&_th]:border [&_th]:border-border-light [&_th]:p-2 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: pageContent }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-7 text-text-main">{pageContent}</div>
          )}
        </article>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader
        title={pageTitle}
        offline={isOffline}
        onRefresh={() => {
          void reload().catch(() => undefined);
        }}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar">{renderContent()}</div>
    </div>
  );
}
