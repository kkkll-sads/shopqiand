/**
 * currency.ts - 金额计算工具函数
 * 
 * 使用 decimal.js 进行精确的金额计算，避免 JavaScript 浮点数精度问题
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import Decimal from 'decimal.js';

/**
 * 创建 Decimal 实例（安全转换）
 */
function toDecimal(value: number | string | Decimal | null | undefined): Decimal {
  if (value === null || value === undefined || value === '') {
    return new Decimal(0);
  }
  if (value instanceof Decimal) {
    return value;
  }
  try {
    return new Decimal(value);
  } catch (e) {
    return new Decimal(0);
  }
}

/**
 * 金额相加
 * 
 * @example
 * add(0.1, 0.2) // Decimal(0.3)
 * add('100.50', 50.25) // Decimal(150.75)
 */
export function add(...values: (number | string | Decimal | null | undefined)[]): Decimal {
  return values.reduce<Decimal>((sum, val) => sum.plus(toDecimal(val)), new Decimal(0));
}

/**
 * 金额相减
 * 
 * @example
 * subtract(100, 50.5) // Decimal(49.5)
 */
export function subtract(
  a: number | string | Decimal | null | undefined,
  b: number | string | Decimal | null | undefined
): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

/**
 * 金额相乘
 * 
 * @example
 * multiply(100, 1.15) // Decimal(115)
 * multiply(100.5, 0.95) // Decimal(95.475)
 */
export function multiply(
  a: number | string | Decimal | null | undefined,
  b: number | string | Decimal | null | undefined
): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

/**
 * 金额相除
 * 
 * @example
 * divide(100, 2) // Decimal(50)
 */
export function divide(
  a: number | string | Decimal | null | undefined,
  b: number | string | Decimal | null | undefined
): Decimal {
  const divisor = toDecimal(b);
  if (divisor.isZero()) {
    throw new Error('Division by zero');
  }
  return toDecimal(a).div(divisor);
}

/**
 * 金额累加（用于数组求和）
 * 
 * @example
 * sum([100, 50.5, 25.25]) // Decimal(175.75)
 */
export function sum(values: (number | string | Decimal | null | undefined)[]): Decimal {
  return add(...values);
}

/**
 * 四舍五入到指定小数位
 * 
 * @example
 * round(100.456, 2) // Decimal(100.46)
 * round(100.454, 2) // Decimal(100.45)
 */
export function round(
  value: number | string | Decimal | null | undefined,
  decimals: number = 2
): Decimal {
  return toDecimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
}

/**
 * 向上取整到指定小数位
 * 
 * @example
 * ceil(100.451, 2) // Decimal(100.46)
 */
export function ceil(
  value: number | string | Decimal | null | undefined,
  decimals: number = 2
): Decimal {
  return toDecimal(value).toDecimalPlaces(decimals, Decimal.ROUND_CEIL);
}

/**
 * 向下取整到指定小数位
 * 
 * @example
 * floor(100.459, 2) // Decimal(100.45)
 */
export function floor(
  value: number | string | Decimal | null | undefined,
  decimals: number = 2
): Decimal {
  return toDecimal(value).toDecimalPlaces(decimals, Decimal.ROUND_FLOOR);
}

/**
 * 转换为数字（用于显示）
 * 
 * @example
 * toNumber(new Decimal(100.5)) // 100.5
 */
export function toNumber(value: Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (value instanceof Decimal) {
    return value.toNumber();
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
}

/**
 * 转换为字符串（保留指定小数位）
 * 
 * @example
 * toString(new Decimal(100.5), 2) // "100.50"
 * toString(new Decimal(100), 2) // "100.00"
 */
export function toString(
  value: Decimal | number | string | null | undefined,
  decimals: number = 2
): string {
  const decimal = toDecimal(value);
  // 确保 decimal 是有效的 Decimal 实例
  if (!(decimal instanceof Decimal)) {
    return new Decimal(0).toFixed(decimals);
  }
  return decimal.toFixed(decimals);
}

/**
 * 货币格式化（不带符号）
 */
export function formatCurrency(
  value: Decimal | number | string | null | undefined,
  decimals: number = 2
): string {
  return toString(value, decimals);
}

/**
 * 人民币格式化（带 ¥ 符号）
 */
export function formatYuan(
  value: Decimal | number | string | null | undefined,
  decimals: number = 2
): string {
  return `¥${formatCurrency(value, decimals)}`;
}

/**
 * 比较两个金额
 * 
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 * 
 * @example
 * compare(100, 50) // 1
 * compare(50, 100) // -1
 * compare(100, 100) // 0
 */
export function compare(
  a: number | string | Decimal | null | undefined,
  b: number | string | Decimal | null | undefined
): number {
  return toDecimal(a).comparedTo(toDecimal(b));
}

/**
 * 判断是否大于
 */
export function gt(
  a: number | string | Decimal | null | undefined,
  b: number | string | Decimal | null | undefined
): boolean {
  return compare(a, b) > 0;
}

/**
 * 判断是否大于等于
 */
export function gte(
  a: number | string | Decimal | null | undefined,
  b: number | string | Decimal | null | undefined
): boolean {
  return compare(a, b) >= 0;
}

/**
 * 判断是否小于
 */
export function lt(
  a: number | string | Decimal | null | undefined,
  b: number | string | Decimal | null | undefined
): boolean {
  return compare(a, b) < 0;
}

/**
 * 判断是否小于等于
 */
export function lte(
  a: number | string | Decimal | null | undefined,
  b: number | string | Decimal | null | undefined
): boolean {
  return compare(a, b) <= 0;
}

/**
 * 判断是否等于
 */
export function eq(
  a: number | string | Decimal | null | undefined,
  b: number | string | Decimal | null | undefined
): boolean {
  return compare(a, b) === 0;
}
