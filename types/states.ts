/**
 * types/states.ts - 状态机状态类型定义
 *
 * 集中定义项目中所有状态机使用的状态和事件枚举
 *
 * @author 树交所前端团队
 * @version 1.0.0
 * @created 2026-01-14
 */

// ========================================
// 实名认证状态机
// ========================================

/**
 * 实名认证状态枚举
 */
export enum RealNameState {
  IDLE = 'idle', // 初始状态
  LOADING = 'loading', // 加载实名认证状态
  FORM = 'form', // 显示表单（未认证）
  VERIFYING = 'verifying', // 跳转H5核身中
  PROCESSING = 'processing', // 处理核身结果
  SUBMITTING = 'submitting', // 提交实名认证
  SUCCESS = 'success', // 已通过实名认证
  PENDING = 'pending', // 审核中
  ERROR = 'error', // 错误状态
}

/**
 * 实名认证事件枚举
 */
export enum RealNameEvent {
  LOAD = 'LOAD',
  LOAD_SUCCESS_VERIFIED = 'LOAD_SUCCESS_VERIFIED',
  LOAD_SUCCESS_PENDING = 'LOAD_SUCCESS_PENDING',
  LOAD_SUCCESS_FORM = 'LOAD_SUCCESS_FORM',
  LOAD_ERROR = 'LOAD_ERROR',
  SUBMIT = 'SUBMIT',
  VERIFY_CALLBACK = 'VERIFY_CALLBACK',
  VERIFY_SUCCESS = 'VERIFY_SUCCESS',
  VERIFY_ERROR = 'VERIFY_ERROR',
  SUBMIT_SUCCESS = 'SUBMIT_SUCCESS',
  SUBMIT_ERROR = 'SUBMIT_ERROR',
  RETRY = 'RETRY',
  RETRY_LOAD = 'RETRY_LOAD',
}

// ========================================
// 资产操作弹窗状态机
// ========================================

/**
 * 操作弹窗状态枚举
 */
export enum ActionModalState {
  CLOSED = 'closed', // 弹窗关闭
  OPEN_DELIVERY = 'open_delivery', // 显示提货标签
  OPEN_CONSIGNMENT = 'open_consignment', // 显示寄售标签
  SUBMITTING = 'submitting', // 提交中（提货或寄售）
}

/**
 * 操作弹窗事件枚举
 */
export enum ActionModalEvent {
  OPEN_DELIVERY = 'OPEN_DELIVERY',
  OPEN_CONSIGNMENT = 'OPEN_CONSIGNMENT',
  SWITCH_TO_DELIVERY = 'SWITCH_TO_DELIVERY',
  SWITCH_TO_CONSIGNMENT = 'SWITCH_TO_CONSIGNMENT',
  SUBMIT = 'SUBMIT',
  SUBMIT_SUCCESS = 'SUBMIT_SUCCESS',
  SUBMIT_ERROR = 'SUBMIT_ERROR',
  CLOSE = 'CLOSE',
}

// ========================================
// 收银台状态机
// ========================================

/**
 * 收银台状态枚举
 */
export enum CashierState {
  IDLE = 'idle', // 初始状态
  LOADING = 'loading', // 加载订单和用户信息
  READY = 'ready', // 准备就绪，可以支付
  PAYING = 'paying', // 支付中
  SUCCESS = 'success', // 支付成功
  ERROR = 'error', // 错误状态
}

/**
 * 收银台事件枚举
 */
export enum CashierEvent {
  LOAD = 'LOAD', // 开始加载
  LOAD_SUCCESS = 'LOAD_SUCCESS', // 加载成功
  LOAD_ERROR = 'LOAD_ERROR', // 加载失败
  PAY = 'PAY', // 开始支付
  PAY_SUCCESS = 'PAY_SUCCESS', // 支付成功
  PAY_ERROR = 'PAY_ERROR', // 支付失败
  RETRY = 'RETRY', // 重试
  CHANGE_PAY_TYPE = 'CHANGE_PAY_TYPE', // 切换支付方式
}

// ========================================
// 通用加载状态机
// ========================================

/**
 * 通用加载状态枚举
 */
export enum LoadingState {
  IDLE = 'idle', // 空闲
  LOADING = 'loading', // 加载中
  SUCCESS = 'success', // 成功
  ERROR = 'error', // 失败
}

/**
 * 通用加载事件枚举
 */
export enum LoadingEvent {
  LOAD = 'LOAD',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  RETRY = 'RETRY',
  RESET = 'RESET',
}

// ========================================
// 表单提交状态机
// ========================================

/**
 * 表单状态枚举
 */
export enum FormState {
  IDLE = 'idle', // 空闲
  VALIDATING = 'validating', // 验证中
  SUBMITTING = 'submitting', // 提交中
  SUCCESS = 'success', // 成功
  ERROR = 'error', // 失败
}

/**
 * 表单事件枚举
 */
export enum FormEvent {
  VALIDATE = 'VALIDATE',
  VALIDATION_SUCCESS = 'VALIDATION_SUCCESS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SUBMIT = 'SUBMIT',
  SUBMIT_SUCCESS = 'SUBMIT_SUCCESS',
  SUBMIT_ERROR = 'SUBMIT_ERROR',
  RESET = 'RESET',
  RETRY = 'RETRY',
}

// ========================================
// 类型导出
// ========================================

/**
 * 所有状态类型的联合类型
 */
export type AppState =
  | RealNameState
  | ActionModalState
  | CashierState
  | LoadingState
  | FormState;

/**
 * 所有事件类型的联合类型
 */
export type AppEvent =
  | RealNameEvent
  | ActionModalEvent
  | CashierEvent
  | LoadingEvent
  | FormEvent;
