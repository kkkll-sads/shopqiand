/**
 * Skeleton - 骨架屏组件系统
 * 
 * 提供多种骨架屏变体，用于数据加载时的占位展示
 * 支持：文本、圆形、矩形、卡片、列表等
 * 
 * @author UI优化
 * @version 1.0.0
 */

import React from 'react';

// ============================================
// 基础骨架屏组件
// ============================================

interface SkeletonBaseProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 基础骨架屏 - 带闪烁动画的占位块
 */
export const SkeletonBase: React.FC<SkeletonBaseProps> = ({ className = '', style }) => (
  <div
    className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded ${className}`}
    style={style}
  />
);

/**
 * 文本骨架屏
 */
export const SkeletonText: React.FC<{ width?: string; className?: string }> = ({ 
  width = '100%', 
  className = '' 
}) => (
  <SkeletonBase className={`h-4 ${className}`} style={{ width }} />
);

/**
 * 标题骨架屏
 */
export const SkeletonTitle: React.FC<{ width?: string; className?: string }> = ({ 
  width = '60%', 
  className = '' 
}) => (
  <SkeletonBase className={`h-5 ${className}`} style={{ width }} />
);

/**
 * 圆形骨架屏（头像等）
 */
export const SkeletonCircle: React.FC<{ size?: number; className?: string }> = ({ 
  size = 40, 
  className = '' 
}) => (
  <SkeletonBase 
    className={`rounded-full flex-shrink-0 ${className}`} 
    style={{ width: size, height: size }} 
  />
);

/**
 * 矩形骨架屏（图片等）
 */
export const SkeletonRect: React.FC<{ 
  width?: number | string; 
  height?: number | string; 
  className?: string;
  rounded?: string;
}> = ({ 
  width = '100%', 
  height = 100, 
  className = '',
  rounded = 'rounded-xl'
}) => (
  <SkeletonBase 
    className={`${rounded} ${className}`} 
    style={{ 
      width: typeof width === 'number' ? `${width}px` : width, 
      height: typeof height === 'number' ? `${height}px` : height 
    }} 
  />
);

// ============================================
// 复合骨架屏组件
// ============================================

/**
 * 藏品/商品卡片骨架屏
 */
export const SkeletonProductCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl p-3 shadow-sm border border-gray-100 ${className}`}>
    <div className="flex gap-3">
      {/* 左侧图片 */}
      <SkeletonRect width={64} height={64} rounded="rounded-xl" />
      
      {/* 右侧内容 */}
      <div className="flex-1 flex flex-col gap-2">
        <SkeletonTitle width="80%" />
        <div className="flex gap-2">
          <SkeletonText width="40px" className="h-5 rounded-lg" />
          <SkeletonText width="60px" className="h-5 rounded-lg" />
        </div>
        <div className="mt-auto pt-2">
          <SkeletonText width="30%" className="h-6" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * 资金明细卡片骨架屏
 */
export const SkeletonTransactionCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50 ${className}`}>
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1 space-y-2">
        <SkeletonText width="60%" className="h-4" />
        <SkeletonText width="40%" className="h-3" />
      </div>
      <SkeletonText width="80px" className="h-6" />
    </div>
    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
      <SkeletonText width="50px" className="h-5 rounded-full" />
      <SkeletonText width="120px" className="h-4" />
    </div>
  </div>
);

/**
 * 列表项骨架屏
 */
export const SkeletonListItem: React.FC<{ className?: string; hasImage?: boolean }> = ({ 
  className = '',
  hasImage = true
}) => (
  <div className={`flex items-center gap-3 p-4 bg-white rounded-xl ${className}`}>
    {hasImage && <SkeletonCircle size={48} />}
    <div className="flex-1 space-y-2">
      <SkeletonText width="70%" />
      <SkeletonText width="40%" className="h-3" />
    </div>
    <SkeletonText width="60px" className="h-5" />
  </div>
);

/**
 * 商城商品网格卡片骨架屏
 */
export const SkeletonGridCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-xl overflow-hidden shadow-sm ${className}`}>
    {/* 图片区域 */}
    <SkeletonRect height={150} rounded="rounded-none" />
    
    {/* 内容区域 */}
    <div className="p-3 space-y-2">
      <SkeletonText width="90%" />
      <SkeletonText width="60%" className="h-3" />
      <div className="flex items-center gap-2 pt-2">
        <SkeletonText width="30%" className="h-5" />
        <SkeletonText width="40px" className="h-4 rounded" />
      </div>
    </div>
  </div>
);

/**
 * 资产头部卡片骨架屏
 */
export const SkeletonAssetHeader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white ${className}`}>
    <div className="space-y-4">
      <SkeletonText width="80px" className="h-4 bg-white/20" />
      <SkeletonText width="150px" className="h-10 bg-white/20" />
      <div className="flex gap-4 pt-2">
        <div className="flex-1 space-y-2">
          <SkeletonText width="60px" className="h-3 bg-white/20" />
          <SkeletonText width="80px" className="h-5 bg-white/20" />
        </div>
        <div className="flex-1 space-y-2">
          <SkeletonText width="60px" className="h-3 bg-white/20" />
          <SkeletonText width="80px" className="h-5 bg-white/20" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * 申购记录骨架屏
 */
export const SkeletonSubscriptionCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-50 rounded-xl p-3.5 ${className}`}>
    <div className="flex justify-between items-start mb-2">
      <div className="space-y-2">
        <SkeletonText width="80px" className="h-4" />
        <SkeletonText width="60px" className="h-5 rounded-md" />
      </div>
      <SkeletonText width="60px" className="h-6 rounded-lg" />
    </div>
    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
      <SkeletonText width="100px" className="h-4" />
      <SkeletonText width="70px" className="h-4" />
    </div>
  </div>
);

// ============================================
// 页面级骨架屏
// ============================================

/**
 * 藏品列表页骨架屏
 */
export const SkeletonCollectionList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3 p-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonProductCard key={i} />
    ))}
  </div>
);

/**
 * 资产页骨架屏
 */
export const SkeletonAssetPage: React.FC = () => (
  <div className="p-3 space-y-4">
    <SkeletonAssetHeader />
    {/* 操作按钮区 */}
    <div className="grid grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <SkeletonCircle size={48} />
          <SkeletonText width="40px" className="h-3" />
        </div>
      ))}
    </div>
    {/* 列表 */}
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonTransactionCard key={i} />
      ))}
    </div>
  </div>
);

/**
 * 首页骨架屏
 */
export const SkeletonHomePage: React.FC = () => (
  <div className="pb-24">
    {/* 搜索栏 */}
    <div className="px-4 pt-3 pb-2">
      <SkeletonRect height={44} rounded="rounded-full" />
    </div>
    
    {/* Banner */}
    <div className="px-4 pb-3">
      <SkeletonRect height={176} rounded="rounded-2xl" />
    </div>
    
    {/* 公告 */}
    <div className="px-4 pb-3">
      <SkeletonRect height={40} rounded="rounded-xl" />
    </div>
    
    {/* 快捷操作 */}
    <div className="px-4 pb-4">
      <div className="bg-white rounded-2xl p-4">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <SkeletonCircle size={48} />
              <SkeletonText width="48px" className="h-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
    
    {/* 交易专区入口 */}
    <div className="px-4 mb-3">
      <SkeletonRect height={80} rounded="rounded-2xl" />
    </div>
    
    {/* 申购记录 */}
    <div className="mx-4 bg-white rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <SkeletonText width="80px" className="h-5" />
        <SkeletonText width="40px" className="h-4" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonSubscriptionCard key={i} />
      ))}
    </div>
  </div>
);

/**
 * 商城商品网格骨架屏
 */
export const SkeletonProductGrid: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-2 gap-2.5 p-2.5">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonGridCard key={i} />
    ))}
  </div>
);

// 默认导出
export default {
  Base: SkeletonBase,
  Text: SkeletonText,
  Title: SkeletonTitle,
  Circle: SkeletonCircle,
  Rect: SkeletonRect,
  ProductCard: SkeletonProductCard,
  TransactionCard: SkeletonTransactionCard,
  ListItem: SkeletonListItem,
  GridCard: SkeletonGridCard,
  AssetHeader: SkeletonAssetHeader,
  SubscriptionCard: SkeletonSubscriptionCard,
  CollectionList: SkeletonCollectionList,
  AssetPage: SkeletonAssetPage,
  HomePage: SkeletonHomePage,
  ProductGrid: SkeletonProductGrid,
};
