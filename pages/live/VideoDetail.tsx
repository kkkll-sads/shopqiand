import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Pause, Volume2, VolumeX, Maximize, Eye } from 'lucide-react';
import { LoadingSpinner } from '../../components/common';
import { fetchLiveVideoConfig } from '../../services/common';
import { getStoredToken } from '../../services/client';
import { isSuccess, extractData } from '../../utils/apiHelpers';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface VideoDetailProps {
    onBack: () => void;
}

interface VideoData {
    video_url: string;
    title: string;
    description: string;
    play_count: number;
    user_played: boolean;
}

const VideoDetail: React.FC<VideoDetailProps> = ({ onBack }) => {
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { handleError } = useErrorHandler();

    useEffect(() => {
        loadVideoData();
    }, []);

    const loadVideoData = async () => {
        try {
            setLoading(true);
            const token = getStoredToken();
            const response = await fetchLiveVideoConfig(token || '');

            if (isSuccess(response)) {
                const data = extractData<VideoData>(response);
                setVideoData(data);
            } else {
                handleError(new Error('获取视频信息失败'));
            }
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                videoRef.current.requestFullscreen();
            }
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVideoClick = () => {
        togglePlay();
        showControlsTemporarily();
    };

    const showControlsTemporarily = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);
    };

    const handleMouseMove = () => {
        showControlsTemporarily();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!videoData) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
                <p className="text-lg mb-4">视频加载失败</p>
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                >
                    返回
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center px-4 py-3">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="flex-1 text-white font-bold text-lg ml-2 truncate">
                        {videoData.title}
                    </h1>
                </div>
            </div>

            {/* Video Container - 9:16 aspect ratio */}
            <div className="flex-1 flex items-center justify-center bg-black">
                <div 
                    className="relative w-full max-w-[calc(100vh*9/16)] mx-auto"
                    style={{ aspectRatio: '9/16' }}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleMouseMove}
                >
                    {/* Video Player */}
                    <video
                        ref={videoRef}
                        src={videoData.video_url}
                        className="w-full h-full object-contain"
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onClick={handleVideoClick}
                        playsInline
                        preload="metadata"
                    />

                    {/* Play/Pause Overlay */}
                    {!isPlaying && (
                        <div 
                            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                            onClick={togglePlay}
                        >
                            <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl">
                                <Play size={40} className="text-black ml-1" />
                            </div>
                        </div>
                    )}

                    {/* Video Controls */}
                    <div 
                        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
                            showControls ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {/* Progress Bar */}
                        <div className="px-4 pt-4">
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
                            />
                            <div className="flex justify-between text-xs text-white/80 mt-1">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center justify-between px-4 py-3">
                            <button
                                onClick={togglePlay}
                                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleMute}
                                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                                >
                                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                </button>
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <Maximize size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Info */}
            <div className="bg-gray-900 text-white p-4 space-y-3">
                <div>
                    <h2 className="text-xl font-bold mb-2">{videoData.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                            <Eye size={16} />
                            <span>{videoData.play_count.toLocaleString()} 次播放</span>
                        </div>
                        {videoData.user_played && (
                            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">
                                已观看
                            </span>
                        )}
                    </div>
                </div>

                {videoData.description && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-1">视频简介</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            {videoData.description}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoDetail;
