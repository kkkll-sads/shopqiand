import { warnLog, errorLog } from '@/utils/logger';

type NeedLoginCallback = (message?: string) => void;

let needLoginHandler: NeedLoginCallback | null = null;

/**
 * 注册登录失效统一处理函数
 */
export const setNeedLoginHandler = (handler: NeedLoginCallback) => {
    needLoginHandler = handler;
};

/**
 * 清空登录失效处理函数
 */
export const clearNeedLoginHandler = () => {
    needLoginHandler = null;
};

/**
 * 触发登录失效处理
 * @returns 是否已处理
 */
export const notifyNeedLogin = (message?: string): boolean => {
    if (needLoginHandler) {
        try {
            needLoginHandler(message);
            return true;
        } catch (error) {
            errorLog('needLoginHandler', 'NeedLogin 处理回调执行失败', error);
        }
    }
    warnLog('needLoginHandler', '捕获到 NeedLoginError，但尚未注册处理函数');
    return false;
};

