import React, { useState, useEffect } from 'react';
import { PlayCircle, Radio, Video } from 'lucide-react';
import { fetchProfile } from '@/services/user/profile';
import { fetchLiveVideoConfig } from '@/services/common';
import { getStoredToken } from '@/services/client';
import { isSuccess, extractData } from '@/utils/apiHelpers';
import { LoadingSpinner, MediaBrowser } from '@/components/common';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { warnLog } from '@/utils/logger';

const LivePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('live');
    const [liveUrl, setLiveUrl] = useState<string | null>(null);
    const liveMachine = useStateMachine<LoadingState, LoadingEvent>({
        initial: LoadingState.IDLE,
        transitions: {
            [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
            [LoadingState.LOADING]: {
                [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
                [LoadingEvent.ERROR]: LoadingState.ERROR,
            },
            [LoadingState.SUCCESS]: {
                [LoadingEvent.LOAD]: LoadingState.LOADING,
                [LoadingEvent.RETRY]: LoadingState.LOADING,
            },
            [LoadingState.ERROR]: {
                [LoadingEvent.LOAD]: LoadingState.LOADING,
                [LoadingEvent.RETRY]: LoadingState.LOADING,
            },
        },
    });
    const [showLiveBrowser, setShowLiveBrowser] = useState<boolean>(false);
    const [videoConfig, setVideoConfig] = useState<{
        video_url: string;
        title: string;
        description: string;
    } | null>(null);
    const videoMachine = useStateMachine<LoadingState, LoadingEvent>({
        initial: LoadingState.IDLE,
        transitions: {
            [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
            [LoadingState.LOADING]: {
                [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
                [LoadingEvent.ERROR]: LoadingState.ERROR,
            },
            [LoadingState.SUCCESS]: {
                [LoadingEvent.LOAD]: LoadingState.LOADING,
                [LoadingEvent.RETRY]: LoadingState.LOADING,
            },
            [LoadingState.ERROR]: {
                [LoadingEvent.LOAD]: LoadingState.LOADING,
                [LoadingEvent.RETRY]: LoadingState.LOADING,
            },
        },
    });
    const loading = liveMachine.state === LoadingState.LOADING;
    const videoLoading = videoMachine.state === LoadingState.LOADING;
    const [showVideoBrowser, setShowVideoBrowser] = useState<boolean>(false);
    const { handleError } = useErrorHandler();

    const tabs = [
        { id: 'live', label: '直播', icon: Radio },
        { id: 'replay', label: '回放', icon: PlayCircle },
    ];

    const loadLiveUrl = async () => {
        const token = getStoredToken();
        if (!token) {
            handleError('未登录，请先登录', { showToast: true });
            liveMachine.send(LoadingEvent.ERROR);
            return;
        }

        try {
            liveMachine.send(LoadingEvent.LOAD);
            const response = await fetchProfile(token);

            if (isSuccess(response) && response.data) {
                const data = extractData(response);
                if (data?.liveUrl) {
                    setLiveUrl(data.liveUrl);
                    liveMachine.send(LoadingEvent.SUCCESS);
                } else {
                    handleError('直播间URL不存在', { showToast: true });
                    liveMachine.send(LoadingEvent.ERROR);
                }
            } else {
                handleError(response, { showToast: true, customMessage: '获取直播间信息失败' });
                liveMachine.send(LoadingEvent.ERROR);
            }
        } catch (error: any) {
            handleError(error, { showToast: true, customMessage: '加载直播间失败' });
            liveMachine.send(LoadingEvent.ERROR);
        } finally {
            // 状态机已处理成功/失败
        }
    };

    const loadVideoConfig = async () => {
        try {
            videoMachine.send(LoadingEvent.LOAD);
            const response = await fetchLiveVideoConfig();

            if (isSuccess(response) && response.data) {
                setVideoConfig(response.data);
                videoMachine.send(LoadingEvent.SUCCESS);
            } else {
                videoMachine.send(LoadingEvent.ERROR);
            }
        } catch (error: any) {
            // 广告视频获取失败不影响直播功能，不显示错误提示
            warnLog('LivePage', '获取广告视频配置失败', error);
            videoMachine.send(LoadingEvent.ERROR);
        } finally {
            // 状态机已处理成功/失败
        }
    };

    useEffect(() => {
        if (activeTab === 'live') {
            loadLiveUrl();
            loadVideoConfig();
        }
    }, [activeTab, handleError]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* Header with Tabs - 京东红主题 */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 sticky top-0 z-20 text-white shadow-lg">
                {/* Tab Navigation */}
                <div className="flex items-center justify-center px-4 pt-4 pb-2">
                    <div className="flex justify-center space-x-12 text-base font-medium">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-2 py-2 transition-colors duration-200 whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-white text-lg font-bold'
                                    : 'text-red-100/90'
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-white rounded-full shadow-sm" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-safe">
                {activeTab === 'live' && (
                    <div className="w-full space-y-4">
                        {/* 广告视频加载状态 */}
                        {videoLoading && !videoConfig && (
                            <div className="flex items-center justify-center py-6">
                                <LoadingSpinner text="加载视频..." />
                            </div>
                        )}
                        {/* 广告视频卡片 */}
                        {videoConfig && (
                            <div
                                onClick={() => setShowVideoBrowser(true)}
                                className="bg-white rounded-xl overflow-hidden shadow-md active:scale-[0.98] transition-transform cursor-pointer border border-gray-100"
                            >
                                {/* 视频封面区域 */}
                                <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 aspect-video flex items-center justify-center">
                                    {/* 渐变背景 */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                                    {/* Video Badge */}
                                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-blue-600/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white font-medium">
                                        <Video size={14} />
                                        广告视频
                                    </div>

                                    {/* 播放按钮 */}
                                    <div className="relative z-10 flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl">
                                            <PlayCircle size={36} className="text-blue-600 ml-0.5" fill="currentColor" />
                                        </div>
                                        <span className="text-white text-base font-semibold drop-shadow-lg">点击观看广告</span>
                                    </div>
                                </div>

                                {/* 卡片信息 */}
                                <div className="p-4">
                                    <h3 className="text-base font-bold text-gray-900 mb-1">{videoConfig.title}</h3>
                                    <p className="text-sm text-gray-500">{videoConfig.description}</p>
                                </div>
                            </div>
                        )}

                        {/* 直播卡片 */}
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                {/* 骨架屏 */}
                                <div className="w-full space-y-4">
                                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                    <div className="skeleton aspect-video" />
                                    <div className="p-4 space-y-2">
                                      <div className="skeleton h-5 w-24 rounded" />
                                      <div className="skeleton h-4 w-40 rounded" />
                                    </div>
                                  </div>
                                </div>
                            </div>
                        ) : liveUrl ? (
                            /* 直播卡片视图 */
                            <div
                                onClick={() => setShowLiveBrowser(true)}
                                className="bg-white rounded-2xl overflow-hidden shadow-lg active:scale-[0.98] transition-all cursor-pointer border border-gray-100"
                            >
                                {/* 封面图片区域 */}
                                <div className="relative bg-gradient-to-br from-red-500 to-red-600 aspect-video flex items-center justify-center">
                                    {/* 渐变背景 */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                                    {/* Live Badge */}
                                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm text-white font-medium shadow-lg">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                        </span>
                                        正在直播
                                    </div>

                                    {/* 播放按钮 */}
                                    <div className="relative z-10 flex flex-col items-center gap-3">
                                        <div className="w-18 h-18 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl">
                                            <PlayCircle size={40} className="text-red-600 ml-0.5" fill="currentColor" />
                                        </div>
                                        <span className="text-white text-base font-bold drop-shadow-lg">点击观看直播</span>
                                    </div>
                                </div>

                                {/* 卡片信息 */}
                                <div className="p-4">
                                    <h3 className="text-base font-bold text-gray-900 mb-1">直播间</h3>
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

            {/* 直播浏览器 - 使用独立的 MediaBrowser */}
            <MediaBrowser
                isOpen={showLiveBrowser}
                url={liveUrl || ''}
                title="直播间"
                type="live"
                onClose={() => setShowLiveBrowser(false)}
            />

            {/* 视频浏览器 - 使用独立的 MediaBrowser */}
            <MediaBrowser
                isOpen={showVideoBrowser}
                url={videoConfig?.video_url || ''}
                title={videoConfig?.title || '广告视频'}
                type="video"
                onClose={() => setShowVideoBrowser(false)}
            />
        </div>
    );
};

export default LivePage;
