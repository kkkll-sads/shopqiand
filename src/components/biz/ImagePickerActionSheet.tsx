import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Eye } from 'lucide-react';
import { ActionSheet, ActionSheetGroup } from '../ui/ActionSheet';

interface ImagePickerActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  hasUploadedImage?: boolean;
  hasCameraPermission?: boolean;
  hasAlbumPermission?: boolean;
  onTakePhoto?: () => void;
  onChooseAlbum?: () => void;
  onViewImage?: () => void;
}

export const ImagePickerActionSheet: React.FC<ImagePickerActionSheetProps> = ({
  isOpen,
  onClose,
  hasUploadedImage = false,
  hasCameraPermission = true,
  hasAlbumPermission = true,
  onTakePhoto,
  onChooseAlbum,
  onViewImage
}) => {
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg('');
    }, 2000);
  };

  const groups: ActionSheetGroup[] = [
    {
      options: [
        {
          label: '拍照',
          icon: <Camera size={18} />,
          disabled: !hasCameraPermission,
          desc: !hasCameraPermission ? '未授权' : undefined,
          onDisabledClick: () => showToast('请在系统设置中开启相机权限'),
          onClick: () => {
            if (onTakePhoto) onTakePhoto();
            onClose();
          }
        },
        {
          label: '从相册选择',
          icon: <ImageIcon size={18} />,
          disabled: !hasAlbumPermission,
          desc: !hasAlbumPermission ? '未授权' : undefined,
          onDisabledClick: () => showToast('请在系统设置中开启相册权限'),
          onClick: () => {
            if (onChooseAlbum) onChooseAlbum();
            onClose();
          }
        }
      ]
    }
  ];

  if (hasUploadedImage) {
    groups[0].options.push({
      label: '查看已上传图片',
      icon: <Eye size={18} />,
      onClick: () => {
        if (onViewImage) onViewImage();
        onClose();
      }
    });
  }

  return (
    <>
      <ActionSheet
        isOpen={isOpen}
        onClose={onClose}
        groups={groups}
      />
      
      {/* Simple Toast for Permission Warning */}
      {toastMsg && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] bg-black/70 text-white text-md px-4 py-2 rounded-lg animate-in fade-in zoom-in duration-200 whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </>
  );
};
