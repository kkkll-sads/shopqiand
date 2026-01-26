import { apiFetch, ApiResponse } from './networking';
import { API_ENDPOINTS } from './config';
import { bizLog, debugLog, errorLog } from '@/utils/logger';

// 注册接口参数类型
export interface RegisterParams {
    mobile: string;
    password: string;
    pay_password: string;
    invite_code: string;
    captcha: string;
}

export interface LoginParams {
    mobile: string;
    password?: string;
    captcha?: string;
    keep?: boolean | number; // 是否保持登录状态
}

/**
 * 注册接口
 * @param params 注册参数
 * @returns Promise<ApiResponse>
 */
export async function register(params: RegisterParams): Promise<ApiResponse> {
    try {
        const formData = new FormData();
        formData.append('tab', 'register');
        formData.append('mobile', params.mobile);
        formData.append('password', params.password);
        formData.append('pay_password', params.pay_password);
        formData.append('invite_code', params.invite_code);
        formData.append('captcha', params.captcha);

        const data = await apiFetch(API_ENDPOINTS.auth.checkIn, {
            method: 'POST',
            body: formData,
        });
        debugLog('api.auth.register.raw', data);
        bizLog('auth.register', { code: data.code });
        return data;
    } catch (error: any) {
        errorLog('api.auth.register', '注册接口调用失败', error);

        // 提供更详细的错误信息
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            // 这通常是 CORS 或网络问题
            const corsError = new Error('网络请求失败，可能是跨域问题或服务器不可达。请检查：\n1. API 服务器是否正常运行\n2. 是否配置了 CORS 允许跨域\n3. 网络连接是否正常');
            (corsError as any).isCorsError = true;
            throw corsError;
        }

        throw error;
    }
}

/**
 * 登录接口
 * @param params 登录参数
 */
export async function login(params: LoginParams): Promise<ApiResponse> {
    try {
        const formData = new FormData();
        
        if (params.captcha) {
            // 验证码登录：使用 sms_login tab，使用 mobile 字段
            formData.append('tab', 'sms_login');
            formData.append('mobile', params.mobile);
            formData.append('captcha', params.captcha);
        } else if (params.password) {
            // 密码登录：使用 login tab，使用 username 字段
            formData.append('tab', 'login');
            formData.append('username', params.mobile);
            formData.append('password', params.password);
        } else {
            // 既没有验证码也没有密码，抛出错误
            throw new Error('请提供密码或验证码');
        }
        
        // 保持登录状态（如果提供）
        if (params.keep !== undefined) {
            const keepValue = typeof params.keep === 'boolean' ? (params.keep ? 1 : 0) : params.keep;
            formData.append('keep', keepValue.toString());
        }

        const data = await apiFetch(API_ENDPOINTS.auth.checkIn, {
            method: 'POST',
            body: formData,
        });
        debugLog('api.auth.login.raw', data);
        bizLog('auth.login.request', { code: data.code });
        return data;
    } catch (error: any) {
        errorLog('api.auth.login', '登录接口调用失败', error);
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            const corsError = new Error('网络请求失败，可能是跨域问题或服务器不可达。请检查：\n1. API 服务器是否正常运行\n2. 是否配置了 CORS 允许跨域\n3. 网络连接是否正常');
            (corsError as any).isCorsError = true;
            throw corsError;
        }
        throw error;
    }
}

/**
 * 找回密码参数接口
 */
export interface RetrievePasswordParams {
    /** 账户类型：mobile/email，默认 mobile */
    type?: 'mobile' | 'email' | string;
    /** 账户：手机号或邮箱 */
    account: string;
    /** 短信/邮箱验证码 */
    captcha: string;
    /** 新密码（6-32位，不能包含特殊字符） */
    password: string;
}

/**
 * 找回密码接口
 * @param params 找回密码参数
 */
export async function retrievePassword(params: RetrievePasswordParams): Promise<ApiResponse> {
    try {
        // 兼容后端字段：password 为主，newpassword 为兼容字段
        const formData = new FormData();
        formData.append('type', params.type || 'mobile');
        formData.append('account', params.account);
        formData.append('captcha', params.captcha);
        formData.append('password', params.password);
        formData.append('newpassword', params.password);

        const data = await apiFetch(API_ENDPOINTS.account.retrievePassword, {
            method: 'POST',
            body: formData,
        });
        debugLog('api.auth.retrievePassword.raw', data);
        return data;
    } catch (error: any) {
        errorLog('api.auth.retrievePassword', '找回密码失败', error);
        throw error;
    }
}
