/**
 * @file ResetPasswordBySms/index.tsx - 短信重置登录密码页面
 * @description 通过手机号和短信验证码重置登录密码。
 */

import { useState } from 'react'; // React 核心 Hook
import { authApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import {
  AuthFormSection,
  AuthPasswordToggle,
  AuthSmsField,
  AuthTopBar,
} from '../../components/biz/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useSmsCode } from '../../hooks/useSmsCode';
import { MOBILE_PATTERN, PASSWORD_PATTERN } from '../../lib/auth';
import { useAppNavigate } from '../../lib/navigation';

export const ResetPasswordBySmsPage = () => {
  const { goBackOr, goTo } = useAppNavigate();
  const { showToast } = useFeedback();
  const [mobile, setMobile] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { buttonText, canSend, message, sendCode, sending } = useSmsCode({
    event: 'user_retrieve_pwd',
  });

  const handleSubmit = async () => {
    const normalizedMobile = mobile.trim();
    const normalizedCode = verifyCode.trim();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (!MOBILE_PATTERN.test(normalizedMobile)) {
      showToast({ message: '请输入正确的手机号', type: 'warning' });
      return;
    }

    if (!normalizedCode) {
      showToast({ message: '请输入短信验证码', type: 'warning' });
      return;
    }

    if (!PASSWORD_PATTERN.test(normalizedPassword)) {
      showToast({ message: '新密码需为 6-32 位字母或数字', type: 'warning' });
      return;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      showToast({ message: '两次输入的新密码不一致', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await authApi.retrievePassword({
        type: 'mobile',
        account: normalizedMobile,
        captcha: normalizedCode,
        password: normalizedPassword,
      });
      showToast({ message: '登录密码已重置，请使用新密码登录', type: 'success' });
      goTo('login');
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto px-4 pb-8 pt-4 no-scrollbar">
        <AuthTopBar onBack={() => goBackOr('login')} />

        <AuthFormSection
          className="mt-16"
          title="验证码重置登录密码"
          description="通过手机验证码重新设置新的登录密码"
          actions={(
            <Button loading={submitting} onClick={handleSubmit}>
              重置登录密码
            </Button>
          )}
        >
          <Input placeholder="请输入手机号" type="tel" value={mobile} onChange={(event) => setMobile(event.target.value)} />
          <AuthSmsField
            value={verifyCode}
            onChange={(event) => setVerifyCode(event.target.value)}
            buttonText={buttonText}
            canSend={canSend}
            message={message}
            sending={sending}
            onSend={() => void sendCode(mobile)}
          />

          <Input
            placeholder="请输入新登录密码"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            rightIcon={<AuthPasswordToggle visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />}
          />

          <Input
            placeholder="请再次输入新登录密码"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            rightIcon={<AuthPasswordToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} />}
          />
        </AuthFormSection>
      </div>
    </div>
  );
};

export default ResetPasswordBySmsPage;

