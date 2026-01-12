import React from 'react';
import { X, Bell } from 'lucide-react';
import { AnnouncementItem } from '../../services/cms';

interface PopupAnnouncementModalProps {
    visible: boolean;
    announcement: AnnouncementItem | null;
    onClose: () => void;
    onDontShowToday?: () => void;
}

const PopupAnnouncementModal: React.FC<PopupAnnouncementModalProps> = ({
    visible,
    announcement,
    onClose,
    onDontShowToday,
}) => {
    if (!visible || !announcement) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-orange-500 to-orange-400 px-4 py-4 text-white">
                    <div className="flex items-center gap-2">
                        <Bell size={20} className="animate-bounce" />
                        <span className="font-semibold">平台公告</span>
                    </div>
                    <button
                        type="button"
                        className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Title */}
                <div className="px-4 pt-4 pb-2">
                    <h3 className="text-lg font-bold text-gray-800 leading-tight">
                        {announcement.title}
                    </h3>
                    {announcement.createtime && (
                        <p className="text-xs text-gray-400 mt-1">
                            {(() => {
                                // 格式化时间戳为可读日期
                                const timestamp = typeof announcement.createtime === 'number'
                                    ? announcement.createtime
                                    : parseInt(announcement.createtime, 10);
                                if (isNaN(timestamp)) return '';
                                // Unix时间戳是秒，JavaScript Date需要毫秒
                                const date = new Date(timestamp * 1000);
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const hours = String(date.getHours()).padStart(2, '0');
                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                return `${year}-${month}-${day} ${hours}:${minutes}`;
                            })()}
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="px-4 py-3 max-h-[50vh] overflow-y-auto">
                    <div
                        className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: announcement.content }}
                    />
                </div>

                {/* Footer */}
                <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
                    <button
                        type="button"
                        className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-sm font-medium rounded-lg active:opacity-80 transition-opacity shadow-sm"
                        onClick={onClose}
                    >
                        我知道了
                    </button>
                    {onDontShowToday && (
                        <button
                            type="button"
                            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => {
                                onDontShowToday();
                                onClose();
                            }}
                        >
                            今日不再提示
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PopupAnnouncementModal;
