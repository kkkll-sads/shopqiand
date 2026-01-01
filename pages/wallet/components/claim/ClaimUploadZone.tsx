import React from 'react';
import { AlertCircle, Check, Image as ImageIcon, Plus, X } from 'lucide-react';
import { ImageUploadState } from '../../hooks/useImageUploads';

interface ClaimUploadZoneProps {
  imageUploadStates: ImageUploadState[];
  onAddClick: () => void;
  onRemove: (idx: number) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  maxCount?: number;
}

const ClaimUploadZone: React.FC<ClaimUploadZoneProps> = ({
  imageUploadStates,
  onAddClick,
  onRemove,
  onFileChange,
  fileInputRef,
  maxCount = 8,
}) => {
  const uploadedCount = imageUploadStates.filter((state) => state.uploaded).length;

  return (
    <div className="grid grid-cols-4 gap-3">
      {imageUploadStates.map((state, idx) => (
        <div key={idx} className="aspect-square rounded-xl bg-[#FFF8F0] border border-[#FFE4C4] overflow-hidden relative group">
          <img
            src={state.url || state.preview}
            alt="preview"
            className={`w-full h-full object-cover ${state.uploading ? 'opacity-50' : ''}`}
          />

          {state.uploading && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}

          {state.error && (
            <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
              <AlertCircle size={24} className="text-white" />
            </div>
          )}

          <button
            onClick={() => onRemove(idx)}
            className="absolute top-0.5 right-0.5 bg-black/40 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
          >
            <X size={10} />
          </button>

          {state.uploaded && !state.uploading && (
            <div className="absolute bottom-0.5 right-0.5 bg-green-500 text-white rounded-full p-1">
              <Check size={10} />
            </div>
          )}
        </div>
      ))}

      {uploadedCount < maxCount && (
        <button
          onClick={onAddClick}
          className="aspect-square rounded-xl bg-[#FFE4C4] border border-[#FFDAB9] flex items-center justify-center text-[#FF6B00] hover:bg-[#FFDAB9] transition-colors"
        >
          <Plus size={28} />
        </button>
      )}

      {imageUploadStates.length === 0 && (
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
        onChange={onFileChange}
      />
    </div>
  );
};

export default ClaimUploadZone;

