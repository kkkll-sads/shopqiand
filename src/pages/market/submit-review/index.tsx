/**
 * SubmitReview - 提交商品评价页面
 *
 * 用于用户对已完成的订单进行评价
 * 支持评分、文字评价、图片上传、匿名评价
 */
import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useNotification } from '@/context/NotificationContext'
import ReviewProductCard from './components/ReviewProductCard'
import ReviewRatingSection from './components/ReviewRatingSection'
import ReviewContentSection from './components/ReviewContentSection'
import ReviewImageUploader from './components/ReviewImageUploader'
import ReviewVideoUploader from './components/ReviewVideoUploader'
import ReviewErrorAlert from './components/ReviewErrorAlert'
import ReviewSubmitBar from './components/ReviewSubmitBar'
import { useSubmitReviewForm } from './hooks/useSubmitReviewForm'

const SubmitReview: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useNotification()

  const orderId = searchParams.get('order_id')
  const productId = searchParams.get('product_id')
  const productName = searchParams.get('name') || '商品'
  const productImage = searchParams.get('image') || ''

  const {
    rating,
    content,
    isAnonymous,
    imageUploadStates,
    videoUploadState,
    fileInputRef,
    videoInputRef,
    errorMessage,
    hasError,
    submitting,
    setRating,
    setContent,
    setIsAnonymous,
    handleImageSelect,
    handleRemoveImage,
    handleVideoSelect,
    handleRemoveVideo,
    handleSubmit,
  } = useSubmitReviewForm({
    orderId,
    productId,
    onSubmitSuccess: (successOrderId) => {
      setTimeout(() => {
        navigate(`/order/${successOrderId}`)
      }, 1500)
    },
  })

  useEffect(() => {
    if (!orderId || !productId) {
      showToast('error', '参数错误', '缺少必要的订单或商品信息')
      setTimeout(() => navigate(-1), 1500)
    }
  }, [orderId, productId, navigate, showToast])

  if (!orderId || !productId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 mb-4">参数错误</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-red-600 text-white rounded-lg">
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full active:bg-gray-100 transition-colors"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="flex-1 text-center pr-9 font-bold text-gray-900 text-lg">商品评价</h1>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        <ReviewProductCard productImage={productImage} productName={productName} orderId={orderId} />

        <ReviewRatingSection rating={rating} submitting={submitting} onChange={setRating} />

        <ReviewContentSection
          content={content}
          isAnonymous={isAnonymous}
          submitting={submitting}
          onContentChange={setContent}
          onAnonymousChange={setIsAnonymous}
        />

        <ReviewImageUploader
          imageUploadStates={imageUploadStates}
          submitting={submitting}
          onRemoveImage={handleRemoveImage}
          onPickImage={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
          disabled={submitting}
        />

        <ReviewVideoUploader
          videoUploadState={videoUploadState}
          submitting={submitting}
          onRemoveVideo={handleRemoveVideo}
          onPickVideo={() => videoInputRef.current?.click()}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoSelect}
          className="hidden"
          disabled={submitting}
        />

        {hasError && <ReviewErrorAlert message={errorMessage} />}
      </div>

      <ReviewSubmitBar
        submitting={submitting}
        disabled={submitting || !content.trim()}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default SubmitReview
