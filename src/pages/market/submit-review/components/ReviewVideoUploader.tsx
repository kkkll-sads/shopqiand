import React from 'react';
import { Loader2, Video as VideoIcon, X } from 'lucide-react';
import type { UploadState } from '../types';

interface ReviewVideoUploaderProps {
  videoUploadState: UploadState | null;
  submitting: boolean;
  onRemoveVideo: () => void;
  onPickVideo: () => void;
}

const ReviewVideoUploader: React.FC<ReviewVideoUploaderProps> = ({
  videoUploadState,
  submitting,
  onRemoveVideo,
  onPickVideo,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-base font-bold text-gray-900 mb-3">上传视频（选填）</h3>
      <div className="flex gap-3">
        {videoUploadState ? (
          <div className="relative w-32 aspect-square bg-gray-100 rounded-xl overflow-hidden group">
            {videoUploadState.uploading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : videoUploadState.error ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                <p className="text-xs text-red-500 text-center mb-1">上传失败</p>
                <button
                  onClick={onRemoveVideo}
                  className="text-xs text-red-500 underline"
                  disabled={submitting}
                >
                  删除
                </button>
              </div>
            ) : (
              <>
                <video
                  src={videoUploadState.url || videoUploadState.preview}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={onRemoveVideo}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={submitting}
                >
                  <X size={14} className="text-white" />
                </button>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={onPickVideo}
            disabled={submitting}
            className="w-32 aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 active:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <VideoIcon size={24} className="text-gray-400" />
            <span className="text-xs text-gray-400">添加视频</span>
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">支持上传1个视频，大小不超过50MB</p>
    </div>
  );
};

export default ReviewVideoUploader;
