/**
 * 业务组件统一导出文件
 * 
 * 功能说明：
 * - 集中导出所有业务组件，简化导入路径
 * - 业务组件是针对特定业务场景的可复用组件
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 * 
 * @example
 * import { StaticContentPage, PasswordForm } from '@/components/business';
 */

// 静态内容页面组件
export { default as StaticContentPage } from './StaticContentPage';

// 密码表单组件
export { default as PasswordForm } from './password-form/PasswordForm';
