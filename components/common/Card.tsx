/**
 * Card - 通用卡片组件
 * 
 * 功能说明：
 * - 提供统一的卡片容器样式
 * - 支持可选的标题栏和右侧操作区
 * - 支持点击事件
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React from 'react';

/**
 * Card 组件属性接口
 */
interface CardProps {
    /** 卡片标题，可选 */
    title?: string;
    /** 标题栏右侧内容（如"查看更多"按钮），可选 */
    extra?: React.ReactNode;
    /** 卡片内容 */
    children: React.ReactNode;
    /** 自定义类名 */
    className?: string;
    /** 内容区域的内边距，默认有内边距 */
    noPadding?: boolean;
    /** 卡片点击事件 */
    onClick?: () => void;
}

/**
 * Card 通用卡片组件
 * 
 * @example
 * // 基础卡片
 * <Card>
 *   <p>卡片内容</p>
 * </Card>
 * 
 * @example
 * // 带标题的卡片
 * <Card title="我的订单" extra={<span>查看全部</span>}>
 *   <OrderList />
 * </Card>
 * 
 * @example
 * // 可点击的卡片
 * <Card onClick={() => navigate('/detail')}>
 *   <ProductInfo />
 * </Card>
 */
const Card: React.FC<CardProps> = ({
    title,
    extra,
    children,
    className = '',
    noPadding = false,
    onClick,
}) => {
    // 判断是否有标题栏
    const hasHeader = title || extra;

    return (
        <div
            className={`bg-white rounded-xl shadow-sm overflow-hidden ${onClick ? 'cursor-pointer active:bg-gray-50' : ''} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {/* 标题栏 */}
            {hasHeader && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    {/* 标题 */}
                    {title && (
                        <h3 className="text-base font-semibold text-gray-800">
                            {title}
                        </h3>
                    )}

                    {/* 右侧操作区 */}
                    {extra && (
                        <div className="text-sm text-gray-500">
                            {extra}
                        </div>
                    )}
                </div>
            )}

            {/* 内容区域 */}
            <div className={noPadding ? '' : 'p-4'}>
                {children}
            </div>
        </div>
    );
};

export default Card;
