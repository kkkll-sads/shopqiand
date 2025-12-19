import React, { useState, useEffect } from 'react';
import { ChevronLeft, Zap, Server, Shield, Leaf, Activity } from 'lucide-react';
import { LoadingSpinner } from '../../components/common';

import { fetchProfile, exchangeScoreToGreenPower, USER_INFO_KEY, AUTH_TOKEN_KEY } from '../../services/api';
import { UserInfo } from '../../types';
import { useNotification } from '../../context/NotificationContext';

interface HashrateExchangeProps {
    onBack: () => void;
    onNavigate: (page: string) => void;
}


const HashrateExchange: React.FC<HashrateExchangeProps> = ({ onBack, onNavigate }) => {
    const { showToast } = useNotification();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);

    // Exchange Rate Configuration
    const STANDARD_RATE = 5; // Points per GH/s
    const SUBSIDIZED_RATE = 2; // Points per GH/s

    useEffect(() => {
        loadUserInfo();
    }, []);

    const loadUserInfo = async () => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) return;
        try {
            const res = await fetchProfile(token);
            if (res.code === 1) {
                setUserInfo(res.data.userInfo);
                localStorage.setItem(USER_INFO_KEY, JSON.stringify(res.data.userInfo));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const calculateCost = () => {
        const val = Number(amount);
        if (isNaN(val) || val < 0) return 0;
        return val * SUBSIDIZED_RATE;
    };


    const handleExchange = async () => {
        if (!amount || Number(amount) <= 0) {
            showToast('warning', '输入有误', '请输入兑换数量');
            return;
        }
        const cost = calculateCost();
        if (userInfo && userInfo.score < cost) {
            showToast('warning', '余额不足', `消费金不足，当前余额: ${userInfo.score}`);
            return;
        }

        try {
            setConfirming(true);
            const res = await exchangeScoreToGreenPower({ score: cost });

            if (res.code === 1 && res.data) {
                showToast('success', '兑换成功', `消耗 ${res.data.score_consumed} 消费金，获得 ${res.data.green_power_gained} 绿色算力`);

                // Update local state with latest data from API
                if (userInfo) {
                    setUserInfo({
                        ...userInfo,
                        score: res.data.after_score,
                        green_power: res.data.after_green_power // Assuming green_power maps to green_power
                    });
                }
                setAmount('');
            } else {
                showToast('error', '兑换失败', res.msg || '未知错误');
            }
        } catch (error: any) {
            showToast('error', '兑换异常', error.message || '网络请求失败');
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 pb-safe">
            {/* Header */}
            <div className="bg-gradient-to-b from-orange-100 to-gray-50 p-5 pt-4">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={onBack} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-700">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">算力补充</h1>
                    <div className="ml-auto text-xs text-green-600 font-medium bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-green-100/50 flex items-center gap-1">
                        <Shield size={12} fill="currentColor" />
                        绿色金融补贴
                    </div>
                </div>

                {/* Amount Card */}
                <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-green-100/30 mb-6 border border-green-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-[100px] -z-0 opacity-50"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-sm font-bold text-gray-400 tracking-wide flex items-center gap-2">
                                <Server size={14} />
                                补充额度 (GH/s)
                            </div>
                            <div className="text-xs text-gray-400">
                                当前持有: <span className="text-green-600 font-bold">{userInfo?.green_power || 0}</span> GHs
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2 border-b-2 border-green-50 pb-2 focus-within:border-green-500 transition-colors">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="flex-1 text-4xl font-black text-gray-900 bg-transparent outline-none placeholder:text-gray-200 font-[DINAlternate-Bold]"
                            />
                            <div className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                1 GHs = {SUBSIDIZED_RATE} 消费金
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mt-4">
                            {[10, 50, 100, 500].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setAmount(String(val))}
                                    className="py-1.5 rounded-lg bg-gray-50 hover:bg-green-50 text-xs font-bold text-gray-500 hover:text-green-600 border border-transparent hover:border-green-200 transition-all"
                                >
                                    +{val}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="px-5 flex-1 space-y-4">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                    兑换详情
                </h2>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">标准算力成本</span>
                        <span className="text-sm font-medium text-gray-400 line-through">{STANDARD_RATE} 消费金 / GHs</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">当前补贴价</span>
                        <span className="text-sm font-bold text-green-600">{SUBSIDIZED_RATE} 消费金 / GHs</span>
                    </div>
                    <div className="w-full h-px bg-gray-50"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-900 font-bold">预计消耗</span>
                        <span className="text-lg font-bold text-orange-500 font-[DINAlternate-Bold]">
                            {calculateCost()} <span className="text-xs text-gray-400 font-normal">消费金</span>
                        </span>
                    </div>
                </div>

                <div className="bg-orange-50 p-3 rounded-xl flex items-start gap-2">
                    <Activity size={16} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-600 leading-tight">
                        您的当前消费金余额为 <span className="font-bold">{userInfo?.score || 0}</span>。算力补充后即时生效，可提升您的每日产出效率。
                    </p>
                </div>
            </div>

            {/* Bottom Action */}
            <div className="p-5 safe-area-bottom bg-white/80 backdrop-blur border-t border-gray-100">
                <button
                    onClick={handleExchange}
                    disabled={confirming || (userInfo ? userInfo.score < calculateCost() : true)}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98]
                        ${confirming || (userInfo && userInfo.score < calculateCost())
                            ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-200'
                        }`}
                >
                    {confirming ? <LoadingSpinner size="sm" color="white" /> : <><Zap size={20} fill="currentColor" /> 确认兑换</>}
                </button>
            </div>
        </div>
    );
};

export default HashrateExchange;
