// 缁熶竴缁存姢鎵€鏈夋帴鍙ｈ矾寰勶紝鏇存崲鎺ュ彛鍙渶鏀硅繖閲?
export const API_ENDPOINTS = {
    auth: {
        checkIn: '/User/checkIn',
    },
    account: {
        profile: '/Account/profile',
        retrievePassword: '/Account/retrievePassword',
        cancelAccount: '/Account/cancelAccount',
        /** 浣欓鍒掕浆鍒版湇鍔¤垂 */
        transferBalanceToServiceFee: '/Account/transferBalanceToServiceFee',
        /** 鏈嶅姟璐瑰厖鍊?*/
        rechargeServiceFee: '/Account/rechargeServiceFee',
        /** 鍏ㄩ儴鏄庣粏锛堢粺涓€鍏ュ彛锛涙浛浠ｅ簾寮冪殑 balance / serviceFeeLog / integral / assetLog锛?*/
        allLog: '/Account/allLog',
        /** 鍚堝苟娴佹按瀛愭槑缁?*/
        allLogMergedItems: '/Account/allLogMergedItems',
        /** 璧勯噾鏄庣粏璇︽儏 */
        moneyLogDetail: '/Account/moneyLogDetail',
        /** 娑堣垂閲戝厬鎹㈢豢鑹茬畻鍔?*/
        exchangeScoreToGreenPower: '/Account/exchangeScoreToGreenPower',
        /** 妫€鏌ユ棫璧勪骇瑙ｉ攣鐘舵€?*/
        checkOldAssetsUnlockStatus: '/Account/checkOldAssetsUnlockStatus',
        /** 瑙ｉ攣鏃ц祫浜?*/
        unlockOldAssets: '/Account/unlockOldAssets',
        /** 鎴愰暱鏉冪泭淇℃伅 */
        growthRightsInfo: '/Account/growthRightsInfo',
        /** 鎴愰暱鏉冪泭瑙ｉ攣钘忓搧 */
        unlockGrowthRightsAsset: '/Account/unlockGrowthRightsAsset',
        /** 璐︽埛涓€瑙堬紙浣欓銆佸巻鍙叉敹鐩娿€佽棌鍝佺粺璁★級 */
        accountOverview: '/Account/accountOverview',
        /** 鑾峰彇绠楀姏鍏戞崲閰嶇疆 */
        exchangeConfig: '/Account/exchangeConfig',
    },
    /** 鍐呭璧勮锛堟浛浠ｅ簾寮冪殑 /api/home/newsList銆乶ewsDetail锛?*/
    contentNews: {
        index: '/ContentNews/index',
        detail: '/ContentNews/detail',
    },
    /** 鐑棬瑙嗛锛堟浛浠ｅ簾寮冪殑 /api/home/videoList锛?*/
    contentHotVideo: {
        index: '/ContentHotVideo/index',
    },
    address: {
        /** 鏀惰揣鍦板潃鍒楄〃 */
        list: '/shopAddress/index',
        /** 鏂板鏀惰揣鍦板潃 */
        add: '/shopAddress/add',
        /** 缂栬緫鏀惰揣鍦板潃 */
        edit: '/shopAddress/edit',
        /** 鍒犻櫎鏀惰揣鍦板潃 */
        delete: '/shopAddress/delete',
        /** 鑾峰彇榛樿鏀惰揣鍦板潃 */
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
        h5Recheck: '/YidunOcr/h5Recheck', // H5浜鸿劯鏍歌韩鏍￠獙鎺ュ彛
    },
    upload: {
        image: '/ajax/upload',
    },
    sms: {
        send: '/Sms/send',
    },
    announcement: {
        /** 骞冲彴鍏憡鍒楄〃 */
        list: '/Announcement/index',
        /** 鏍囪鍏憡宸茶 */
        markRead: '/Announcement/markRead',
    },
    activeRank: {
        /** 鍥㈤槦璐＄尞姒滄€昏锛堟椿鍔ㄤ俊鎭?+ top + 鎴戠殑鍥㈤槦 + 鏇存柊鏃堕棿锛?*/
        overview: '/ActiveRank/overview',
        /** 鍥㈤槦璐＄尞姒?Top N */
        top: '/ActiveRank/top',
        /** 鎴戠殑鍥㈤槦鎺掑悕 */
        my: '/ActiveRank/my',
        /** 鍥㈤槦璐＄尞姒滆鍒欙紙鍏紑锛?*/
        rules: '/ActiveRank/rules',
    },
    banner: {
        /** 杞挱鍥惧垪琛?*/
        list: '/Banner/getBannerList',
    },
    recharge: {
        /** 鍏呭€煎叕鍙歌处鎴峰垪琛?*/
        companyAccountList: '/Recharge/getCompanyAccountList',
        /** 鎻愪氦鍏呭€艰鍗?*/
        submitOrder: '/Recharge/submitOrder',
        /** 鎻愪氦鎻愮幇鐢宠 */
        submitWithdraw: '/Recharge/submitWithdraw',
        /** 鎻愪氦鎷撳睍鎻愮幇鐢宠 */
        submitStaticIncomeWithdraw: '/Recharge/submitStaticIncomeWithdraw',
        /** 鑾峰彇鎴戠殑鍏呭€艰鍗曞垪琛?*/
        getMyOrderList: '/Recharge/getMyOrderList',
        /** 鑾峰彇鎴戠殑鎻愮幇璁板綍鍒楄〃 */
        getMyWithdrawList: '/Recharge/getMyWithdrawList',
        /** 鑾峰彇鍏呭€艰鍗曡鎯?*/
        detail: '/Recharge/detail',
        // 鏇存柊璁㈠崟澶囨敞/鐢ㄦ埛鍙嶉
        updateOrderRemark: '/Recharge/updateOrderRemark',
    },
    common: {
        page: '/Common/page',
        /** 鑾峰彇鐘舵€佸瓧鍏革紙澧炲己鐗堬級 */
        dict: '/Common/dict',
        /** 鑾峰彇鎺ㄥ箍濂栧姳閰嶇疆 */
        rewardConfig: '/Common/rewardConfig',
        /** 鑾峰彇瀹㈡湇閰嶇疆锛堝叕寮€鎺ュ彛锛?*/
        chatConfig: '/Common/chatConfig',
    },
    /** CMS 閰嶇疆 */
    cms: {
        /** 鑾峰彇棣栭〉閰嶇疆 */
        homeConfig: '/Cms/homeConfig',
    },
    /** 鍟嗗煄閰嶇疆锛堢嫭绔嬩簬 shopProduct锛?*/
    shop: {
        /** 鑾峰彇鍟嗗煄閰嶇疆 */
        config: '/Shop/config',
    },
    /** 璁㈠崟閰嶇疆 */
    order: {
        /** 鑾峰彇璁㈠崟鍒嗙被閰嶇疆 */
        categories: '/Order/categories',
    },
    help: {
        /** 甯姪涓績 - 鍒嗙被鍒楄〃 */
        categories: '/Help/categories',
        /** 甯姪涓績 - 闂鍒楄〃 */
        questions: '/Help/questions',
    },
    shopProduct: {
        /** 鍟嗗搧鍒楄〃 */
        list: '/shopProduct/index',
        /** 鍟嗗搧璇︽儏 */
        detail: '/shopProduct/detail',
        /** 鍟嗗搧鍒嗙被鍒楄〃 */
        categories: '/shopProduct/categories',
        /** 鐑攢鍟嗗搧鍒楄〃锛堟寜閿€閲忔帓搴忥級 */
        sales: '/shopProduct/sales',
        /** 鏈€鏂板晢鍝佸垪琛?*/
        latest: '/shopProduct/latest',
        /** 鍟嗗搧鍒嗕韩淇℃伅 */
        share: '/shopProduct/share',
        /** 鍟嗗搧璇勪环鍒楄〃 */
        reviews: '/shopProduct/reviews',
        /** 鍟嗗搧璇勪环鎽樿 */
        reviewSummary: '/shopProduct/reviewSummary',
        /** 鎻愪氦鍟嗗搧璇勪环 */
        submitReview: '/shopProduct/submitReview',
        /** 鐐硅禐/鍙栨秷鐐硅禐璇勪环 */
        likeReview: '/shopProduct/likeReview',
    },
    shopOrder: {
        /** 鍒涘缓璁㈠崟 */
        create: '/shopOrder/create',
        /** 璐拱鍟嗗搧锛堜竴姝ュ埌浣嶏細鍒涘缓璁㈠崟骞舵敮浠橈級 */
        buy: '/shopOrder/buy',
        /** 寰呬粯娆捐鍗曞垪琛?*/
        pendingPay: '/shopOrder/pendingPay',
        /** 寰呭彂璐ц鍗曞垪琛?*/
        pendingShip: '/shopOrder/pendingShip',
        /** 寰呯‘璁ゆ敹璐ц鍗曞垪琛?*/
        pendingConfirm: '/shopOrder/pendingConfirm',
        /** 宸插畬鎴愯鍗曞垪琛?*/
        completed: '/shopOrder/completed',
        /** 纭鏀惰揣 */
        confirm: '/shopOrder/confirm',
        /** 鏀粯璁㈠崟 */
        pay: '/shopOrder/pay',
        /** 璁㈠崟璇︽儏 */
        detail: '/shopOrder/detail',
        /** 鍒犻櫎璁㈠崟 */
        delete: '/shopOrder/delete',
        /** 鍙栨秷璁㈠崟 */
        cancel: '/shopOrder/cancel',
        /** 璁㈠崟缁熻 */
        statistics: '/shopOrder/statistics',
    },
    collectionSession: {
        /** 浜ゆ槗涓撳満鍒楄〃 */
        index: '/collectionSession/index',
        /** 浜ゆ槗涓撳満璇︽儏 */
        detail: '/collectionSession/detail',
    },
    collectionItem: {
        /** 浜ゆ槗鍟嗗搧鍒楄〃 */
        index: '/collectionItem/index',
        /** 鏍规嵁涓撳満ID鑾峰彇鍟嗗搧鍒楄〃 */
        bySession: '/collectionItem/bySession',
        /** 浜ゆ槗鍟嗗搧璇︽儏 */
        detail: '/collectionItem/detail',
        /** 浜ゆ槗鍟嗗搧鍘熷璇︽儏锛堜笅鏋朵篃鍙煡鐪嬶級 */
        originalDetail: '/collectionItem/originalDetail',
    },
    collectionTrade: {
        /** 瀵勫敭浜ゆ槗鍖哄垪琛?*/
        tradeList: '/collectionTrade/tradeList',
        /** 鎴戠殑钘忓搧鍒楄〃 */
        myCollection: '/collectionTrade/myCollection',
        /** 璐拱璁板綍鍒楄〃 */
        purchaseRecords: '/collectionTrade/purchaseRecords',
        /** 璁㈠崟璇︽儏 */
        orderDetail: '/collectionTrade/orderDetail',
        /** 杞叆鎸栫熆/鐭挎満 */
        toMining: '/collectionTrade/toMining',
        /** 鏍规嵁缂栫爜鏌ヨ钘忓搧 */
        queryByCode: '/collectionTrade/queryByCode',
        /** 璐拱钘忓搧 */
        buy: '/collectionTrade/buy',
        /** 鏌ヨ鎾悎姹犲垪琛?*/
        matchingPool: '/collectionTrade/matchingPool',
        /** 鍙栨秷绔炰环锛堜粠鎾悎姹犵Щ闄わ級 */
        cancelBid: '/collectionTrade/cancelBid',
        /** 鎻愯揣璁㈠崟鍒楄〃锛堜繚鐣欙級 */
        deliveryList: '/collectionTrade/deliveryList',
        /** 鏉冪泭鍒嗗壊锛堜繚鐣欙級 */
        rightsDeliver: '/collectionTrade/rightsDeliver',
    },
    collectionConsignment: {
        /** 鐢宠瀵勫敭 */
        consign: '/collectionConsignment/consign',
        /** 鎵归噺瀵勫敭 */
        batchConsign: '/collectionConsignment/batchConsign',
        /** 鍙壒閲忓瘎鍞垪琛?*/
        batchConsignableList: '/collectionConsignment/batchConsignableList',
        /** 瀵勫敭妫€鏌?*/
        consignmentCheck: '/collectionConsignment/consignmentCheck',
        /** 鎴戠殑瀵勫敭鍒楄〃 */
        myConsignmentList: '/collectionConsignment/myConsignmentList',
        /** 瀵勫敭璇︽儏 */
        consignmentDetail: '/collectionConsignment/consignmentDetail',
        /** 鍙栨秷瀵勫敭 */
        cancelConsignment: '/collectionConsignment/cancelConsignment',
        /** 瀵勫敭鍟嗗搧鍒楄〃 */
        consignmentList: '/collectionConsignment/consignmentList',
        /** 鐢宠鎻愯揣 */
        deliver: '/collectionConsignment/deliver',
    },
    collectionReservation: {
        /** 预约支付预览 */
        previewBidBuy: '/collectionReservation/previewBidBuy',
        /** @deprecated 兼容旧命名，主命名请使用 previewBidBuy */
        bidBuyPreview: '/collectionReservation/bidBuyPreview',
        /** @deprecated 兼容旧别名，主命名请使用 previewBidBuy */
        preview: '/collectionReservation/preview',
        /** 绔炰环璐拱钘忓搧 */
        bidBuy: '/collectionReservation/bidBuy',
        /** 棰勭害璁板綍鍒楄〃 */
        reservations: '/collectionReservation/reservations',
        /** 棰勭害璁板綍璇︽儏 */
        reservationDetail: '/collectionReservation/reservationDetail',
    },
    artist: {
        /** 鑹烘湳瀹跺垪琛?*/
        index: '/artist/index',
        /** 鑹烘湳瀹惰鎯?*/
        detail: '/artist/detail',
        /** 鑹烘湳瀹朵綔鍝佽鎯?*/
        workDetail: '/artist/workDetail',
        /** 鍏ㄩ儴鑹烘湳瀹朵綔鍝佸垪琛?*/
        allWorks: '/artist/allWorks',
    },
    signIn: {
        /** 鑾峰彇绛惧埌娲诲姩瑙勫垯 */
        rules: '/SignIn/rules',
        /** 鑾峰彇绛惧埌淇℃伅 */
        info: '/SignIn/info',
        /** 鎵ц绛惧埌 */
        do: '/SignIn/do',
        /** 鑾峰彇绛惧埌璁板綍 */
        records: '/SignIn/records',
        /** 鑾峰彇鎻愮幇杩涘害 */
        progress: '/SignIn/progress',
    },
    userCollection: {
        /** 鐢ㄦ埛钘忓搧璇︽儏 */
        detail: '/userCollection/detail',
    },
    team: {
        /** 鑾峰彇鍥㈤槦姒傝 */
        overview: '/Team/overview',
        /** 鑾峰彇鎺ㄥ箍鍗′俊鎭?*/
        promotionCard: '/Team/promotionCard',
        /** 鑾峰彇鍥㈤槦鎴愬憳鍒楄〃 */
        members: '/Team/members',
        /** 鑾峰彇濂藉弸/鍥㈤槦鎴愬憳璇︽儏 */
        memberDetail: '/Team/memberDetail',
    },
    app: {
        /** 妫€鏌ュ簲鐢ㄧ増鏈洿鏂?*/
        checkUpdate: '/AppVersion/checkUpdate',
    },
    financeOrder: {
        /** 浣欓鍒掕浆鍒板彲鐢ㄤ綑棰?*/
        transferIncomeToPurchase: '/financeOrder/transferIncomeToPurchase',
    },
    liveVideo: {
        /** 鑾峰彇鐩存挱骞垮憡瑙嗛閰嶇疆 */
        config: '/liveVideo/config',
    },
    /** 权益卡 */
    membershipCard: {
        /** 获取可购买的权益卡产品列表 */
        products: '/membershipCard/products',
        /** 购买权益卡 */
        buy: '/membershipCard/buy',
        /** 我的权益卡列表 */
        myCards: '/membershipCard/myCards',
        /** 寄售前预览可抵扣金额 */
        previewDeduction: '/membershipCard/previewDeduction',
    },
} as const;


