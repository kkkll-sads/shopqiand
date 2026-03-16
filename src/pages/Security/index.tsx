/**
 * @file Security/index.tsx
 * @description 用户安全设置页面，管理登录密码、支付密码、实名认证等。
 */

import { useEffect, useState } from 'react';
import { Lock, Smartphone, UserX } from 'lucide-react';
import { accountApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { AuthPasswordToggle } from '../../components/biz/auth';
import { SettingsActionItem, SettingsNotice, SettingsSection } from '../../components/biz/settings/SettingsSection';
import { PageHeader } from '../../components/layout/PageHeader';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { Button } from '../../components/ui/Button';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { useRequest } from '../../hooks/useRequest';
import { clearAuthSession, PASSWORD_PATTERN } from '../../lib/auth';
import { useAppNavigate } from '../../lib/navigation';

function maskMobile(mobile?: string) {
  if (!mobile) {
    return '--';
  }
  return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

export const SecurityPage = () => {
  const { goBack, goTo } = useAppNavigate();
  const { showToast, showLoading, hideLoading } = useFeedback();
  const profileRequest = useRequest((signal) => accountApi.getProfile({ signal }), {
    cacheKey: 'account:profile',
  });
  const [showCancelAccountForm, setShowCancelAccountForm] = useState(false);
  const [cancelPassword, setCancelPassword] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPassword, setShowCancelPassword] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [showCancelAccountSheet, setShowCancelAccountSheet] = useState(false);

  useEffect(() => {
    if (profileRequest.error) {
      showToast({ message: profileRequest.error.message, type: 'error' });
    }
  }, [profileRequest.error, showToast]);

  const resetCancelAccountForm = () => {
    setShowCancelAccountForm(false);
    setShowCancelAccountSheet(false);
    setCancelPassword('');
    setCancelReason('');
    setShowCancelPassword(false);
  };

  const openCancelAccountForm = () => {
    setShowCancelAccountSheet(false);
    setShowCancelAccountForm(true);
  };

  const handleCancelAccount = async () => {
    const password = cancelPassword.trim();
    const reason = cancelReason.trim();

    if (!password) {
      showToast({ message: '请输入账户密码', type: 'warning' });
      return;
    }

    if (!PASSWORD_PATTERN.test(password)) {
      showToast({ message: '账户密码需为 6-32 位字母或数字', type: 'warning' });
      return;
    }

    setCancelSubmitting(true);
    showLoading({ message: '正在提交注销申请...', subMessage: '提交成功后当前账号将退出登录' });

    try {
      await accountApi.cancelAccount({
        password,
        reason: reason || undefined,
      });
      hideLoading();
      clearAuthSession();
      resetCancelAccountForm();
      showToast({ message: '账户已注销', type: 'success' });
      goTo('login');
    } catch (error) {
      hideLoading();
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setCancelSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="账号与安全" onBack={goBack} />
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="space-y-4">
          <SettingsSection title="密码与验证" description="统一管理登录密码、支付密码和手机号信息。">
            {profileRequest.loading && !profileRequest.data ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} className="h-16 rounded-[20px]" />
                ))}
              </div>
            ) : (
              <>
                <SettingsActionItem
                  label="修改登录密码"
                  description="校验旧密码后修改"
                  icon={<Lock size={18} />}
                  onClick={() => goTo('change_password')}
                />
                <SettingsActionItem
                  label="修改支付密码"
                  description="用于支付和资金验证"
                  icon={<Lock size={18} />}
                  onClick={() => goTo('change_pay_password')}
                />
                <SettingsActionItem
                  label="绑定手机号"
                  description="当前绑定手机号"
                  icon={<Smartphone size={18} />}
                  value={maskMobile(profileRequest.data?.userInfo?.mobile)}
                  variant="static"
                  disabled
                />
              </>
            )}
          </SettingsSection>

          <SettingsSection title="账户管理" description="危险操作前请确认账户与资产状态。">
            <SettingsActionItem
              label="注销账户"
              icon={<UserX size={18} />}
              variant="danger"
              hideChevron={showCancelAccountForm}
              onClick={() => {
                if (showCancelAccountForm) {
                  resetCancelAccountForm();
                  return;
                }
                setShowCancelAccountSheet(true);
              }}
            />
            {showCancelAccountForm ? (
              <div className="space-y-3 border-b border-border-light/80 px-4 py-4">
                <Input
                  placeholder="请输入账户密码"
                  type={showCancelPassword ? 'text' : 'password'}
                  value={cancelPassword}
                  onChange={(event) => setCancelPassword(event.target.value)}
                  rightIcon={
                    <AuthPasswordToggle
                      visible={showCancelPassword}
                      onToggle={() => setShowCancelPassword((value) => !value)}
                    />
                  }
                />
                <Input
                  placeholder="请输入注销原因（选填）"
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetCancelAccountForm}
                    className="flex-1 rounded-full bg-bg-base py-3 text-md font-medium text-text-main"
                    disabled={cancelSubmitting}
                  >
                    取消
                  </button>
                  <Button className="flex-1" loading={cancelSubmitting} onClick={handleCancelAccount}>
                    确认注销
                  </Button>
                </div>
              </div>
            ) : null}
          </SettingsSection>

          <SettingsNotice title="安全提示">
            修改登录密码后当前登录态会失效；支付密码建议与登录密码区分使用。
          </SettingsNotice>
        </div>
      </div>

      <ActionSheet
        isOpen={showCancelAccountSheet}
        onClose={() => {
          if (cancelSubmitting) {
            return;
          }
          setShowCancelAccountSheet(false);
        }}
        title="确认注销账户？"
        groups={[
          {
            options: [
              {
                label: '继续注销',
                icon: <UserX size={18} />,
                danger: true,
                onClick: openCancelAccountForm,
              },
            ],
          },
        ]}
      />
    </div>
  );
};
