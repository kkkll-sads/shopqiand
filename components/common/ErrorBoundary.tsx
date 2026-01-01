/**
 * ErrorBoundary - 错误边界组件
 * 
 * 功能说明：
 * - 捕获子组件树中的 JavaScript 错误
 * - 防止组件错误导致整个应用崩溃
 * - 显示友好的错误回退界面
 * - 支持错误上报（可扩展）
 * 
 * 注意：错误边界无法捕获以下错误：
 * - 事件处理函数中的错误
 * - 异步代码（如 setTimeout）
 * - 服务端渲染
 * - 错误边界自身抛出的错误
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorFallback from './ErrorFallback';

/**
 * ErrorBoundary 组件属性接口
 */
interface ErrorBoundaryProps {
    /** 子组件 */
    children: ReactNode;
    /** 自定义错误回退组件 */
    fallback?: ReactNode;
    /** 错误发生时的回调函数 */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * ErrorBoundary 组件状态接口
 */
interface ErrorBoundaryState {
    /** 是否发生错误 */
    hasError: boolean;
    /** 错误对象 */
    error: Error | null;
}

/**
 * ErrorBoundary 错误边界组件
 * 
 * @example
 * // 基础用法 - 包裹整个应用
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * 
 * @example
 * // 包裹特定组件
 * <ErrorBoundary onError={(error) => reportError(error)}>
 *   <UserProfile />
 * </ErrorBoundary>
 * 
 * @example
 * // 自定义错误回退界面
 * <ErrorBoundary fallback={<CustomErrorPage />}>
 *   <Dashboard />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        // 初始化状态
        this.state = {
            hasError: false,
            error: null,
        };
    }

    /**
     * 静态方法：从错误中派生状态
     * 当子组件抛出错误时，React 会调用此方法
     * 
     * @param error - 捕获到的错误对象
     * @returns 更新后的状态
     */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // 更新状态，使下次渲染显示错误回退界面
        return {
            hasError: true,
            error,
        };
    }

    /**
     * 组件捕获到错误后的生命周期方法
     * 用于记录错误日志或上报错误
     * 
     * @param error - 错误对象
     * @param errorInfo - 包含组件栈信息的对象
     */
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // 打印错误信息到控制台（开发阶段）
        console.error('ErrorBoundary 捕获到错误:', error);
        console.error('组件栈信息:', errorInfo.componentStack);

        // 调用外部错误处理回调（可用于错误上报）
        this.props.onError?.(error, errorInfo);

        // TODO: 可以在这里添加错误上报逻辑
        // 例如：发送到 Sentry、自建错误监控系统等
        // reportErrorToService(error, errorInfo);
    }

    /**
     * 重置错误状态的方法
     * 允许用户尝试重新加载出错的组件
     */
    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render(): ReactNode {
        const { hasError, error } = this.state;
        const { children, fallback } = this.props;

        // 如果发生错误，显示回退界面
        if (hasError) {
            // 如果提供了自定义回退组件，使用自定义组件
            if (fallback) {
                return fallback;
            }

            // 使用默认的错误回退组件
            return (
                <ErrorFallback
                    error={error}
                    onReset={this.handleReset}
                />
            );
        }

        // 正常渲染子组件
        return children;
    }
}

export default ErrorBoundary;
