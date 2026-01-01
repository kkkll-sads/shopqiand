/**
 * StaticContentPage - 静态内容页面组件
 * 
 * 功能说明：
 * - 通用的静态内容展示页面
 * - 支持隐私政策、用户协议、关于我们等页面
 * - 自动根据类型获取对应的页面内容
 * - 统一的加载、错误和内容展示逻辑
 * 
 * 可合并的页面：
 * - PrivacyPolicy.tsx
 * - UserAgreement.tsx  
 * - AboutUs.tsx
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import SubPageLayout from '../SubPageLayout';
import { LoadingSpinner } from '../common';
import {
    fetchPrivacyPolicyPage,
    fetchUserAgreementPage,
    fetchAboutUsPage,
    PageContent,
} from '../../services/api';
import { isSuccess, extractError } from '../../utils/apiHelpers';

/**
 * 页面类型枚举
 */
type PageType = 'privacy_policy' | 'user_agreement' | 'about_us';

/**
 * StaticContentPage 组件属性接口
 */
interface StaticContentPageProps {
    /** 页面类型 */
    type: PageType;
    /** 默认标题（内容加载前显示） */
    defaultTitle: string;
    /** 返回回调 */
    onBack: () => void;
}

/**
 * 根据页面类型获取对应的 API 函数
 * 
 * @param type - 页面类型
 * @returns 对应的 API 请求函数
 */
const getApiFunctionByType = (type: PageType) => {
    switch (type) {
        case 'privacy_policy':
            return fetchPrivacyPolicyPage;
        case 'user_agreement':
            return fetchUserAgreementPage;
        case 'about_us':
            return fetchAboutUsPage;
        default:
            return fetchAboutUsPage;
    }
};

/**
 * StaticContentPage 静态内容页面组件
 * 
 * @example
 * // 隐私政策页面
 * <StaticContentPage
 *   type="privacy_policy"
 *   defaultTitle="隐私政策"
 *   onBack={() => navigate(-1)}
 * />
 * 
 * @example
 * // 用户协议页面
 * <StaticContentPage
 *   type="user_agreement"
 *   defaultTitle="用户协议"
 *   onBack={() => navigate(-1)}
 * />
 * 
 * @example
 * // 关于我们页面
 * <StaticContentPage
 *   type="about_us"
 *   defaultTitle="中心介绍"
 *   onBack={() => navigate(-1)}
 * />
 */
const StaticContentPage: React.FC<StaticContentPageProps> = ({
    type,
    defaultTitle,
    onBack,
}) => {
    // 页面内容状态
    const [page, setPage] = useState<PageContent | null>(null);
    // 加载状态
    const [loading, setLoading] = useState<boolean>(true);
    // 错误状态
    const [error, setError] = useState<string | null>(null);

    /**
     * 加载页面内容
     */
    useEffect(() => {
        // 用于取消请求的标记
        let cancelled = false;

        const fetchPage = async () => {
            setLoading(true);
            setError(null);

            try {
                // 根据类型获取对应的 API 函数
                const apiFunction = getApiFunctionByType(type);
                const response = await apiFunction();

                // 组件已卸载则不更新状态
                if (cancelled) return;

                if (isSuccess(response) && response.data) {
                    setPage(response.data);
                } else {
                    setError(extractError(response, '加载失败，请稍后重试'));
                }
            } catch (e: any) {
                if (cancelled) return;
                console.error(`加载${defaultTitle}失败:`, e);
                setError('网络异常，请检查网络后重试');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchPage();

        // 组件卸载时取消请求
        return () => {
            cancelled = true;
        };
    }, [type, defaultTitle]);

    return (
        <SubPageLayout title={page?.title || defaultTitle} onBack={onBack}>
            <div className="p-4 m-4 bg-white rounded-xl shadow-sm border border-gray-100">
                {/* 加载状态 */}
                {loading && (
                    <div className="py-10">
                        <LoadingSpinner text="正在加载..." />
                    </div>
                )}

                {/* 错误状态 */}
                {!loading && error && (
                    <div className="py-10 text-center text-red-500 text-sm">
                        {error}
                    </div>
                )}

                {/* 内容展示 */}
                {!loading && !error && page?.content && (
                    <div
                        className="prose prose-sm max-w-none text-gray-800"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                )}

                {/* 版权信息 */}
                <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
                    <p>Copyright © 2025 数权中心. All rights reserved.</p>
                    <p className="mt-1">版本 v1.0.2</p>
                </div>
            </div>
        </SubPageLayout>
    );
};

export default StaticContentPage;
