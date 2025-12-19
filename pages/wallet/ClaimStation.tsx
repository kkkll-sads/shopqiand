import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Plus, XCircle, AlertCircle, History, Check, Image as ImageIcon, X, ShoppingBag, Users, Lock, Ticket } from 'lucide-react';
import { fetchProfile, AUTH_TOKEN_KEY } from '../../services/api';
import { UserInfo } from '../../types';
import { useNotification } from '../../context/NotificationContext';

interface ClaimStationProps {
    onBack?: () => void;
    onNavigate?: (page: string) => void;
}

interface ClaimRecord {
    id: string;
    type: string;
    amount: number;
    status: 'audit' | 'success' | 'rejected'; // audit: 审核中, success: 成功, rejected: 驳回
    time: string;
    reason?: string;
}

const ClaimStation: React.FC<ClaimStationProps> = ({ onBack, onNavigate }) => {
    const { showToast } = useNotification();
    const [activeTab, setActiveTab] = useState<'apply' | 'unlock'>('apply');

    // 1: 实名, 2: 凭证, 3: 审核, 4: 结果
    const [step] = useState(2);
    const [form, setForm] = useState({
        type: 'screenshot',
        amount: '',
        images: [] as string[],
    });
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<ClaimRecord[]>([
        { id: '1', type: 'balance', amount: 5000.00, status: 'audit', time: '2023-10-27 10:00' },
        { id: '2', type: 'transfer', amount: 948.00, status: 'success', time: '2023-10-26 14:30' },
        { id: '3', type: 'other', amount: 3000.00, status: 'rejected', time: '2023-10-25 09:15', reason: '审核失败为什么...' },
    ]);
    const [showErrorTip, setShowErrorTip] = useState(false);

    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    const [unlockStatus, setUnlockStatus] = useState({
        hasSelfTrade: false,
        activeReferrals: 0,
        referralTarget: 3,
        canUnlock: false,
        isLoading: true
    });
    const [unlockLoading, setUnlockLoading] = useState(false);

    // Mock Load Unlock Status
    useEffect(() => {
        if (activeTab === 'unlock') {
            setUnlockStatus(prev => ({ ...prev, isLoading: true }));
            // Simulate API call
            setTimeout(() => {
                // Mock data: Assume user has self trade but only 1 referral
                // In real app, this comes from checkUnlockCondition API
                setUnlockStatus({
                    hasSelfTrade: true,
                    activeReferrals: 3, // Mocking success state
                    referralTarget: 3,
                    canUnlock: true,
                    isLoading: false
                });
            }, 800);
        }
    }, [activeTab]);

    const handleUnlockLegacy = () => {
        if (!userInfo?.legacy_frozen || Number(userInfo.legacy_frozen) < 1000) {
            showToast('warning', '余额不足', '待激活确权金不足 1000');
            return;
        }
        if (!unlockStatus.hasSelfTrade) {
            showToast('warning', '条件未满足', '您自身尚未完成交易');
            return;
        }
        if (unlockStatus.activeReferrals < unlockStatus.referralTarget) {
            showToast('warning', '条件未满足', `直推交易用户不足 (当前 ${unlockStatus.activeReferrals}/${unlockStatus.referralTarget})`);
            return;
        }

        setUnlockLoading(true);
        // Simulate API call
        setTimeout(() => {
            setUnlockLoading(false);
            showToast('success', '解锁成功', '权益包与寄售券已发放');
            // Update local balance mock
            if (userInfo) {
                setUserInfo({
                    ...userInfo,
                    legacy_frozen: Number(userInfo.legacy_frozen) - 1000
                });
            }
        }, 1500);
    };

    useEffect(() => {
        const loadData = async () => {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (token) {
                try {
                    const res = await fetchProfile(token);
                    if (res.code === 1 && res.data) {
                        setUserInfo(res.data.userInfo);
                    }
                } catch (error) {
                    console.error('获取用户信息失败:', error);
                }
            }
        };
        loadData();
    }, []);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const currentCount = form.images.length;
            const newFiles = Array.from(files);

            // Calculate how many more we can add
            const remainingSlots = 8 - currentCount;
            const filesToAdd = newFiles.slice(0, remainingSlots);

            const newImages = filesToAdd.map(file => URL.createObjectURL(file as any));
            setForm(prev => ({ ...prev, images: [...prev.images, ...newImages] }));

            if (newFiles.length > remainingSlots) {
                showToast('warning', '数量限制', '最多只能上传8张凭证');
            }
        }
    };

    const handleSubmit = () => {
        if (!form.amount || parseFloat(form.amount) <= 0) {
            // showToast('warning', '输入有误', '请输入有效的确权金额');
            setShowErrorTip(true);
            setTimeout(() => setShowErrorTip(false), 3000);
            return;
        }
        if (form.images.length === 0) {
            showToast('warning', '缺少凭证', '请上传凭证截图');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            const newRecord: ClaimRecord = {
                id: Date.now().toString(),
                type: form.type === 'screenshot' ? 'balance' : form.type,
                amount: parseFloat(form.amount),
                status: 'audit',
                time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16)
            };
            setHistory([newRecord, ...history]);
            showToast('success', '提交成功', '提交成功！请等待人工复核');
            setForm({ type: 'screenshot', amount: '', images: [] });
        }, 1500);
    };

    const getStatusTag = (status: string) => {
        switch (status) {
            case 'audit':
                return <span className="text-xs px-3 py-1 rounded bg-[#FFE4C4] text-[#8B4513] font-medium border border-[#DEB887]">AI审计中</span>;
            case 'success':
                return <span className="text-xs px-3 py-1 rounded bg-[#DEF7EC] text-[#03543F] font-medium border border-[#84E1BC]">确权成功</span>;
            case 'rejected':
                return <span className="text-xs px-3 py-1 rounded bg-[#FDE8E8] text-[#9B1C1C] font-medium border border-[#F8B4B4]">审核失败</span>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF8F0] pb-24 font-sans relative">
            {/* Error Tip Toast - Mimicking the red box in image */}
            {showErrorTip && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
                    <div className="bg-[#FF4D4F] text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px] justify-center">
                        <div className="border-2 border-white rounded-full p-0.5">
                            <X size={12} className="text-white" strokeWidth={3} />
                        </div>
                        <span className="font-medium">请输入有效的确权金额</span>
                        <button
                            onClick={() => setShowErrorTip(false)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 active:opacity-70"
                        >
                            <X size={16} className="text-white/80" />
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Header Area */}
            <div className="bg-[#FFDAB9] pt-safe pb-2 px-4 sticky top-0 z-20">
                {/* Back Link if needed, though pure tab design usually sits in main nav structure, 
                    but adapting for sub-page capability */}
                {/* {onBack && (
                     <div className="absolute top-safe left-2 z-30">
                        <button className="p-2" onClick={onBack}>
                            <ChevronLeft size={24} className="text-[#8B4513]" />
                        </button>
                     </div>
                )} */}

                {/* Tabs */}
                <div className="bg-[#FFE4C4]/50 p-1 rounded-2xl flex relative">
                    <button
                        onClick={() => setActiveTab('apply')}
                        className={`flex-1 py-2.5 text-center rounded-xl text-base font-bold transition-all duration-300 relative z-10 ${activeTab === 'apply'
                            ? 'bg-white text-[#FF4500] shadow-sm'
                            : 'text-[#8B4513]/70 hover:bg-white/30'
                            }`}
                    >
                        确权申请
                    </button>
                    <button
                        onClick={() => setActiveTab('unlock')}
                        className={`flex-1 py-2.5 text-center rounded-xl text-base font-bold transition-all duration-300 relative z-10 ${activeTab === 'unlock'
                            ? 'bg-white text-[#FF4500] shadow-sm'
                            : 'text-[#8B4513]/70 hover:bg-white/30'
                            }`}
                    >
                        旧资产解锁
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <div className="px-4 -mt-2 relative z-10">
                {activeTab === 'apply' ? (
                    <>
                        {/* Steps Indicator */}
                        <div className="bg-[#FFF8F0] py-4 mb-2">
                            <div className="flex items-center justify-between relative px-4">
                                {/* Background Line */}
                                <div className="absolute top-3 left-8 right-8 h-[3px] bg-[#FFE4C4] -z-10 rounded-full"></div>

                                {[
                                    { label: '实名认证', status: 'done' },
                                    { label: '上传凭证', status: 'active' },
                                    { label: '等待审核', status: 'wait' },
                                    { label: '确权成功', status: 'wait' },
                                ].map((s, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-2">
                                        <div className={`w-7 h-7 rounded-full border-[3px] flex items-center justify-center z-10 bg-[#FFF8F0] shadow-sm transition-colors duration-300
                                            ${s.status === 'done' ? 'border-[#FF6B00] bg-[#FF6B00]' :
                                                s.status === 'active' ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/20' : 'border-[#E0E0E0]'}
                                         `}>
                                            {s.status === 'done' && <Check size={14} className="text-white" strokeWidth={3} />}
                                            {s.status === 'active' && <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]"></div>}
                                        </div>
                                        <span className={`text-xs font-medium scale-90 ${s.status === 'active' ? 'text-[#FF4500]' : s.status === 'done' ? 'text-[#8B4513]' : 'text-[#BBBBBB]'}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Form Card */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm shadow-orange-100/50">

                                {/* Type Select */}
                                <div className="mb-6">
                                    <div className="flex items-center mb-3">
                                        <div className="w-1 h-4 bg-[#FF4500] rounded-full mr-2"></div>
                                        <h3 className="text-[#333333] font-bold text-base">凭证类型</h3>
                                    </div>
                                    <div className="relative">
                                        <select
                                            className="w-full appearance-none bg-[#F9F9F9] border border-[#EEEEEE] text-[#333333] text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#FF4500] focus:border-[#FF4500] transition-all"
                                            value={form.type}
                                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                                        >
                                            <option value="screenshot">余额截图</option>
                                            <option value="transfer">转账记录</option>
                                            <option value="other">其他凭证</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#999999]">
                                            <ChevronLeft size={20} className="-rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Amount Input */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center">
                                            <div className="w-1 h-4 bg-[#FF4500] rounded-full mr-2"></div>
                                            <h3 className="text-[#333333] font-bold text-base">确权金额</h3>
                                        </div>
                                        <span className="text-xs text-[#666666]">当前余额: <span className="font-bold text-[#333333]">¥{userInfo?.money || '0.00'}</span></span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full bg-[#F9F9F9] border border-[#EEEEEE] text-[#333333] text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#FF4500] focus:border-[#FF4500] transition-all placeholder-[#CCCCCC]"
                                            placeholder="确权金额"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-[#FF4D4F]">提示：请严格按照截图金额填写，虚假申报将导致封号</p>
                                </div>

                                {/* Upload */}
                                <div className="mb-6">
                                    <div className="flex items-center mb-3">
                                        <div className="w-1 h-4 bg-[#FF4500] rounded-full mr-2"></div>
                                        <h3 className="text-[#333333] font-bold text-base">凭证上传</h3>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        {form.images.map((img, idx) => (
                                            <div key={idx} className="aspect-square rounded-xl bg-[#FFF8F0] border border-[#FFE4C4] overflow-hidden relative group">
                                                <img src={img} alt="preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                                                    className="absolute top-0.5 right-0.5 bg-black/40 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}

                                        {form.images.length < 8 && (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="aspect-square rounded-xl bg-[#FFE4C4] border border-[#FFDAB9] flex items-center justify-center text-[#FF6B00] hover:bg-[#FFDAB9] transition-colors"
                                            >
                                                <Plus size={28} />
                                            </button>
                                        )}

                                        {/* Placeholder logic to improve layout visualization if empty */}
                                        {form.images.length === 0 && (
                                            <div className="aspect-square rounded-xl bg-[#F9F9F9] border border-[#EEEEEE] flex items-center justify-center">
                                                <ImageIcon size={24} className="text-[#DDDDDD]" />
                                            </div>
                                        )}

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className={`w-full py-3.5 rounded-full text-lg font-bold text-white shadow-lg transition-all active:scale-[0.98] mt-2
                                        ${loading ? 'bg-gray-300 shadow-none cursor-not-allowed' : 'bg-gradient-to-r from-[#FF6B00] to-[#FF4500] shadow-orange-200'}`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            提交中 <span className="animate-spin">◌</span>
                                        </span>
                                    ) : '提 交'}
                                </button>
                            </div>

                            {/* History List */}
                            <div className="space-y-4 pb-4">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="font-bold text-[#333333] text-lg">历史记录区</h3>
                                    <button
                                        className="text-[#FF4500] text-sm font-medium hover:text-[#E63E00]"
                                        onClick={() => onNavigate?.('claim-history')}
                                    >
                                        查看更多
                                    </button>
                                </div>

                                {history.length > 0 ? (
                                    history.map((record, idx) => (
                                        <div key={record.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[#666666] text-base font-medium">Record {history.length - idx}</span>
                                                {getStatusTag(record.status)}
                                            </div>

                                            <div className="flex-1 text-right">
                                                <div className="text-[#999999] text-sm">标签：{record.status === 'audit' ? 'AI审计中' : record.status === 'success' ? '确权成功' : '审核失败'}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
                                        暂无提交记录
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Asset Balance Card */}
                        <div className="bg-gradient-to-br from-[#FF9966] to-[#FF5E62] rounded-2xl p-6 text-white shadow-lg shadow-orange-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Lock size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-white/80 text-sm font-medium mb-1">待激活确权金余额</div>
                                <div className="text-3xl font-bold font-mono tracking-wider">
                                    ¥{userInfo?.legacy_frozen ? Number(userInfo.legacy_frozen).toFixed(2) : (userInfo?.pending_service_fee || '0.00')}
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-white/90 text-xs bg-white/20 px-3 py-1.5 rounded-full w-fit backdrop-blur-sm">
                                    <AlertCircle size={12} />
                                    <span>完成任务即可解锁旧资产</span>
                                </div>
                            </div>
                        </div>

                        {/* Unlock Conditions */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#FFE4C4]/60">
                            <div className="flex items-center mb-4 border-b border-gray-100 pb-3">
                                <div className="w-1 h-4 bg-[#FF4500] rounded-full mr-2"></div>
                                <h3 className="text-[#333333] font-bold text-base">解锁条件检测</h3>
                            </div>

                            <div className="space-y-4">
                                {/* Condition 1: Self Trade */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${unlockStatus.hasSelfTrade ? 'bg-[#DEF7EC] text-[#03543F]' : 'bg-[#FDE8E8] text-[#9B1C1C]'}`}>
                                            <ShoppingBag size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[#333] font-medium text-sm">自身完成交易</div>
                                            <div className="text-xs text-gray-500">需至少完成一笔买入或卖出</div>
                                        </div>
                                    </div>
                                    <div>
                                        {unlockStatus.isLoading ? (
                                            <span className="text-gray-400 text-xs">检测中...</span>
                                        ) : unlockStatus.hasSelfTrade ? (
                                            <Check size={20} className="text-[#03543F]" />
                                        ) : (
                                            <X size={20} className="text-[#9B1C1C]" />
                                        )}
                                    </div>
                                </div>

                                {/* Condition 2: Referrals */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${unlockStatus.activeReferrals >= unlockStatus.referralTarget ? 'bg-[#DEF7EC] text-[#03543F]' : 'bg-[#FFF8F0] text-[#8B4513]'}`}>
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[#333] font-medium text-sm">直推有效用户</div>
                                            <div className="text-xs text-gray-500">需直推 {unlockStatus.referralTarget} 个有交易记录的用户</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        {unlockStatus.isLoading ? (
                                            <span className="text-gray-400 text-xs">检测中...</span>
                                        ) : (
                                            <>
                                                <span className={`text-sm font-bold ${unlockStatus.activeReferrals >= unlockStatus.referralTarget ? 'text-[#03543F]' : 'text-[#FF4500]'}`}>
                                                    {unlockStatus.activeReferrals}/{unlockStatus.referralTarget}
                                                </span>
                                                {unlockStatus.activeReferrals >= unlockStatus.referralTarget && <Check size={14} className="text-[#03543F] mt-1" />}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Unlock Rewards & Action */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#FFE4C4]/60">
                            <div className="flex items-center mb-4 border-b border-gray-100 pb-3">
                                <div className="w-1 h-4 bg-[#FF4500] rounded-full mr-2"></div>
                                <h3 className="text-[#333333] font-bold text-base">解锁权益</h3>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-1 bg-[#FFF8F0] p-3 rounded-xl border border-[#FFE4C4] flex flex-col items-center justify-center text-center">
                                    <div className="text-[#FF4500] font-bold text-lg mb-1">权益资产包</div>
                                    <div className="text-xs text-[#8B4513]">价值 ¥1000</div>
                                </div>
                                <div className="text-[#D48E58]">+</div>
                                <div className="flex-1 bg-[#FFF8F0] p-3 rounded-xl border border-[#FFE4C4] flex flex-col items-center justify-center text-center">
                                    <div className="text-[#FF4500] font-bold text-lg mb-1">寄售券 x1</div>
                                    <div className="text-xs text-[#8B4513]">解锁赠送</div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="text-gray-600">解锁消耗</span>
                                    <span className="font-bold text-[#FF4500]">1000 待激活金</span>
                                </div>
                                <div className="text-xs text-center text-gray-400">
                                    点击解锁后系统将自动扣除余额并发放权益
                                </div>
                            </div>

                            <button
                                onClick={handleUnlockLegacy}
                                disabled={unlockLoading || unlockStatus.isLoading || !unlockStatus.canUnlock || !userInfo?.legacy_frozen || Number(userInfo.legacy_frozen) < 1000}
                                className={`w-full py-3.5 rounded-full text-lg font-bold text-white shadow-lg transition-all active:scale-[0.98]
                                    ${(unlockLoading || unlockStatus.isLoading || !unlockStatus.canUnlock || !userInfo?.legacy_frozen || Number(userInfo.legacy_frozen) < 1000)
                                        ? 'bg-gray-300 shadow-none cursor-not-allowed'
                                        : 'bg-gradient-to-r from-[#FF6B00] to-[#FF4500] shadow-orange-200'}`}
                            >
                                {unlockLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        解锁中 <span className="animate-spin">◌</span>
                                    </span>
                                ) : '立即解锁'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};



export default ClaimStation;


