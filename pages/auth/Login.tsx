/**
 * Login - 登录页面
 * 
 * 使用 isValidPhone 验证函数重构
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */


import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Check } from 'lucide-react';
import { login as loginApi, LoginParams } from '../../services/api';
import { LoginSuccessPayload } from '../../types';
import { isValidPhone } from '../../utils/validation';
import { useNotification } from '../../context/NotificationContext';
import { bizLog, debugLog, errorLog } from '../../utils/logger';
import { isSuccess, extractError } from '../../utils/apiHelpers';

// localStorage 存储键名
const STORAGE_KEY_PHONE = 'login_remembered_phone';
const STORAGE_KEY_PASSWORD = 'login_remembered_password';
const STORAGE_KEY_REMEMBER = 'login_remember_me';

/**
 * Login 组件属性接口
 */
interface LoginProps {
  onLogin: (payload?: LoginSuccessPayload) => void;
  onNavigateRegister: () => void;
  onNavigateUserAgreement: () => void;
  onNavigatePrivacyPolicy: () => void;
  onNavigateForgotPassword: () => void;
}

/**
 * Login 登录页面组件
 */
const Login: React.FC<LoginProps> = ({
  onLogin,
  onNavigateRegister,
  onNavigateUserAgreement,
  onNavigatePrivacyPolicy,
  onNavigateForgotPassword,
}) => {
  const { showToast } = useNotification();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [loginType, setLoginType] = useState<'password' | 'code'>('password');
  const [countdown, setCountdown] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

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
      console.error('读取记住密码信息失败:', error);
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
      console.error('保存记住密码信息失败:', error);
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
      console.error('清除记住密码信息失败:', error);
    }
  };

  /**
   * 发送验证码
   */
  const handleSendCode = () => {
    if (!phone) {
      showToast('warning', '请输入手机号');
      return;
    }
    const phoneValidation = isValidPhone(phone);
    if (!phoneValidation.valid) {
      showToast('warning', '手机号错误', phoneValidation.message);
      return;
    }

    // 模拟发送验证码
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

    showToast('success', '验证码已发送', '请查收（模拟）');
  };

  /**
   * 处理登录
   */
  const handleLogin = async () => {
    if (!phone) {
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

    // 使用验证工具函数
    const phoneValidation = isValidPhone(phone);
    if (!phoneValidation.valid) {
      showToast('warning', '手机号错误', phoneValidation.message);
      return;
    }

    setLoading(true);
    try {
      const params: LoginParams = {
        mobile: phone,
        password: loginType === 'password' ? password : '', // 暂不支持验证码登录接口，需后端支持
      };

      if (loginType === 'code') {
        // 模拟验证码登录
        showToast('info', '暂未支持', '验证码登录暂未对接后端API');
        setLoading(false);
        return;
      }

      const response = await loginApi(params);
      debugLog('auth.login.page', '登录接口响应', response);
      bizLog('auth.login.page', { code: response.code });

      // ✅ 使用统一API响应处理
      if (isSuccess(response)) {
        const token = response.data?.userInfo?.token;
        if (!token) {
          showToast('error', '登录异常', '登录成功，但未获取到 token，无法继续');
          return;
        }

        // 根据"记住密码"选项处理凭证存储
        if (rememberMe) {
          saveCredentials();
        } else {
          clearCredentials();
        }

        showToast('success', '登录成功', response.msg);
        onLogin({
          token,
          userInfo: response.data?.userInfo || null,
        });
      } else {
        const errorMsg = extractError(response, '登录失败，请稍后重试');
        debugLog('auth.login.page', '登录失败', errorMsg);
        showToast('error', '登录失败', errorMsg);
      }
    } catch (error: any) {
      errorLog('auth.login.page', '登录失败', error);
      if (error.isCorsError) {
        showToast('error', '网络错误', error.message);
      } else if (error.message) {
        showToast('error', '登录失败', error.message);
      } else {
        showToast('error', '登录失败', '请检查网络连接后重试');
      }
    } finally {
      if (loginType !== 'code') {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-8 pt-20 pb-safe bg-gradient-to-br from-[#FFD6A5] via-[#FFC3A0] to-[#FFDEE9]">
      {/* 标题 */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Hello!</h1>
        <h2 className="text-2xl font-bold text-gray-700">欢迎登录树交所</h2>
      </div>

      {/* Tab 切换 */}
      <div className="flex items-center space-x-6 mb-8">
        <button
          onClick={() => setLoginType('password')}
          className={`text-lg font-medium transition-colors relative pb-2 ${loginType === 'password'
            ? 'text-gray-800 font-bold after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-1 after:bg-orange-500 after:rounded-full'
            : 'text-gray-500'
            }`}
        >
          密码登录
        </button>
        <button
          onClick={() => setLoginType('code')}
          className={`text-lg font-medium transition-colors relative pb-2 ${loginType === 'code'
            ? 'text-gray-800 font-bold after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-1 after:bg-orange-500 after:rounded-full'
            : 'text-gray-500'
            }`}
        >
          验证码登录
        </button>
      </div>

      {/* 表单 */}
      <div className="space-y-6 mb-4">
        {/* 手机号输入 */}
        <div className="bg-white rounded-lg flex items-center px-4 py-3 shadow-sm">
          <User className="text-gray-500 mr-3" size={20} />
          <input
            type="tel"
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 text-base outline-none placeholder-gray-400 bg-transparent text-gray-800"
          />
          {phone && (
            <button onClick={() => setPhone('')} className="text-gray-300 ml-2">
              <div className="bg-gray-200 rounded-full p-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>
            </button>
          )}
        </div>

        {/* 密码/验证码输入 */}
        {loginType === 'password' ? (
          <div className="bg-white rounded-lg flex items-center px-4 py-3 shadow-sm">
            <Lock className="text-gray-500 mr-3" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="请输入您的密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 text-base outline-none placeholder-gray-400 bg-transparent text-gray-800"
            />
            <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 ml-2">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg flex items-center px-4 py-3 shadow-sm">
            <div className="text-gray-500 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
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
              className={`ml-2 text-sm font-medium ${countdown > 0 ? 'text-gray-400' : 'text-orange-500'}`}
            >
              {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
            </button>
          </div>
        )}
      </div>

      {/* 选项 */}
      <div className="flex justify-between items-center mb-10 text-sm">
        <label className="flex items-center text-gray-700 gap-2 cursor-pointer select-none">
          <div
            className={`w-4 h-4 border rounded flex items-center justify-center transition-colors cursor-pointer ${rememberMe
                ? 'bg-orange-400 border-orange-400'
                : 'border-orange-400 bg-transparent'
              }`}
            onClick={() => setRememberMe(!rememberMe)}
          >
            {rememberMe && <Check size={12} className="text-white" />}
          </div>
          <span onClick={() => setRememberMe(!rememberMe)}>记住密码</span>
        </label>
        <button type="button" className="text-gray-600" onClick={onNavigateForgotPassword}>
          忘记密码
        </button>
      </div>

      {/* 登录按钮 */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#FF9966] to-[#FF5E62] text-white font-bold py-3.5 rounded-full shadow-lg shadow-orange-200 active:scale-[0.98] transition-all mb-8 text-lg tracking-wide disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? '登录中...' : '登 录'}
      </button>

      {/* 协议 */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mb-12">
        <div
          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors ${agreed ? 'bg-orange-500 border-orange-500' : 'border-gray-400 bg-transparent'}`}
          onClick={() => setAgreed(!agreed)}
        >
          {agreed && <Check size={12} className="text-white" />}
        </div>
        <div className="leading-none flex items-center flex-wrap">
          <span>登录即代表你已同意</span>
          <button type="button" className="text-orange-500 mx-0.5" onClick={onNavigateUserAgreement}>
            用户协议
          </button>
          <span>和</span>
          <button type="button" className="text-orange-500 mx-0.5" onClick={onNavigatePrivacyPolicy}>
            隐私政策
          </button>
        </div>
      </div>

      {/* 注册链接 */}
      <div className="mt-auto text-center pb-8 flex items-center justify-center gap-1 text-sm">
        <span className="text-gray-600">没有账户？</span>
        <button onClick={onNavigateRegister} className="text-blue-600 font-medium hover:text-blue-700">
          点击注册
        </button>
      </div>
    </div>
  );
};

export default Login;