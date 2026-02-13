// 统一维护所有接口路径，更换接口只需改这里
export const API_ENDPOINTS = {
    auth: {
        checkIn: '/User/checkIn',
    },
    account: {
        profile: '/Account/profile',
        retrievePassword: '/Account/retrievePassword',
        cancelAccount: '/Account/cancelAccount',
        /** 余额划转到服务费 */
        transferBalanceToServiceFee: '/Account/transferBalanceToServiceFee',
        /** 服务费充值 */
        rechargeServiceFee: '/Account/rechargeServiceFee',
        /** 全部明细（统一入口；替代废弃的 balance / serviceFeeLog / integral / assetLog） */
        allLog: '/Account/allLog',
        /** 合并流水子明细 */
        allLogMergedItems: '/Account/allLogMergedItems',
        /** 资金明细详情 */
        moneyLogDetail: '/Account/moneyLogDetail',
        /** 消费金兑换绿色算力 */
        exchangeScoreToGreenPower: '/Account/exchangeScoreToGreenPower',
        /** 检查旧资产解锁状态 */
        checkOldAssetsUnlockStatus: '/Account/checkOldAssetsUnlockStatus',
        /** 解锁旧资产 */
        unlockOldAssets: '/Account/unlockOldAssets',
        /** 成长权益信息 */
        growthRightsInfo: '/Account/growthRightsInfo',
        /** 成长权益解锁藏品 */
        unlockGrowthRightsAsset: '/Account/unlockGrowthRightsAsset',
        /** 账户一览（余额、历史收益、藏品统计） */
        accountOverview: '/Account/accountOverview',
        /** 获取算力兑换配置 */
        exchangeConfig: '/Account/exchangeConfig',
    },
    /** 内容资讯（替代废弃的 /api/home/newsList、newsDetail） */
    contentNews: {
        index: '/ContentNews/index',
        detail: '/ContentNews/detail',
    },
    /** 热门视频（替代废弃的 /api/home/videoList） */
    contentHotVideo: {
        index: '/ContentHotVideo/index',
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
        /** 标记公告已读 */
        markRead: '/Announcement/markRead',
    },
    activeRank: {
        /** 团队贡献榜总览（活动信息 + top + 我的团队 + 更新时间） */
        overview: '/ActiveRank/overview',
        /** 团队贡献榜 Top N */
        top: '/ActiveRank/top',
        /** 我的团队排名 */
        my: '/ActiveRank/my',
        /** 团队贡献榜规则（公开） */
        rules: '/ActiveRank/rules',
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
        /** 获取状态字典（增强版） */
        dict: '/Common/dict',
        /** 获取推广奖励配置 */
        rewardConfig: '/Common/rewardConfig',
    },
    /** CMS 配置 */
    cms: {
        /** 获取首页配置 */
        homeConfig: '/Cms/homeConfig',
    },
    /** 商城配置（独立于 shopProduct） */
    shop: {
        /** 获取商城配置 */
        config: '/Shop/config',
    },
    /** 订单配置 */
    order: {
        /** 获取订单分类配置 */
        categories: '/Order/categories',
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
        /** 商品评价列表 */
        reviews: '/shopProduct/reviews',
        /** 商品评价摘要 */
        reviewSummary: '/shopProduct/reviewSummary',
        /** 提交商品评价 */
        submitReview: '/shopProduct/submitReview',
        /** 点赞/取消点赞评价 */
        likeReview: '/shopProduct/likeReview',
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
    },
    collectionTrade: {
        /** 寄售交易区列表 */
        tradeList: '/collectionTrade/tradeList',
        /** 我的藏品列表 */
        myCollection: '/collectionTrade/myCollection',
        /** 购买记录列表 */
        purchaseRecords: '/collectionTrade/purchaseRecords',
        /** 订单详情 */
        orderDetail: '/collectionTrade/orderDetail',
        /** 转入挖矿/矿机 */
        toMining: '/collectionTrade/toMining',
        /** 根据编码查询藏品 */
        queryByCode: '/collectionTrade/queryByCode',
        /** 购买藏品 */
        buy: '/collectionTrade/buy',
        /** 查询撮合池列表 */
        matchingPool: '/collectionTrade/matchingPool',
        /** 取消竞价（从撮合池移除） */
        cancelBid: '/collectionTrade/cancelBid',
        /** 提货订单列表（保留） */
        deliveryList: '/collectionTrade/deliveryList',
        /** 权益分割（保留） */
        rightsDeliver: '/collectionTrade/rightsDeliver',
    },
    collectionConsignment: {
        /** 申请寄售 */
        consign: '/collectionConsignment/consign',
        /** 批量寄售 */
        batchConsign: '/collectionConsignment/batchConsign',
        /** 可批量寄售列表 */
        batchConsignableList: '/collectionConsignment/batchConsignableList',
        /** 寄售检查 */
        consignmentCheck: '/collectionConsignment/consignmentCheck',
        /** 我的寄售列表 */
        myConsignmentList: '/collectionConsignment/myConsignmentList',
        /** 寄售详情 */
        consignmentDetail: '/collectionConsignment/consignmentDetail',
        /** 取消寄售 */
        cancelConsignment: '/collectionConsignment/cancelConsignment',
        /** 寄售商品列表 */
        consignmentList: '/collectionConsignment/consignmentList',
        /** 申请提货 */
        deliver: '/collectionConsignment/deliver',
    },
    collectionReservation: {
        /** 竞价购买藏品 */
        bidBuy: '/collectionReservation/bidBuy',
        /** 预约记录列表 */
        reservations: '/collectionReservation/reservations',
        /** 预约记录详情 */
        reservationDetail: '/collectionReservation/reservationDetail',
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
        /** 获取团队概览 */
        overview: '/Team/overview',
        /** 获取推广卡信息 */
        promotionCard: '/Team/promotionCard',
        /** 获取团队成员列表 */
        members: '/Team/members',
        /** 获取好友/团队成员详情 */
        memberDetail: '/Team/memberDetail',
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
        config: '/liveVideo/config',
    },
} as const;
