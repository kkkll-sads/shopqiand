import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { accountApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
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
        <div className="rounded-[24px] bg-bg-card p-4 shadow-soft">
          <div className="space-y-4">
            <Input
              placeholder="请输入当前登录密码"
              type={showOldPassword ? 'text' : 'password'}
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              rightIcon={
                <button type="button" onClick={() => setShowOldPassword((value) => !value)}>
                  {showOldPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              }
            />
            <Input
              placeholder="请输入新登录密码"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              rightIcon={
                <button type="button" onClick={() => setShowNewPassword((value) => !value)}>
                  {showNewPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              }
            />
            <Input
              placeholder="请再次输入新登录密码"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              rightIcon={
                <button type="button" onClick={() => setShowConfirmPassword((value) => !value)}>
                  {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              }
            />
          </div>

          <div className="mt-5 text-[12px] leading-5 text-text-sub">
            修改成功后当前登录态会失效，需要使用新密码重新登录。
          </div>
        </div>

        <Button className="mt-6" disabled={submitting} onClick={handleSubmit}>
          {submitting ? '提交中...' : '确认修改'}
        </Button>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
