// 统一 API 前缀，与 vite.config.ts 中的代理前缀保持一致
export const API_PREFIX = '/api';

// API 基础配置：
// - 开发环境：使用 Vite 代理，走相对路径 /api
// - 生产环境：优先使用环境变量 VITE_API_BASE_URL，其次使用当前域名

// 动态获取当前域名，避免硬编码后端地址被攻击
const getOrigin = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return '';
};
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

    // 使用 window.location.origin 自适应当前域名
    return getOrigin();
};

// API 基础配置
export const API_BASE_URL = resolveApiBaseUrl();
export const API_ASSET_ORIGIN = resolveApiOrigin();

export const normalizeAssetUrl = (raw?: string) => {
    if (!raw) return '';

    // 如果是完整URL，检查是否需要转为相对路径
    if (raw.startsWith('http')) {
        try {
            const url = new URL(raw);
            const currentOrigin = getOrigin();

            // 检查是否是当前域名
            const isCurrentDomain = typeof window !== 'undefined' &&
                url.host === window.location.host;

            // 检查是否与配置的 API Origin 匹配
            const isConfiguredApi = currentOrigin && (() => {
                try {
                    return url.host === new URL(currentOrigin).host;
                } catch {
                    return false;
                }
            })();

            // 兼容处理：后端返回的 URL 可能包含旧的服务器地址（IP 格式）
            // 这些地址需要转换为相对路径，通过 Nginx 代理访问
            const isLegacyBackendUrl = /^\d+\.\d+\.\d+\.\d+/.test(url.hostname);

            if (isCurrentDomain || isConfiguredApi || isLegacyBackendUrl) {
                // 转换为相对路径，通过本地代理访问 (解决 Mixed Content 和跨域问题)
                const relativePath = url.pathname + url.search;
                return relativePath.startsWith('/') ? relativePath : '/' + relativePath;
            }
        } catch {
            // URL解析失败，返回原始值
        }
        return raw;
    }

    if (raw.startsWith('//')) {
        try {
            // 尝试使用当前页面协议
            const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
            return `${protocol}${raw}`;
        } catch {
            return `https:${raw}`;
        }
    }

    // 相对路径，直接返回（会通过代理访问）
    if (raw.startsWith('/')) {
        return raw;
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
        /** 资金明细详情 */
        moneyLogDetail: '/Account/moneyLogDetail',
        /** 消费金日志 */
        integral: '/Account/integral',
        /** 消费金兑换绿色算力 */
        exchangeScoreToGreenPower: '/Account/exchangeScoreToGreenPower',
        /** 检查旧资产解锁状态 */
        checkOldAssetsUnlockStatus: '/Account/checkOldAssetsUnlockStatus',
        /** 解锁旧资产 */
        unlockOldAssets: '/Account/unlockOldAssets',
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
        resetPayPasswordBySms: '/User/resetPayPasswordBySms',
        paymentAccountList: '/User/getPaymentAccountList',
        addPaymentAccount: '/User/addPaymentAccount',
        deletePaymentAccount: '/User/deletePaymentAccount',
        editPaymentAccount: '/User/editPaymentAccount',
        setDefaultPaymentAccount: '/User/setDefaultPaymentAccount',
        agentReviewStatus: '/User/agentReviewStatus',
        submitAgentReview: '/User/submitAgentReview',
        getH5AuthToken: '/User/getH5AuthToken',
        consignmentCoupons: '/user/consignmentCoupons',
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
        /** 获取充值订单详情 */
        detail: '/Recharge/detail',
        // 更新订单备注/用户反馈
        updateOrderRemark: '/Recharge/updateOrderRemark',
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
        /** 商品分享信息 */
        share: '/shopProduct/share',
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
        /** 取消订单 */
        cancel: '/shopOrder/cancel',
        /** 订单统计 */
        statistics: '/shopOrder/statistics',
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
        /** 查询撮合池列表 */
        matchingPool: '/collectionItem/matchingPool',
        /** 取消竞价（从撮合池移除） */
        cancelBid: '/collectionItem/cancelBid',
        /** 竞价购买藏品（进入撮合池） */
        bidBuy: '/collectionItem/bidBuy',
        /** 我的藏品 (新接口) */
        myCollection: '/collectionItem/myCollection',
        /** 获取购买记录列表 */
        purchaseRecords: '/collectionItem/purchaseRecords',
        /** 获取寄售商品列表 */
        consignmentList: '/collectionItem/consignmentList',
        /** 获取寄售交易区列表 */
        tradeList: '/collectionItem/tradeList',
        /** 获取我的寄售列表 */
        myConsignmentList: '/collectionItem/myConsignmentList',
        /** 通过确权编号或MD5指纹查询藏品 */
        queryByCode: '/collectionItem/queryByCode',
        /** 获取寄售详情 */
        consignmentDetail: '/collectionItem/consignmentDetail',
        /** 取消寄售 */
        cancelConsignment: '/collectionItem/cancelConsignment',
        /** 申请提货 */
        deliver: '/collectionItem/deliver',
        /** 申请寄售 */
        consign: '/collectionItem/consign',
        /** 检查寄售解锁状态 */
        consignmentCheck: '/collectionItem/consignmentCheck',
        /** 提货订单列表 */
        deliveryList: '/collectionItem/deliveryList',
        /** 权益分割 */
        rightsDeliver: '/collectionItem/rightsDeliver',
        /** 盲盒预约记录列表 */
        reservations: '/collectionItem/reservations',
        /** 预约记录详情 */
        reservationDetail: '/collectionItem/reservationDetail',
        /** 订单详情 */
        orderDetail: '/collectionItem/orderDetail',
        /** 升级为共识验证节点 */
        toMining: '/collectionItem/toMining',
        /** 获取可批量寄售的藏品列表 */
        batchConsignableList: '/collectionItem/batchConsignableList',
        /** 执行批量寄售 */
        batchConsign: '/collectionItem/batchConsign',
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
    userCollection: {
        /** 用户藏品详情 */
        detail: '/userCollection/detail',
    },
    team: {
        /** 获取推广卡信息 */
        promotionCard: '/Team/promotionCard',
        /** 获取团队成员列表 */
        members: '/Team/members',
    },
    app: {
        /** 检查应用版本更新 */
        checkUpdate: '/AppVersion/checkUpdate',
    },
    financeOrder: {
        /** 余额划转到可用余额 */
        transferIncomeToPurchase: '/financeOrder/transferIncomeToPurchase',
    },
    liveVideo: {
        /** 获取直播广告视频配置 */
        config: '/index.php/api/liveVideo/config',
    },
} as const;

