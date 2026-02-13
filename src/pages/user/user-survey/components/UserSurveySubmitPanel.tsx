import React from 'react';
import { AlertCircle, Check, Plus, Send, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/common';
import { ImageUploadState } from '../types';

interface UserSurveySubmitPanelProps {
  title: string;
  content: string;
  uploadStates: ImageUploadState[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  submitting: boolean;
  disableSubmit: boolean;
  disableReason?: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onSubmit: () => void;
}

const UserSurveySubmitPanel: React.FC<UserSurveySubmitPanelProps> = ({
  title,
  content,
  uploadStates,
  fileInputRef,
  submitting,
  disableSubmit,
  disableReason,
  onTitleChange,
  onContentChange,
  onFileChange,
  onRemoveImage,
  onSubmit,
}) => {
  const hasUploadingImages = uploadStates.some((state) => state.uploading);
  const hasUploadErrors = uploadStates.some((state) => Boolean(state.error));
  const hasInvalidUploadedImages = uploadStates.some(
    (state) => !state.uploading && !state.error && !(state.uploaded && state.url)
  );
  const resolvedDisableSubmit =
    submitting || disableSubmit || hasUploadingImages || hasUploadErrors || hasInvalidUploadedImages;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
        <div className="mb-5">
          <label className="block text-sm font-bold text-gray-700 mb-2">标题</label>
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="请输入反馈标题"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">反馈内容</label>
          <textarea
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="请详细描述您的建议或遇到的问题..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[160px] resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">上传图片 (可选)</label>
          <div className="grid grid-cols-4 gap-3">
            {uploadStates.map((state, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-xl bg-gray-50 border border-gray-200 overflow-hidden relative group"
              >
                <img
                  src={state.url || state.preview}
                  alt="preview"
                  className={`w-full h-full object-cover ${state.uploading ? 'opacity-50' : ''}`}
                />

                {state.uploading && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  </div>
                )}

                {state.error && (
                  <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                    <AlertCircle size={20} className="text-white" />
                  </div>
                )}

                <button
                  onClick={() => onRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-black/40 text-white rounded-full p-1 active:bg-red-500 transition-colors"
                >
                  <X size={12} />
                </button>

                {state.uploaded && !state.uploading && (
                  <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                    <Check size={10} />
                  </div>
                )}
              </div>
            ))}

            {uploadStates.length < 4 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-gray-400 transition-all active:scale-95"
              >
                <Plus size={24} className="mb-1" />
                <span className="text-[10px]">上传</span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={onFileChange}
            />
          </div>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={resolvedDisableSubmit}
        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
          resolvedDisableSubmit ? 'bg-red-300' : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}
      >
        {submitting ? <LoadingSpinner size="sm" color="white" /> : <Send size={18} />}
        <span>提交反馈</span>
      </button>

      {disableReason && !submitting && (
        <div className="text-xs text-amber-600 text-center">{disableReason}</div>
      )}

      <div className="text-xs text-gray-400 text-center px-4 leading-relaxed">
        您的反馈对我们非常重要，采纳后将获得算力奖励。
      </div>
    </div>
  );
};

export default UserSurveySubmitPanel;
