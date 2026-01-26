/**
 * LoadingSpinner - 通用加载状态组件
 * 
 * 功能说明：
 * - 提供统一的加载动画效果
 * - 支持三种尺寸：小(sm)、中(md)、大(lg)
 * - 支持自定义加载文字
 * - 支持全屏模式和内联模式
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React from 'react';

/**
 * LoadingSpinner 组件属性接口
 */
interface LoadingSpinnerProps {
    /** 加载器尺寸，默认 'md' */
    size?: 'sm' | 'md' | 'lg' | number;
    /** 加载提示文字，可选 */
    color?: string;
    text?: string;
    /** 是否全屏显示，默认 false */
    fullScreen?: boolean;
    /** 自定义类名 */
    className?: string;
}

/**
 * 根据尺寸获取对应的 CSS 类名和图标大小
 * @param size - 尺寸类型
 * @returns 包含类名和图标大小的对象
 */
const getSizeConfig = (size: 'sm' | 'md' | 'lg' | number) => {
    if (typeof size === 'number') {
        return { iconSize: size, textClass: 'text-sm', gapClass: 'gap-2' };
    }
    const sizeMap = {
        sm: { iconSize: 16, textClass: 'text-xs', gapClass: 'gap-1' },
        md: { iconSize: 24, textClass: 'text-sm', gapClass: 'gap-2' },
        lg: { iconSize: 32, textClass: 'text-base', gapClass: 'gap-3' },
    };
    return sizeMap[size] || sizeMap.md;
};

/**
 * LoadingSpinner 加载状态组件
 * 
 * @example
 * // 基础用法
 * <LoadingSpinner />
 * 
 * @example
 * // 带文字的加载状态
 * <LoadingSpinner text="加载中..." size="lg" />
 * 
 * @example
 * // 全屏加载
 * <LoadingSpinner fullScreen text="正在加载数据..." />
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
    color,
    fullScreen = false,
    className = '',
}) => {
    // 获取尺寸配置
    const { iconSize, textClass, gapClass } = getSizeConfig(size);

    // 容器样式：根据是否全屏决定布局
    const containerClass = fullScreen
        ? 'fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50'
        : `flex items-center justify-center ${gapClass} ${className}`;

    const spinnerColor = color || "currentColor";

    return (
        <div className={containerClass}>
            {/* 旋转的加载图标 - SVG */}
            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 24 24"
                fill="none"
                stroke={spinnerColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`animate-spin ${!color && 'text-red-600'}`}
                aria-hidden="true"
            >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>

            {/* 加载提示文字 */}
            {text && (
                <span className={`${textClass} text-gray-600`}>
                    {text}
                </span>
            )}
        </div>
    );
};

export default LoadingSpinner;
