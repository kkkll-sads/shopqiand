/**
 * RealNameRequiredModal - 实名认证提示弹窗
 * 
 * 功能说明：
 * - 在未实名用户访问受限页面时显示
 * - 提供前往实名认证和返回首页两个选项
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { STORAGE_KEYS } from '../../constants/storageKeys';

interface RealNameRequiredModalProps {
    /** 是否显示弹窗 */
    open: boolean;
    /** 是否已实名认证 */
    isRealNameVerified?: boolean;
    /** 前往实名认证 */
    onNavigateToAuth: () => void;
    /** 返回首页 */
    onBackToHome: () => void;
    /** 跳转到个人页面（已实名时使用） */
    onNavigateToProfile?: () => void;
}

/**
 * RealNameRequiredModal 实名认证提示弹窗组件
 */
const RealNameRequiredModal: React.FC<RealNameRequiredModalProps> = ({
    open,
    isRealNameVerified = false,
    onNavigateToAuth,
    onBackToHome,
    onNavigateToProfile,
}) => {
    if (!open) return null;

    // 如果已实名认证，直接跳转到个人页面
    if (isRealNameVerified && onNavigateToProfile) {
        onNavigateToProfile();
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-2xl">
                {/* 图标 */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                        <AlertCircle className="text-orange-500" size={32} />
                    </div>
                </div>

                {/* 标题 */}
                <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
                    需要实名认证
                </h2>

                {/* 内容 */}
                <p className="text-center text-gray-600 mb-8 leading-relaxed">
                    为了您的账户安全，需要完成实名认证后才能使用此功能
                </p>

                {/* 按钮 */}
                <div className="space-y-3">
                    <button
                        onClick={onNavigateToAuth}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-full font-bold text-base shadow-lg shadow-orange-200 active:scale-95 transition-transform"
                    >
                        前往实名认证
                    </button>
                    <button
                        onClick={onBackToHome}
                        className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-full font-medium text-base active:scale-95 transition-transform"
                    >
                        返回首页
                    </button>
                    <button
                        onClick={() => {
                            // 使用统一的 Key 清除本地存储
                            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN_KEY);
                            localStorage.removeItem(STORAGE_KEYS.USER_INFO_KEY);
                            localStorage.removeItem(STORAGE_KEYS.AUTH_KEY);
                            localStorage.removeItem(STORAGE_KEYS.REAL_NAME_STATUS_KEY);
                            localStorage.removeItem(STORAGE_KEYS.REAL_NAME_KEY);

                            // 刷新页面跳转到登录
                            window.location.href = '/login';
                        }}
                        className="w-full text-gray-400 text-sm py-2"
                    >
                        退出登录
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RealNameRequiredModal;
