/**
 * ConfirmModal - 确认弹窗组件
 * 
 * 功能说明：
 * - 通用的确认操作弹窗
 * - 支持自定义标题、内容、按钮文字
 * - 支持加载状态
 * - 点击遮罩层可关闭（可配置）
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React from 'react';
import { X, Loader2 } from 'lucide-react';

/**
 * ConfirmModal 组件属性接口
 */
interface ConfirmModalProps {
    /** 控制弹窗显示/隐藏 */
    open: boolean;
    /** 弹窗标题 */
    title: string;
    /** 弹窗内容，支持字符串或 React 节点 */
    content: React.ReactNode;
    /** 确认按钮点击回调 */
    onConfirm: () => void;
    /** 取消/关闭按钮点击回调 */
    onCancel: () => void;
    /** 确认按钮文字，默认 "确定" */
    confirmText?: string;
    /** 取消按钮文字，默认 "取消" */
    cancelText?: string;
    /** 确认按钮加载状态 */
    loading?: boolean;
    /** 确认按钮样式类型，默认 "primary" */
    confirmType?: 'primary' | 'danger';
    /** 是否显示关闭按钮，默认 true */
    showCloseButton?: boolean;
    /** 点击遮罩层是否关闭，默认 true */
    maskClosable?: boolean;
}

/**
 * ConfirmModal 确认弹窗组件
 * 
 * @example
 * // 基础用法
 * <ConfirmModal
 *   open={showModal}
 *   title="确认删除"
 *   content="确定要删除该订单吗？此操作不可恢复。"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowModal(false)}
 * />
 * 
 * @example
 * // 危险操作确认
 * <ConfirmModal
 *   open={showModal}
 *   title="注销账户"
 *   content="注销后所有数据将被清除，且无法恢复！"
 *   confirmText="确认注销"
 *   confirmType="danger"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowModal(false)}
 * />
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    title,
    content,
    onConfirm,
    onCancel,
    confirmText = '确定',
    cancelText = '取消',
    loading = false,
    confirmType = 'primary',
    showCloseButton = true,
    maskClosable = true,
}) => {
    // 弹窗未打开时不渲染
    if (!open) return null;

    /**
     * 处理遮罩层点击事件
     */
    const handleMaskClick = () => {
        if (maskClosable && !loading) {
            onCancel();
        }
    };

    /**
     * 阻止弹窗内容区域的点击事件冒泡
     */
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    // 确认按钮样式
    const confirmButtonClass = confirmType === 'danger'
        ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
        : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700';

    return (
        // 遮罩层
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleMaskClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* 弹窗内容容器 */}
            <div
                className="bg-white rounded-2xl w-full max-w-sm shadow-xl transform transition-all 
                   animate-in fade-in zoom-in-95 duration-200"
                onClick={handleContentClick}
            >
                {/* 标题栏 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 id="modal-title" className="text-lg font-semibold text-gray-800">
                        {title}
                    </h3>

                    {/* 关闭按钮 */}
                    {showCloseButton && (
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full 
                         hover:bg-gray-100 transition-colors disabled:opacity-50"
                            aria-label="关闭弹窗"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* 内容区域 */}
                <div className="px-5 py-6 text-gray-600 text-sm leading-relaxed">
                    {content}
                </div>

                {/* 按钮区域 */}
                <div className="flex gap-3 px-5 pb-5">
                    {/* 取消按钮 */}
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 
                       font-medium rounded-xl hover:bg-gray-50 active:bg-gray-100
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>

                    {/* 确认按钮 */}
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 py-3 px-4 text-white font-medium rounded-xl 
                       transition-colors disabled:opacity-70 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 ${confirmButtonClass}`}
                    >
                        {loading && (
                            <Loader2 size={18} className="animate-spin" />
                        )}
                        {loading ? '处理中...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
