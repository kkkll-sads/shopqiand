/**
 * @file ChangePassword/index.tsx
 * @description 用户通过输入旧密码和新密码来修改登录密码，修改成功后自动清除登录态并跳转登录页。
 */

import { useState } from 'react';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { accountApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { AuthPasswordToggle } from '../../components/biz/auth/AuthPasswordToggle';
import {
  SettingsActionItem,
  SettingsNotice,
  SettingsSection,
} from '../../components/biz/settings/SettingsSection';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Input } from '../../components/ui/Input';
import { clearAuthSession, PASSWORD_PATTERN } from '../../lib/auth';
import { useAppNavigate } from '../../lib/navigation';

export const ChangePasswordPage = () => {
  const { goBackOr, goTo } = useAppNavigate();
  const { showToast } = useFeedback();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async () => {
    const currentPassword = oldPassword.trim();
    const nextPassword = newPassword.trim();
    const nextConfirmPassword = confirmPassword.trim();

    if (!currentPassword) {
      showToast({ message: '请输入当前登录密码', type: 'warning' });
      return;
    }

    if (!PASSWORD_PATTERN.test(nextPassword)) {
      showToast({ message: '新密码需为 6-32 位字母或数字', type: 'warning' });
      return;
    }

    if (nextPassword !== nextConfirmPassword) {
      showToast({ message: '两次输入的新密码不一致', type: 'warning' });
      return;
    }

    if (currentPassword === nextPassword) {
      showToast({ message: '新密码不能与旧密码相同', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await accountApi.changePassword({
        oldPassword: currentPassword,
        newPassword: nextPassword,
      });
      clearAuthSession();
      showToast({ message: '登录密码修改成功，请重新登录', type: 'success' });
      goTo('login');
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="修改登录密码" onBack={() => goBackOr('settings')} />
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="space-y-4">
          <SettingsSection title="身份校验" description="请先输入旧密码，再设置新的登录密码。">
            <div className="space-y-4 px-4 py-4">
              <Input
                placeholder="请输入当前登录密码"
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                rightIcon={<AuthPasswordToggle visible={showOldPassword} onToggle={() => setShowOldPassword((value) => !value)} />}
              />
              <Input
                placeholder="请输入新登录密码"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                rightIcon={<AuthPasswordToggle visible={showNewPassword} onToggle={() => setShowNewPassword((value) => !value)} />}
              />
              <Input
                placeholder="请再次输入新登录密码"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                rightIcon={
                  <AuthPasswordToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} />
                }
              />
            </div>
          </SettingsSection>

          <SettingsNotice tone="warning" title="修改后影响">
            <div className="flex items-start gap-2">
              <ShieldAlert size={16} className="mt-0.5 shrink-0" />
              <span>修改成功后当前登录态会失效，需要使用新密码重新登录。</span>
            </div>
          </SettingsNotice>

          <SettingsSection>
            <SettingsActionItem
              label="验证码重置登录密码？"
              description="通过短信验证码重置登录密码"
              icon={<KeyRound size={18} />}
              variant="secondary"
              borderless
              onClick={() => goTo('reset_password')}
            />
          </SettingsSection>

          <Button className="mt-2" loading={submitting} onClick={handleSubmit}>
            确认修改
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
