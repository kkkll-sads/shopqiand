/**
 * @file ChangePayPassword/index.tsx - 修改支付密码页面
 * @description 用户通过输入旧支付密码和新支付密码来修改支付密码，支持跳转重置支付密码页。
 */

import { useState } from 'react'; // React 核心 Hook
import { KeyRound, ShieldAlert } from 'lucide-react';
import { getErrorMessage } from '../../api/core/errors';
import { userApi } from '../../api/modules/user';
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
import { PASSWORD_PATTERN } from '../../lib/auth';
import { useAppNavigate } from '../../lib/navigation';

/**
 * ChangePayPasswordPage - 修改支付密码页面
 * 功能：输入旧支付密码 → 输入新密码 → 确认新密码 → 提交修改
 */
export const ChangePayPasswordPage = () => {
  const { goBackOr, navigate } = useAppNavigate();
  const { showToast } = useFeedback();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /** 提交修改支付密码：验证表单 → 调用 API */
  const handleSubmit = async () => {
    const currentPassword = oldPassword.trim();
    const nextPassword = newPassword.trim();
    const nextConfirmPassword = confirmPassword.trim();

    if (!currentPassword) {
      showToast({ message: '请输入当前支付密码', type: 'warning' });
      return;
    }

    if (!PASSWORD_PATTERN.test(nextPassword)) {
      showToast({ message: '新支付密码需为 6-32 位字母或数字', type: 'warning' });
      return;
    }

    if (nextPassword !== nextConfirmPassword) {
      showToast({ message: '两次输入的新支付密码不一致', type: 'warning' });
      return;
    }

    if (currentPassword === nextPassword) {
      showToast({ message: '新支付密码不能与旧密码相同', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await userApi.updatePayPassword({
        oldPayPassword: currentPassword,
        newPayPassword: nextPassword,
      });
      showToast({ message: '支付密码修改成功', type: 'success' });
      goBackOr('settings');
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="修改支付密码" onBack={() => goBackOr('settings')} />
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="space-y-4">
          <SettingsSection title="支付验证" description="用于支付和资金验证，请设置独立密码。">
            <div className="space-y-4 px-4 py-4">
              <Input
                placeholder="请输入当前支付密码"
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                rightIcon={<AuthPasswordToggle visible={showOldPassword} onToggle={() => setShowOldPassword((value) => !value)} />}
              />
              <Input
                placeholder="请输入新支付密码"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                rightIcon={<AuthPasswordToggle visible={showNewPassword} onToggle={() => setShowNewPassword((value) => !value)} />}
              />
              <Input
                placeholder="请再次输入新支付密码"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                rightIcon={
                  <AuthPasswordToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} />
                }
              />
            </div>
          </SettingsSection>

          <SettingsNotice tone="warning" title="安全提示">
            <div className="flex items-start gap-2">
              <ShieldAlert size={16} className="mt-0.5 shrink-0" />
              <span>支付密码建议与登录密码区分使用，避免复用同一组口令。</span>
            </div>
          </SettingsNotice>

          <SettingsSection>
            <SettingsActionItem
              label="忘记支付密码？"
              description="通过短信验证码重置支付密码"
              icon={<KeyRound size={18} />}
              variant="secondary"
              borderless
              onClick={() => navigate('/reset-pay-password')}
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

export default ChangePayPasswordPage;
