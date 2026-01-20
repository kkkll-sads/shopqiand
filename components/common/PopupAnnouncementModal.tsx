import React from 'react';
import { X, Megaphone } from 'lucide-react';
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

    // 格式化时间
    const formatTime = () => {
        if (!announcement.createtime) return '';
        const timestamp = typeof announcement.createtime === 'number'
            ? announcement.createtime
            : parseInt(announcement.createtime, 10);
        if (isNaN(timestamp)) return '';
        const date = new Date(timestamp * 1000);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${month}-${day} ${hours}:${minutes}`;
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center px-6"
            style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 4rem))' }}
            onClick={onClose}
        >
            {/* 背景遮罩 - 毛玻璃效果 */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* 弹窗容器 */}
            <div className="relative w-full max-w-[320px]" onClick={(e) => e.stopPropagation()}>
                {/* 关闭按钮 - 弹窗外部右上角 */}
                <button
                    type="button"
                    className="absolute -top-12 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white active:bg-white/30 transition-colors"
                    onClick={onClose}
                >
                    <X size={20} strokeWidth={2.5} />
                </button>

                {/* 主卡片 */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[70vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
                    {/* 顶部装饰区域 */}
                    <div className="relative bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 px-5 pt-6 pb-10 flex-shrink-0">
                        {/* 装饰圆点 */}
                        <div className="absolute top-3 right-4 flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        </div>
                        
                        {/* 大喇叭图标 */}
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-3 shadow-lg">
                            <Megaphone size={28} className="text-white" />
                        </div>
                        
                        <h2 className="text-xl font-bold text-white tracking-wide">平台公告</h2>
                        <p className="text-white/70 text-xs mt-1">重要通知，请仔细阅读</p>

                        {/* 底部波浪装饰 */}
                        <div className="absolute bottom-0 left-0 right-0">
                            <svg viewBox="0 0 320 20" className="w-full h-5 fill-white">
                                <path d="M0,20 L0,10 Q80,0 160,10 T320,10 L320,20 Z" />
                            </svg>
                        </div>
                    </div>

                    {/* 内容区域 */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                        {/* 标题和时间 */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="text-[15px] font-bold text-gray-800 leading-snug flex-1">
                                {announcement.title}
                            </h3>
                            {announcement.createtime && (
                                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                                    {formatTime()}
                                </span>
                            )}
                        </div>
                        
                        {/* 正文内容 */}
                        <div
                            className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: announcement.content }}
                        />
                    </div>

                    {/* 底部按钮区域 */}
                    <div className="px-5 pb-5 pt-3 flex-shrink-0">
                        <button
                            type="button"
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-xl active:scale-[0.98] transition-transform shadow-lg shadow-orange-500/30"
                            onClick={onClose}
                        >
                            我知道了
                        </button>
                        {onDontShowToday && (
                            <button
                                type="button"
                                className="w-full mt-2 py-2 text-xs text-gray-400 active:text-gray-600 transition-colors"
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
        </div>
    );
};

export default PopupAnnouncementModal;
