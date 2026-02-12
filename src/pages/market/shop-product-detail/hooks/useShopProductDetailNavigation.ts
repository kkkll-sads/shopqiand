import { useState, useRef, useEffect, useCallback, type RefObject } from 'react'
import type { ShopDetailTab } from '../types'

interface UseShopProductDetailNavigationResult {
  activeTab: ShopDetailTab
  headerStyle: 'transparent' | 'white'
  productSectionRef: RefObject<HTMLDivElement | null>
  reviewsSectionRef: RefObject<HTMLDivElement | null>
  detailSectionRef: RefObject<HTMLDivElement | null>
  handleTabClick: (tab: ShopDetailTab) => void
}

const HEADER_SWITCH_THRESHOLD = 300
const TAB_SWITCH_OFFSET = 100

export function useShopProductDetailNavigation(): UseShopProductDetailNavigationResult {
  const [activeTab, setActiveTab] = useState<ShopDetailTab>('product')
  const [headerStyle, setHeaderStyle] = useState<'transparent' | 'white'>('transparent')

  const productSectionRef = useRef<HTMLDivElement>(null)
  const reviewsSectionRef = useRef<HTMLDivElement>(null)
  const detailSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > HEADER_SWITCH_THRESHOLD) {
        setHeaderStyle('white')
      } else {
        setHeaderStyle('transparent')
      }

      const detailTop = detailSectionRef.current?.offsetTop ?? Infinity
      const reviewsTop = reviewsSectionRef.current?.offsetTop ?? Infinity

      if (currentScrollY + TAB_SWITCH_OFFSET >= detailTop) {
        setActiveTab('detail')
      } else if (currentScrollY + TAB_SWITCH_OFFSET >= reviewsTop) {
        setActiveTab('reviews')
      } else {
        setActiveTab('product')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleTabClick = useCallback((tab: ShopDetailTab) => {
    setActiveTab(tab)

    const targetRefMap = {
      product: productSectionRef,
      reviews: reviewsSectionRef,
      detail: detailSectionRef,
    } as const

    targetRefMap[tab].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return {
    activeTab,
    headerStyle,
    productSectionRef,
    reviewsSectionRef,
    detailSectionRef,
    handleTabClick,
  }
}
