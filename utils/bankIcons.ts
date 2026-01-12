/**
 * 银行图标工具
 * 根据银行 code 获取银行图标 URL
 * 图标来源：https://github.com/heavenforhb/bankInfo
 */

/**
 * 已有图标的银行 code 列表
 * 这些银行有对应的图标文件在 /images/banks/ 目录下
 */
const BANK_ICONS_AVAILABLE = new Set([
    'ABC',     // 中国农业银行
    'ASCB',    // 鞍山银行
    'BJBANK',  // 北京银行
    'BOC',     // 中国银行
    'BOHAIB',  // 渤海银行
    'CCB',     // 中国建设银行
    'CEB',     // 中国光大银行
    'CIB',     // 兴业银行
    'CITIC',   // 中信银行
    'CMB',     // 招商银行
    'CMBC',    // 中国民生银行
    'COMM',    // 交通银行
    'CQBANK',  // 重庆银行
    'CZBANK',  // 浙商银行
    'GDB',     // 广发银行
    'HBC',     // 河北银行
    'HXBANK',  // 华夏银行
    'ICBC',    // 中国工商银行
    'JSB',     // 吉林银行
    'NBBANK',  // 宁波银行
    'NJCB',    // 南京银行
    'PSBC',    // 中国邮政储蓄银行
    'SHBANK',  // 上海银行
    'SPABANK', // 平安银行
    'SPDB',    // 浦发银行
]);

/**
 * 银行名称到 code 的映射 (用于从 bankcard 包的 name 获取 code)
 * bankcard 包已经提供了这个映射，这里是补充一些常用别名
 */
const BANK_NAME_ALIAS: Record<string, string> = {
    // 常用名称别名
    '工商银行': 'ICBC',
    '农业银行': 'ABC',
    '中国银行': 'BOC',
    '建设银行': 'CCB',
    '交通银行': 'COMM',
    '邮储银行': 'PSBC',
    '邮政银行': 'PSBC',
    '招行': 'CMB',
    '浦发': 'SPDB',
    '光大': 'CEB',
    '民生': 'CMBC',
    '华夏': 'HXBANK',
    '广发': 'GDB',
    '兴业': 'CIB',
    '平安': 'SPABANK',
};

/**
 * 获取银行图标 URL
 * @param bankCode 银行 code (如 ICBC, ABC, CMB)
 * @returns 图标 URL
 */
export const getBankIconUrl = (bankCode: string): string => {
    const code = bankCode?.toUpperCase();
    if (code && BANK_ICONS_AVAILABLE.has(code)) {
        return `/images/banks/${code}.png`;
    }
    return '/images/banks/default.png';
};

/**
 * 根据银行名称获取图标 URL
 * @param bankName 银行名称
 * @param bankCode 可选的银行 code (如果传入了就直接用)
 */
export const getBankIconByName = (bankName: string, bankCode?: string): string => {
    // 如果提供了 code，直接用
    if (bankCode) {
        return getBankIconUrl(bankCode);
    }

    // 尝试从别名获取
    const alias = BANK_NAME_ALIAS[bankName];
    if (alias) {
        return getBankIconUrl(alias);
    }

    // 尝试从名称中匹配关键词
    for (const [keyword, code] of Object.entries(BANK_NAME_ALIAS)) {
        if (bankName.includes(keyword)) {
            return getBankIconUrl(code);
        }
    }

    return '/images/banks/default.png';
};

/**
 * 检查银行是否有图标
 */
export const hasBankIcon = (bankCode: string): boolean => {
    return BANK_ICONS_AVAILABLE.has(bankCode?.toUpperCase());
};
