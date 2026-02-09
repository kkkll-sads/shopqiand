import { apiFetch } from './networking';
import type { ApiResponse } from './networking';
import { API_ENDPOINTS } from './config';
import { NeedLoginError } from './networking';
import { authedFetch } from './client';
import { warnLog } from '@/utils/logger';

// 通用单页内容类型
export interface PageContent {
    title?: string;
    content?: string;
}

export async function fetchAboutUsPage(): Promise<ApiResponse<PageContent>> {
    try {
        return await apiFetch<PageContent>(`${API_ENDPOINTS.common.page}?type=about_us`, {
            method: 'GET',
            token: '', // 公开页面，不传递token
            disableNeedLoginHandler: true, // 禁用全局 NeedLoginError 处理
        });
    } catch (error: any) {
        // 对于公开页面，如果遇到任何错误（包括登录错误），返回友好的错误响应
        warnLog('cms', '公开页面 about_us 遇到错误，返回本地错误响应', error.message);
        return {
            code: 500,
            msg: '页面加载失败，请稍后重试',
            data: null
        } as ApiResponse<PageContent>;
    }
}

export async function fetchPrivacyPolicyPage(): Promise<ApiResponse<PageContent>> {
    try {
        return await apiFetch<PageContent>(`${API_ENDPOINTS.common.page}?type=privacy_policy`, {
            method: 'GET',
            token: '', // 公开页面，不传递token
            disableNeedLoginHandler: true, // 禁用全局 NeedLoginError 处理
        });
    } catch (error: any) {
        // 对于公开页面，如果遇到任何错误（包括登录错误），返回友好的错误响应
        warnLog('cms', '公开页面 privacy_policy 遇到错误，返回本地错误响应', error.message);
        return {
            code: 500,
            msg: '页面加载失败，请稍后重试',
            data: null
        } as ApiResponse<PageContent>;
    }
}

export async function fetchUserAgreementPage(): Promise<ApiResponse<PageContent>> {
    try {
        return await apiFetch<PageContent>(`${API_ENDPOINTS.common.page}?type=user_agreement`, {
            method: 'GET',
            token: '', // 公开页面，不传递token
            disableNeedLoginHandler: true, // 禁用全局 NeedLoginError 处理
        });
    } catch (error: any) {
        // 对于公开页面，如果遇到任何错误（包括登录错误），返回友好的错误响应
        warnLog('cms', '公开页面 user_agreement 遇到错误，返回本地错误响应', error.message);
        return {
            code: 500,
            msg: '页面加载失败，请稍后重试',
            data: null
        } as ApiResponse<PageContent>;
    }
}

// 帮助中心
export interface HelpCategoryItem {
    id: number;
    name: string;
    code: string;
}

export interface HelpCategoryListData {
    list: HelpCategoryItem[];
}

export async function fetchHelpCategories(): Promise<ApiResponse<HelpCategoryListData>> {
    return apiFetch<HelpCategoryListData>(API_ENDPOINTS.help.categories, {
        method: 'GET',
    });
}

export interface HelpQuestionItem {
    id: number;
    title: string;
    content: string;
    category_id: number;
}

export interface HelpQuestionListData {
    list: HelpQuestionItem[];
}

export interface FetchHelpQuestionsParams {
    category_id: number | string;
    category_code?: string;
}

export async function fetchHelpQuestions(params: FetchHelpQuestionsParams): Promise<ApiResponse<HelpQuestionListData>> {
    const search = new URLSearchParams();
    search.set('category_id', String(params.category_id));
    if (params.category_code) search.set('category_code', params.category_code);

    const path = `${API_ENDPOINTS.help.questions}?${search.toString()}`;
    return apiFetch<HelpQuestionListData>(path, {
        method: 'GET',
    });
}

// 公告
export interface AnnouncementItem {
    id: number;
    title: string;
    content: string;
    type: string;
    type_text?: string;
    status: string;
    status_text?: string;
    is_popup?: number;  // 是否弹出：1=弹出，0=不弹出
    popup_delay?: number;  // 弹出延迟（秒）
    sort?: number;
    start_time?: string;
    end_time?: string;
    view_count?: number;
    is_read?: boolean;  // 是否已读（登录用户才有）
    createtime: string;
    updatetime?: string;
    [key: string]: any;
}

export interface AnnouncementListData {
    list: AnnouncementItem[];
    total: number;
    current_page: number;
}

export interface FetchAnnouncementsParams {
    page?: number;
    limit?: number;
    type?: string;
    title?: string;
    is_popup?: number;  // 是否弹窗：1=弹窗公告，0=普通公告
}

export async function fetchAnnouncements(params: FetchAnnouncementsParams = {}): Promise<ApiResponse<AnnouncementListData>> {
    const { page, limit, type = 'normal', title, is_popup } = params;
    const search = new URLSearchParams();
    if (page !== undefined) search.set('page', String(page));
    if (limit !== undefined) search.set('limit', String(limit));
    if (type) search.set('type', type);
    if (title) search.set('title', title);
    if (is_popup !== undefined) search.set('is_popup', String(is_popup));

    const path = `${API_ENDPOINTS.announcement.list}?${search.toString()}`;
    return apiFetch<AnnouncementListData>(path, {
        method: 'GET',
    });
}

// 轮播图
export interface BannerApiItem {
    id: number;
    title: string;
    image: string;
    url?: string;
    [key: string]: any;
}

export interface BannerListData {
    list: BannerApiItem[];
    total: number;
}

export interface FetchBannersParams {
    page?: number;
    limit?: number;
}

export async function fetchBanners(params: FetchBannersParams = {}): Promise<ApiResponse<BannerListData>> {
    const search = new URLSearchParams();
    if (params.page !== undefined) search.set('page', String(params.page));
    if (params.limit !== undefined) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.banner.list}?${search.toString()}`;
    return apiFetch<BannerListData>(path, {
        method: 'GET',
    });
}

/**
 * 标记公告已读
 * API: POST /api/Announcement/markRead
 * 
 * @param id - 公告id
 * @param token - 用户登录Token（可选，使用 authedFetch 自动获取）
 * @returns 操作结果
 */
export async function markAnnouncementRead(id: number | string, token?: string): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('id', String(id));

    return authedFetch(API_ENDPOINTS.announcement.markRead, {
        method: 'POST',
        body: formData,
        token,
    });
}

// ========================================
// 首页配置
// ========================================

/**
 * 快捷入口配置项
 */
export interface QuickAction {
    id: string;
    title: string;
    icon_url?: string;
    icon_name?: string;
    route_path: string;
    bg_color?: string;
    text_color?: string;
    sort_order?: number;
    is_visible: boolean;
    badge_text?: string;
}

/**
 * 交易专区卡片配置
 */
export interface TradingZoneCard {
    title: string;
    subtitle: string;
    bg_image_url?: string;
    route_path: string;
    is_visible: boolean;
}

/**
 * 申购记录区块配置
 */
export interface SubscriptionSection {
    title: string;
    show_count: number;
    is_visible: boolean;
}

/**
 * 首页配置数据
 */
export interface HomeConfigData {
    quick_actions: QuickAction[];
    trading_zone_card: TradingZoneCard;
    subscription_section: SubscriptionSection;
}

/**
 * 获取首页配置
 * API: GET /api/Cms/homeConfig
 * 
 * @returns 首页配置数据（快捷入口、交易专区卡片、申购记录区块）
 */
export async function fetchHomeConfig(): Promise<ApiResponse<HomeConfigData>> {
    return apiFetch<HomeConfigData>(API_ENDPOINTS.cms.homeConfig, {
        method: 'GET',
    });
}
