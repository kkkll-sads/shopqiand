/**
 * HelpCenter - 帮助中心页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/layouts/PageContainer';
import { LoadingSpinner, EmptyState } from '@/components/common';
import { fetchHelpCategories, fetchHelpQuestions, HelpCategoryItem, HelpQuestionItem } from '@/services';
import { extractData } from '@/utils/apiHelpers';
import { warnLog, errorLog } from '@/utils/logger';

/**
 * 帮助分类接口
 */
interface HelpCategory {
  id: number;
  name: string;
  code: string;
}

/**
 * 帮助问题接口
 */
interface HelpQuestion {
  id: number;
  categoryId: number;
  title: string;
  content: string;
  imageUrls?: string[];
}

/**
 * HelpCenter 帮助中心页面组件
 */
const HelpCenter: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<HelpQuestion | null>(null);
  const [questionsByCategory, setQuestionsByCategory] = useState<Record<number, HelpQuestion[]>>({});
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null);

  // 加载分类列表
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await fetchHelpCategories();
        const data = extractData(res);
        if (data?.list) {
          const list = (data.list as HelpCategoryItem[]).map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
          }));
          setCategories(list);
        } else {
          warnLog('HelpCenter', '获取帮助中心分类失败', res);
        }
      } catch (error) {
        errorLog('HelpCenter', '获取帮助中心分类接口异常', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  /**
   * 切换分类展开状态
   */
  const handleToggleCategory = async (cat: HelpCategory) => {
    const isExpanded = expandedCategoryId === cat.id;
    if (isExpanded) {
      setExpandedCategoryId(null);
      return;
    }

    setExpandedCategoryId(cat.id);

    // 如果该分类的问题列表还没有加载，则发起请求
    if (!questionsByCategory[cat.id]) {
      try {
        setLoadingCategoryId(cat.id);
        const res = await fetchHelpQuestions({
          category_id: cat.id,
          category_code: cat.code,
        });
        const data = extractData(res);
        if (data?.list) {
          const list = (data.list as HelpQuestionItem[]).map((item) => ({
            id: item.id,
            categoryId: item.category_id,
            title: item.title,
            content: item.content,
          }));
          setQuestionsByCategory((prev) => ({
            ...prev,
            [cat.id]: list,
          }));
        } else {
          setQuestionsByCategory((prev) => ({
            ...prev,
            [cat.id]: [],
          }));
        }
      } catch (error) {
        errorLog('HelpCenter', '获取帮助中心问题列表接口异常', error);
        setQuestionsByCategory((prev) => ({
          ...prev,
          [cat.id]: [],
        }));
      } finally {
        setLoadingCategoryId(null);
      }
    }
  };

  /**
   * 从详情返回列表
   */
  const handleBackFromDetail = () => {
    setActiveQuestion(null);
  };

  return (
    <PageContainer
      title="帮助中心"
      onBack={activeQuestion ? handleBackFromDetail : () => navigate(-1)}
      padding={false}
    >
      {/* 列表视图 */}
      {!activeQuestion ? (
        <div className="mt-2 space-y-2">
          {/* 加载状态 */}
          {loadingCategories && categories.length === 0 && (
            <div className="py-10">
              <LoadingSpinner text="正在加载帮助中心内容..." />
            </div>
          )}

          {/* 空状态 */}
          {!loadingCategories && categories.length === 0 && (
            <EmptyState title="暂无帮助中心数据" />
          )}

          {/* 分类列表 */}
          {categories.map((cat) => {
            const isExpanded = expandedCategoryId === cat.id;
            const catQuestions = questionsByCategory[cat.id] || [];
            const isLoadingThisCategory = loadingCategoryId === cat.id;

            return (
              <div key={cat.id} className="bg-white">
                <button
                  className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100 active:bg-gray-50"
                  onClick={() => handleToggleCategory(cat)}
                >
                  <span className="text-sm font-medium text-gray-900 text-left">
                    {cat.name}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {isExpanded ? '收起' : '展开'}
                  </span>
                </button>

                {isExpanded && (
                  <div>
                    {/* 加载问题列表中 */}
                    {isLoadingThisCategory && catQuestions.length === 0 && (
                      <div className="px-4 py-3 text-[11px] text-gray-400 border-t border-gray-50">
                        正在加载问题列表...
                      </div>
                    )}

                    {/* 问题列表 */}
                    {!isLoadingThisCategory &&
                      catQuestions.map((q) => (
                        <button
                          key={q.id}
                          className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-50 text-left active:bg-gray-50"
                          onClick={() => setActiveQuestion(q)}
                        >
                          <span className="text-xs text-gray-800">{q.title}</span>
                          <span className="text-[11px] text-gray-400 ml-2">详情</span>
                        </button>
                      ))}

                    {/* 无问题 */}
                    {!isLoadingThisCategory && catQuestions.length === 0 && (
                      <div className="px-4 py-3 text-[11px] text-gray-400 border-t border-gray-50">
                        暂无相关问题
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* 问题详情视图 */
        <div className="p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              {activeQuestion.title}
            </h2>
            <div
              className="text-xs leading-6 text-gray-600 prose prose-sm max-w-none [&_img]:max-w-full [&_img]:h-auto"
              dangerouslySetInnerHTML={{ __html: activeQuestion.content }}
            />
            {activeQuestion.imageUrls && activeQuestion.imageUrls.length > 0 && (
              <div className="mt-3 space-y-2">
                {activeQuestion.imageUrls.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt="帮助说明图片"
                    className="w-full rounded-md border border-gray-100 object-contain"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default HelpCenter;
