/**
 * ResultModal - 结果提示弹窗组件
 * 
 * 功能说明：
 * - 用于显示操作结果（成功/失败/警告）
 * - 支持自动关闭倒计时
 * - 提供三种状态类型对应不同的图标和颜色
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

/**
 * 结果类型枚举
 */
type ResultType = 'success' | 'error' | 'warning';

/**
 * ResultModal 组件属性接口
 */
interface ResultModalProps {
    /** 控制弹窗显示/隐藏 */
    open: boolean;
    /** 结果类型：成功/失败/警告 */
    type: ResultType;
    /** 结果标题 */
    title: string;
    /** 结果描述内容，可选 */
    content?: string;
    /** 关闭回调函数 */
    onClose: () => void;
    /** 自动关闭延迟（毫秒），设为 0 则不自动关闭，默认 3000 */
    autoCloseDelay?: number;
    /** 确认按钮文字，默认 "知道了" */
    buttonText?: string;
}

/**
 * 获取结果类型对应的配置（图标、颜色等）
 * @param type - 结果类型
 * @returns 配置对象
 */
const getTypeConfig = (type: ResultType) => {
    const configMap = {
        success: {
            icon: CheckCircle,
            iconColor: 'text-green-500',
            iconBgColor: 'bg-green-50',
            buttonColor: 'bg-green-500 hover:bg-green-600',
        },
        error: {
            icon: XCircle,
            iconColor: 'text-red-500',
            iconBgColor: 'bg-red-50',
            buttonColor: 'bg-red-500 hover:bg-red-600',
        },
        warning: {
            icon: AlertCircle,
            iconColor: 'text-orange-500',
            iconBgColor: 'bg-orange-50',
            buttonColor: 'bg-orange-500 hover:bg-orange-600',
        },
    };
    return configMap[type];
};

/**
 * ResultModal 结果提示弹窗组件
 * 
 * @example
 * // 成功提示
 * <ResultModal
 *   open={showResult}
 *   type="success"
 *   title="支付成功"
 *   content="您的订单已成功支付，即将跳转到订单详情页。"
 *   onClose={() => setShowResult(false)}
 * />
 * 
 * @example
 * // 错误提示
 * <ResultModal
 *   open={showError}
 *   type="error"
 *   title="操作失败"
 *   content="网络异常，请稍后重试。"
 *   onClose={() => setShowError(false)}
 *   autoCloseDelay={5000}
 * />
 */
const ResultModal: React.FC<ResultModalProps> = ({
    open,
    type,
    title,
    content,
    onClose,
    autoCloseDelay = 3000,
    buttonText = '知道了',
}) => {
    // 获取类型配置
    const config = getTypeConfig(type);
    const IconComponent = config.icon;

    /**
     * 自动关闭定时器
     * 当 autoCloseDelay > 0 时，在指定时间后自动关闭弹窗
     */
    useEffect(() => {
        if (open && autoCloseDelay > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);

            // 组件卸载或依赖变化时清除定时器
            return () => clearTimeout(timer);
        }
    }, [open, autoCloseDelay, onClose]);

    // 弹窗未打开时不渲染
    if (!open) return null;

    return (
        // 遮罩层
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
        >
            {/* 弹窗内容容器 */}
            <div className="bg-white rounded-2xl w-full max-w-xs shadow-xl text-center 
                      animate-in fade-in zoom-in-95 duration-200">
                {/* 关闭按钮 */}
                <div className="flex justify-end p-3">
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full 
                       hover:bg-gray-100 transition-colors"
                        aria-label="关闭"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 图标区域 */}
                <div className="flex justify-center -mt-2">
                    <div className={`p-4 rounded-full ${config.iconBgColor}`}>
                        <IconComponent
                            size={48}
                            className={config.iconColor}
                            aria-hidden="true"
                        />
                    </div>
                </div>

                {/* 标题 */}
                <h3 className="text-xl font-semibold text-gray-800 mt-4 px-4">
                    {title}
                </h3>

                {/* 描述内容 */}
                {content && (
                    <p className="text-sm text-gray-500 mt-2 px-6 leading-relaxed">
                        {content}
                    </p>
                )}

                {/* 确认按钮 */}
                <div className="px-6 pb-6 pt-6">
                    <button
                        onClick={onClose}
                        className={`w-full py-3 text-white font-medium rounded-xl 
                       transition-colors active:scale-95 ${config.buttonColor}`}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultModal;
