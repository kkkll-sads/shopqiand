/**
 * Register - 注册页面（新路由系统版）
 *
 * ✅ 已迁移：使用 React Router + useNavigate
 * ✅ 已迁移：使用 useAuthStore 管理登录状态
 *
 * @author 树交所前端团队
 * @version 3.0.0（新路由版）
 * @refactored 2026-01-14
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  XCircle,
  User,
  Lock,
  Smartphone,
  CreditCard,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { register, RegisterParams, fetchAnnouncements, AnnouncementItem } from '@/services';
import { sendSmsCode } from '@/services/common';
import { isValidPhone } from '@/utils/validation';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess, extractError } from '@/utils/apiHelpers';
import PopupAnnouncementModal from '@/components/common/PopupAnnouncementModal';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useStateMachine } from '@/hooks/useStateMachine';
import { FormEvent, FormState } from '@/types/states';
import { debugLog, errorLog } from '@/utils/logger';

/**
 * Register 注册页面组件
 */
const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login: loginToStore } = useAuthStore();
  const { showToast } = useNotification();

  /**
   * 从URL参数中获取邀请码
   */
  const getInviteCodeFromUrl = () => {
    if (typeof window === 'undefined') return '';
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('invite_code') || '';
  };

  const [inviteCode, setInviteCode] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [payPassword, setPayPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);
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

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showPayPassword, setShowPayPassword] = useState(false);

  // 注册须知公告弹窗状态
  const [showRegisterNotice, setShowRegisterNotice] = useState(false);
  const [registerNoticeAnnouncement, setRegisterNoticeAnnouncement] =
    useState<AnnouncementItem | null>(null);

  // 组件加载时从URL参数中读取邀请码
  useEffect(() => {
    const urlInviteCode = getInviteCodeFromUrl();
    debugLog('Register', 'URL invite_code', urlInviteCode);
    debugLog('Register', 'Current URL', typeof window !== 'undefined' ? window.location.href : 'SSR');
    if (urlInviteCode) {
      debugLog('Register', 'Setting invite code from URL', urlInviteCode);
      setInviteCode(urlInviteCode);
    } else {
      debugLog('Register', 'No invite code in URL, using default');
    }
  }, []);

  // 加载注册须知公告
  useEffect(() => {
    const loadRegisterNotice = async () => {
      try {
        const response = await fetchAnnouncements({ page: 1, limit: 10, type: 'normal' });
        if (isSuccess(response) && response.data?.list) {
          // 查找标题包含"注册须知"的公告（即使后端返回的是不弹窗的，也强制弹窗）
          const notice = response.data.list.find(
            (item: AnnouncementItem) => item.title && item.title.includes('注册须知')
          );

          if (notice) {
            // 检查今天是否已经关闭过该公告
            const dismissedKey = `register_notice_dismissed_${notice.id}`;
            const dismissedDate = localStorage.getItem(dismissedKey);
            const today = new Date().toDateString();

            if (dismissedDate !== today) {
              setRegisterNoticeAnnouncement(notice);
              setShowRegisterNotice(true);
            }
          }
        }
      } catch (error) {
        errorLog('Register', '加载注册须知失败', error);
      }
    };

    loadRegisterNotice();
  }, []);

  /**
   * 发送验证码
   */
  const handleSendCode = async () => {
    const phoneValidation = isValidPhone(phone);
    if (!phoneValidation.valid) {
      showToast('warning', '手机号错误', phoneValidation.message);
      return;
    }

    try {
      await sendSmsCode({
        mobile: phone,
        event: 'register',
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
   * 处理注册
   */
  const handleRegister = async () => {
    if (!phone || !password || !payPassword || !verifyCode) {
      showToast('warning', '请填写完整信息');
      return;
    }
    if (!agreed) {
      showToast('warning', '请阅读并同意用户协议');
      return;
    }

    // 验证支付密码格式（6位数字）
    if (!/^\d{6}$/.test(payPassword)) {
      showToast('warning', '支付密码格式错误', '支付密码必须为6位数字');
      return;
    }

    // 使用验证工具函数验证手机号
    const phoneValidation = isValidPhone(phone);
    if (!phoneValidation.valid) {
      showToast('warning', '手机号错误', phoneValidation.message);
      return;
    }

    submitMachine.send(FormEvent.SUBMIT);
    try {
      const params: RegisterParams = {
        mobile: phone,
        password: password,
        pay_password: payPassword,
        invite_code: inviteCode,
        captcha: verifyCode,
      };

      const response = await register(params);
      debugLog('Register', '注册接口响应', response);
      debugLog('Register', 'response.data', response.data);

      // ✅ 使用统一API响应处理
      if (isSuccess(response)) {
        // 提取用户信息和token
        const userInfo = response.data?.userInfo || null;
        const token = userInfo?.token || '';

        debugLog('Register', '提取的userInfo', userInfo);
        debugLog('Register', '提取的token', token);

        if (!token) {
          showToast('warning', '注册成功', '但未获取到登录凭证，请手动登录');
          navigate('/login');
          submitMachine.send(FormEvent.SUBMIT_ERROR);
          submitMachine.send(FormEvent.RESET);
          return;
        }

        showToast('success', '注册成功', '正在自动登录...');

        // ✅ 使用 Zustand store 管理登录状态
        loginToStore({
          token,
          userInfo,
        });

        debugLog('Register', '自动登录成功，跳转到首页');

        // ✅ 注册成功后跳转到首页
        navigate('/');
        submitMachine.send(FormEvent.SUBMIT_SUCCESS);
      } else {
        const errorMsg = extractError(response, '注册失败，请稍后重试');
        showToast('error', '注册失败', errorMsg);
        submitMachine.send(FormEvent.SUBMIT_ERROR);
        submitMachine.send(FormEvent.RESET);
      }
    } catch (error: any) {
      errorLog('Register', '注册失败', error);
      if (error.isCorsError) {
        showToast('error', '网络错误', error.message);
      } else if (error.message) {
        showToast('error', '注册失败', error.message);
      } else {
        showToast('error', '注册失败', '请检查网络连接后重试');
      }
      submitMachine.send(FormEvent.SUBMIT_ERROR);
      submitMachine.send(FormEvent.RESET);
    } finally {
      // 状态机已处理成功/失败
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-5 pt-6 pb-safe bg-gradient-to-b from-red-50 via-white to-gray-50">
      {/* 顶部导航 */}
      <div className="flex items-center mb-6 relative">
        <button onClick={() => navigate(-1)} className="absolute left-0 -ml-2 p-2">
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 w-full text-center">注册</h1>
      </div>

      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 mb-1">Hello!</h2>
        <h3 className="text-base font-bold text-gray-600">欢迎注册树交所</h3>
      </div>

      {/* 表单 */}
      <div className="space-y-3 mb-6">
        {/* 邀请码 */}
        <div className="bg-white rounded-xl flex items-center px-4 py-3 border border-gray-100 shadow-sm focus-within:border-red-200 focus-within:ring-2 focus-within:ring-red-50 transition-all">
          <User className="text-gray-400 mr-3" size={20} />
          <input
            type="text"
            value={inviteCode}
            placeholder="请输入邀请码"
            onChange={(e) => setInviteCode(e.target.value)}
            className="flex-1 text-base outline-none placeholder-gray-400 bg-transparent text-gray-800"
          />
          {inviteCode && (
            <button onClick={() => setInviteCode('')} className="text-gray-300 ml-2">
              <XCircle size={18} fill="#9ca3af" className="text-white" />
            </button>
          )}
        </div>

        {/* 手机号 */}
        <div className="bg-white rounded-xl flex items-center px-4 py-3 border border-gray-100 shadow-sm focus-within:border-red-200 focus-within:ring-2 focus-within:ring-red-50 transition-all">
          <Smartphone className="text-gray-400 mr-3" size={20} />
          <input
            type="tel"
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 text-base outline-none placeholder-gray-400 bg-transparent text-gray-800"
          />
        </div>

        {/* 登录密码 */}
        <div className="bg-white rounded-xl flex items-center px-4 py-3 border border-gray-100 shadow-sm focus-within:border-red-200 focus-within:ring-2 focus-within:ring-red-50 transition-all">
          <Lock className="text-gray-400 mr-3" size={20} />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="设置登录密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 text-base outline-none placeholder-gray-400 bg-transparent text-gray-800"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 text-gray-400">
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* 支付密码 */}
        <div className="bg-white rounded-xl flex items-center px-4 py-3 border border-gray-100 shadow-sm focus-within:border-red-200 focus-within:ring-2 focus-within:ring-red-50 transition-all">
          <CreditCard className="text-gray-400 mr-3" size={20} />
          <input
            type={showPayPassword ? 'text' : 'password'}
            placeholder="设置支付密码 (6位数字)"
            value={payPassword}
            onChange={(e) => setPayPassword(e.target.value)}
            className="flex-1 text-base outline-none placeholder-gray-400 bg-transparent text-gray-800"
          />
          <button type="button" onClick={() => setShowPayPassword(!showPayPassword)} className="ml-2 text-gray-400">
            {showPayPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* 验证码 */}
        <div className="bg-white rounded-xl flex items-center px-4 py-3 border border-gray-100 shadow-sm focus-within:border-red-200 focus-within:ring-2 focus-within:ring-red-50 transition-all">
          <ShieldCheck className="text-gray-400 mr-3" size={20} />
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
            className={`text-sm font-medium whitespace-nowrap pl-3 border-l border-gray-200 ${countdown > 0 ? 'text-gray-400' : 'text-red-600'}`}
          >
            {countdown > 0 ? `${countdown}s 后重试` : '获取验证码'}
          </button>
        </div>
      </div>

      {/* 提交按钮 */}
      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all text-base mb-4 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? '注册中...' : '完成并登录'}
      </button>

      {/* 协议 */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-6">
        <div
          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors ${agreed ? 'bg-red-600 border-red-600' : 'border-gray-300 bg-white'}`}
          onClick={() => setAgreed(!agreed)}
        >
          {agreed && <Check size={10} className="text-white" />}
        </div>
        <div className="leading-relaxed flex items-center flex-wrap">
          <span>阅读并同意</span>
          <button type="button" className="text-red-600 mx-0.5" onClick={() => navigate('/user-agreement')}>《用户协议》</button>
          <span>及</span>
          <button type="button" className="text-red-600 mx-0.5" onClick={() => navigate('/privacy-policy')}>《隐私政策》</button>
        </div>
      </div>

      {/* 登录链接 */}
      <div className="mt-auto text-center pb-4 flex items-center justify-center gap-1 text-sm">
        <span className="text-gray-500">已有账户？</span>
        <button onClick={() => navigate('/login')} className="text-red-600 font-medium">
          立即登录
        </button>
      </div>

      {/* 注册须知公告弹窗 */}
      <PopupAnnouncementModal
        visible={showRegisterNotice}
        announcement={registerNoticeAnnouncement}
        onClose={() => {
          setShowRegisterNotice(false);
        }}
        onDontShowToday={() => {
          if (registerNoticeAnnouncement) {
            const dismissedKey = `register_notice_dismissed_${registerNoticeAnnouncement.id}`;
            const today = new Date().toDateString();
            localStorage.setItem(dismissedKey, today);
          }
        }}
      />
    </div>
  );
};

export default Register;
