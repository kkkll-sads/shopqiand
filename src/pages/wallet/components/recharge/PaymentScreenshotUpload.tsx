/**
 * PaymentScreenshotUpload - 付款截图上传组件
 */
import React from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

interface PaymentScreenshotUploadProps {
  imagePreview: string | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
}

const PaymentScreenshotUpload: React.FC<PaymentScreenshotUploadProps> = ({
  imagePreview,
  onImageSelect,
  onImageRemove,
}) => {
  const { showToast } = useNotification();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      showToast('error', '格式错误', '只支持 JPG、PNG、GIF 格式');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', '文件过大', '图片大小不能超过 5MB');
      return;
    }

    onImageSelect(e);
  };

  return (
    <div className="mb-4">
      <label className="text-sm font-bold text-gray-900 mb-2 block flex items-center gap-2">
        <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
        上传付款截图
      </label>

      <input
        type="file"
        accept="image/jpeg,image/png,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        id="payment-screenshot"
      />

      {!imagePreview ? (
        <label
          htmlFor="payment-screenshot"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-orange-50/30 transition-all group bg-white"
        >
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-orange-100 transition-colors">
            <Upload size={20} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
          </div>
          <span className="text-xs font-medium text-gray-600 group-hover:text-orange-600">点击上传付款截图</span>
          <span className="text-[10px] text-gray-400 mt-0.5">支持 JPG/PNG/GIF，最大5MB</span>
        </label>
      ) : (
        <div className="relative group rounded-2xl overflow-hidden shadow-lg shadow-gray-200">
          <div className="absolute inset-0 bg-gray-900/5 -z-10"></div>
          <img
            src={imagePreview}
            alt="付款截图"
            className="w-full h-auto max-h-[300px] object-contain bg-gray-900"
          />
          <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/50 to-transparent flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onImageRemove}
              className="w-8 h-8 bg-red-500/80 text-white rounded-full flex items-center justify-center hover:bg-red-600 backdrop-blur-sm transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <label
            htmlFor="payment-screenshot"
            className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur text-xs font-bold text-gray-800 rounded-full cursor-pointer hover:bg-white transition-all shadow-lg border border-gray-100 flex items-center gap-2"
          >
            <ImageIcon size={14} />
            重新上传
          </label>
        </div>
      )}
    </div>
  );
};

export default PaymentScreenshotUpload;
