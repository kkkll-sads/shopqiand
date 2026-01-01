/**
 * PasswordForm - 密码表单组件
 * 
 * 功能说明：
 * - 通用的密码修改/重置表单
 * - 支持重置登录密码、修改支付密码、找回密码等场景
 * - 统一的表单验证和提交逻辑
 * 
 * 可合并的页面：
 * - ResetLoginPassword.tsx
 * - ResetPayPassword.tsx
 * - ForgotPassword.tsx
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '../common';
import {
    updatePassword,
    updatePayPassword,
    retrievePassword,
    resetPayPasswordBySms,
} from '../../services/api';
import { sendSmsCode } from '../../services/common';
import { useNotification } from '../../context/NotificationContext';
import { clearAuthStorage } from '../../utils/storageAccess';
import { readJSON } from '../../utils/storageAccess';
import { isSuccess, extractError } from '../../utils/apiHelpers';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { handleApiError, getApiErrorMessage, isApiSuccess } from '../../utils/apiErrorHandler';

/**
 * 表单类型枚举
 */
type FormType = 'reset_login' | 'reset_pay' | 'reset_pay_sms' | 'forgot';

/**
 * PasswordForm 组件属性接口
 */
interface PasswordFormProps {
    /** 表单类型 */
    type: FormType;
    /** 页面标题 */
    title: string;
    /** 返回回调 */
    onBack: () => void;
    /** 成功回调 */
    onSuccess?: () => void;
    /** 跳转找回密码回调 (可选) */
    onNavigateForgotPassword?: () => void;
}

/**
 * 根据表单类型获取配置
 */
const getFormConfig = (type: FormType) => {
    switch (type) {
        case 'reset_login':
            return {
                oldLabel: '旧登录密码',
                oldPlaceholder: '请输入当前使用的登录密码',
                newLabel: '新登录密码',
                newPlaceholder: '请设置新的登录密码',
                confirmLabel: '确认新密码',
                confirmPlaceholder: '请再次输入新密码',
                submitText: '提交修改',
                minLength: 6,
                showPhone: false,
                showCode: false,
            };
        case 'reset_pay':
            return {
                oldLabel: '旧支付密码',
                oldPlaceholder: '请输入当前支付密码（6位数字）',
                newLabel: '新支付密码',
                newPlaceholder: '请设置新支付密码（6位数字）',
                confirmLabel: '确认新密码',
                confirmPlaceholder: '请再次输入新支付密码',
                submitText: '确认修改',
                minLength: 6,
                showPhone: false,
                showCode: false,
            };
        case 'reset_pay_sms':
            return {
                oldLabel: '',
                oldPlaceholder: '',
                newLabel: '新支付密码',
                newPlaceholder: '请设置新支付密码（6位数字）',
                confirmLabel: '确认新密码',
                confirmPlaceholder: '请再次输入新支付密码',
                submitText: '确认重置',
                minLength: 6,
                showPhone: true,
                showCode: true,
            };
        case 'forgot':
            return {
                oldLabel: '',
                oldPlaceholder: '',
                newLabel: '新登录密码',
                newPlaceholder: '请设置新的登录密码，6-32 位',
                confirmLabel: '',
                confirmPlaceholder: '',
                submitText: '重置密码',
                minLength: 6,
                showPhone: true,
                showCode: true,
            };
        default:
            return {
                oldLabel: '旧密码',
                oldPlaceholder: '请输入旧密码',
                newLabel: '新密码',
                newPlaceholder: '请输入新密码',
                confirmLabel: '确认新密码',
                confirmPlaceholder: '请再次输入新密码',
                submitText: '确认',
                minLength: 6,
                showPhone: false,
                showCode: false,
            };
    }
};

/**
 * PasswordForm 密码表单组件
 * 
 * @example
 * // 重置登录密码
 * <PasswordForm
 *   type="reset_login"
 *   title="重置登录密码"
 *   onBack={() => navigate(-1)}
 * />
 * 
 * @example
 * // 修改支付密码
 * <PasswordForm
 *   type="reset_pay"
 *   title="修改支付密码"
 *   onBack={() => navigate(-1)}
 * />
 */
const PasswordForm: React.FC<PasswordFormProps> = ({
    type,
    title,
    onBack,
    onSuccess,
    onNavigateForgotPassword,
}) => {
    const [currentType, setCurrentType] = useState<FormType>(type);

    // 获取通知上下文
    const { showToast } = useNotification();

    // 获取表单配置
    const config = getFormConfig(currentType);

    // 读取本地用户手机号（用于重置登录/交易密码时自动填充且不可修改）
    const storedUserInfo = readJSON<{ mobile?: string }>(STORAGE_KEYS.USER_INFO_KEY, null);
    const presetAccount = storedUserInfo?.mobile || '';

    // 表单状态
    const [phone, setPhone] = useState(presetAccount);
    const [code, setCode] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    // Password visibility states
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // 判断账号是否禁用（有预设账号或非找回密码模式时禁用）
    const isAccountDisabled = loading || !!presetAccount;

    /**
     * 发送验证码（找回密码场景）
     */
    const handleSendCode = async () => {
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(phone.trim())) {
            showToast('warning', '手机号错误', '请输入正确的手机号');
            return;
        }

        try {
            await sendSmsCode({
                mobile: phone.trim(),
                event: currentType === 'reset_pay_sms' ? 'reset_pay_password' : 'retrieve_password'
            });
            showToast('success', '验证码已发送');
            setCountdown(60);

            // Start countdown timer
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
            const msg = handleApiError(error, '发送验证码失败');
            showToast('error', '发送失败', msg);
        }
    };

    /**
     * 提交表单
     */
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const trimmedNewPassword = newPassword.trim();

        // 验证找回密码场景
        if (currentType === 'forgot') {
            const trimmedAccount = phone.trim();
            const trimmedCode = code.trim();

            if (!trimmedAccount || !trimmedCode || !trimmedNewPassword) {
                setError('请完整填写手机号、验证码和新密码');
                return;
            }

            const phoneRegex = /^1[3-9]\d{9}$/;
            // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            let accountType: 'mobile' | 'email' = 'mobile';

            if (phoneRegex.test(trimmedAccount)) {
                accountType = 'mobile';
            }
            // else if (emailRegex.test(trimmedAccount)) {
            //     accountType = 'email';
            // } 
            else {
                setError('请输入正确的手机号');
                return;
            }

            // 6-32 位，限制特殊字符
            const passwordRegex = /^[A-Za-z0-9]{6,32}$/;
            if (!passwordRegex.test(trimmedNewPassword)) {
                setError('新密码需为6-32位字母或数字，且不含特殊字符');
                return;
            }

            setError('');
            setLoading(true);

            try {
                await retrievePassword({
                    type: accountType,
                    account: trimmedAccount,
                    captcha: trimmedCode,
                    password: trimmedNewPassword
                });
                showToast('success', '重置成功', '请使用新密码重新登录');
                onSuccess?.();
                onBack();
            } catch (error: any) {
                const message = error.msg || error.message || '重置密码失败，请检查验证码是否正确';
                setError(message);
                showToast('error', '重置失败', message);
            } finally {
                setLoading(false);
            }
            return;
        }

        // 验证修改密码场景
        const trimmedOldPassword = oldPassword.trim();
        const trimmedConfirm = confirmPassword.trim();

        if (currentType === 'reset_pay') {
            const sixDigitRegex = /^\d{6}$/;
            if (!sixDigitRegex.test(trimmedOldPassword) || !sixDigitRegex.test(trimmedNewPassword) || !sixDigitRegex.test(trimmedConfirm)) {
                setError('支付密码需为6位数字');
                return;
            }
        } else if (currentType === 'reset_pay_sms') {
            const phoneRegex = /^1[3-9]\d{9}$/;
            if (!phoneRegex.test(phone.trim())) {
                setError('请输入正确的手机号');
                return;
            }
            if (!code.trim()) {
                setError('请输入短信验证码');
                return;
            }
            const sixDigitRegex = /^\d{6}$/;
            if (!sixDigitRegex.test(trimmedNewPassword) || !sixDigitRegex.test(trimmedConfirm)) {
                setError('支付密码需为6位数字');
                return;
            }
        } else {
            if (!trimmedOldPassword || !trimmedNewPassword || !trimmedConfirm) {
                setError('请完整填写所有字段');
                return;
            }

            if (trimmedNewPassword.length < config.minLength) {
                setError(`新密码长度至少需要 ${config.minLength} 位`);
                return;
            }

            if (trimmedNewPassword !== trimmedConfirm) {
                setError('两次输入的新密码不一致');
                return;
            }
        }

        if (trimmedNewPassword !== trimmedConfirm) {
            setError('两次输入的新密码不一致');
            return;
        }

        setError('');
        setLoading(true);

        try {
            if (currentType === 'reset_login') {
                // 重置登录密码
                const response = await updatePassword({
                    old_password: trimmedOldPassword,
                    new_password: trimmedNewPassword,
                });

                // 检查返回码
                if (isSuccess(response)) {
                    // 清理本地登录态，强制重新登录
                    clearAuthStorage();

                    showToast('success', '重置成功', '登录密码重置成功，请使用新密码重新登录');
                    onSuccess?.();
                    onBack();
                } else {
                    const errorMsg = extractError(response, '修改密码失败');
                    setError(errorMsg);
                    showToast('error', '修改失败', errorMsg);
                }
            } else if (currentType === 'reset_pay') {
                // 修改支付密码
                const response = await updatePayPassword({
                    old_pay_password: trimmedOldPassword,
                    new_pay_password: trimmedNewPassword,
                });

                // 检查返回码
                if (isSuccess(response)) {
                    showToast('success', '修改成功', '支付密码修改成功');
                    onSuccess?.();
                    onBack();
                } else {
                    const errorMsg = extractError(response, '修改支付密码失败');
                    setError(errorMsg);
                    showToast('error', '修改失败', errorMsg);
                }
            } else if (currentType === 'reset_pay_sms') {
                const response = await resetPayPasswordBySms({
                    mobile: phone.trim(),
                    captcha: code.trim(),
                    new_pay_password: trimmedNewPassword,
                });

                if (isSuccess(response)) {
                    showToast('success', '重置成功', '支付密码重置成功');
                    onSuccess?.();
                    onBack();
                } else {
                    const errorMsg = extractError(response, '重置支付密码失败');
                    setError(errorMsg);
                    showToast('error', '重置失败', errorMsg);
                }
            }
        } catch (err: any) {
            const message =
                err?.msg || err?.message || err?.data?.msg || '操作失败，请稍后重试';
            setError(message);
            showToast('error', '操作失败', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-safe">
            {/* 顶部导航栏 */}
            <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-gray-100">
                <div className="relative flex items-center justify-center w-full">
                    <button
                        className="absolute left-0 p-2 -ml-2 rounded-full active:bg-gray-100 transition-colors"
                        onClick={onBack}
                        aria-label="返回"
                    >
                        <ChevronLeft size={22} className="text-gray-900" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">{title}</h1>

                    {/* 忘记密码按钮 (仅在重置登录密码或支付密码时显示) */}
                    {(currentType === 'reset_login' || currentType === 'reset_pay') && onNavigateForgotPassword && (
                        <button
                            type="button"
                            className="absolute right-0 text-sm text-orange-600 font-medium active:opacity-70"
                            onClick={() => {
                                if (currentType === 'reset_pay') {
                                    setCurrentType('reset_pay_sms');
                                    setError('');
                                    setCode('');
                                    setPhone('');
                                    setOldPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                } else {
                                    onNavigateForgotPassword();
                                }
                            }}
                        >
                            {currentType === 'reset_pay' ? '短信重置' : '忘记密码？'}
                        </button>
                    )}
                </div>
            </header>

            {/* 表单内容 */}
            <main className="pt-2">
                {currentType === 'reset_pay' && (
                    <div className="mx-4 mb-4 rounded-xl bg-orange-50 p-4">
                        <div className="flex gap-3">
                            <div className="text-orange-500 mt-0.5">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M11.9945 16H12.0035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <p className="text-sm text-orange-700 leading-relaxed">
                                支持通过短信验证码重置交易密码；若忘记旧支付密码，请点击右上角“短信重置”。
                            </p>
                        </div>
                    </div>
                )}

                <form className="bg-white px-4" onSubmit={handleSubmit}>
                    {/* 账号输入（找回密码场景：手机号） */}
                    {config.showPhone && (
                        <div className="py-4 border-b border-gray-100">
                            <div className="text-sm text-gray-500 mb-1">账号（手机号）</div>
                            <input
                                type="tel"
                                className={`w-full text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300 font-medium ${isAccountDisabled ? 'text-gray-500' : ''}`}
                                placeholder="请输入注册时使用的手机号"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={isAccountDisabled}
                                readOnly={isAccountDisabled}
                            />
                        </div>
                    )}

                    {/* 验证码输入（找回密码场景） */}
                    {config.showCode && (
                        <div className="py-4 border-b border-gray-100">
                            <div className="text-sm text-gray-500 mb-1">验证码</div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    className="flex-1 text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300 font-medium"
                                    placeholder="请输入短信验证码"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className={`text-sm font-medium transition-opacity whitespace-nowrap ${countdown > 0 || loading
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-orange-600 active:opacity-70'
                                        }`}
                                    onClick={handleSendCode}
                                    disabled={loading || countdown > 0}
                                >
                                    {countdown > 0 ? `${countdown}s后重试` : '获取验证码'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 旧密码输入 */}
                    {config.oldLabel && (
                        <div className="py-4 border-b border-gray-100">
                            <div className="text-sm text-gray-500 mb-1">{config.oldLabel}</div>
                            <div className="flex items-center">
                                <input
                                    type={showOldPassword ? "text" : "password"}
                                    className="flex-1 text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300 font-medium"
                                    placeholder={config.oldPlaceholder}
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="p-2 text-gray-400 focus:outline-none"
                                >
                                    {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 新密码输入 */}
                    <div className="py-4 border-b border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">{config.newLabel}</div>
                        <div className="flex items-center">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                className="flex-1 text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300 font-medium"
                                placeholder={config.newPlaceholder}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="p-2 text-gray-400 focus:outline-none"
                            >
                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* 确认新密码输入 */}
                    {config.confirmLabel && (
                        <div className="py-4 border-b border-gray-100">
                            <div className="text-sm text-gray-500 mb-1">{config.confirmLabel}</div>
                            <div className="flex items-center">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="flex-1 text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300 font-medium"
                                    placeholder={config.confirmPlaceholder}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="p-2 text-gray-400 focus:outline-none"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                <div className="px-4 mt-6">
                    {/* 错误提示 */}
                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 p-3 flex items-start gap-2">
                            <div className="text-red-500 mt-0.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <p className="text-sm text-red-600 font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* 提交按钮 */}
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/20 active:scale-[0.98] active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <LoadingSpinner size="sm" color="white" />
                                <span>处理中...</span>
                            </span>
                        ) : config.submitText}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PasswordForm;
