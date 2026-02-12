/**
 * 前后端统一状态映射字典
 *
 * 用于统一前后端的状态码、枚举值、文本映射。
 * 已按业务域拆分到 ./status-enums/*，本文件保留为兼容导出入口。
 *
 * 注意：此文件应与后端 app/common/library/StatusDict.php 保持一致
 */

export * from './status-enums'
