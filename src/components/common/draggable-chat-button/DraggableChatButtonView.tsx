import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { BUTTON_SIZE, EDGE_MARGIN } from './constants';
import type { ChatButtonSide } from './types';

interface DraggableChatButtonViewProps {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  deleteZoneRef: React.RefObject<HTMLDivElement | null>;
  currentSide: ChatButtonSide;
  isHalfHidden: boolean;
  showDeleteButton: boolean;
  positionY: number;
  onClose: () => void;
}

const DraggableChatButtonView: React.FC<DraggableChatButtonViewProps> = ({
  buttonRef,
  deleteZoneRef,
  currentSide,
  isHalfHidden,
  showDeleteButton,
  positionY,
  onClose,
}) => {
  return (
    <>
      <button
        ref={buttonRef}
        className="fixed z-[10000] rounded-full shadow-lg"
        style={{
          width: `${BUTTON_SIZE}px`,
          height: `${BUTTON_SIZE}px`,
          transform: 'translate3d(0, 0, 0)',
          touchAction: 'none',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-label="打开客服"
      >
        <div
          className={`w-full h-full rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 ${
            isHalfHidden
              ? 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-orange-400/20'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/30'
          }`}
        >
          <MessageCircle
            size={24}
            strokeWidth={2}
            className={`transition-transform duration-300 ${
              currentSide === 'left' && isHalfHidden ? 'translate-x-3' : ''
            } ${currentSide === 'right' && isHalfHidden ? '-translate-x-3' : ''}`}
          />
        </div>
      </button>

      {showDeleteButton && (
        <div
          ref={deleteZoneRef}
          className="fixed z-[10001] animate-fadeIn"
          style={{
            left: currentSide === 'left' ? EDGE_MARGIN + BUTTON_SIZE + 8 : 'auto',
            right: currentSide === 'right' ? EDGE_MARGIN + BUTTON_SIZE + 8 : 'auto',
            top: positionY + BUTTON_SIZE / 2 - 16,
          }}
        >
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-full shadow-lg border border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-200 transition-all active:scale-95"
          >
            <X size={16} />
            <span className="text-xs font-medium">关闭</span>
          </button>
        </div>
      )}
    </>
  );
};

export default DraggableChatButtonView;
