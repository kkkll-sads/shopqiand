import React from 'react';
import { X, Loader2 } from 'lucide-react';

interface BalanceHelpModalProps {
    visible: boolean;
    title: string;
    content: string;
    loading?: boolean;
    onClose: () => void;
}

const BalanceHelpModal: React.FC<BalanceHelpModalProps> = ({
    visible,
    title,
    content,
    loading = false,
    onClose,
}) => {
    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-[85%] max-w-md mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
                    <h3 className="text-base font-semibold text-gray-800">{title}</h3>
                    <button
                        type="button"
                        className="p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        onClick={onClose}
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-4 py-4 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 size={32} className="text-orange-500 animate-spin mb-2" />
                            <span className="text-sm text-gray-500">加载中...</span>
                        </div>
                    ) : content ? (
                        <div
                            className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    ) : (
                        <div className="text-center py-8 text-sm text-gray-400">
                            暂无说明内容
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <button
                        type="button"
                        className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-sm font-medium rounded-lg active:opacity-80 transition-opacity"
                        onClick={onClose}
                    >
                        我知道了
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BalanceHelpModal;
