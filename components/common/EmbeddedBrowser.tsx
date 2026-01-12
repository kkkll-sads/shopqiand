import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
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

    if (!isOpen) return null;

    const handleReload = () => {
        setLoading(true);
        setKey(prev => prev + 1);
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

                <button
                    onClick={handleReload}
                    className="p-2 -mr-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="刷新"
                >
                    <RefreshCw size={20} />
                </button>
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
        </div>
    );
};
