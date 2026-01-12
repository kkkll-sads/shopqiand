/**
 * 字段映射工具
 * 用于前后端字段转换、别名处理和数据类型转换
 */

// ============================================================================
// 字段映射配置
// ============================================================================

/**
 * 用户信息字段映射
 * 后端字段 -> 前端字段
 */
export const USER_FIELD_MAPPING = {
    // 基本信息
    id: 'id',
    username: 'username',
    nickname: 'nickname',
    email: 'email',
    mobile: 'mobile',
    avatar: 'avatar',
    gender: 'gender',
    birthday: 'birthday',

    // 资金字段
    money: 'totalAssets',                    // 总资产（派生值）
    balance_available: 'availableBalance',   // 可用余额
    service_fee_balance: 'serviceFeeBalance', // 确权金
    withdrawable_money: 'withdrawableBalance', // 可提现余额
    score: 'consumptionPoints',              // 消费金
    green_power: 'greenPower',               // 绿色算力
    pending_activation_gold: 'pendingActivationGold', // 待激活金

    // 其他字段
    usdt: 'usdt',
    last_login_time: 'lastLoginTime',
    last_login_ip: 'lastLoginIp',
    join_time: 'joinTime',
    motto: 'motto',
    draw_count: 'drawCount',
    user_type: 'userType',
    token: 'token',
    refresh_token: 'refreshToken',
    invite_code: 'inviteCode',
    agent_review_status: 'agentReviewStatus',
    real_name: 'realName',
    real_name_status: 'realNameStatus',
    consignment_coupon: 'consignmentCoupon',
    legacy_frozen: 'legacyFrozen',
} as const;

/**
 * 藏品信息字段映射
 */
export const COLLECTION_FIELD_MAPPING = {
    id: 'id',
    title: 'title',
    price: 'price',
    image: 'image',
    category: 'category',

    // 新增字段
    session_id: 'sessionId',
    zone_id: 'zoneId',
    core_enterprise: 'coreEnterprise',
    farmer_info: 'farmerInfo',
    asset_code: 'assetCode',
    tx_hash: 'txHash',
    owner_id: 'ownerId',
    supplier_name: 'supplierName',

    // 寄售相关
    consignment_id: 'consignmentId',
    consignment_price: 'consignmentPrice',
    stock: 'stock',
    sales: 'sales',
    package_id: 'packageId',
    package_name: 'packageName',
} as const;

/**
 * 寄售券字段映射
 */
export const COUPON_FIELD_MAPPING = {
    id: 'id',
    user_id: 'userId',
    session_id: 'sessionId',
    zone_id: 'zoneId',
    price_zone: 'priceZone',
    expire_time: 'expireTime',
    status: 'status',
    create_time: 'createTime',
    update_time: 'updateTime',
} as const;

/**
 * 订单字段映射
 */
export const ORDER_FIELD_MAPPING = {
    id: 'id',
    order_no: 'orderNo',
    product_name: 'productName',
    product_image: 'productImage',
    price: 'price',
    quantity: 'quantity',
    total_amount: 'totalAmount',
    status: 'status',
    pay_time: 'payTime',
    create_time: 'createTime',
    update_time: 'updateTime',
} as const;

// ============================================================================
// 字段别名配置（用于多个后端字段名映射到同一个前端字段）
// ============================================================================

/**
 * 字段别名映射
 * 某些后端接口可能使用不同的字段名返回相同的数据
 */
export const FIELD_ALIASES = {
    // 用户ID的多种表示
    userId: ['user_id', 'uid', 'userid'],

    // 时间字段的多种表示
    createTime: ['create_time', 'createtime', 'created_at', 'createdAt'],
    updateTime: ['update_time', 'updatetime', 'updated_at', 'updatedAt'],

    // 价格字段的多种表示
    price: ['price', 'amount', 'money'],

    // 图片字段的多种表示
    image: ['image', 'img', 'pic', 'picture', 'photo'],
} as const;

// ============================================================================
// 数据类型转换函数
// ============================================================================

/**
 * 时间戳转换为前端Date对象
 */
export function convertTimestamp(timestamp: number | string | null): Date | null {
    if (!timestamp) return null;
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    return new Date(ts * 1000); // 后端返回秒级时间戳，前端需要毫秒
}

/**
 * 金额字符串转换为数字
 */
export function convertAmount(amount: string | number | undefined): number {
    if (amount === undefined || amount === null) return 0;
    if (typeof amount === 'number') return amount;
    return parseFloat(amount) || 0;
}

/**
 * 状态值转换为布尔值
 */
export function convertStatus(status: number | string): boolean {
    if (typeof status === 'number') return status === 1;
    return status === '1';
}

/**
 * 数组字符串转换为数组
 */
export function convertArrayString(str: string | string[]): string[] {
    if (Array.isArray(str)) return str;
    if (!str) return [];
    try {
        return JSON.parse(str);
    } catch {
        return str.split(',').filter(Boolean);
    }
}

// ============================================================================
// 通用字段映射函数
// ============================================================================

/**
 * 根据映射配置转换对象字段
 * @param data 原始数据对象
 * @param mapping 字段映射配置
 * @returns 转换后的对象
 */
export function mapFields<T extends Record<string, any>, M extends Record<string, string>>(
    data: T,
    mapping: M
): Record<M[keyof M], any> {
    const result: any = {};

    for (const [backendKey, frontendKey] of Object.entries(mapping)) {
        if (backendKey in data) {
            result[frontendKey] = data[backendKey];
        }
    }

    return result;
}

/**
 * 批量转换数组中的对象字段
 */
export function mapFieldsArray<T extends Record<string, any>, M extends Record<string, string>>(
    dataArray: T[],
    mapping: M
): Record<M[keyof M], any>[] {
    return dataArray.map(item => mapFields(item, mapping));
}

/**
 * 反向映射：前端字段 -> 后端字段
 */
export function reverseMapFields<T extends Record<string, any>, M extends Record<string, string>>(
    data: T,
    mapping: M
): Record<string, any> {
    const result: any = {};
    const reversedMapping = Object.fromEntries(
        Object.entries(mapping).map(([k, v]) => [v, k])
    );

    for (const [frontendKey, backendKey] of Object.entries(reversedMapping)) {
        if (frontendKey in data) {
            result[backendKey] = data[frontendKey];
        }
    }

    return result;
}

// ============================================================================
// 特定类型的字段转换器
// ============================================================================

/**
 * 用户信息字段转换
 */
export function convertUserFields(data: any): any {
    const mapped = mapFields(data, USER_FIELD_MAPPING);

    // 时间字段转换
    if (data.last_login_time) {
        mapped.lastLoginTime = convertTimestamp(data.last_login_time);
    }
    if (data.join_time) {
        mapped.joinTime = convertTimestamp(data.join_time);
    }

    // 金额字段转换
    mapped.availableBalance = convertAmount(data.balance_available);
    mapped.serviceFeeBalance = convertAmount(data.service_fee_balance);
    mapped.withdrawableBalance = convertAmount(data.withdrawable_money);
    mapped.totalAssets = convertAmount(data.money);

    return mapped;
}

/**
 * 藏品信息字段转换
 */
export function convertCollectionFields(data: any): any {
    const mapped = mapFields(data, COLLECTION_FIELD_MAPPING);

    // 价格字段转换
    mapped.price = convertAmount(data.price);
    mapped.consignmentPrice = convertAmount(data.consignment_price);

    return mapped;
}

/**
 * 寄售券字段转换
 */
export function convertCouponFields(data: any): any {
    const mapped = mapFields(data, COUPON_FIELD_MAPPING);

    // 时间字段转换
    mapped.expireTime = convertTimestamp(data.expire_time);
    mapped.createTime = convertTimestamp(data.create_time);
    mapped.updateTime = convertTimestamp(data.update_time);

    // 状态转换
    mapped.isAvailable = convertStatus(data.status);

    return mapped;
}

/**
 * 订单字段转换
 */
export function convertOrderFields(data: any): any {
    const mapped = mapFields(data, ORDER_FIELD_MAPPING);

    // 金额字段转换
    mapped.price = convertAmount(data.price);
    mapped.totalAmount = convertAmount(data.total_amount);

    // 时间字段转换
    mapped.payTime = convertTimestamp(data.pay_time);
    mapped.createTime = convertTimestamp(data.create_time);
    mapped.updateTime = convertTimestamp(data.update_time);

    return mapped;
}

// ============================================================================
// 字段验证
// ============================================================================

/**
 * 验证必填字段是否存在
 */
export function validateRequiredFields(
    data: Record<string, any>,
    requiredFields: string[]
): { valid: boolean; missing: string[] } {
    const missing = requiredFields.filter(field => !(field in data) || data[field] === null || data[field] === undefined);
    return {
        valid: missing.length === 0,
        missing,
    };
}

/**
 * 用户信息必填字段
 */
export const USER_REQUIRED_FIELDS = ['id', 'username', 'mobile', 'token'];

/**
 * 藏品信息必填字段
 */
export const COLLECTION_REQUIRED_FIELDS = ['id', 'title', 'price', 'image'];

/**
 * 订单信息必填字段
 */
export const ORDER_REQUIRED_FIELDS = ['id', 'product_name', 'price', 'status'];
