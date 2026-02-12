import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, type LoginParams, fetchProfile, fetchRealNameStatus } from '@/services';
import { useNotification } from '@/context/NotificationContext';
import { useAuthStore } from '@/stores/authStore';
import { useStateMachine } from '@/hooks/useStateMachine';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { FormEvent, FormState } from '@/types/states';
import { sendSmsCode } from '@/services/common';
import { isSuccess, extractErrorFromException } from '@/utils/apiHelpers';
import { bizLog, debugLog, errorLog, warnLog } from '@/utils/logger';
import { useLoginBottomPadding } from './useLoginBottomPadding';
import {
  clearRememberedCredentials,
  loadRememberedCredentials,
  saveRememberedCredentials,
} from '../storage';

export type LoginType = 'password' | 'code';

type CorsErrorLike = {
  isCorsError?: boolean;
};

const isCorsErrorLike = (error: unknown): error is CorsErrorLike =>
  typeof error === 'object' && error !== null && 'isCorsError' in error;

interface UseLoginPageResult {
  phone: string;
  password: string;
  verifyCode: string;
  agreed: boolean;
  showPassword: boolean;
  loginType: LoginType;
  countdown: number;
  rememberMe: boolean;
  bottomPadding: number;
  loading: boolean;
  setPhone: (value: string) => void;
  setPassword: (value: string) => void;
  setVerifyCode: (value: string) => void;
  setLoginType: (value: LoginType) => void;
  toggleShowPassword: () => void;
  toggleRememberMe: () => void;
  toggleAgreed: () => void;
  handleSendCode: () => Promise<void>;
  handleLogin: () => Promise<void>;
  navigateOnlineService: () => void;
  navigateForgotPassword: () => void;
  navigateUserAgreement: () => void;
  navigatePrivacyPolicy: () => void;
  navigateRegister: () => void;
}

export function useLoginPage(): UseLoginPageResult {
  const navigate = useNavigate();
  const { login: loginToStore } = useAuthStore();
  const { showToast } = useNotification();
  const { handleError } = useErrorHandler({ showToast: true, persist: false });

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [loginType, setLoginType] = useState<LoginType>('password');
  const [countdown, setCountdown] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  const bottomPadding = useLoginBottomPadding();

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

  const loading = submitMachine.state === FormState.SUBMITTING;

  useEffect(() => {
    try {
      const rememberedCredentials = loadRememberedCredentials();
      if (rememberedCredentials.rememberMe) {
        setPhone(rememberedCredentials.phone);
        setPassword(rememberedCredentials.password);
        setRememberMe(true);
      }
    } catch (error) {
      errorLog('Login', '读取记住密码信息失败', error);
    }
  }, []);

  const saveCredentials = () => {
    try {
      saveRememberedCredentials(phone, password);
    } catch (error) {
      errorLog('Login', '保存记住密码信息失败', error);
    }
  };

  const clearCredentials = () => {
    try {
      clearRememberedCredentials();
    } catch (error) {
      errorLog('Login', '清除记住密码信息失败', error);
    }
  };

  const handleSendCode = async () => {
    if (!phone || !phone.trim()) {
      showToast('warning', '请输入手机号');
      return;
    }

    try {
      await sendSmsCode({
        mobile: phone.trim(),
        event: 'user_login',
      });

      showToast('success', '验证码已发送');
      setCountdown(60);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: unknown) {
      const msg = extractErrorFromException(error, '发送验证码失败');
      showToast('error', '验证码发送失败', msg);
    }
  };

  const handleLogin = async () => {
    if (!phone || !phone.trim()) {
      showToast('warning', '请输入手机号');
      return;
    }

    if (loginType === 'password' && !password) {
      showToast('warning', '请输入密码');
      return;
    }

    if (loginType === 'code' && !verifyCode) {
      showToast('warning', '请输入验证码');
      return;
    }

    if (!agreed) {
      showToast('warning', '请阅读并同意用户协议');
      return;
    }

    submitMachine.send(FormEvent.SUBMIT);

    try {
      const params: LoginParams = {
        mobile: phone.trim(),
        password: loginType === 'password' ? password : undefined,
        captcha: loginType === 'code' ? verifyCode : undefined,
        keep: rememberMe ? 1 : 0,
      };

      const response = await loginApi(params);
      debugLog('auth.login.page', '登录接口响应', response);
      bizLog('auth.login.page', { success: isSuccess(response) });

      if (!isSuccess(response)) {
        handleError(response, {
          toastTitle: '登录失败',
          customMessage: '登录失败，请稍后重试',
          context: { phone, loginType },
        });
        submitMachine.send(FormEvent.SUBMIT_ERROR);
        submitMachine.send(FormEvent.RESET);
        return;
      }

      const token = response.data?.userInfo?.token;
      if (!token) {
        showToast('error', '登录异常', '登录成功，但未获取到 token，无法继续');
        submitMachine.send(FormEvent.SUBMIT_ERROR);
        submitMachine.send(FormEvent.RESET);
        return;
      }

      if (rememberMe) {
        saveCredentials();
      } else {
        clearCredentials();
      }

      showToast('success', '登录成功', response.msg);

      let fullUserInfo = response.data?.userInfo || null;
      let realNameStatus = 0;
      let realName = '';

      try {
        const profileRes = await fetchProfile(token);
        if (isSuccess(profileRes) && profileRes.data?.userInfo) {
          fullUserInfo = {
            ...fullUserInfo,
            ...profileRes.data.userInfo,
            token,
          };
        }
      } catch (error) {
        warnLog('Login', '获取用户信息失败，使用登录返回的基础信息', error);
      }

      try {
        const realNameRes = await fetchRealNameStatus(token);
        if (isSuccess(realNameRes) && realNameRes.data) {
          realNameStatus = realNameRes.data.real_name_status || 0;
          realName = realNameRes.data.real_name || '';
          debugLog('auth.login.page', '获取实名状态成功', {
            real_name_status: realNameStatus,
            real_name: realName,
          });
        }
      } catch (error) {
        warnLog('Login', '获取实名状态失败', error);
      }

      loginToStore({
        token,
        userInfo: fullUserInfo,
      });

      useAuthStore.getState().updateRealNameStatus(realNameStatus, realName);

      navigate('/');
      submitMachine.send(FormEvent.SUBMIT_SUCCESS);
    } catch (error: unknown) {
      const isCorsError = isCorsErrorLike(error) && error.isCorsError === true;
      const errorMessage = extractErrorFromException(error, '请检查网络连接后重试');
      handleError(error, {
        toastTitle: isCorsError ? '网络错误' : '登录失败',
        customMessage: isCorsError ? errorMessage : '请检查网络连接后重试',
        context: { phone, loginType },
      });
      submitMachine.send(FormEvent.SUBMIT_ERROR);
      submitMachine.send(FormEvent.RESET);
    }
  };

  return {
    phone,
    password,
    verifyCode,
    agreed,
    showPassword,
    loginType,
    countdown,
    rememberMe,
    bottomPadding,
    loading,
    setPhone,
    setPassword,
    setVerifyCode,
    setLoginType,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    toggleRememberMe: () => setRememberMe((prev) => !prev),
    toggleAgreed: () => setAgreed((prev) => !prev),
    handleSendCode,
    handleLogin,
    navigateOnlineService: () => navigate('/online-service'),
    navigateForgotPassword: () => navigate('/forgot-password'),
    navigateUserAgreement: () => navigate('/user-agreement'),
    navigatePrivacyPolicy: () => navigate('/privacy-policy'),
    navigateRegister: () => navigate('/register'),
  };
}
