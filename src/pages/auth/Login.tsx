/**
 * Login - 登录页面（新路由系统版）
 *
 * ✅ 已迁移：使用 React Router + useNavigate
 * ✅ 已迁移：使用 useAuthStore 管理登录状态
 *
 * @author 树交所前端团队
 * @version 3.0.0（新路由版）
 * @refactored 2026-01-14
 */

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Check, HeadphonesIcon } from 'lucide-react';
import { login as loginApi, LoginParams, fetchProfile, fetchRealNameStatus } from '@/services';
import { useNotification } from '@/context/NotificationContext';
import { bizLog, debugLog, errorLog, warnLog } from '@/utils/logger';
import { isSuccess } from '@/utils/apiHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { sendSmsCode } from '@/services/common';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useStateMachine } from '@/hooks/useStateMachine';
import { FormEvent, FormState } from '@/types/states';

// localStorage 存储键名
const STORAGE_KEY_PHONE = 'login_remembered_phone';
const STORAGE_KEY_PASSWORD = 'login_remembered_password';
const STORAGE_KEY_REMEMBER = 'login_remember_me';

/**
 * Login 登录页面组件
 */
const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login: loginToStore } = useAuthStore();
  const { showToast } = useNotification();

  // ✅ 使用统一错误处理Hook（提供日志记录和错误分类）
  const { handleError } = useErrorHandler({ showToast: true, persist: false });

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [loginType, setLoginType] = useState<'password' | 'code'>('password');
  const [countdown, setCountdown] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [bottomPadding, setBottomPadding] = useState(48); // 默认48px (pb-12)
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

  /**
   * 动态计算底部padding，避免被浏览器导航栏遮挡
   */
  useEffect(() => {
    const calculateBottomPadding = () => {
      // 基础padding 48px (pb-12)
      const basePadding = 48;

      // 检测iOS安全区域（底部刘海区域）
      const safeAreaBottomCSS = getComputedStyle(document.documentElement).getPropertyValue(
        'env(safe-area-inset-bottom)'
      );
      let safeAreaBottom = 0;
      if (safeAreaBottomCSS) {
        safeAreaBottom = parseInt(safeAreaBottomCSS.replace('px', ''), 10) || 0;
      }

      // 移动浏览器导航栏高度通常在50-80px之间，我们使用60px作为缓冲
      const navigationBarBuffer = 60;

      // 计算最终padding：基础padding + 安全区域 + 导航栏缓冲
      const calculatedPadding = basePadding + safeAreaBottom + navigationBarBuffer;

      setBottomPadding(calculatedPadding);
    };

    // 初始化计算
    calculateBottomPadding();

    // 监听窗口大小变化（包括浏览器导航栏显示/隐藏）
    const handleResize = () => {
      calculateBottomPadding();
    };

    // 监听滚动（移动浏览器在滚动时可能会显示/隐藏导航栏，改变视口高度）
    let lastHeight = window.innerHeight;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentHeight = window.innerHeight;
          // 如果视口高度发生变化（通常是因为导航栏显示/隐藏），重新计算
          if (Math.abs(currentHeight - lastHeight) > 10) {
            calculateBottomPadding();
            lastHeight = currentHeight;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 监听屏幕旋转
    const handleOrientationChange = () => {
      setTimeout(calculateBottomPadding, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    // 定期检查（处理一些特殊情况）
    const interval = setInterval(calculateBottomPadding, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearInterval(interval);
    };
  }, []);

  /**
   * 组件加载时，从 localStorage 读取已保存的账号密码
   */
  useEffect(() => {
    try {
      const savedRemember = localStorage.getItem(STORAGE_KEY_REMEMBER);
      if (savedRemember === 'true') {
        const savedPhone = localStorage.getItem(STORAGE_KEY_PHONE) || '';
        const savedPassword = localStorage.getItem(STORAGE_KEY_PASSWORD) || '';
        setPhone(savedPhone);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      errorLog('Login', '读取记住密码信息失败', error);
    }
  }, []);

  /**
   * 保存账号密码到 localStorage
   */
  const saveCredentials = () => {
    try {
      localStorage.setItem(STORAGE_KEY_PHONE, phone);
      localStorage.setItem(STORAGE_KEY_PASSWORD, password);
      localStorage.setItem(STORAGE_KEY_REMEMBER, 'true');
    } catch (error) {
      errorLog('Login', '保存记住密码信息失败', error);
    }
  };

  /**
   * 清除 localStorage 中的账号密码
   */
  const clearCredentials = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_PHONE);
      localStorage.removeItem(STORAGE_KEY_PASSWORD);
      localStorage.removeItem(STORAGE_KEY_REMEMBER);
    } catch (error) {
      errorLog('Login', '清除记住密码信息失败', error);
    }
  };

  /**
   * 发送验证码
   */
  const handleSendCode = async () => {
    // 只检查是否为空，具体格式验证由后端处理
    if (!phone || !phone.trim()) {
      showToast('warning', '请输入手机号');
      return;
    }

    try {
      await sendSmsCode({
        mobile: phone.trim(),
        event: 'user_login', // 验证码登录场景使用 user_login
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
    } catch (error: any) {
      const msg = error.msg || error.message || '发送验证码失败';
      showToast('error', '验证码发送失败', msg);
    }
  };

  /**
   * 处理登录
   */
  const handleLogin = async () => {
    // 只检查是否为空，具体格式验证由后端处理
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
        keep: rememberMe ? 1 : 0, // 根据"记住密码"选项设置保持登录状态
      };

      const response = await loginApi(params);
      debugLog('auth.login.page', '登录接口响应', response);
      bizLog('auth.login.page', { success: isSuccess(response) });

      // ✅ 使用统一API响应处理
      if (isSuccess(response)) {
        const token = response.data?.userInfo?.token;
        if (!token) {
          showToast('error', '登录异常', '登录成功，但未获取到 token，无法继续');
          submitMachine.send(FormEvent.SUBMIT_ERROR);
          submitMachine.send(FormEvent.RESET);
          return;
        }

        // 根据"记住密码"选项处理凭证存储
        if (rememberMe) {
          saveCredentials();
        } else {
          clearCredentials();
        }

        showToast('success', '登录成功', response.msg);

        // ✅ 获取完整的用户信息
        let fullUserInfo = response.data?.userInfo || null;
        let realNameStatus = 0;
        let realName = '';

        try {
          const profileRes = await fetchProfile(token);
          if (isSuccess(profileRes) && profileRes.data?.userInfo) {
            // 合并登录返回的 userInfo 和 profile 返回的 userInfo
            fullUserInfo = {
              ...fullUserInfo,
              ...profileRes.data.userInfo,
              token, // 保留 token
            };
          }
        } catch (e) {
          warnLog('Login', '获取用户信息失败，使用登录返回的基础信息', e);
        }

        // ✅ 单独获取实名认证状态
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
        } catch (e) {
          warnLog('Login', '获取实名状态失败', e);
        }

        // ✅ 使用 Zustand store 管理登录状态
        loginToStore({
          token,
          userInfo: fullUserInfo,
        });

        // ✅ 更新实名认证状态
        const { updateRealNameStatus } = useAuthStore.getState();
        updateRealNameStatus(realNameStatus, realName);

        // ✅ 登录成功后跳转到首页
        navigate('/');
        submitMachine.send(FormEvent.SUBMIT_SUCCESS);
      } else {
        // ✅ 使用统一错误处理（自动记录日志、分类错误、显示Toast）
        handleError(response, {
          toastTitle: '登录失败',
          customMessage: '登录失败，请稍后重试',
          context: { phone, loginType },
        });
        submitMachine.send(FormEvent.SUBMIT_ERROR);
        submitMachine.send(FormEvent.RESET);
      }
    } catch (error: any) {
      // ✅ 使用统一错误处理
      handleError(error, {
        toastTitle: error.isCorsError ? '网络错误' : '登录失败',
        customMessage: error.isCorsError ? error.message : '请检查网络连接后重试',
        context: { phone, loginType },
      });
      submitMachine.send(FormEvent.SUBMIT_ERROR);
      submitMachine.send(FormEvent.RESET);
    } finally {
      // 状态机已处理成功/失败
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-safe bg-gradient-to-b from-red-50 via-white to-gray-50 relative">
      {/* 顶部客服入口 */}
      <button
        onClick={() => navigate('/online-service')}
        className="absolute top-4 right-4 p-2 rounded-full bg-white border border-gray-100 text-gray-600 active:scale-95 transition-all shadow-sm z-10"
      >
        <div className="flex items-center gap-1">
          <HeadphonesIcon size={18} />
          <span className="text-sm font-medium">客服</span>
        </div>
      </button>

      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-1">Hello!</h1>
        <h2 className="text-lg font-bold text-gray-600">欢迎登录树交所</h2>
      </div>

      {/* Tab 切换 */}
      <div className="flex items-center space-x-6 mb-6">
        <button
          onClick={() => setLoginType('password')}
          className={`text-base font-medium transition-colors relative pb-2 ${loginType === 'password'
              ? 'text-gray-900 font-bold after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-1 after:bg-red-600 after:rounded-full'
              : 'text-gray-400'
            }`}
        >
          密码登录
        </button>
        <button
          onClick={() => setLoginType('code')}
          className={`text-base font-medium transition-colors relative pb-2 ${loginType === 'code'
              ? 'text-gray-900 font-bold after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-1 after:bg-red-600 after:rounded-full'
              : 'text-gray-400'
            }`}
        >
          验证码登录
        </button>
      </div>

      {/* 表单 */}
      <div className="space-y-4 mb-4">
        {/* 手机号输入 */}
        <div className="bg-white rounded-xl flex items-center px-4 py-3.5 border border-gray-100 shadow-sm focus-within:border-red-200 focus-within:ring-2 focus-within:ring-red-50 transition-all">
          <User className="text-gray-400 mr-3" size={20} />
          <input
            type="tel"
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 text-base outline-none placeholder-gray-400 bg-transparent text-gray-800"
          />
          {phone && (
            <button onClick={() => setPhone('')} className="text-gray-300 ml-2">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
            </button>
          )}
        </div>

        {/* 密码/验证码输入 */}
        {loginType === 'password' ? (
          <div className="bg-white rounded-xl flex items-center px-4 py-3.5 border border-gray-100 shadow-sm focus-within:border-red-200 focus-within:ring-2 focus-within:ring-red-50 transition-all">
            <Lock className="text-gray-400 mr-3" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入您的密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 text-base outline-none placeholder-gray-400 bg-transparent text-gray-800"
            />
            <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 ml-2">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl flex items-center px-4 py-3.5 border border-gray-100 shadow-sm focus-within:border-red-200 focus-within:ring-2 focus-within:ring-red-50 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mr-3">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <input
              type="text"
              placeholder="请输入验证码"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className="flex-1 text-base outline-none placeholder-gray-400 bg-transparent text-gray-800"
            />
            <button
              onClick={handleSendCode}
              disabled={countdown > 0}
              className={`ml-2 text-sm font-medium ${countdown > 0 ? 'text-gray-400' : 'text-red-600'}`}
            >
              {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
            </button>
          </div>
        )}
      </div>

      {/* 选项 */}
      <div className="flex justify-between items-center mb-8 text-sm">
        <label className="flex items-center text-gray-600 gap-2 cursor-pointer select-none">
          <div
            className={`w-4 h-4 border rounded flex items-center justify-center transition-colors cursor-pointer ${rememberMe ? 'bg-red-600 border-red-600' : 'border-gray-300 bg-white'
              }`}
            onClick={() => setRememberMe(!rememberMe)}
          >
            {rememberMe && <Check size={12} className="text-white" />}
          </div>
          <span onClick={() => setRememberMe(!rememberMe)}>记住密码</span>
        </label>
        <button type="button" className="text-gray-500" onClick={() => navigate('/forgot-password')}>
          忘记密码
        </button>
      </div>

      {/* 登录按钮 */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all mb-6 text-base disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? '登录中...' : '登 录'}
      </button>

      {/* 协议 */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-8">
        <div
          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors ${agreed ? 'bg-red-600 border-red-600' : 'border-gray-300 bg-white'}`}
          onClick={() => setAgreed(!agreed)}
        >
          {agreed && <Check size={10} className="text-white" />}
        </div>
        <div className="leading-none flex items-center flex-wrap">
          <span>登录即代表你已同意</span>
          <button type="button" className="text-red-600 mx-0.5" onClick={() => navigate('/user-agreement')}>用户协议</button>
          <span>和</span>
          <button type="button" className="text-red-600 mx-0.5" onClick={() => navigate('/privacy-policy')}>隐私政策</button>
        </div>
      </div>

      {/* 注册链接 */}
      <div
        className="mt-auto text-center flex items-center justify-center gap-1 text-sm"
        style={{ paddingBottom: `${bottomPadding}px` }}
      >
        <span className="text-gray-500">没有账户？</span>
        <button onClick={() => navigate('/register')} className="text-red-600 font-medium">
          点击注册
        </button>
      </div>
    </div>
  );
};

export default Login;
