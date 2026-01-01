/**
 * PageContainer - 页面容器组件
 * 
 * 功能说明：
 * - 提供统一的页面布局结构
 * - 包含顶部导航栏和内容区域
 * - 支持自定义背景色和内边距
 * - 支持加载状态显示
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * PageContainer 组件属性接口
 */
interface PageContainerProps {
    /** 页面标题 */
    title: string;
    /** 返回按钮点击回调 */
    onBack?: () => void;
    /** 页面内容 */
    children: React.ReactNode;
    /** 顶部导航栏右侧操作区 */
    rightAction?: React.ReactNode;
    /** 是否显示加载状态 */
    loading?: boolean;
    /** 加载提示文字 */
    loadingText?: string;
    /** 背景颜色类名，默认 'bg-gray-50' */
    bgColor?: string;
    /** 是否有内边距，默认 true */
    padding?: boolean;
    /** 底部固定内容 */
    footer?: React.ReactNode;
    /** 自定义类名 */
    className?: string;
}

/**
 * PageContainer 页面容器组件
 * 
 * @example
 * // 基础用法
 * <PageContainer title="我的订单" onBack={() => navigate(-1)}>
 *   <OrderList />
 * </PageContainer>
 * 
 * @example
 * // 带加载状态
 * <PageContainer title="订单详情" loading={isLoading} loadingText="加载中...">
 *   <OrderDetail data={orderData} />
 * </PageContainer>
 * 
 * @example
 * // 带底部按钮
 * <PageContainer 
 *   title="确认订单" 
 *   footer={<SubmitButton onClick={handleSubmit} />}
 * >
 *   <OrderForm />
 * </PageContainer>
 */
const PageContainer: React.FC<PageContainerProps> = ({
    title,
    onBack,
    children,
    rightAction,
    loading = false,
    loadingText = '加载中...',
    bgColor = 'bg-gray-50',
    padding = true,
    footer,
    className = '',
}) => {
    return (
        <div className={`min-h-screen ${bgColor} pb-safe flex flex-col ${className}`}>
            {/* 顶部导航栏 */}
            <header className="bg-white px-4 py-3 flex items-center sticky top-0 z-30 shadow-sm">
                {/* 返回按钮 */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="absolute left-4 p-1 text-gray-600 active:bg-gray-100 rounded-full"
                        aria-label="返回上一页"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                {/* 页面标题 */}
                <h1 className="text-lg font-bold text-gray-800 w-full text-center">
                    {title}
                </h1>

                {/* 右侧操作区 */}
                {rightAction && (
                    <div className="absolute right-4">
                        {rightAction}
                    </div>
                )}
            </header>

            {/* 内容区域 */}
            <div className={`flex-1 ${padding ? 'p-4' : ''}`}>
                {/* 加载状态 */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <LoadingSpinner text={loadingText} />
                    </div>
                ) : (
                    children
                )}
            </div>

            {/* 底部固定区域 */}
            {footer && (
                <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-100 
                        px-4 py-3 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default PageContainer;
