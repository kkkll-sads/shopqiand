/**
 * BaseModal - 基础弹窗组件
 * 
 * 功能说明：
 * - 提供统一的弹窗基础结构
 * - 支持遮罩层、标题栏、内容区、操作按钮
 * - 可被其他 Modal 组件继承使用
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * BaseModal 组件属性接口
 */
export interface BaseModalProps {
  /** 控制弹窗显示/隐藏 */
  visible: boolean;
  /** 关闭回调函数 */
  onClose: () => void;
  /** 弹窗标题 */
  title?: string;
  /** 弹窗内容 */
  children: React.ReactNode;
  /** 是否显示关闭按钮，默认 true */
  showCloseButton?: boolean;
  /** 点击遮罩层是否关闭，默认 true */
  maskClosable?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义内容区类名 */
  contentClassName?: string;
  /** 最大宽度，默认 'max-w-sm' */
  maxWidth?: string;
}

/**
 * BaseModal 基础弹窗组件
 * 
 * @example
 * <BaseModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="标题"
 * >
 *   <p>内容</p>
 * </BaseModal>
 */
const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  maskClosable = true,
  className = '',
  contentClassName = '',
  maxWidth = 'max-w-sm',
}) => {
  // 阻止滚动穿透
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!visible) return null;

  const handleMaskClick = () => {
    if (maskClosable) {
      onClose();
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={handleMaskClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={`bg-white rounded-2xl w-full ${maxWidth} shadow-xl transform transition-all animate-in fade-in zoom-in-95 duration-200 ${className}`}
        onClick={handleContentClick}
      >
        {/* 标题栏 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            {title && (
              <h3 id="modal-title" className="text-lg font-semibold text-gray-800">
                {title}
              </h3>
            )}
            {!title && <div />}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="关闭弹窗"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* 内容区域 */}
        <div className={contentClassName || 'px-5 py-6'}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;
