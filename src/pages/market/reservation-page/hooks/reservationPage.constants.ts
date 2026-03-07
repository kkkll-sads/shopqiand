import { Product } from '@/types'
import { extractPriceFromZone } from '../helpers'

export const fallbackProduct: Product = {
  id: '0',
  title: '',
  image: '',
  artist: '',
  price: 0,
  category: '',
}

export const baseHashrate = 5

export const getProductPackageId = (product: Product): number | string | undefined =>
  product.packageId ?? product.package_id

export const getInitialZoneMaxPrice = (product: Product): number => {
  const preloaded = window.__preloadedReservationData
  if (preloaded?.zoneMaxPrice) {
    return preloaded.zoneMaxPrice
  }

  const priceZone = product.priceZone ?? product.price_zone
  if (priceZone) {
    const parsedPrice = extractPriceFromZone(priceZone)
    if (parsedPrice > 0) {
      return parsedPrice
    }
  }

  return Number(product.price)
}
