import { API_BASE_URL } from './config';
import { NeedLoginError } from '../utils/errors';
import { useAuthStore } from '../src/stores/authStore';
import { notifyNeedLogin } from './needLoginHandler';

export interface ApiFetchConfig {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: BodyInit | null;
    /** 是否自动附带 ba-user-token */
    token?: string;
    /** 是否禁用全局 NeedLoginError 处理（用于公开页面） */
    disableNeedLoginHandler?: boolean;
}

// API 响应类型
export interface ApiResponse<T = any> {
    code?: number;
    msg?: string;
    data?: T;
    [key: string]: any;
}

const parseResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        const text = await response.text();
        console.warn('API 返回非 JSON 响应:', text);
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error(`服务器返回了非 JSON 格式的响应: ${text.substring(0, 100)}`);
        }
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${data?.msg || data?.message || JSON.stringify(data)}`);
    }

    return data;
};

/**
 * 通用请求封装
 * @param path 不包含基础前缀的路径，如：/User/checkIn
 */
export async function apiFetch<T = any>(
    path: string,
    { method = 'GET', headers = {}, body = null, token, disableNeedLoginHandler = false }: ApiFetchConfig = {},
): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${path}`;

    const finalHeaders: Record<string, string> = {
        Accept: 'application/json',
        ...headers,
    };

    // 需要带用户 token 的接口统一从这里注入
    if (token) {
        finalHeaders['ba-user-token'] = token;
        // ba-token 和 ba-user-token 使用相同的值
        if (!finalHeaders['ba-token']) {
            finalHeaders['ba-token'] = token;
        }
        // batoken 也需要设置（部分接口需要）
        if (!finalHeaders['batoken']) {
            finalHeaders['batoken'] = token;
        }
    }

    // 对非 FormData 自动补充 JSON Content-Type
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    if (!isFormData && body && !finalHeaders['Content-Type']) {
        finalHeaders['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(url, {
            method,
            headers: {
                ...finalHeaders,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
            body,
            mode: 'cors',
            credentials: 'omit',
        });

        const data = await parseResponse(response);

        // 处理 code 303：需要登录，抛出统一错误由上层决定跳转
        if (data.code === 303) {
            const needLoginError = new NeedLoginError(data.msg || '请先登录');

            // 如果启用了禁用全局处理器选项，抛出一个普通错误而不是 NeedLoginError
            if (disableNeedLoginHandler) {
                console.warn('公开页面遇到登录错误，抛出普通错误让上层处理');
                throw new Error('公开页面访问失败：' + (data.msg || '请稍后重试'));
            }

            console.warn('用户登录已失效（code 303），抛出 NeedLoginError 交由上层统一处理');
            throw needLoginError;
        }

        return data;
    } catch (error: any) {
        if (error?.name === 'NeedLoginError') {
            const handled = notifyNeedLogin(error.message);
            if (!handled) {
                useAuthStore.getState().logout();
            }
            throw error;
        }

        console.error(`API 调用失败 [${method}] ${url}:`, error);

        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            const corsError = new Error(
                '网络请求失败，可能是跨域问题或服务器不可达。请检查：\n1. API 服务器是否正常运行\n2. 是否配置了 CORS 允许跨域\n3. 网络连接是否正常',
            );
            (corsError as any).isCorsError = true;
            throw corsError;
        }

        throw error;
    }
}
