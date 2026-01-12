/**
 * LazyImage - 懒加载图片组件
 * 
 * 功能说明：
 * - 使用 Intersection Observer API 实现图片懒加载
 * - 支持加载占位图和错误占位图
 * - 支持加载状态显示
 * - 优化页面性能，减少不必要的网络请求
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * LazyImage 组件属性接口
 */
interface LazyImageProps {
    /** 图片地址 */
    src: string;
    /** 图片替代文字 */
    alt: string;
    /** 自定义类名 */
    className?: string;
    /** 占位图地址，默认为灰色背景 */
    placeholder?: string;
    /** 图片加载失败时的回调 */
    onError?: () => void;
    /** 图片加载成功时的回调 */
    onLoad?: () => void;
}

/**
 * 默认的 1x1 透明图片（Base64编码）
 * 用作初始占位，防止图片空白闪烁
 */
const TRANSPARENT_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * LazyImage 懒加载图片组件
 * 
 * @example
 * // 基础用法
 * <LazyImage
 *   src="https://example.com/image.jpg"
 *   alt="商品图片"
 *   className="w-full h-40 object-cover rounded-lg"
 * />
 * 
 * @example
 * // 带占位图
 * <LazyImage
 *   src={product.image}
 *   alt={product.name}
 *   placeholder="/images/loading.gif"
 *   className="w-24 h-24 object-cover"
 * />
 */
const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    className = '',
    placeholder,
    onError,
    onLoad,
}) => {
    // 图片加载状态
    const [loaded, setLoaded] = useState(false);
    // 图片加载错误状态
    const [error, setError] = useState(false);
    // 是否已进入可视区域
    const [isInView, setIsInView] = useState(false);
    // 图片元素引用
    const imgRef = useRef<HTMLImageElement>(null);

    /**
     * 使用 Intersection Observer 监听图片是否进入可视区域
     */
    useEffect(() => {
        // 获取图片元素
        const imgElement = imgRef.current;
        if (!imgElement) return;

        // 创建观察器实例
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    // 当图片进入可视区域时
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        // 已进入视图后停止观察
                        observer.unobserve(imgElement);
                    }
                });
            },
            {
                // 提前 100px 开始加载
                rootMargin: '100px',
                // 元素进入 10% 即触发
                threshold: 0.1,
            }
        );

        // 开始观察图片元素
        observer.observe(imgElement);

        // 组件卸载时清理观察器
        return () => {
            observer.disconnect();
        };
    }, []);

    /**
     * 处理图片加载成功
     */
    const handleLoad = () => {
        setLoaded(true);
        setError(false);
        onLoad?.();
    };

    /**
     * 处理图片加载失败
     */
    const handleError = () => {
        setLoaded(true);
        setError(true);
        onError?.();
    };

    // 确定显示的图片地址
    const displaySrc = isInView ? src : (placeholder || TRANSPARENT_PLACEHOLDER);

    return (
        <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
            {/* 加载中的骨架屏效果 */}
            {!loaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 
                        animate-pulse" />
            )}

            {/* 图片元素 */}
            {!error ? (
                <img
                    ref={imgRef}
                    src={displaySrc}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-300 
                     ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading="lazy"
                />
            ) : (
                // 加载失败时显示的占位内容
                <div className="absolute inset-0 flex flex-col items-center justify-center 
                        bg-gray-100 text-gray-400">
                    <ImageOff size={24} aria-hidden="true" />
                    <span className="text-xs mt-1">加载失败</span>
                </div>
            )}
        </div>
    );
};

export default LazyImage;
