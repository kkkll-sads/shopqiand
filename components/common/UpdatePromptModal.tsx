import React from 'react';
import { Download, X } from 'lucide-react';
import { AppVersionInfo } from '../../services/app';

interface UpdatePromptModalProps {
  /** 是否显示模态框 */
  visible: boolean;
  /** 版本信息 */
  versionInfo: AppVersionInfo;
  /** 取消回调 */
  onCancel: () => void;
  /** 确认更新回调 */
  onConfirm: () => void;
}

/**
 * 版本更新提示模态框
 */
const UpdatePromptModal: React.FC<UpdatePromptModalProps> = ({
  visible,
  versionInfo,
  onCancel,
  onConfirm,
}) => {
  if (!visible) return null;

  const handleDownload = () => {
    // 打开下载链接
    window.open(versionInfo.download_url, '_blank');
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-sm w-full mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">发现新版本</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-gray-100 active:bg-gray-200"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-4 py-4">
          <div className="text-center">
            {/* 应用图标 */}
            <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-yellow-700">
                {versionInfo.app_name?.charAt(0) || 'APP'}
              </span>
            </div>

            {/* 版本信息 */}
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              {versionInfo.app_name} v{versionInfo.version_code}
            </h4>

            <p className="text-sm text-gray-600 mb-6">
              发现新版本，请及时更新以体验最新功能
            </p>

            {/* 更新提示 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                新版本包含重要更新和性能优化
              </p>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3 px-4 pb-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-md font-medium active:bg-gray-200"
          >
            稍后更新
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md font-medium active:bg-orange-600 flex items-center justify-center gap-2"
          >
            <Download size={16} />
            立即更新
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePromptModal;
