/**
 * errorHelpers/extract.ts - 错误消息提取
 */

/**
 * 从任意错误对象中提取错误消息
 *
 * 支持的错误对象格式：
 * - { msg: string }
 * - { message: string }
 * - { response: { msg: string } }
 * - { data: { message: string } }
 * - Error 对象
 * - 字符串
 *
 * @deprecated 推荐使用 apiHelpers.ts 中的 extractError 或 extractErrorFromException 函数
 * 此函数保留仅为向后兼容，新代码请使用 apiHelpers.ts 中的函数
 */
export function extractErrorMessage(
  error: any,
  defaultMessage: string = '操作失败，请稍后重试'
): string {
  if (!error) return defaultMessage;

  // 字符串错误
  if (typeof error === 'string') return error;

  // 优先级1: error.msg
  if (error.msg && typeof error.msg === 'string') return error.msg;

  // 优先级2: error.response.msg
  if (error.response?.msg && typeof error.response.msg === 'string') {
    return error.response.msg;
  }

  // 优先级3: error.message
  if (error.message && typeof error.message === 'string') return error.message;

  // 优先级4: error.data.message
  if (error.data?.message && typeof error.data.message === 'string') {
    return error.data.message;
  }

  // 优先级5: error.response.data.message
  if (error.response?.data?.message && typeof error.response.data.message === 'string') {
    return error.response.data.message;
  }

  return defaultMessage;
}
