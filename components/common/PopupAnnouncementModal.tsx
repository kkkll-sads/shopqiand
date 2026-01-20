import React, { useRef, useState, useEffect } from 'react';
import { X, Megaphone, ChevronDown } from 'lucide-react';
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
    const contentRef = useRef<HTMLDivElement>(null);
    const [canScrollDown, setCanScrollDown] = useState(false);

    // 检测是否可以继续向下滚动
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;

        const checkScroll = () => {
            const hasMoreContent = el.scrollHeight > el.clientHeight;
            const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
            setCanScrollDown(hasMoreContent && !isAtBottom);
        };

        checkScroll();
        el.addEventListener('scroll', checkScroll);
        return () => el.removeEventListener('scroll', checkScroll);
    }, [visible, announcement]);

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
            className="fixed inset-0 z-[100] flex items-center justify-center px-5"
            style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 4rem))' }}
            onClick={onClose}
        >
            {/* 背景遮罩 - 毛玻璃效果 */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* 弹窗容器 */}
            <div className="relative w-full max-w-[340px]" onClick={(e) => e.stopPropagation()}>
                {/* 关闭按钮 - 弹窗外部右上角 */}
                <button
                    type="button"
                    className="absolute -top-12 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white active:bg-white/30 transition-colors"
                    onClick={onClose}
                >
                    <X size={20} strokeWidth={2.5} />
                </button>

                {/* 主卡片 */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[75vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
                    {/* 顶部装饰区域 - 精简版 */}
                    <div className="relative bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 px-4 pt-4 pb-6 flex-shrink-0">
                        {/* 装饰圆点 */}
                        <div className="absolute top-3 right-4 flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        </div>
                        
                        {/* 标题行：图标 + 文字 */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow">
                                <Megaphone size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">平台公告</h2>
                                <p className="text-white/70 text-[11px]">重要通知，请仔细阅读</p>
                            </div>
                        </div>

                        {/* 底部波浪装饰 */}
                        <div className="absolute bottom-0 left-0 right-0">
                            <svg viewBox="0 0 340 16" className="w-full h-4 fill-white">
                                <path d="M0,16 L0,8 Q85,0 170,8 T340,8 L340,16 Z" />
                            </svg>
                        </div>
                    </div>

                    {/* 内容区域 */}
                    <div className="relative flex-1 min-h-0">
                        <div 
                            ref={contentRef}
                            className="overflow-y-auto px-4 py-3 max-h-[45vh]"
                        >
                            {/* 标题和时间 */}
                            <div className="flex items-start justify-between gap-3 mb-2">
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

                        {/* 底部渐变遮罩 + 滚动提示 */}
                        {canScrollDown && (
                            <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                                {/* 渐变遮罩 */}
                                <div className="h-12 bg-gradient-to-t from-white via-white/90 to-transparent" />
                                {/* 滚动提示 */}
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                                    <span className="text-[10px] text-gray-400">下滑查看更多</span>
                                    <ChevronDown size={14} className="text-gray-400 -mt-0.5" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 底部按钮区域 */}
                    <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-gray-100">
                        <button
                            type="button"
                            className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-xl active:scale-[0.98] transition-transform shadow-lg shadow-orange-500/30"
                            onClick={onClose}
                        >
                            我知道了
                        </button>
                        {onDontShowToday && (
                            <button
                                type="button"
                                className="w-full mt-1.5 py-1.5 text-xs text-gray-400 active:text-gray-600 transition-colors"
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
