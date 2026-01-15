import { ApiResponse } from './networking';
import { API_ENDPOINTS } from './config';
import { authedFetch, getStoredToken } from './client';

/**
 * 视频数据接口
 */
export interface VideoItem {
    id: number;
    title: string;
    cover: string;          // 封面图
    video_url: string;      // 视频URL
    description?: string;   // 描述
    duration?: number;      // 时长（秒）
    view_count?: number;    // 观看次数
    like_count?: number;    // 点赞数
    status: number;         // 状态：0=下架，1=上架
    sort: number;           // 排序
    create_time?: string;   // 创建时间
    update_time?: string;   // 更新时间
}

/**
 * 视频列表响应
 */
export interface VideoListResponse {
    list: VideoItem[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

/**
 * 获取视频列表参数
 */
export interface GetVideoListParams {
    page?: number;
    limit?: number;
    status?: number;        // 状态筛选
    keyword?: string;       // 关键词搜索
    token?: string;
}

/**
 * 添加/编辑视频参数
 */
export interface SaveVideoParams {
    id?: number;            // 编辑时需要
    title: string;
    cover: string;
    video_url: string;
    description?: string;
    duration?: number;
    status?: number;
    sort?: number;
    token?: string;
}

/**
 * 获取视频列表
 */
export async function getVideoList(params: GetVideoListParams = {}): Promise<ApiResponse<VideoListResponse>> {
    const token = params.token ?? getStoredToken();
    const search = new URLSearchParams();
    
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.status !== undefined) search.set('status', String(params.status));
    if (params.keyword) search.set('keyword', params.keyword);

    const path = `${API_ENDPOINTS.contentHotVideo.index}?${search.toString()}`;
    return authedFetch<VideoListResponse>(path, {
        method: 'GET',
        token,
    });
}

/**
 * 获取视频详情
 */
export async function getVideoDetail(id: number, token?: string): Promise<ApiResponse<VideoItem>> {
    const authToken = token ?? getStoredToken();
    const path = `${API_ENDPOINTS.contentHotVideo.detail}?id=${id}`;
    return authedFetch<VideoItem>(path, {
        method: 'GET',
        token: authToken,
    });
}

/**
 * 添加视频
 */
export async function addVideo(params: SaveVideoParams): Promise<ApiResponse> {
    const token = params.token ?? getStoredToken();
    const formData = new FormData();
    
    formData.append('title', params.title);
    formData.append('cover', params.cover);
    formData.append('video_url', params.video_url);
    if (params.description) formData.append('description', params.description);
    if (params.duration) formData.append('duration', String(params.duration));
    if (params.status !== undefined) formData.append('status', String(params.status));
    if (params.sort !== undefined) formData.append('sort', String(params.sort));

    return authedFetch(API_ENDPOINTS.contentHotVideo.add, {
        method: 'POST',
        body: formData,
        token,
    });
}

/**
 * 编辑视频
 */
export async function editVideo(params: SaveVideoParams): Promise<ApiResponse> {
    if (!params.id) {
        throw new Error('编辑视频需要提供ID');
    }
    
    const token = params.token ?? getStoredToken();
    const formData = new FormData();
    
    formData.append('id', String(params.id));
    formData.append('title', params.title);
    formData.append('cover', params.cover);
    formData.append('video_url', params.video_url);
    if (params.description) formData.append('description', params.description);
    if (params.duration) formData.append('duration', String(params.duration));
    if (params.status !== undefined) formData.append('status', String(params.status));
    if (params.sort !== undefined) formData.append('sort', String(params.sort));

    return authedFetch(API_ENDPOINTS.contentHotVideo.edit, {
        method: 'POST',
        body: formData,
        token,
    });
}

/**
 * 删除视频
 */
export async function deleteVideo(id: number, token?: string): Promise<ApiResponse> {
    const authToken = token ?? getStoredToken();
    const formData = new FormData();
    formData.append('id', String(id));

    return authedFetch(API_ENDPOINTS.contentHotVideo.delete, {
        method: 'POST',
        body: formData,
        token: authToken,
    });
}
