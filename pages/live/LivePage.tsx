import React, { useState, useEffect } from 'react';
import { PlayCircle, Radio } from 'lucide-react';
import { fetchProfile } from '../../services/api';
import { getStoredToken } from '../../services/client';
import { isSuccess, extractData } from '../../utils/apiHelpers';
import { LoadingSpinner, EmbeddedBrowser } from '../../components/common';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const LivePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('live');
    const [liveUrl, setLiveUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [showLiveBrowser, setShowLiveBrowser] = useState<boolean>(false);
    const { handleError } = useErrorHandler();

    const tabs = [
        { id: 'live', label: '直播', icon: Radio },
        { id: 'replay', label: '回放', icon: PlayCircle },
    ];

    useEffect(() => {
        const loadLiveUrl = async () => {
            const token = getStoredToken();
            if (!token) {
                handleError('未登录，请先登录', { showToast: true });
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetchProfile(token);

                if (isSuccess(response) && response.data) {
                    const data = extractData(response);
                    if (data?.liveUrl) {
                        setLiveUrl(data.liveUrl);
                    } else {
                        handleError('直播间URL不存在', { showToast: true });
                    }
                } else {
                    handleError(response, { showToast: true, customMessage: '获取直播间信息失败' });
                }
            } catch (error: any) {
                handleError(error, { showToast: true, customMessage: '加载直播间失败' });
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'live') {
            loadLiveUrl();
        }
    }, [activeTab, handleError]);

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* Header with Tabs */}
            <div className="bg-orange-600 sticky top-0 z-20 text-white shadow-lg">
                {/* Tab Navigation */}
                <div className="flex items-center justify-center px-4 pt-4 pb-2">
                    <div className="flex justify-center space-x-12 text-base font-medium">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-2 py-2 transition-colors duration-200 whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-white text-lg font-bold'
                                    : 'text-orange-100/90'
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full p-1" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 pb-safe">
                {activeTab === 'live' && (
                    <div className="w-full">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <LoadingSpinner text="加载中..." />
                            </div>
                        ) : liveUrl ? (
                            /* 直播卡片视图 */
                            <div
                                onClick={() => setShowLiveBrowser(true)}
                                className="bg-white rounded-xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform cursor-pointer"
                            >
                                {/* 封面图片区域 */}
                                <div className="relative bg-gradient-to-br from-orange-500 to-red-500 aspect-video flex items-center justify-center">
                                    {/* 渐变背景 */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                                    {/* Live Badge */}
                                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-orange-600/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white font-medium">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                        </span>
                                        正在直播
                                    </div>

                                    {/* 播放按钮 */}
                                    <div className="relative z-10 flex flex-col items-center gap-3">
                                        <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl">
                                            <PlayCircle size={40} className="text-orange-600 ml-1" fill="currentColor" />
                                        </div>
                                        <span className="text-white text-lg font-semibold drop-shadow-lg">点击观看直播</span>
                                    </div>
                                </div>

                                {/* 卡片信息 */}
                                <div className="p-4">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">直播间</h3>
                                    <p className="text-sm text-gray-500">点击卡片进入直播间观看</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Radio size={32} className="text-gray-300" />
                                </div>
                                <p>暂无直播内容</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State for other tabs */}
                {activeTab !== 'live' && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            {(() => {
                                const IconComponent = tabs.find(t => t.id === activeTab)?.icon;
                                return IconComponent ? <IconComponent size={32} className="text-gray-300" /> : null;
                            })()}
                        </div>
                        <p>暂无{tabs.find(t => t.id === activeTab)?.label}内容</p>
                    </div>
                )}
            </div>

            {/* Embedded Live Browser */}
            <EmbeddedBrowser
                isOpen={showLiveBrowser}
                url={liveUrl || ''}
                title="直播间"
                onClose={() => setShowLiveBrowser(false)}
            />
        </div>
    );
};

export default LivePage;
