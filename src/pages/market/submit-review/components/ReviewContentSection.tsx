import React from 'react';

interface ReviewContentSectionProps {
  content: string;
  isAnonymous: boolean;
  submitting: boolean;
  onContentChange: (value: string) => void;
  onAnonymousChange: (value: boolean) => void;
}

const ReviewContentSection: React.FC<ReviewContentSectionProps> = ({
  content,
  isAnonymous,
  submitting,
  onContentChange,
  onAnonymousChange,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-base font-bold text-gray-900 mb-3">评价内容</h3>
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="分享你的使用体验，帮助其他买家做出购买决策..."
        className="w-full min-h-[120px] p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
        maxLength={500}
        disabled={submitting}
      />
      <div className="flex items-center justify-between mt-2">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => onAnonymousChange(e.target.checked)}
            disabled={submitting}
            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <span>匿名评价</span>
        </label>
        <span className={`text-xs ${content.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
          {content.length}/500
        </span>
      </div>
    </div>
  );
};

export default ReviewContentSection;
