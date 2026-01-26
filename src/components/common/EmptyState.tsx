/**
 * EmptyState - 空状态组件
 * 
 * 功能说明：
 * - 当列表或页面没有数据时显示的占位组件
 * - 支持自定义图标、标题、描述文字
 * - 支持添加操作按钮引导用户
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState 组件属性接口
 */
interface EmptyStateProps {
    /** 自定义图标，默认为收件箱图标 */
    icon?: React.ReactNode;
    /** 空状态标题 */
    title: string;
    /** 空状态描述，可选 */
    description?: string;
    /** 操作按钮配置，可选 */
    action?: {
        /** 按钮文字 */
        label: string;
        /** 按钮点击回调 */
        onClick: () => void;
    };
    /** 自定义类名 */
    className?: string;
}

/**
 * EmptyState 空状态组件
 * 
 * @example
 * // 基础用法
 * <EmptyState title="暂无数据" />
 * 
 * @example
 * // 带描述和操作按钮
 * <EmptyState
 *   title="暂无订单"
 *   description="您还没有任何订单记录"
 *   action={{ label: "去购物", onClick: () => navigate('/market') }}
 * />
 * 
 * @example
 * // 自定义图标
 * <EmptyState
 *   icon={<ShoppingCart size={48} className="text-gray-300" />}
 *   title="购物车是空的"
 * />
 */
const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    className = '',
}) => {
    return (
        <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
            {/* 图标区域 */}
            <div className="mb-4">
                {icon || (
                    <Inbox
                        size={64}
                        className="text-gray-300"
                        aria-hidden="true"
                    />
                )}
            </div>

            {/* 标题 */}
            <h3 className="text-lg font-medium text-gray-500 mb-2">
                {title}
            </h3>

            {/* 描述文字 */}
            {description && (
                <p className="text-sm text-gray-400 text-center max-w-xs mb-4">
                    {description}
                </p>
            )}

            {/* 操作按钮 */}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-2 px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-full 
                     hover:from-red-600 hover:to-red-700 active:scale-95 transition-all duration-200
                     shadow-md shadow-red-200"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
