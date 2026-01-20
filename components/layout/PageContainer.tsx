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
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // 每次页面重新渲染或挂载时，滚动到顶部
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = 0;
            }
            window.scrollTo(0, 0);
        }, 0);

        return () => clearTimeout(timer);
    }, [title]);

    return (
        <div className={`min-h-screen ${bgColor} pb-safe ${className}`}>
            {/* 固定顶部导航栏 */}
            <header className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white px-4 py-3 flex items-center z-40 shadow-sm">
                {/* 返回按钮 */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="absolute left-4 p-2 -ml-2 text-gray-600 active:bg-gray-100 active:scale-95 rounded-full transition-all"
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

            {/* 内容区域 - 为固定头部留出空间 */}
            <div className="pt-[52px] min-h-screen flex flex-col">
                <div
                    ref={scrollRef}
                    className={`flex-1 flex flex-col ${bgColor} ${padding ? 'p-4' : ''} overflow-y-auto`}
                >
                    {/* 加载状态 */}
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <LoadingSpinner text={loadingText} />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            {children}
                        </div>
                    )}
                </div>
            </div>

            {/* 底部固定区域 */}
            {footer && (
                <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 
                        px-4 py-3 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-30">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default PageContainer;
