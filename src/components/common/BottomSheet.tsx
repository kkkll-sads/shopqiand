/**
 * BottomSheet - 通用底部弹出抽屉组件
 * 
 * 用于展示优惠详情、地址选择、服务保障等内容
 * 支持自定义标题、内容和关闭回调
 */
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  /** 是否显示 */
  visible: boolean;
  /** 标题 */
  title: string;
  /** 关闭回调 */
  onClose: () => void;
  /** 子内容 */
  children: React.ReactNode;
  /** 最大高度，默认 80vh */
  maxHeight?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  title,
  onClose,
  children,
  maxHeight = '80vh',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  // 点击遮罩关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [visible, onClose]);

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

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center"
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className="w-full bg-white rounded-t-2xl animate-slide-up overflow-hidden"
        style={{ maxHeight }}
      >
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
          <div className="w-8" />
          <h3 className="text-base font-medium text-gray-800 flex items-center gap-1">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="overflow-y-auto" style={{ maxHeight: `calc(${maxHeight} - 56px)` }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BottomSheet;
