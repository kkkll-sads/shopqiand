import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, ChevronRight, ImagePlus, PencilLine } from 'lucide-react';
import { accountApi, uploadApi, userApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { resolveUploadUrl } from '../../api/modules/upload';
import { ImagePickerActionSheet } from '../../components/biz/ImagePickerActionSheet';
import { SettingsNotice, SettingsSection } from '../../components/biz/settings/SettingsSection';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useRequest } from '../../hooks/useRequest';
import { patchAuthSessionUserInfo } from '../../lib/auth';
import { useAppNavigate } from '../../lib/navigation';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function readString(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

export const EditProfilePage = () => {
  const { goBackOr, goTo } = useAppNavigate();
  const { session, isAuthenticated } = useAuthSession();
  const { showToast } = useFeedback();
  const albumInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [showImagePicker, setShowImagePicker] = useState(false);
  const [nickname, setNickname] = useState('');
  const [nicknameTouched, setNicknameTouched] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const profileRequest = useRequest((signal) => accountApi.getProfile({ signal }), {
    cache: true,
    cacheKey: 'user:profile',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });

  const profileUserInfo = profileRequest.data?.userInfo;
  const sessionUserInfo = session?.userInfo;
  const baseUserInfo = profileUserInfo ?? sessionUserInfo;
  const currentNickname = readString(baseUserInfo?.nickname) || readString(baseUserInfo?.username);
  const currentAvatarRaw = readString(baseUserInfo?.avatar);
  const currentAvatar = currentAvatarRaw ? resolveUploadUrl(currentAvatarRaw) : '';
  const displayName = nickname.trim() || currentNickname || '会员用户';

  useEffect(() => {
    if (!isAuthenticated) {
      goTo('login');
    }
  }, [goTo, isAuthenticated]);

  useEffect(() => {
    if (!nicknameTouched) {
      setNickname(currentNickname);
    }
  }, [currentNickname, nicknameTouched]);

  useEffect(() => {
    if (!avatarUploading) {
      setAvatarPreview(currentAvatar);
    }
  }, [avatarUploading, currentAvatar]);

  const handleAvatarSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast({ message: '请选择图片文件', type: 'warning' });
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      showToast({ message: '头像图片不能超过 5MB', type: 'warning' });
      return;
    }

    setAvatarUploading(true);

    try {
      const uploaded = await uploadApi.upload({
        file,
        topic: 'avatar',
      });
      const avatarUrl = uploaded.url;

      if (!avatarUrl) {
        throw new Error('头像上传失败，请稍后重试');
      }

      await userApi.updateNickname({ avatarUrl });
      let latestAvatar = avatarUrl;
      try {
        const latestProfile = await profileRequest.reload();
        const latestUserInfo = latestProfile?.userInfo;
        latestAvatar = readString(latestUserInfo?.avatar) || avatarUrl;

        if (latestUserInfo) {
          patchAuthSessionUserInfo({
            ...latestUserInfo,
            avatar: latestAvatar,
          });
        } else {
          patchAuthSessionUserInfo({ avatar: latestAvatar });
        }
      } catch {
        patchAuthSessionUserInfo({ avatar: latestAvatar });
      }

      setAvatarPreview(latestAvatar);
      showToast({ message: '头像已更新', type: 'success' });
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    await handleAvatarSelect(file);
  };

  const handleSave = async () => {
    const nextNickname = nickname.trim();

    if (!nextNickname) {
      showToast({ message: '请输入昵称', type: 'warning' });
      return;
    }

    if (nextNickname.length > 20) {
      showToast({ message: '昵称最多 20 个字符', type: 'warning' });
      return;
    }

    if (nextNickname === currentNickname) {
      showToast({ message: '昵称没有变化', type: 'info' });
      return;
    }

    setSubmitting(true);

    try {
      await userApi.updateNickname({ nickname: nextNickname });
      patchAuthSessionUserInfo({ nickname: nextNickname });
      setNicknameTouched(false);
      showToast({ message: '昵称已更新', type: 'success' });
      goBackOr('user');
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAvatar = () => {
    if (!avatarPreview) {
      return;
    }

    window.open(avatarPreview, '_blank', 'noopener,noreferrer');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="编辑资料" onBack={() => goBackOr('user')} />

      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="space-y-4">
          <SettingsSection
            title="资料信息"
            description="头像修改会立即生效，昵称保存后会同步到 APP。"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between border-b border-border-light/80 px-4 py-4 text-left transition-colors active:bg-bg-hover disabled:opacity-60"
              onClick={() => setShowImagePicker(true)}
              disabled={avatarUploading}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bg-base text-text-sub">
                  {avatarUploading ? (
                    <ImagePlus size={18} className="animate-pulse" />
                  ) : (
                    <Camera size={18} />
                  )}
                </div>
                <div>
                  <div className="text-lg text-text-main">APP 头像</div>
                  <div className="mt-1 text-s leading-5 text-text-sub">
                    {avatarUploading ? '正在上传新头像...' : '支持拍照或从相册选择'}
                  </div>
                </div>
              </div>

              <div className="ml-3 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-border-light bg-primary-start/10 text-lg font-semibold text-primary-start shadow-sm">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="当前头像"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (displayName || '用').slice(0, 1)
                  )}
                </div>
                <ChevronRight size={16} className="text-text-aux" />
              </div>
            </button>

            <div className="space-y-3 px-4 py-4">
              <div className="flex items-center gap-2 text-base font-medium text-text-main">
                <PencilLine size={16} className="text-text-sub" />
                APP 昵称
              </div>
              <Input
                value={nickname}
                maxLength={20}
                placeholder="请输入新的昵称"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setNickname(event.target.value);
                  setNicknameTouched(true);
                }}
              />
              <div className="flex items-center justify-between text-s text-text-sub">
                <span>当前显示昵称：{currentNickname || '未设置'}</span>
                <span>{nickname.trim().length}/20</span>
              </div>
            </div>
          </SettingsSection>

          <SettingsNotice title="修改说明">
            头像支持 JPG、PNG、WebP，单张不超过 5MB。昵称修改成功后，“我的”页会直接展示最新信息。
          </SettingsNotice>

          <Button loading={submitting} disabled={avatarUploading} onClick={handleSave}>
            保存昵称
          </Button>
        </div>
      </div>

      <input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <ImagePickerActionSheet
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        hasUploadedImage={!!avatarPreview}
        onChooseAlbum={() => albumInputRef.current?.click()}
        onTakePhoto={() => cameraInputRef.current?.click()}
        onViewImage={handleViewAvatar}
      />
    </div>
  );
};

export default EditProfilePage;
