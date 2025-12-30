
import React, { useState } from 'react';
import { Search, Video, PlayCircle, BookOpen, Clock, Signal, Radio } from 'lucide-react';

interface LiveStream {
    id: string;
    title: string;
    streamer: string;
    viewers: number;
    image: string;
    avatar: string;
    tags?: string[];
    isLive: boolean;
}

const MOCK_STREAMS: LiveStream[] = [
    {
        id: '1',
        title: '开启全民数商新生活',
        streamer: '树拍集团董事长',
        viewers: 12500,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100',
        isLive: true
    },
    {
        id: '2',
        title: '新时代，新气象',
        streamer: '树拍易购官方直播间',
        viewers: 8900,
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1000',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
        isLive: true
    },
    {
        id: '3',
        title: '如何开通数字店',
        streamer: '众欢商贸商行',
        viewers: 3400,
        image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1000',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100',
        isLive: true
    },
    {
        id: '4',
        title: '数字确权最新政策解读',
        streamer: '政策解读中心',
        viewers: 5600,
        image: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&q=80&w=1000',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
        isLive: true
    }
];

const LivePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('live');

    const tabs = [
        { id: 'live', label: '直播', icon: Radio },
        { id: 'replay', label: '回放', icon: PlayCircle },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header with Tabs */}
            <div className="bg-orange-600 sticky top-0 z-20 text-white shadow-lg">
                {/* Top Status Bar Placeholder if needed (usually handled by OS/Browser) */}

                {/* Tab Navigation */}
                <div className="flex items-center justify-center px-4 pt-4 pb-2">
                    <div className="flex justify-center space-x-12 text-base font-medium">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-2 py-2 transition-colors duration-200 whitespace-nowrap ${activeTab === tab.id ? 'text-white text-lg font-bold' : 'text-orange-100/90'
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

            {/* Content Grid */}
            <div className="p-3">
                {activeTab === 'live' && (
                    <div className="grid grid-cols-2 gap-3">
                        {MOCK_STREAMS.map(stream => (
                            <div key={stream.id} className="bg-white rounded-xl overflow-hidden shadow-sm aspect-[3/4] relative group">
                                {/* Image Background */}
                                <img
                                    src={stream.image}
                                    alt={stream.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90"></div>

                                {/* Live Badge */}
                                {stream.isLive && (
                                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-orange-600/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white font-medium">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                        </span>
                                        正在直播
                                    </div>
                                )}

                                {/* Viewers Count */}
                                <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white/90">
                                    {stream.viewers > 10000 ? (stream.viewers / 10000).toFixed(1) + 'w' : stream.viewers}观看
                                </div>

                                {/* Bottom Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                    <h3 className="text-sm font-bold line-clamp-2 mb-2 leading-tight text-shadow-sm">{stream.title}</h3>

                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full border border-white/50 overflow-hidden shrink-0">
                                            <img src={stream.avatar} alt={stream.streamer} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-xs text-white/90 truncate">{stream.streamer}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>



            {/* Empty State for other tabs */}
            {activeTab !== 'live' && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        {tabs.find(t => t.id === activeTab)?.icon({ size: 32, className: 'text-gray-300' }) as React.ReactNode}
                    </div>
                    <p>暂无{tabs.find(t => t.id === activeTab)?.label}内容</p>
                </div>
            )}
        </div>
    );
};

export default LivePage;
