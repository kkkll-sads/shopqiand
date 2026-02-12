import React from 'react';
import { Star } from 'lucide-react';

interface ReviewRatingSectionProps {
  rating: number;
  submitting: boolean;
  onChange: (rating: number) => void;
}

const getRatingText = (rating: number): string => {
  if (rating === 5) return '非常满意';
  if (rating === 4) return '满意';
  if (rating === 3) return '一般';
  if (rating === 2) return '不满意';
  return '非常不满意';
};

const ReviewRatingSection: React.FC<ReviewRatingSectionProps> = ({
  rating,
  submitting,
  onChange,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-base font-bold text-gray-900 mb-4">评分</h3>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className="p-1 active:scale-95 transition-transform"
            disabled={submitting}
          >
            <Star
              size={40}
              className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
              strokeWidth={1.5}
            />
          </button>
        ))}
        <span className="ml-2 text-base text-gray-600 font-medium">{getRatingText(rating)}</span>
      </div>
    </div>
  );
};

export default ReviewRatingSection;
