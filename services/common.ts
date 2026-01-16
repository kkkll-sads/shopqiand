import { ApiResponse } from './networking';
import { API_ENDPOINTS } from './config';
// 统一的带 token 请求封装，减少重复从 localStorage 取 token
import { authedFetch } from './client';
import { debugLog, errorLog } from '../utils/logger';

export interface UploadFileData {
    suffix?: string;
    url?: string;
    full_url?: string;
    path?: string;
    filepath?: string;
    fullurl?: string;
    fullUrl?: string;
    [key: string]: any;
}

export interface UploadResponse {
    id: number;
    url: string;
    name: string;
    size: number;
    mimetype: string;
    width?: number;
    height?: number;
    sha1: string;
    storage: string;
    full_url: string;
    // Legacy fields for compatibility
    path?: string;
    filepath?: string;
    fullurl?: string;
    fullUrl?: string;
}

interface RawUploadResponse {
    file?: UploadFileData;
    url?: string;
    full_url?: string;
    path?: string;
    filepath?: string;
    fullurl?: string;
    fullUrl?: string;
    [key: string]: any;
}

export async function uploadImage(file: File, token?: string): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    // 使用 authedFetch 自动注入 token（传入的 token 优先）
    const res = await authedFetch<RawUploadResponse>(API_ENDPOINTS.upload.image, {
        method: 'POST',
        body: formData,
        token,
    });

    // 后端返回数据可能在 data.file 下，也可能直接在 data 下
    const rawData = res.data || {};
    const fileData = rawData.file || rawData;

    // 如果后端直接返回完整数据，使用它；否则构建完整响应
    if (fileData.id && fileData.url) {
        // 后端已经返回完整格式
        return {
            ...res,
            data: {
                id: fileData.id,
                url: fileData.url,
                name: fileData.name,
                size: fileData.size,
                mimetype: fileData.mimetype,
                width: fileData.width,
                height: fileData.height,
                sha1: fileData.sha1,
                storage: fileData.storage,
                full_url: fileData.url, // 兼容现有代码
                // Legacy fields for compatibility
                path: fileData.path,
                filepath: fileData.filepath,
                fullurl: fileData.fullurl,
                fullUrl: fileData.fullUrl,
            },
        };
    } else {
        // 兼容旧格式
        const url = fileData.url || fileData.path || fileData.filepath || '';
        const full_url = fileData.full_url || fileData.fullurl || fileData.fullUrl || url;

        return {
            ...res,
            data: {
                id: 0,
                url,
                name: file.name,
                size: file.size,
                mimetype: file.type,
                width: undefined,
                height: undefined,
                sha1: '',
                storage: 'local',
                full_url,
                // Legacy fields for compatibility
                path: fileData.path,
                filepath: fileData.filepath,
                fullurl: fileData.fullurl,
                fullUrl: fileData.fullUrl,
            },
        };
    }
}

export interface SendSmsParams {
    mobile: string;
    event: string;
    password?: string;
}

export async function sendSmsCode(params: SendSmsParams, token?: string): Promise<ApiResponse<any>> {
    // Construct body using FormData for compatibility
    const payload = new FormData();
    payload.append('mobile', params.mobile);
    payload.append('event', params.event);

    if (params.password) {
        payload.append('password', params.password);
    }

    const response = await authedFetch(API_ENDPOINTS.sms.send, {
        method: 'POST',
        body: payload,
        token,
    });

    // 检查返回码，code !== 1 表示失败
    if (Number(response.code) !== 1) {
        const error = new Error(response.msg || '发送验证码失败');
        (error as any).msg = response.msg;
        (error as any).code = response.code;
        throw error;
    }

    return response;
}

/**
 * 广告视频配置数据（列表页）
 */
export interface LiveVideoConfigData {
    video_url: string;
    title: string;
    description: string;
}

/**
 * 视频详情数据（详情页）
 */
export interface VideoDetailData {
    video_url: string;
    title: string;
    description: string;
    play_count: number;
    user_played: boolean;
    is_login: boolean;
}

/**
 * 获取视频配置/详情（统一接口）
 * @param token - 可选，传递后会记录播放量并返回用户观看状态
 * 
 * 不传token：返回基本信息（video_url, title, description, play_count）
 * 传token：返回完整信息（包含 user_played, is_login）
 */
export async function fetchLiveVideoConfig(token?: string): Promise<ApiResponse<VideoDetailData>> {
    try {
        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };

        // 如果有 token，添加到请求头
        if (token) {
            headers['batoken'] = token;
        }

        const response = await fetch(API_ENDPOINTS.liveVideo.config, {
            method: 'GET',
            headers,
        });

        const data = await response.json();
        debugLog('api.liveVideo.config', { token: !!token, data });
        return data;
    } catch (error: any) {
        errorLog('api.liveVideo.config', '获取视频配置失败', error);
        throw error;
    }
}
