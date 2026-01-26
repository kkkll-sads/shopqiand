/**
 * ResultModal - 结果提示弹窗组件
 * 已重构: 基于 BaseModal
 */
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import BaseModal from './BaseModal';

type ResultType = 'success' | 'error' | 'warning';

interface ResultModalProps {
  open: boolean;
  type: ResultType;
  title: string;
  content?: string;
  onClose: () => void;
  autoCloseDelay?: number;
  buttonText?: string;
}

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

const ResultModal: React.FC<ResultModalProps> = ({
  open,
  type,
  title,
  content,
  onClose,
  autoCloseDelay = 3000,
  buttonText = '知道了',
}) => {
  const config = getTypeConfig(type);
  const IconComponent = config.icon;

  useEffect(() => {
    if (open && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [open, autoCloseDelay, onClose]);

  return (
    <BaseModal
      visible={open}
      onClose={onClose}
      showCloseButton={false}
      maskClosable={false}
      maxWidth="max-w-xs"
      contentClassName="text-center"
    >
      {/* 关闭按钮 */}
      <div className="flex justify-end p-3 -mt-4 -mr-2">
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="关闭"
        >
          <X size={20} />
        </button>
      </div>

      {/* 图标区域 */}
      <div className="flex justify-center -mt-2">
        <div className={`p-4 rounded-full ${config.iconBgColor}`}>
          <IconComponent size={48} className={config.iconColor} aria-hidden="true" />
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
          className={`w-full py-3 text-white font-medium rounded-xl transition-colors active:scale-95 ${config.buttonColor}`}
        >
          {buttonText}
        </button>
      </div>
    </BaseModal>
  );
};

export default ResultModal;
