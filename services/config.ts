// 统一 API 前缀，与 vite.config.ts 中的代理前缀保持一致
export const API_PREFIX = '/api';

// API 基础配置：
// - 开发环境：使用 Vite 代理，走相对路径 /api
// - 生产环境：优先使用环境变量 VITE_API_BASE_URL，其次降级到写死的线上地址

const DEFAULT_API_ORIGIN = 'https://18.166.211.131';
const rawEnv = (import.meta as any).env ?? {};

const resolveApiBaseUrl = () => {
    const envBase = rawEnv?.VITE_API_BASE_URL;
    if (envBase) return envBase;
    // 开发和生产环境都使用相对路径，通过 Nginx 代理解决跨域
    return API_PREFIX;
};

const resolveApiOrigin = () => {
    const candidates = [rawEnv?.VITE_API_BASE_URL, rawEnv?.VITE_API_TARGET];

    for (const candidate of candidates) {
        if (candidate && candidate.startsWith('http')) {
            try {
                return new URL(candidate).origin;
            } catch (error) {
                console.warn('[api] 无法解析 API origin:', candidate, error);
            }
        }
    }

    if (!rawEnv?.DEV) {
        const baseUrl = resolveApiBaseUrl();
        if (baseUrl.startsWith('http')) {
            try {
                return new URL(baseUrl).origin;
            } catch { }
        }
    }

    return DEFAULT_API_ORIGIN;
};

// API 基础配置
export const API_BASE_URL = resolveApiBaseUrl();
export const API_ASSET_ORIGIN = resolveApiOrigin();

export const normalizeAssetUrl = (raw?: string) => {
    if (!raw) return '';
    if (raw.startsWith('http')) return raw;

    if (raw.startsWith('//')) {
        try {
            const originUrl = new URL(API_ASSET_ORIGIN);
            return `${originUrl.protocol}${raw}`;
        } catch {
            const protocol =
                typeof window !== 'undefined' ? window.location.protocol : 'https:';
            return `${protocol}${raw}`;
        }
    }

    if (raw.startsWith('/')) {
        return `${API_ASSET_ORIGIN.replace(/\/$/, '')}${raw}`;
    }

    return raw;
};

// 统一维护所有接口路径，更换接口只需改这里
export const API_ENDPOINTS = {
    auth: {
        checkIn: '/User/checkIn',
    },
    account: {
        profile: '/Account/profile',
        retrievePassword: '/Account/retrievePassword',
        cancelAccount: '/Account/cancelAccount',
        /** 余额日志（资金明细） */
        balance: '/Account/balance',
        /** 余额划转到服务费 */
        transferBalanceToServiceFee: '/Account/transferBalanceToServiceFee',
        /** 服务费明细 */
        serviceFeeLog: '/Account/serviceFeeLog',
        /** 服务费充值 */
        rechargeServiceFee: '/Account/rechargeServiceFee',
        /** 全部明细 */
        allLog: '/Account/allLog',
        /** 消费金日志 */
        integral: '/Account/integral',
        /** 消费金兑换绿色算力 */
        exchangeScoreToGreenPower: '/Account/exchangeScoreToGreenPower',
    },
    address: {
        /** 收货地址列表 */
        list: '/shopAddress/index',
        /** 新增收货地址 */
        add: '/shopAddress/add',
        /** 编辑收货地址 */
        edit: '/shopAddress/edit',
        /** 删除收货地址 */
        delete: '/shopAddress/delete',
        /** 获取默认收货地址 */
        getDefault: '/shopAddress/getDefault',
    },
    user: {
        realNameStatus: '/User/realNameStatus',
        submitRealName: '/User/submitRealName',
        updateAvatar: '/User/updateAvatar',
        updateNickname: '/User/updateNickname',
        updatePassword: '/User/updatePassword',
        updatePayPassword: '/User/updatePayPassword',
        paymentAccountList: '/User/getPaymentAccountList',
        addPaymentAccount: '/User/addPaymentAccount',
        deletePaymentAccount: '/User/deletePaymentAccount',
        editPaymentAccount: '/User/editPaymentAccount',
        setDefaultPaymentAccount: '/User/setDefaultPaymentAccount',
        agentReviewStatus: '/User/agentReviewStatus',
        submitAgentReview: '/User/submitAgentReview',
        getH5AuthToken: '/User/getH5AuthToken',
    },
    yidun: {
        livePersonCheck: '/YidunOcr/livePersonCheck',
        h5Recheck: '/YidunOcr/h5Recheck', // H5人脸核身校验接口
    },
    upload: {
        image: '/ajax/upload',
    },
    sms: {
        send: '/Sms/send',
    },
    announcement: {
        /** 平台公告列表 */
        list: '/Announcement/index',
    },
    banner: {
        /** 轮播图列表 */
        list: '/Banner/getBannerList',
    },
    recharge: {
        /** 充值公司账户列表 */
        companyAccountList: '/Recharge/getCompanyAccountList',
        /** 提交充值订单 */
        submitOrder: '/Recharge/submitOrder',
        /** 提交提现申请 */
        submitWithdraw: '/Recharge/submitWithdraw',
        /** 提交拓展提现申请 */
        submitStaticIncomeWithdraw: '/Recharge/submitStaticIncomeWithdraw',
        /** 获取我的充值订单列表 */
        getMyOrderList: '/Recharge/getMyOrderList',
        /** 获取我的提现记录列表 */
        getMyWithdrawList: '/Recharge/getMyWithdrawList',
    },
    common: {
        page: '/Common/page',
    },
    help: {
        /** 帮助中心 - 分类列表 */
        categories: '/Help/categories',
        /** 帮助中心 - 问题列表 */
        questions: '/Help/questions',
    },
    shopProduct: {
        /** 商品列表 */
        list: '/shopProduct/index',
        /** 商品详情 */
        detail: '/shopProduct/detail',
        /** 商品分类列表 */
        categories: '/shopProduct/categories',
        /** 热销商品列表（按销量排序） */
        sales: '/shopProduct/sales',
        /** 最新商品列表 */
        latest: '/shopProduct/latest',
    },
    shopOrder: {
        /** 创建订单 */
        create: '/shopOrder/create',
        /** 购买商品（一步到位：创建订单并支付） */
        buy: '/shopOrder/buy',
        /** 待付款订单列表 */
        pendingPay: '/shopOrder/pendingPay',
        /** 待发货订单列表 */
        pendingShip: '/shopOrder/pendingShip',
        /** 待确认收货订单列表 */
        pendingConfirm: '/shopOrder/pendingConfirm',
        /** 已完成订单列表 */
        completed: '/shopOrder/completed',
        /** 确认收货 */
        confirm: '/shopOrder/confirm',
        /** 支付订单 */
        pay: '/shopOrder/pay',
        /** 订单详情 */
        detail: '/shopOrder/detail',
        /** 删除订单 */
        delete: '/shopOrder/delete',
    },
    collectionSession: {
        /** 交易专场列表 */
        index: '/collectionSession/index',
        /** 交易专场详情 */
        detail: '/collectionSession/detail',
    },
    collectionItem: {
        /** 交易商品列表 */
        index: '/collectionItem/index',
        /** 根据专场ID获取商品列表 */
        bySession: '/collectionItem/bySession',
        /** 交易商品详情 */
        detail: '/collectionItem/detail',
        /** 交易商品原始详情（下架也可查看） */
        originalDetail: '/collectionItem/originalDetail',
        /** 购买藏品 */
        buy: '/collectionItem/buy',
        /** 获取购买记录列表 */
        purchaseRecords: '/collectionItem/purchaseRecords',
        /** 获取寄售商品列表 */
        consignmentList: '/collectionItem/consignmentList',
        /** 获取我的寄售列表 */
        myConsignmentList: '/collectionItem/myConsignmentList',
        /** 获取寄售详情 */
        consignmentDetail: '/collectionItem/consignmentDetail',
        /** 取消寄售 */
        cancelConsignment: '/collectionItem/cancelConsignment',
        /** 申请提货 */
        deliver: '/collectionItem/deliver',
        /** 申请寄售 */
        consign: '/collectionItem/consign',
        /** 提货订单列表 */
        deliveryList: '/collectionItem/deliveryList',
    },
    artist: {
        /** 艺术家列表 */
        index: '/artist/index',
        /** 艺术家详情 */
        detail: '/artist/detail',
        /** 艺术家作品详情 */
        workDetail: '/artist/workDetail',
        /** 全部艺术家作品列表 */
        allWorks: '/artist/allWorks',
    },
    signIn: {
        /** 获取签到活动规则 */
        rules: '/SignIn/rules',
        /** 获取签到信息 */
        info: '/SignIn/info',
        /** 执行签到 */
        do: '/SignIn/do',
        /** 获取签到记录 */
        records: '/SignIn/records',
        /** 获取提现进度 */
        progress: '/SignIn/progress',
    },
    team: {
        /** 获取推广卡信息 */
        promotionCard: '/Team/promotionCard',
        /** 获取团队成员列表 */
        members: '/Team/members',
    },
} as const;

// 本地存储 key - 从统一位置导入并重新导出
export { AUTH_TOKEN_KEY, USER_INFO_KEY } from '../constants/storageKeys';
