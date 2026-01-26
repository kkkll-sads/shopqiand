/**
 * ErrorFallback - 错误回退组件
 * 
 * 功能说明：
 * - 当应用发生错误时显示的友好界面
 * - 提供错误信息展示
 * - 提供重试和返回首页按钮
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorFallback 组件属性接口
 */
interface ErrorFallbackProps {
    /** 错误对象 */
    error: Error | null;
    /** 重试按钮点击回调 */
    onReset?: () => void;
}

/**
 * ErrorFallback 错误回退组件
 * 
 * @example
 * // 在 ErrorBoundary 中使用
 * <ErrorFallback
 *   error={error}
 *   onReset={() => window.location.reload()}
 * />
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({
    error,
    onReset,
}) => {
    /**
     * 返回首页
     */
    const handleGoHome = () => {
        window.location.href = '/';
    };

    /**
     * 刷新页面
     */
    const handleRefresh = () => {
        if (onReset) {
            onReset();
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                {/* 错误图标 */}
                <div className="flex justify-center mb-6">
                    <div className="bg-red-50 p-4 rounded-full">
                        <AlertTriangle
                            size={48}
                            className="text-red-500"
                            aria-hidden="true"
                        />
                    </div>
                </div>

                {/* 错误标题 */}
                <h1 className="text-xl font-bold text-gray-800 mb-2">
                    页面出现问题
                </h1>

                {/* 错误描述 */}
                <p className="text-gray-500 mb-6">
                    抱歉，页面加载时遇到了问题。请尝试刷新页面或返回首页。
                </p>

                {/* 错误详情（仅在开发环境显示） */}
                {error && process.env.NODE_ENV === 'development' && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <p className="text-xs text-gray-500 mb-1">错误信息：</p>
                        <p className="text-sm text-red-600 font-mono break-all">
                            {error.message}
                        </p>
                    </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-3">
                    {/* 返回首页按钮 */}
                    <button
                        onClick={handleGoHome}
                        className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 
                       font-medium rounded-xl hover:bg-gray-50 active:bg-gray-100
                       transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={18} />
                        返回首页
                    </button>

                    {/* 刷新页面按钮 */}
                    <button
                        onClick={handleRefresh}
                        className="flex-1 py-3 px-4 bg-orange-500 text-white font-medium 
                       rounded-xl hover:bg-orange-600 active:bg-orange-700
                       transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} />
                        刷新重试
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorFallback;
