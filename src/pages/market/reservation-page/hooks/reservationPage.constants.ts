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
  (product as any).packageId ?? (product as any).package_id

export const getInitialZoneMaxPrice = (product: Product): number => {
  if (globalThis.__preloadedReservationData?.zoneMaxPrice) {
    return globalThis.__preloadedReservationData.zoneMaxPrice
  }

  const priceZone = (product as any).priceZone || (product as any).price_zone
  if (priceZone) {
    const parsedPrice = extractPriceFromZone(priceZone)
    if (parsedPrice > 0) {
      return parsedPrice
    }
  }

  return Number(product.price)
}
