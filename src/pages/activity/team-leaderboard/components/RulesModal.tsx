import React from 'react';
import { X } from 'lucide-react';

interface RulesModalProps {
    open: boolean;
    onClose: () => void;
    eventTitle?: string;
    rulesText?: string;
    loading?: boolean;
}

const fallbackRules = [
    {
        title: '统计周期',
        content: '以活动配置时间为准，系统自动统计活动期间的团队有效充值贡献值。',
    },
    {
        title: '榜单范围',
        content: '仅展示团队贡献排行前50名。',
    },
    {
        title: '统计口径',
        content: '统计团队成员有效充值金额累计；无效订单不计入。',
    },
    {
        title: '排名规则',
        content: '贡献值高者在前；若贡献值相同，按达成时间先后排序。',
    },
    {
        title: '奖励说明',
        content: '1-10名封顶3000，11-30名封顶2500，31-50名封顶2000。',
    },
];

const normalizeRulesText = (rawText?: string): string => {
    if (!rawText) return '';
    return rawText
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

const RulesModal: React.FC<RulesModalProps> = ({ open, onClose, eventTitle, rulesText, loading = false }) => {
    if (!open) return null;
    const plainRules = normalizeRulesText(rulesText);
    const hasRules = plainRules.length > 0;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg">活动说明</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-12 text-center text-sm text-gray-400">规则加载中...</div>
                    ) : hasRules ? (
                        <div className="space-y-3 text-sm text-gray-600">
                            {eventTitle && (
                                <div className="text-base font-bold text-gray-900">{eventTitle}</div>
                            )}
                            <div className="whitespace-pre-wrap leading-6">{plainRules}</div>
                        </div>
                    ) : (
                        <div className="space-y-4 text-sm text-gray-600">
                            {fallbackRules.map((rule) => (
                                <section key={rule.title}>
                                    <h4 className="font-bold text-gray-900 mb-1">{rule.title}</h4>
                                    <p>{rule.content}</p>
                                </section>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-red-600 text-white font-bold rounded-xl active:scale-[0.98] transition-transform shadow-lg shadow-red-100"
                    >
                        我知道了
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RulesModal;
