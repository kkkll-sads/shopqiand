/**
 * ConfirmModal - 确认弹窗组件
 * 已重构: 基于 BaseModal
 */
import React from 'react';
import { Loader2 } from 'lucide-react';
import BaseModal from './BaseModal';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  content: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  confirmType?: 'primary' | 'danger';
  showCloseButton?: boolean;
  maskClosable?: boolean;
}

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
  const confirmButtonClass = confirmType === 'danger'
    ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
    : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700';

  return (
    <BaseModal
      visible={open}
      onClose={onCancel}
      title={title}
      showCloseButton={showCloseButton}
      maskClosable={maskClosable && !loading}
      contentClassName="px-5 py-6"
    >
      {/* 内容区域 */}
      <div className="text-gray-600 text-sm leading-relaxed mb-6">
        {content}
      </div>

      {/* 按钮区域 */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 py-3 px-4 text-white font-medium rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${confirmButtonClass}`}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? '处理中...' : confirmText}
        </button>
      </div>
    </BaseModal>
  );
};

export default ConfirmModal;
