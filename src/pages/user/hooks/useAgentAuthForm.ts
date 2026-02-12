import { useEffect, useState } from 'react';
import type { ChangeEventHandler } from 'react';
import {
  AgentReviewStatusData,
  fetchAgentReviewStatus,
  submitAgentReview,
  uploadImage,
  normalizeAssetUrl,
} from '@/services';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess } from '@/utils/apiHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useStateMachine } from '@/hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '@/types/states';
import { errorLog, warnLog } from '@/utils/logger';

export type AgentEntityType = 'individual' | 'company';

const createLoadingMachineConfig = () => ({
  initial: LoadingState.IDLE,
  transitions: {
    [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
    [LoadingState.LOADING]: {
      [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
      [LoadingEvent.ERROR]: LoadingState.ERROR,
    },
    [LoadingState.SUCCESS]: {
      [LoadingEvent.LOAD]: LoadingState.LOADING,
      [LoadingEvent.RETRY]: LoadingState.LOADING,
    },
    [LoadingState.ERROR]: {
      [LoadingEvent.LOAD]: LoadingState.LOADING,
      [LoadingEvent.RETRY]: LoadingState.LOADING,
    },
  },
});

interface UseAgentAuthFormResult {
  status: AgentReviewStatusData | null;
  companyName: string;
  legalPerson: string;
  legalId: string;
  entityType: AgentEntityType;
  licensePreview: string;
  loading: boolean;
  submitting: boolean;
  uploadingLicense: boolean;
  hasError: boolean;
  errorMessage: string;
  setCompanyName: (value: string) => void;
  setLegalPerson: (value: string) => void;
  setLegalId: (value: string) => void;
  setEntityType: (value: AgentEntityType) => void;
  handleLicenseChange: ChangeEventHandler<HTMLInputElement>;
  handleSubmit: () => Promise<void>;
}

export function useAgentAuthForm(): UseAgentAuthFormResult {
  const { showToast } = useNotification();
  const { errorMessage, hasError, handleError, clearError } = useErrorHandler();

  const loadMachine = useStateMachine<LoadingState, LoadingEvent>(createLoadingMachineConfig());
  const submitMachine = useStateMachine<FormState, FormEvent>({
    initial: FormState.IDLE,
    transitions: {
      [FormState.IDLE]: { [FormEvent.SUBMIT]: FormState.SUBMITTING },
      [FormState.VALIDATING]: {
        [FormEvent.VALIDATION_SUCCESS]: FormState.SUBMITTING,
        [FormEvent.VALIDATION_ERROR]: FormState.ERROR,
      },
      [FormState.SUBMITTING]: {
        [FormEvent.SUBMIT_SUCCESS]: FormState.SUCCESS,
        [FormEvent.SUBMIT_ERROR]: FormState.ERROR,
      },
      [FormState.SUCCESS]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
      [FormState.ERROR]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
    },
  });
  const uploadMachine = useStateMachine<LoadingState, LoadingEvent>(createLoadingMachineConfig());

  const loading = loadMachine.state === LoadingState.LOADING;
  const submitting = submitMachine.state === FormState.SUBMITTING;
  const uploadingLicense = uploadMachine.state === LoadingState.LOADING;

  const [status, setStatus] = useState<AgentReviewStatusData | null>(null);
  const [companyName, setCompanyNameState] = useState('');
  const [legalPerson, setLegalPersonState] = useState('');
  const [legalId, setLegalIdState] = useState('');
  const [entityType, setEntityTypeState] = useState<AgentEntityType>('company');
  const [licensePreview, setLicensePreview] = useState('');
  const [licenseImagePath, setLicenseImagePath] = useState('');

  const syncFormFromStatus = (data: AgentReviewStatusData | null) => {
    if (!data) return;

    setCompanyNameState(data.company_name || '');
    setLegalPersonState(data.legal_person || '');
    setLegalIdState(data.legal_id_number || '');
    setEntityTypeState(data.subject_type === 2 ? 'individual' : 'company');
    setLicenseImagePath(data.license_image || '');
    setLicensePreview(normalizeAssetUrl(data.license_image || ''));
  };

  useEffect(() => {
    const init = async () => {
      const token = getStoredToken() || '';
      if (!token) {
        handleError('未找到登录信息，请先登录', {
          persist: true,
          showToast: false,
        });
        loadMachine.send(LoadingEvent.ERROR);
        return;
      }

      try {
        loadMachine.send(LoadingEvent.LOAD);
        const response = await fetchAgentReviewStatus(token);
        if (isSuccess(response)) {
          const data = response.data as AgentReviewStatusData;
          setStatus(data);
          syncFormFromStatus(data);
          loadMachine.send(LoadingEvent.SUCCESS);
          return;
        }

        handleError(response, {
          persist: true,
          showToast: false,
          customMessage: '获取代理商状态失败',
        });
        loadMachine.send(LoadingEvent.ERROR);
      } catch (error: any) {
        handleError(error, {
          persist: true,
          showToast: false,
          customMessage: '获取代理商状态失败，请稍后重试',
        });
        loadMachine.send(LoadingEvent.ERROR);
      }
    };

    void init();
  }, []);

  const handleLicenseChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      uploadMachine.send(LoadingEvent.LOAD);
      const response = await uploadImage(file);
      const data = (response.data || {}) as any;
      const path = data.url || data.path || data.filepath || '';
      const fullUrl = data.fullurl || data.fullUrl || data.url || path;

      if (!path && !fullUrl) {
        throw new Error('上传失败，返回数据为空');
      }

      setLicenseImagePath(path || fullUrl);
      setLicensePreview(normalizeAssetUrl(fullUrl || path));
      showToast('success', response?.msg || '上传成功');
      uploadMachine.send(LoadingEvent.SUCCESS);
    } catch (error: any) {
      errorLog('AgentAuth', '营业执照上传失败', error);
      const errorMessage =
        error?.msg || error?.response?.msg || error?.message || '营业执照上传失败，请稍后重试';
      showToast('error', '上传失败', errorMessage);
      uploadMachine.send(LoadingEvent.ERROR);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      submitMachine.send(FormEvent.SUBMIT);
      clearError();

      const token = getStoredToken() || '';
      const response = await submitAgentReview({
        company_name: companyName,
        legal_person: legalPerson,
        legal_id_number: legalId,
        subject_type: entityType === 'individual' ? 2 : 1,
        license_image: licenseImagePath,
        token,
      });

      if (response?.msg) {
        showToast(isSuccess(response) ? 'success' : 'info', '提示', response.msg);
      } else {
        showToast('success', '提交成功');
      }

      try {
        const statusResponse = await fetchAgentReviewStatus(token);
        if (isSuccess(statusResponse)) {
          setStatus(statusResponse.data as AgentReviewStatusData);
        }
      } catch (error) {
        warnLog('AgentAuth', '刷新代理商状态失败', error);
      }

      submitMachine.send(FormEvent.SUBMIT_SUCCESS);
    } catch (error: any) {
      errorLog('AgentAuth', '提交代理商申请失败', error);
      showToast('error', '提交失败', error?.message || '提交代理商申请失败，请稍后重试');
      submitMachine.send(FormEvent.SUBMIT_ERROR);
    }
  };

  return {
    status,
    companyName,
    legalPerson,
    legalId,
    entityType,
    licensePreview,
    loading,
    submitting,
    uploadingLicense,
    hasError,
    errorMessage,
    setCompanyName: setCompanyNameState,
    setLegalPerson: setLegalPersonState,
    setLegalId: setLegalIdState,
    setEntityType: setEntityTypeState,
    handleLicenseChange,
    handleSubmit,
  };
}
