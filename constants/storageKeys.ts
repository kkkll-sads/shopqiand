/**
 * storageKeys.ts - 统一的 localStorage 键名管理
 * 
 * 所有 localStorage 的 key 都从这里导出，避免字符串散落在各处导致不一致。
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

export const STORAGE_KEYS = {
    /** 登录状态标记 */
    AUTH_KEY: 'cat_is_logged_in',

    /** 用户认证令牌 */
    AUTH_TOKEN_KEY: 'cat_auth_token',

    /** 用户信息 (JSON) */
    USER_INFO_KEY: 'cat_user_info',

    /** 实名认证状态 */
    REAL_NAME_STATUS_KEY: 'cat_real_name_status',

    /** 真实姓名 */
    REAL_NAME_KEY: 'cat_real_name',

    /** 已读消息 ID 列表 */
    READ_MESSAGE_IDS_KEY: 'cat_read_message_ids',

    /** 新闻页当前 Tab */
    NEWS_ACTIVE_TAB_KEY: 'cat_news_active_tab',

    /** 已读新闻 ID 列表 (App.tsx 使用) */
    READ_NEWS_IDS_KEY: 'cat_read_news_ids',

    /** 登录页记住密码 - 手机号 */
    LOGIN_REMEMBERED_PHONE: 'login_remembered_phone',

    /** 登录页记住密码 - 密码 */
    LOGIN_REMEMBERED_PASSWORD: 'login_remembered_password',

    /** 登录页记住密码 - 开关状态 */
    LOGIN_REMEMBER_ME: 'login_remember_me',

    /** 上次签到日期 (YYYY-MM-DD) */
    LAST_SIGN_IN_DATE_KEY: 'cat_last_sign_in_date',
} as const;

// 注意：AUTH_TOKEN_KEY 和 USER_INFO_KEY 已废弃
// 认证状态请使用 src/stores/authStore.ts (Zustand)
