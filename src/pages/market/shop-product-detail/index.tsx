/**
 * ShopProductDetail - 商城商品详情页（京东风格）
 * 已重构: 拆分为多个子组件和 hooks
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomSheet from '@/components/common/BottomSheet'
import AddressSheet from '@/components/business/AddressSheet'
import ServiceSheet from '@/components/business/ServiceSheet'
import BuySpecSheet from '@/components/shop/BuySpecSheet'
import { LoadingSpinner } from '@/components/common'
import { Product } from '@/types'
import { ShopProductDetailData } from '@/services'
import { debugLog } from '@/utils/logger'
import {
  ProductGallery,
  ProductInfo,
  ProductSpecs,
  ProductActions,
  SkuSwitcher,
} from '../components/product'
import { useProductDetail } from '../hooks/useProductDetail'
import { useProductBuy } from '../hooks/useProductBuy'
import { useShopProductDetailNavigation } from './hooks/useShopProductDetailNavigation'
import { mergeDisplayImages, getSpecsForBuySheet } from './utils'
import {
  ShopProductHeader,
  ShopProductServiceCards,
  ShopProductReviewsSection,
  ShopProductDescriptionSection,
} from './components'

interface ShopProductDetailProps {
  product: Product
  hideActions?: boolean
  initialData?: ShopProductDetailData | null
}

const ShopProductDetail: React.FC<ShopProductDetailProps> = ({
  product,
  hideActions = false,
  initialData = null,
}) => {
  const navigate = useNavigate()

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showAddressSheet, setShowAddressSheet] = useState(false)
  const [showServiceSheet, setShowServiceSheet] = useState(false)
  const [showBuySpecSheet, setShowBuySpecSheet] = useState(false)
  const [preSelectedValueIds, setPreSelectedValueIds] = useState<Record<number, number>>({})
  const [skuPreviewImage, setSkuPreviewImage] = useState<string | null>(null)

  const {
    activeTab,
    headerStyle,
    productSectionRef,
    reviewsSectionRef,
    detailSectionRef,
    handleTabClick,
  } = useShopProductDetailNavigation()

  const {
    detailData,
    reviewSummary,
    loading,
    hasError,
    errorMessage,
    displayTitle,
    displayPrice,
    maxPrice,
    showPriceRange,
    scorePrice,
    salesCount,
    reviewCount,
    detailImages,
    safeShopImages,
    hasSelectableSpecs,
  } = useProductDetail({ product, initialData })

  const {
    selectedSpecs,
    buyQuantity,
    selectedSkuId,
    buying,
    handleConfirmBuy,
    setBuyQuantity,
    setSelectedSkuId,
  } = useProductBuy({
    productId: product.id,
    productTitle: displayTitle,
    isPhysical: detailData?.is_physical === '1',
  })

  const handleBuy = useCallback(() => {
    if (buying) return
    setShowBuySpecSheet(true)
  }, [buying])

  const displayImages = useMemo(() => mergeDisplayImages(safeShopImages, skuPreviewImage), [safeShopImages, skuPreviewImage])

  useEffect(() => {
    if (skuPreviewImage) {
      setCurrentImageIndex(0)
    }
  }, [skuPreviewImage])

  const mainImage = displayImages[currentImageIndex] || detailData?.thumbnail || product.image
  const specsForBuySheet = useMemo(() => getSpecsForBuySheet(detailData?.specs || []), [detailData?.specs])

  const handleOpenReviews = useCallback(() => {
    navigate(`/reviews/${product.id}?name=${encodeURIComponent(displayTitle)}`)
  }, [navigate, product.id, displayTitle])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    )
  }

  if (hasError) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">{errorMessage}</div>
  }

  return (
    <div className="bg-[#f5f5f5]" style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}>
      <ShopProductHeader
        headerStyle={headerStyle}
        activeTab={activeTab}
        onBack={() => navigate(-1)}
        onTabClick={handleTabClick}
      />

      <div className="relative" ref={productSectionRef}>
        <ProductGallery images={displayImages} currentIndex={currentImageIndex} onIndexChange={setCurrentImageIndex} />
      </div>

      {(detailData?.has_sku === '1' || detailData?.has_sku === 1) && detailData?.sku_specs?.length && detailData?.skus?.length ? (
        <SkuSwitcher
          skuSpecs={detailData.sku_specs}
          skus={detailData.skus}
          selectedSkuId={selectedSkuId}
          onSkuSelect={(sku, specValueIds) => {
            setPreSelectedValueIds(specValueIds)
            if (sku) {
              setSelectedSkuId(sku.id)
              if (sku.image) {
                setSkuPreviewImage(sku.image)
              }
            }
          }}
        />
      ) : null}

      <ProductInfo
        title={displayTitle}
        price={displayPrice}
        maxPrice={maxPrice}
        showPriceRange={showPriceRange}
        scorePrice={scorePrice}
        salesCount={salesCount}
      />

      <ShopProductServiceCards
        onOpenService={() => setShowServiceSheet(true)}
        onOpenAddress={() => setShowAddressSheet(true)}
      />

      <ProductSpecs
        selectedSpecs={selectedSpecs}
        quantity={buyQuantity}
        hasSelectableSpecs={hasSelectableSpecs}
        onOpen={() => setShowBuySpecSheet(true)}
      />

      <ShopProductReviewsSection
        sectionRef={reviewsSectionRef}
        reviewSummary={reviewSummary}
        reviewCount={reviewCount}
        onOpenReviews={handleOpenReviews}
      />

      <ShopProductDescriptionSection
        sectionRef={detailSectionRef}
        description={detailData?.description}
        detailImages={detailImages}
        mainImage={mainImage}
      />

      <ProductActions buying={buying} onBuy={handleBuy} hideActions={hideActions} />

      <BottomSheet visible={showAddressSheet} title="选择地址" onClose={() => setShowAddressSheet(false)}>
        <AddressSheet
          visible={showAddressSheet}
          onSelectAddress={(address) => {
            debugLog('ShopProductDetail', '选择地址', address)
            setShowAddressSheet(false)
          }}
          onAddAddress={() => {
            navigate('/address-list')
            setShowAddressSheet(false)
          }}
        />
      </BottomSheet>

      <BottomSheet visible={showServiceSheet} title="安心保障" onClose={() => setShowServiceSheet(false)}>
        <ServiceSheet productName={displayTitle} />
      </BottomSheet>

      <BuySpecSheet
        visible={showBuySpecSheet}
        onClose={() => setShowBuySpecSheet(false)}
        productName={displayTitle}
        productImage={mainImage}
        price={displayPrice}
        scorePrice={scorePrice}
        stock={detailData?.stock ?? 999}
        maxPurchase={detailData?.max_purchase ?? 99}
        specs={specsForBuySheet}
        hasSku={detailData?.has_sku === '1' || detailData?.has_sku === 1}
        skuSpecs={detailData?.sku_specs || []}
        skus={detailData?.skus || []}
        priceRange={detailData?.price_range}
        preSelectedValueIds={preSelectedValueIds}
        onConfirm={handleConfirmBuy}
      />
    </div>
  )
}

export default ShopProductDetail
