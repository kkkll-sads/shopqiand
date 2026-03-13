/**
 * @file LoadingSkeleton - 统一骨架屏加载状态
 * @description 提供几种常用的骨架屏布局预设：
 *   - list: 列表项骨架（图标+多行文字）
 *   - card: 卡片骨架（图片+标题+描述）
 *   - detail: 详情页骨架（大图+多行文字+按钮）
 *   - custom: 自定义子元素
 * 
 * @example
 * ```tsx
 * <LoadingSkeleton type="list" count={5} />
 * <LoadingSkeleton type="card" count={3} />
 * ```
 */
import React from 'react';

interface LoadingSkeletonProps {
  /** 骨架屏预设类型 */
  type?: 'list' | 'card' | 'detail';
  /** 重复数量 */
  count?: number;
  /** 自定义子元素（type='custom' 时使用） */
  children?: React.ReactNode;
}

/** 脉冲动画块 */
const Bone = ({ className = '' }: { className?: string }) => (
  <div className={`bg-bg-hover dark:bg-bg-hover rounded animate-pulse ${className}`} />
);

/** 列表项骨架 */
const ListSkeleton = ({ count = 5 }: { count: number }) => (
  <div className="p-4 space-y-4">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <Bone className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-3/4" />
          <Bone className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

/** 卡片骨架 */
const CardSkeleton = ({ count = 3 }: { count: number }) => (
  <div className="p-4 space-y-3">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="bg-bg-card rounded-xl p-4 shadow-sm border border-border-light animate-pulse">
        <div className="flex items-start space-x-3">
          <Bone className="w-20 h-20 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-full" />
            <Bone className="h-3 w-2/3" />
            <Bone className="h-3 w-1/3" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/** 详情页骨架 */
const DetailSkeleton = () => (
  <div className="p-4 space-y-4 animate-pulse">
    <Bone className="w-full h-48 rounded-xl" />
    <Bone className="h-6 w-3/4" />
    <Bone className="h-4 w-1/2" />
    <div className="space-y-2 pt-4">
      <Bone className="h-3 w-full" />
      <Bone className="h-3 w-full" />
      <Bone className="h-3 w-2/3" />
    </div>
    <Bone className="h-11 w-full rounded-full mt-6" />
  </div>
);

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'list',
  count = 5,
  children,
}) => {
  if (children) return <>{children}</>;

  switch (type) {
    case 'card':
      return <CardSkeleton count={count} />;
    case 'detail':
      return <DetailSkeleton />;
    case 'list':
    default:
      return <ListSkeleton count={count} />;
  }
};
