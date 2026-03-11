import { useEffect } from 'react';
import { ChevronRight, Lock, Smartphone } from 'lucide-react';
import { accountApi } from '../../api';
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

  const rows = [
    {
      label: '修改登录密码',
      value: '校验旧密码后修改',
      action: () => goTo('change_password'),
      icon: <Lock size={18} />,
    },
    {
      label: '修改支付密码',
      value: '用于支付和资金验证',
      action: () => goTo('change_pay_password'),
      icon: <Lock size={18} />,
    },
    {
      label: '验证码重置登录密码',
      value: '短信验证码重置',
      action: () => goTo('reset_password'),
      icon: <Smartphone size={18} />,
    },
    {
      label: '绑定手机号',
      value: maskMobile(profileRequest.data?.userInfo?.mobile),
      action: () => undefined,
      icon: <Smartphone size={18} />,
    },
  ];

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="账号与安全" onBack={goBack} />
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="rounded-[24px] bg-bg-card shadow-soft">
          <div className="border-b border-border-light px-4 py-4 text-[16px] font-medium text-text-main">
            密码与验证
          </div>

          {profileRequest.loading && !profileRequest.data ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : (
            rows.map((row, index) => (
              <div key={row.label}>
                <button
                  type="button"
                  onClick={row.action}
                  className="flex w-full items-center justify-between px-4 py-4 text-left active:bg-bg-hover"
                  disabled={row.label === '绑定手机号'}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-text-sub">{row.icon}</div>
                    <div>
                      <div className="text-[16px] text-text-main">{row.label}</div>
                      <div className="mt-1 text-[12px] text-text-sub">{row.value}</div>
                    </div>
                  </div>
                  {row.label === '绑定手机号' ? null : <ChevronRight size={16} className="text-text-aux" />}
                </button>
                {index < rows.length - 1 ? <div className="mx-4 border-t border-border-light" /> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
