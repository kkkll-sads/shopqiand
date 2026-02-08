import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ExternalLink } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface EmbeddedBrowserProps {
    url: string;
    title?: string;
    onClose: () => void;
    isOpen: boolean;
}

export const EmbeddedBrowser: React.FC<EmbeddedBrowserProps> = ({
    url,
    title = '支付页面',
    onClose,
    isOpen
}) => {
    const [loading, setLoading] = useState(true);
    const [key, setKey] = useState(0); // Used to reload iframe
    const [showInstructionOverlay, setShowInstructionOverlay] = useState(false);

    useEffect(() => {
        if (isOpen && url) {
            // 检查是否已经关闭过提示（使用 localStorage）
            const dismissedKey = `payment_instruction_dismissed_${url}`;
            const dismissed = localStorage.getItem(dismissedKey);
            
            // 延迟显示提示，让页面先加载
            const timer = setTimeout(() => {
                if (!dismissed) {
                    setShowInstructionOverlay(true);
                }
            }, 500);
            
            return () => clearTimeout(timer);
        }
    }, [isOpen, url]);

    if (!isOpen) return null;

    const handleReload = () => {
        setLoading(true);
        setKey(prev => prev + 1);
    };

    const handleOpenInBrowser = () => {
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleCloseInstruction = () => {
        setShowInstructionOverlay(false);
        // 记录用户已关闭提示（可选：使用 URL 作为 key，或者使用通用 key）
        const dismissedKey = `payment_instruction_dismissed_${url}`;
        localStorage.setItem(dismissedKey, 'true');
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm shrink-0">
                <button
                    onClick={onClose}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="flex-1 text-center mx-2 truncate">
                    <span className="font-bold text-gray-900">{title}</span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleOpenInBrowser}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="在浏览器中打开"
                    >
                        <ExternalLink size={20} />
                    </button>
                    <button
                        onClick={handleReload}
                        className="p-2 -mr-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="刷新"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative bg-gray-50">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-50/80">
                        <LoadingSpinner size="lg" />
                        <span className="ml-2 text-gray-500 font-medium">加载中...</span>
                    </div>
                )}

                <iframe
                    key={key}
                    src={url}
                    className="w-full h-full border-none"
                    onLoad={() => setLoading(false)}
                    allow="accelerometer; autoplay; camera; microphone; payment; geolocation"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
                />
            </div>

            {/* 支付提示遮罩层 */}
            {showInstructionOverlay && (
                <div className="absolute inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative animate-in zoom-in-95 duration-200">
                        {/* 关闭按钮 */}
                        <button
                            onClick={handleCloseInstruction}
                            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* 内容 */}
                        <div className="p-6 pt-8">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ExternalLink size={32} className="text-orange-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">支付提示</h3>
                            </div>

                            {/* 步骤说明 */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        1
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            点击右上角
                                            <span className="inline-flex items-center mx-1 text-orange-600 font-bold">
                                                <ExternalLink size={14} className="inline" />
                                            </span>
                                            按钮
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        2
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            在浏览器中打开页面
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        3
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            跳转至支付宝/微信完成支付
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        4
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            支付成功后，返回APP查看订单
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 确认按钮 */}
                            <button
                                onClick={handleCloseInstruction}
                                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform"
                            >
                                我知道了
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
