import React from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import type { UploadState } from '../types';

interface ReviewImageUploaderProps {
  imageUploadStates: UploadState[];
  submitting: boolean;
  onRemoveImage: (index: number) => void;
  onPickImage: () => void;
}

const ReviewImageUploader: React.FC<ReviewImageUploaderProps> = ({
  imageUploadStates,
  submitting,
  onRemoveImage,
  onPickImage,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-base font-bold text-gray-900 mb-3">上传图片（选填）</h3>
      <div className="grid grid-cols-3 gap-3">
        {imageUploadStates.map((state, index) => (
          <div key={index} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
            {state.uploading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : state.error ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                <p className="text-xs text-red-500 text-center mb-1">上传失败</p>
                <button
                  onClick={() => onRemoveImage(index)}
                  className="text-xs text-red-500 underline"
                  disabled={submitting}
                >
                  删除
                </button>
              </div>
            ) : (
              <>
                <img
                  src={state.url || state.preview}
                  alt={`评价图片${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={submitting}
                >
                  <X size={14} className="text-white" />
                </button>
              </>
            )}
          </div>
        ))}

        {imageUploadStates.length < 9 && (
          <button
            onClick={onPickImage}
            disabled={submitting}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 active:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Camera size={24} className="text-gray-400" />
            <span className="text-xs text-gray-400">添加图片</span>
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">最多上传9张图片</p>
    </div>
  );
};

export default ReviewImageUploader;
