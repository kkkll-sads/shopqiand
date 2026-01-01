/**
 * UserSurvey - 用户问卷页面
 * 
 * 使用 PageContainer、ResultModal 组件重构
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */


import React, { useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import { ResultModal } from '../../components/common';
import { useModal } from '../../hooks';
import { useNotification } from '../../context/NotificationContext';

/**
 * UserSurvey 组件属性接口
 */
interface UserSurveyProps {
  onBack: () => void;
}

/** 评分选项 */
const RATING_OPTIONS = [1, 2, 3, 4, 5];

/** 使用频率选项 */
const FREQUENCY_OPTIONS = [
  { value: 'daily', label: '几乎每天都会使用' },
  { value: 'weekly', label: '每周使用几次' },
  { value: 'sometimes', label: '偶尔使用' },
  { value: 'first', label: '第一次体验' },
];

/**
 * UserSurvey 用户问卷页面组件
 */
const UserSurvey: React.FC<UserSurveyProps> = ({ onBack }) => {
  const { showToast } = useNotification();
  const [rating, setRating] = useState<number | null>(null);
  const [useFrequency, setUseFrequency] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // 使用 useModal 管理结果弹窗
  const resultModal = useModal();

  /**
   * 处理提交
   */
  const handleSubmit = () => {
    if (!rating) {
      showToast('warning', '请评分', '请先选择整体满意度');
      return;
    }
    setSubmitted(true);
    resultModal.show();
  };

  return (
    <PageContainer title="用户问卷" onBack={onBack}>
      {!submitted ? (
        <>
          {/* 满意度评分 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              您对本应用的整体满意度？
            </h2>
            <div className="flex items-center px-1 space-x-1">
              {RATING_OPTIONS.map((value) => {
                const active = rating !== null && rating >= value;
                return (
                  <button
                    key={value}
                    type="button"
                    className="w-9 h-9 flex items-center justify-center active:opacity-80"
                    onClick={() => setRating(value)}
                  >
                    <span className={`text-2xl ${active ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-[11px] text-gray-400 flex justify-between">
              <span>非常不满意</span>
              <span>非常满意</span>
            </div>
          </div>

          {/* 使用频率和建议 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 mb-4">
            {/* 使用频率 */}
            <div>
              <div className="text-xs text-gray-500 mb-1.5">使用频率</div>
              <div className="flex flex-wrap gap-2">
                {FREQUENCY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-[11px] border text-gray-700 active:opacity-80 ${useFrequency === option.value
                      ? 'bg-orange-50 text-orange-600 border-orange-400'
                      : 'bg-white border-gray-200'
                      }`}
                    onClick={() =>
                      setUseFrequency(useFrequency === option.value ? '' : option.value)
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 建议输入 */}
            <div>
              <div className="text-xs text-gray-500 mb-1.5">
                您最希望我们优化或新增的功能？
              </div>
              <textarea
                className="w-full min-h-[100px] resize-none text-xs border border-gray-200 rounded-md px-3 py-2 outline-none placeholder:text-gray-300 text-gray-800"
                placeholder="欢迎留下您的宝贵意见，例如：界面体验、交易流程、客服响应等"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
              />
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            className="w-full bg-orange-500 text-white text-sm font-semibold py-3 rounded-md active:opacity-80 shadow-sm"
            onClick={handleSubmit}
          >
            提交问卷
          </button>
        </>
      ) : (
        /* 提交成功 */
        <div className="mt-20 flex flex-col items-center text-center px-6">
          <div className="w-14 h-14 rounded-full bg-green-100 text-green-500 flex items-center justify-center mb-3">
            <span className="text-2xl">✓</span>
          </div>
          <div className="text-sm font-semibold text-gray-900 mb-1">
            感谢您的反馈
          </div>
          <p className="text-xs text-gray-500 leading-5">
            您的意见已成功提交，我们会认真评估并不断优化产品体验。
          </p>
        </div>
      )}
    </PageContainer>
  );
};

export default UserSurvey;
