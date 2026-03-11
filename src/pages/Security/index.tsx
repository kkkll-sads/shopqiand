/**
 * @file Security/index.tsx - 安全中心页面
 * @description 用户安全设置页面，管理登录密码、支付密码、实名认证等。
 */

import { useEffect } from 'react'; // React 核心 Hook
import { Lock, Smartphone } from 'lucide-react';
import { accountApi } from '../../api';
import { SettingsActionItem, SettingsNotice, SettingsSection } from '../../components/biz/settings/SettingsSection';
import { PageHeader } from '../../components/layout/PageHeader';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Skeleton } from '../../components/ui/Skeleton';
import { useRequest } from '../../hooks/useRequest';
import { useAppNavigate } from '../../lib/navigation';

function maskMobile(mobile?: string) {
  if (!mobile) {
    return '--';
  }
  return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

export const SecurityPage = () => {
  const { goBack, goTo } = useAppNavigate();
  const { showToast } = useFeedback();
  const profileRequest = useRequest((signal) => accountApi.getProfile({ signal }), {
    cacheKey: 'account:profile',
  });

  useEffect(() => {
    if (profileRequest.error) {
      showToast({ message: profileRequest.error.message, type: 'error' });
    }
  }, [profileRequest.error, showToast]);

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
                  label="验证码重置登录密码"
                  description="短信验证码重置"
                  icon={<Smartphone size={18} />}
                  onClick={() => goTo('reset_password')}
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

          <SettingsNotice title="安全提示">
            修改登录密码后当前登录态会失效；支付密码建议与登录密码区分使用。
          </SettingsNotice>
        </div>
      </div>
    </div>
  );
};
