import React, { useState, useEffect } from 'react';
import { ChevronLeft, Share2, Copy, Shield, Fingerprint, Award, ExternalLink, ArrowRightLeft, Store } from 'lucide-react';
import { MyCollectionItem, fetchProfile, fetchRealNameStatus, AUTH_TOKEN_KEY } from '../../services/api';
import { UserInfo } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { Route } from '../../router/routes';

interface MyCollectionDetailProps {
    item: MyCollectionItem;
    onBack: () => void;
    onNavigate: (route: Route) => void;
}

const MyCollectionDetail: React.FC<MyCollectionDetailProps> = ({ item, onBack, onNavigate }) => {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const { showToast } = useNotification();

    useEffect(() => {
        const loadData = async () => {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (token) {
                try {
                    // Try fetching profile first
                    const profileRes = await fetchProfile(token);
                    let currentInfo = profileRes.code === 1 && profileRes.data ? profileRes.data.userInfo : null;

                    // Then fetch real name status specifically
                    const realNameRes = await fetchRealNameStatus(token);
                    if (realNameRes.code === 1 && realNameRes.data) {
                        if (currentInfo) {
                            currentInfo = {
                                ...currentInfo,
                                real_name: realNameRes.data.real_name || currentInfo.real_name,
                                real_name_status: realNameRes.data.real_name_status
                            };
                        } else {
                            // Minimal info if profile failed
                            currentInfo = {
                                real_name: realNameRes.data.real_name,
                                real_name_status: realNameRes.data.real_name_status
                            } as any;
                        }
                    }

                    if (currentInfo) {
                        setUserInfo(currentInfo);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        };
        loadData();
    }, []);

    const title = item.item_title || item.title || '未命名藏品';
    // Use item.price for now, mock appreciation
    const price = parseFloat(item.price || '0');
    const currentValuation = (price * 1.055).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-gray-900 font-serif pb-24 relative overflow-hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}>
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-sm px-4 py-4 flex justify-between items-center border-b border-amber-900/5">
                <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-800">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">数字资产持有凭证</h1>
                <button className="p-2 hover:bg-black/5 rounded-full text-gray-800">
                    <Share2 size={20} />
                </button>
            </header>

            {/* Certificate Container */}
            <div className="p-5">
                <div className="bg-white relative shadow-2xl shadow-gray-200/50 rounded-sm overflow-hidden border-[6px] border-double border-amber-900/10 p-6 md:p-8">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <Shield size={200} />
                    </div>

                    {/* Top Logo Area */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-900 mb-3 border border-amber-100">
                            <Award size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-wide mb-1">数字资产持有凭证</h2>
                        <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Digital Asset Certificate</div>
                    </div>

                    {/* Certificate Fields */}
                    <div className="space-y-6 relative z-10 font-sans">
                        <div className="text-center py-6 mb-2 relative">
                            {/* Pattern Background - Guilloche Style */}
                            <div className="absolute inset-0 opacity-[0.08] pointer-events-none rounded-lg border border-amber-900/5 overflow-hidden"
                                style={{
                                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #C5A572 10px, #C5A572 11px),
                                    repeating-linear-gradient(-45deg, transparent, transparent 10px, #C5A572 10px, #C5A572 11px)`
                                }}>
                            </div>

                            {/* Line 1: Confirmation Number */}
                            <div className="text-sm text-gray-600 font-[courier,monospace] font-bold tracking-widest mb-3 relative z-10 drop-shadow-sm">
                                确权编号：37-DATA-****-{String(item.id || 8821).padStart(4, '0')}
                            </div>

                            {/* Line 2 */}
                            <h3 className="text-2xl font-extrabold text-gray-700 mb-3 font-serif tracking-tight leading-tight relative z-10 drop-shadow-sm px-2">
                                【{title}】
                            </h3>

                            {/* Line 3: Holder */}
                            <div className="text-base font-bold text-gray-600 tracking-wide relative z-10 mb-4">
                                持有人：{(() => {
                                    const name = userInfo?.real_name;
                                    if (!name) return '未认证';
                                    if (name.length <= 2) {
                                        return name.charAt(0) + '*';
                                    }
                                    return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
                                })()}
                            </div>

                            {/* Stamp */}
                            <div className="absolute -right-4 -bottom-6 w-32 h-32 opacity-[0.85] -rotate-12 mix-blend-multiply z-20 pointer-events-none filter contrast-125 brightness-90">
                                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <path id="textCircleTop" d="M 25,100 A 75,75 0 1,1 175,100" fill="none" />
                                        <filter id="roughPaper">
                                            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
                                            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                                        </filter>
                                    </defs>
                                    <g filter="url(#roughPaper)" fill="#B22222" stroke="none"> {/* Darker Red #B22222 */}
                                        <circle cx="100" cy="100" r="96" fill="none" stroke="#B22222" strokeWidth="3" />
                                        <circle cx="100" cy="100" r="92" fill="none" stroke="#B22222" strokeWidth="1" />
                                        <text fontSize="14" fontWeight="bold" fontFamily="SimSun, serif" fill="#B22222">
                                            <textPath href="#textCircleTop" startOffset="50%" textAnchor="middle" spacing="auto">
                                                树交所数字资产登记结算中心
                                            </textPath>
                                        </text>
                                        <text x="100" y="100" fontSize="40" textAnchor="middle" dominantBaseline="middle" fill="#B22222">★</text>
                                        <text x="100" y="135" fontSize="18" fontWeight="bold" fontFamily="SimHei, sans-serif" textAnchor="middle" fill="#B22222">
                                            确权专用章
                                        </text>
                                        <text x="100" y="155" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="bold" textAnchor="middle" fill="#B22222" letterSpacing="1">
                                            37010299821
                                        </text>
                                    </g>
                                </svg>
                            </div>
                        </div>

                        {/* Asset Anchor Block */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                            <div className="flex items-start gap-3 mb-3">
                                <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-0.5">Asset Anchor / 资产锚定</label>
                                    <div className="text-sm font-medium text-gray-600">
                                        涉及农户/合作社：238户 (数据已脱敏)
                                        <span className="inline-block ml-1 text-[10px] text-amber-600 border border-amber-200 px-1 rounded bg-white">隐私保护</span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1 leading-tight">
                                        * 根据《数据安全法》及商业保密协议，底层隐私信息已做Hash脱敏处理，仅持有人可申请解密查看。
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fingerprint Block */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Blockchain Fingerprint / 存证指纹</label>
                            <div className="bg-gray-900 text-green-500 font-mono text-[10px] p-3 rounded-t break-all leading-relaxed relative group">
                                <div className="flex items-center gap-2 mb-1 text-gray-500 font-sans font-bold">
                                    <Fingerprint size={12} />
                                    <span className="uppercase">TREE-CHAIN CONSORTIUM</span>
                                </div>
                                {item.fingerprint || item.md5 || item.tx_hash || '0x7d9a8b1c4e2f3a6b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6'}
                            </div>
                            {/* Black box buttons */}
                            <div className="bg-gray-800 rounded-b p-2 flex gap-2 border-t border-gray-700">
                                <button
                                    onClick={() => {
                                        const md5Hash = item.fingerprint || item.md5 || item.tx_hash || '0x7d9a8b1c4e2f3a6b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6';
                                        navigator.clipboard.writeText(md5Hash).then(() => {
                                            showToast('success', '已复制MD5指纹');
                                        }).catch(() => {
                                            showToast('error', '复制失败');
                                        });
                                    }}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                                >
                                    <Copy size={10} />
                                    复制Hash
                                </button>
                                <button
                                    onClick={() => {
                                        // 使用MD5指纹进行查证，不使用脱敏的确权编号，避免查询错误
                                        const md5Fingerprint = item.fingerprint || item.md5 || item.tx_hash || '';
                                        if (!md5Fingerprint) {
                                            showToast('error', '无法获取MD5指纹');
                                            return;
                                        }
                                        onNavigate({ name: 'search', code: md5Fingerprint });
                                    }}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                                >
                                    <ExternalLink size={10} />
                                    去查证
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-[9999] pointer-events-auto">
                <div className="flex justify-between items-center mb-3 px-1">
                    <span className="text-sm text-gray-500 font-medium">当前估值</span>
                    <div className="text-right">
                        <span className="text-lg font-bold text-gray-700 font-mono">¥{currentValuation}</span>
                        <span className="text-xs text-red-500 font-bold ml-2 bg-red-50 px-1.5 py-0.5 rounded-full">+5.5%</span>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={() => { showToast('info', '提示', '权益交割功能正在开发中，敬请期待'); }}
                        className="flex-1 bg-gray-500 text-white hover:bg-gray-600 transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-gray-500/20 active:scale-[0.98] pointer-events-auto touch-manipulation">
                        <ArrowRightLeft size={18} />
                        权益交割(转分红)
                    </button>
                    <button
                        onClick={() => {
                            onNavigate({ name: 'my-collection-consignment', id: String(item.id) });
                        }}
                        className="flex-1 bg-[#8B0000] text-amber-100 hover:bg-[#A00000] transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-[0.98] pointer-events-auto touch-manipulation">
                        <Store size={18} />
                        立即上架寄售
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyCollectionDetail;
