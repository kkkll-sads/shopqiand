import React from 'react';
import { Check, Eye, EyeOff, HeadphonesIcon, Lock, User } from 'lucide-react';

interface LoginFormViewProps {
  phone: string;
  password: string;
  verifyCode: string;
  agreed: boolean;
  showPassword: boolean;
  loginType: 'password' | 'code';
  countdown: number;
  rememberMe: boolean;
  bottomPadding: number;
  loading: boolean;
  onPhoneChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onVerifyCodeChange: (value: string) => void;
  onTogglePasswordVisibility: () => void;
  onToggleLoginType: (type: 'password' | 'code') => void;
  onSendCode: () => void;
  onToggleRememberMe: () => void;
  onToggleAgreed: () => void;
  onLogin: () => void;
  onNavigateOnlineService: () => void;
  onNavigateForgotPassword: () => void;
  onNavigateUserAgreement: () => void;
  onNavigatePrivacyPolicy: () => void;
  onNavigateRegister: () => void;
}

const LoginFormView: React.FC<LoginFormViewProps> = ({
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
  onPhoneChange,
  onPasswordChange,
  onVerifyCodeChange,
  onTogglePasswordVisibility,
  onToggleLoginType,
  onSendCode,
  onToggleRememberMe,
  onToggleAgreed,
  onLogin,
  onNavigateOnlineService,
  onNavigateForgotPassword,
  onNavigateUserAgreement,
  onNavigatePrivacyPolicy,
  onNavigateRegister,
}) => (
  <div className="min-h-screen flex flex-col px-6 pt-16 pb-safe bg-gradient-to-b from-red-50 via-white to-gray-50 relative">
    <button
      onClick={onNavigateOnlineService}
      className="absolute top-4 right-4 p-2 rounded-full bg-white border border-gray-100 text-gray-600 active:scale-95 transition-all shadow-sm z-10"
    >
      <div className="flex items-center gap-1">
        <HeadphonesIcon size={18} />
        <span className="text-sm font-medium">客服</span>
      </div>
    </button>

    <div className="mb-8">
      <h1 className="text-3xl font-black text-gray-900 mb-1">Hello!</h1>
      <h2 className="text-lg font-bold text-gray-600">欢迎登录树交所</h2>
    </div>

    <div className="flex items-center space-x-6 mb-6">
      <button
        onClick={() => onToggleLoginType('password')}
        className={`text-base font-medium transition-colors relative pb-2 ${
          loginType === 'password'
            ? 'text-gray-900 font-bold after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-1 after:bg-red-600 after:rounded-full'
            : 'text-gray-400'
        }`}
      >
        密码登录
      </button>
      <button
        onClick={() => onToggleLoginType('code')}
        className={`text-base font-medium transition-colors relative pb-2 ${
          loginType === 'code'
            ? 'text-gray-900 font-bold after:content-[""] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-1 after:bg-red-600 after:rounded-full'
            : 'text-gray-400'
        }`}
      >
        验证码登录
      </button>
    </div>

    <div className="space-y-4 mb-4">
      <div className="bg-white rounded-xl flex items-center px-4 py-3.5 border border-gray-100 shadow-sm focus-within:border-red-200 focus-within:ring-2 focus-within:ring-red-50 transition-all">
        <User className="text-gray-400 mr-3" size={20} />
        <input
          type="tel"
          placeholder="请输入手机号"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          className="flex-1 text-base outline-none placeholder-gray-400 bg-transparent text-gray-800"
        />
        {phone && (
          <button onClick={() => onPhoneChange('')} className="text-gray-300 ml-2">
            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-500"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {loginType === 'password' ? (
        <div className="bg-white rounded-xl flex items-center px-4 py-3.5 border border-gray-100 shadow-sm focus-within:border-red-200 focus-within:ring-2 focus-within:ring-red-50 transition-all">
          <Lock className="text-gray-400 mr-3" size={20} />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="请输入您的密码"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="flex-1 text-base outline-none placeholder-gray-400 bg-transparent text-gray-800"
          />
          <button onClick={onTogglePasswordVisibility} className="text-gray-400 ml-2">
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl flex items-center px-4 py-3.5 border border-gray-100 shadow-sm focus-within:border-red-200 focus-within:ring-2 focus-within:ring-red-50 transition-all">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400 mr-3"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <input
            type="text"
            placeholder="请输入验证码"
            value={verifyCode}
            onChange={(event) => onVerifyCodeChange(event.target.value)}
            className="flex-1 text-base outline-none placeholder-gray-400 bg-transparent text-gray-800"
          />
          <button
            onClick={onSendCode}
            disabled={countdown > 0}
            className={`ml-2 text-sm font-medium ${countdown > 0 ? 'text-gray-400' : 'text-red-600'}`}
          >
            {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
          </button>
        </div>
      )}
    </div>

    <div className="flex justify-between items-center mb-8 text-sm">
      <label className="flex items-center text-gray-600 gap-2 cursor-pointer select-none">
        <div
          className={`w-4 h-4 border rounded flex items-center justify-center transition-colors cursor-pointer ${
            rememberMe ? 'bg-red-600 border-red-600' : 'border-gray-300 bg-white'
          }`}
          onClick={onToggleRememberMe}
        >
          {rememberMe && <Check size={12} className="text-white" />}
        </div>
        <span onClick={onToggleRememberMe}>记住密码</span>
      </label>
      <button type="button" className="text-gray-500" onClick={onNavigateForgotPassword}>
        忘记密码
      </button>
    </div>

    <button
      onClick={onLogin}
      disabled={loading}
      className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all mb-6 text-base disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? '登录中...' : '登 录'}
    </button>

    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-8">
      <div
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors ${
          agreed ? 'bg-red-600 border-red-600' : 'border-gray-300 bg-white'
        }`}
        onClick={onToggleAgreed}
      >
        {agreed && <Check size={10} className="text-white" />}
      </div>
      <div className="leading-none flex items-center flex-wrap">
        <span>登录即代表你已同意</span>
        <button type="button" className="text-red-600 mx-0.5" onClick={onNavigateUserAgreement}>
          用户协议
        </button>
        <span>和</span>
        <button type="button" className="text-red-600 mx-0.5" onClick={onNavigatePrivacyPolicy}>
          隐私政策
        </button>
      </div>
    </div>

    <div
      className="mt-auto text-center flex items-center justify-center gap-1 text-sm"
      style={{ paddingBottom: `${bottomPadding}px` }}
    >
      <span className="text-gray-500">没有账户？</span>
      <button onClick={onNavigateRegister} className="text-red-600 font-medium">
        点击注册
      </button>
    </div>
  </div>
);

export default LoginFormView;
