import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock3,
  FileImage,
  ShieldCheck,
  Upload,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { getErrorMessage } from '../../api/core/errors';
import { uploadApi, userApi, type AgentReviewStatus } from '../../api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useAppNavigate } from '../../lib/navigation';

type SubjectType = 1 | 2;

function isValidChineseIdCard(value: string) {
  return /^(?:\d{15}|\d{17}[\dXx])$/.test(value);
}

function readStatusTone(status: number) {
  switch (status) {
    case 1:
      return {
        icon: CheckCircle2,
        iconClassName: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
        title: '代理认证已通过',
        description: '当前账户已具备代理身份。',
      };
    case 0:
      return {
        icon: Clock3,
        iconClassName: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
        title: '代理认证审核中',
        description: '资料已提交，请等待平台审核结果。',
      };
    case 2:
      return {
        icon: XCircle,
        iconClassName: 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-300',
        title: '代理认证未通过',
        description: '请根据驳回原因修改资料后重新提交。',
      };
    default:
      return {
        icon: ShieldCheck,
        iconClassName: 'bg-orange-50 text-orange-500 dark:bg-orange-950/40 dark:text-orange-300',
        title: '提交代理认证资料',
        description: '完善企业与法人信息，上传营业执照后提交审核。',
      };
  }
}

export const AgentAuthPage = () => {
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { showToast } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<AgentReviewStatus | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [legalPerson, setLegalPerson] = useState('');
  const [legalIdNumber, setLegalIdNumber] = useState('');
  const [subjectType, setSubjectType] = useState<SubjectType>(1);
  const [licenseImage, setLicenseImage] = useState('');

  const loadStatus = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await userApi.getAgentReviewStatus();
      setStatus(result);
      setCompanyName(result?.companyName ?? '');
      setLegalPerson(result?.legalPerson ?? '');
      setLegalIdNumber(result?.legalIdNumber ?? '');
      setSubjectType(result?.subjectType === 2 ? 2 : 1);
      setLicenseImage(result?.licenseImage ?? '');
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      showToast({ message: getErrorMessage(loadError), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    void loadStatus();
  }, [isAuthenticated]);

  const formError = useMemo(() => {
    if (!companyName.trim()) {
      return '请输入企业名称';
    }

    if (!legalPerson.trim()) {
      return '请输入法人姓名';
    }

    if (!legalIdNumber.trim()) {
      return '请输入法人证件号';
    }

    if (!isValidChineseIdCard(legalIdNumber.trim())) {
      return '法人证件号格式不正确';
    }

    if (!licenseImage.trim()) {
      return '请上传营业执照';
    }

    return '';
  }, [companyName, legalIdNumber, legalPerson, licenseImage]);

  const canEdit = !status || status.status === -1 || status.status === 2;
  const statusTone = readStatusTone(status?.status ?? -1);
  const StatusIcon = statusTone.icon;

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setUploading(true);

    try {
      const uploaded = await uploadApi.upload({
        file,
        topic: 'agent-review',
      });
      setLicenseImage(uploaded.url);
      showToast({ message: '营业执照上传成功', type: 'success' });
    } catch (uploadError) {
      showToast({ message: getErrorMessage(uploadError), type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (formError) {
      showToast({ message: formError, type: 'warning' });
      return;
    }

    setSubmitting(true);

    try {
      await userApi.submitAgentReview({
        companyName: companyName.trim(),
        legalPerson: legalPerson.trim(),
        legalIdNumber: legalIdNumber.trim().toUpperCase(),
        licenseImage: licenseImage.trim(),
        subjectType,
      });
      showToast({ message: '代理认证申请已提交', type: 'success' });
      await loadStatus();
    } catch (submitError) {
      showToast({ message: getErrorMessage(submitError), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
        <PageHeader title="代理认证" onBack={goBack} />
        <EmptyState
          icon={<UserCheck size={48} />}
          message="登录后查看并提交代理认证资料"
          actionText="去登录"
          actionVariant="primary"
          onAction={() => goTo('login')}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="代理认证" onBack={goBack} />

      {loading ? (
        <div className="flex-1 px-4 py-6">
          <Card className="border border-border-light p-5">
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-32 rounded-full bg-bg-hover" />
              <div className="h-4 w-full rounded-full bg-bg-hover" />
              <div className="h-4 w-2/3 rounded-full bg-bg-hover" />
            </div>
          </Card>
        </div>
      ) : error ? (
        <div className="flex-1 px-4 py-6">
          <ErrorState message={error} onRetry={() => void loadStatus()} />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
            <Card className="border border-border-light p-5">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${statusTone.iconClassName}`}
                >
                  <StatusIcon size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-text-main">{statusTone.title}</h2>
                  <p className="mt-1 text-sm text-text-sub">{statusTone.description}</p>
                  {status?.statusText ? (
                    <div className="mt-4 inline-flex rounded-full bg-bg-base px-3 py-1 text-xs text-text-sub">
                      当前状态：{status.statusText}
                    </div>
                  ) : null}
                  {status?.auditRemark ? (
                    <div className="mt-4 rounded-2xl bg-red-50/80 px-4 py-3 text-sm text-red-500 dark:bg-red-950/40 dark:text-red-300">
                      驳回原因：{status.auditRemark}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>

            {canEdit ? (
              <>
                <Card className="mt-4 border border-border-light p-5">
                  <h3 className="text-base font-semibold text-text-main">企业资料</h3>

                  <div className="mt-4 space-y-4">
                    <label className="block">
                      <div className="mb-2 flex items-center gap-2 text-sm text-text-sub">
                        <Building2 size={16} />
                        企业名称
                      </div>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                        placeholder="请输入企业名称"
                  className="h-12 w-full rounded-2xl border border-border-light bg-bg-base px-4 text-lg text-text-main outline-none transition-colors placeholder:text-text-aux focus:border-orange-400"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-2 flex items-center gap-2 text-sm text-text-sub">
                        <UserCheck size={16} />
                        法人姓名
                      </div>
                      <input
                        type="text"
                        value={legalPerson}
                        onChange={(event) => setLegalPerson(event.target.value)}
                        placeholder="请输入法人姓名"
                  className="h-12 w-full rounded-2xl border border-border-light bg-bg-base px-4 text-lg text-text-main outline-none transition-colors placeholder:text-text-aux focus:border-orange-400"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-2 flex items-center gap-2 text-sm text-text-sub">
                        <AlertCircle size={16} />
                        法人证件号
                      </div>
                      <input
                        type="text"
                        value={legalIdNumber}
                        onChange={(event) =>
                          setLegalIdNumber(event.target.value.replace(/\s+/g, '').toUpperCase())
                        }
                        placeholder="请输入法人证件号"
                  className="h-12 w-full rounded-2xl border border-border-light bg-bg-base px-4 text-lg text-text-main outline-none transition-colors placeholder:text-text-aux focus:border-orange-400"
                      />
                    </label>
                  </div>
                </Card>

                <Card className="mt-4 border border-border-light p-5">
                  <h3 className="text-base font-semibold text-text-main">主体类型</h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSubjectType(1)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                        subjectType === 1
                          ? 'border-orange-300 bg-orange-50 text-orange-600'
                          : 'border-border-light bg-bg-base text-text-sub'
                      }`}
                    >
                      企业法人
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectType(2)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                        subjectType === 2
                          ? 'border-orange-300 bg-orange-50 text-orange-600'
                          : 'border-border-light bg-bg-base text-text-sub'
                      }`}
                    >
                      个体户
                    </button>
                  </div>
                </Card>

                <Card className="mt-4 border border-border-light p-5">
                  <h3 className="text-base font-semibold text-text-main">营业执照</h3>

                  <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border-main bg-bg-base px-4 py-6 text-center">
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                    {licenseImage ? (
                      <img
                        src={licenseImage}
                        alt="营业执照"
                        className="h-40 w-full rounded-2xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-card text-text-sub">
                          <FileImage size={24} />
                        </div>
                        <div className="mt-3 text-sm font-medium text-text-main">上传营业执照</div>
                        <div className="mt-1 text-xs text-text-aux">支持 jpg、png 等常见图片格式</div>
                      </>
                    )}
                    <div className="mt-4 inline-flex items-center gap-2 text-sm text-text-sub">
                      <Upload size={16} />
                      {uploading ? '上传中...' : '点击选择图片'}
                    </div>
                  </label>
                </Card>
              </>
            ) : null}
          </div>

          {canEdit ? (
            <div className="shrink-0 border-t border-border-light bg-bg-card px-4 py-3 pb-safe">
              <Button variant="primary" loading={submitting} onClick={handleSubmit}>
                提交代理认证
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default AgentAuthPage;
