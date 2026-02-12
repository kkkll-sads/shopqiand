import React from 'react'
import { ChevronRight } from 'lucide-react'

interface ReviewPreviewItem {
  id: number | string
  user_name?: string
  rating: number
  content: string
}

interface ReviewSummaryLike {
  total?: number
  good_rate?: number
  preview?: ReviewPreviewItem[]
}

interface ShopProductReviewsSectionProps {
  sectionRef: React.RefObject<HTMLDivElement | null>
  reviewSummary: ReviewSummaryLike | null
  reviewCount: number
  onOpenReviews: () => void
}

const ShopProductReviewsSection: React.FC<ShopProductReviewsSectionProps> = ({
  sectionRef,
  reviewSummary,
  reviewCount,
  onOpenReviews,
}) => (
  <div className="bg-white mt-2" ref={sectionRef}>
    <div
      className="px-4 py-3 flex items-center justify-between border-b border-gray-50 active:bg-gray-50 cursor-pointer"
      onClick={onOpenReviews}
    >
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-800">买家评价</span>
        <span className="text-gray-400 text-sm">{reviewSummary?.total || reviewCount}+</span>
      </div>
      <div className="flex items-center text-xs text-gray-500">
        <span>好评度</span>
        <span className="text-gray-900 font-bold ml-1">{reviewSummary?.good_rate || 100}%</span>
        <ChevronRight size={14} className="text-gray-400" />
      </div>
    </div>

    <div className="divide-y divide-gray-50">
      {reviewSummary?.preview && reviewSummary.preview.length > 0 ? (
        reviewSummary.preview.map((review) => (
          <div key={review.id} className="px-4 py-3 active:bg-gray-50 cursor-pointer" onClick={onOpenReviews}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold border border-gray-200">
                {(review.user_name || '匿名').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">{review.user_name || '匿名用户'}</span>
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                    {'★'.repeat(review.rating)}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{review.content}</p>
          </div>
        ))
      ) : (
        <div className="px-4 py-6 text-center text-gray-400 text-sm">暂无评价，快来抢先评价吧~</div>
      )}
    </div>
  </div>
)

export default ShopProductReviewsSection
