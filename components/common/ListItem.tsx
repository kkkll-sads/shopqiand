/**
 * ListItem - 列表项组件
 * 
 * 功能说明：
 * - 通用的列表项布局组件
 * - 左侧图标 + 标题/副标题 + 右侧内容/箭头
 * - 支持点击交互
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * ListItem 组件属性接口
 */
interface ListItemProps {
    /** 左侧图标，可选 */
    icon?: React.ReactNode;
    /** 标题文字 */
    title: string;
    /** 副标题/描述，可选 */
    subtitle?: string;
    /** 右侧额外内容，可选 */
    extra?: React.ReactNode;
    /** 是否显示右侧箭头，默认 true */
    arrow?: boolean;
    /** 点击事件处理函数 */
    onClick?: () => void;
    /** 自定义类名 */
    className?: string;
    /** 是否禁用 */
    disabled?: boolean;
}

/**
 * ListItem 列表项组件
 * 
 * @example
 * // 基础列表项
 * <ListItem title="我的订单" onClick={() => navigate('/orders')} />
 * 
 * @example
 * // 带图标和副标题
 * <ListItem
 *   icon={<Settings size={20} className="text-gray-600" />}
 *   title="账户设置"
 *   subtitle="修改密码、安全设置"
 *   onClick={() => navigate('/settings')}
 * />
 * 
 * @example
 * // 带右侧额外内容
 * <ListItem
 *   title="账户余额"
 *   extra={<span className="text-orange-500 font-medium">¥1,234.56</span>}
 *   arrow={false}
 * />
 */
const ListItem: React.FC<ListItemProps> = ({
    icon,
    title,
    subtitle,
    extra,
    arrow = true,
    onClick,
    className = '',
    disabled = false,
}) => {
    // 是否可点击
    const isClickable = onClick && !disabled;

    return (
        <div
            className={`
        flex items-center py-3.5 px-4 bg-white
        ${isClickable ? 'cursor-pointer active:bg-gray-50' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
            onClick={isClickable ? onClick : undefined}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
        >
            {/* 左侧图标 */}
            {icon && (
                <div className="mr-3 flex-shrink-0">
                    {icon}
                </div>
            )}

            {/* 中间内容区 */}
            <div className="flex-1 min-w-0">
                {/* 标题 */}
                <div className="text-base text-gray-800 truncate">
                    {title}
                </div>

                {/* 副标题 */}
                {subtitle && (
                    <div className="text-sm text-gray-500 mt-0.5 truncate">
                        {subtitle}
                    </div>
                )}
            </div>

            {/* 右侧区域 */}
            <div className="flex items-center ml-3 flex-shrink-0">
                {/* 额外内容 */}
                {extra && (
                    <div className="mr-1">
                        {extra}
                    </div>
                )}

                {/* 箭头图标 */}
                {arrow && (
                    <ChevronRight
                        size={20}
                        className="text-gray-400"
                        aria-hidden="true"
                    />
                )}
            </div>
        </div>
    );
};

export default ListItem;
