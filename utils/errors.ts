/**
 * NeedLoginError - 需要登录的错误类型
 * 
 * 用于 networking 层在检测到 code=303 时抛出，
 * 让上层统一处理登录跳转，而不是在 networking 层直接跳页面。
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

export class NeedLoginError extends Error {
    code = 303;
    needLogin = true;

    constructor(message: string = '请先登录') {
        super(message);
        this.name = 'NeedLoginError';
    }
}
