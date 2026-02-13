import React from 'react';
import { X } from 'lucide-react';

interface RulesModalProps {
    open: boolean;
    onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ open, onClose }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg">活动规则</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4 text-sm text-gray-600">
                        <section>
                            <h4 className="font-bold text-gray-900 mb-1">统计周期</h4>
                            <p>即日起至 2月15日 24:00</p>
                        </section>

                        <section>
                            <h4 className="font-bold text-gray-900 mb-1">榜单范围</h4>
                            <p>仅展示活跃值排名前50名的团队。</p>
                        </section>

                        <section>
                            <h4 className="font-bold text-gray-900 mb-1">活跃值口径</h4>
                            <p>系统自动统计有效活跃值（含行为活跃与贡献得分），异常/退款等情况将自动扣减或不计入。</p>
                        </section>

                        <section>
                            <h4 className="font-bold text-gray-900 mb-1">更新频率</h4>
                            <p>榜单数据每10分钟刷新一次。</p>
                        </section>

                        <section>
                            <h4 className="font-bold text-gray-900 mb-1">奖励说明</h4>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-2 mt-2">
                                <div className="flex justify-between">
                                    <span>第1-10名</span>
                                    <span className="font-bold text-red-500">团建封顶3000元</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>第11-30名</span>
                                    <span className="font-bold text-red-500">团建封顶2500元</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>第31-50名</span>
                                    <span className="font-bold text-red-500">团建封顶2000元</span>
                                </div>
                            </div>
                        </section>
                    </div>
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
