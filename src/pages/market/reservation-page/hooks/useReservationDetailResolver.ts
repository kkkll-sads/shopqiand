import { useCallback, useEffect, useState } from 'react'
import type { Product } from '@/types'
import type { CollectionSessionItem } from '@/services'
import { fetchCollectionItemDetail, fetchCollectionSessionDetail } from '@/services'
import { extractData } from '@/utils/apiHelpers'
import { debugLog, warnLog, errorLog } from '@/utils/logger'
import { extractPriceFromZone } from '../helpers'
import { getInitialZoneMaxPrice, getProductPackageId } from './reservationPage.constants'
import type { ReservationDetailResolverResult, ReservationSessionIds } from './reservationPage.types'

export function useReservationDetailResolver(product: Product): ReservationDetailResolverResult {
  const preloaded = window.__preloadedReservationData
  const [sessionId, setSessionId] = useState<number | string | undefined>(
    preloaded?.sessionId ?? product.sessionId ?? product.session_id,
  )
  const [zoneId, setZoneId] = useState<number | string | undefined>(
    preloaded?.zoneId ?? product.zoneId ?? product.zone_id,
  )
  const [packageId, setPackageId] = useState<number | string | undefined>(
    preloaded?.packageId ?? getProductPackageId(product),
  )

  const [, setSessionTitle] = useState<string | undefined>()
  const [, setSessionStartTime] = useState<string | undefined>()
  const [, setSessionEndTime] = useState<string | undefined>()

  const [zoneMaxPrice, setZoneMaxPrice] = useState<number>(() => getInitialZoneMaxPrice(product))
  const [hasUpdatedZoneMaxPrice, setHasUpdatedZoneMaxPrice] = useState<boolean>(
    preloaded?.zoneMaxPrice !== undefined,
  )
  const [triedFillFromDetail, setTriedFillFromDetail] = useState(false)

  const getFallbackSessionIds = useCallback(
    (): ReservationSessionIds => ({
      sessionId: sessionId ?? product.sessionId ?? product.session_id,
      zoneId: zoneId ?? product.zoneId ?? product.zone_id,
      packageId: packageId ?? getProductPackageId(product),
    }),
    [packageId, product, sessionId, zoneId],
  )

  const fillSessionZoneFromDetail = useCallback(async (): Promise<ReservationSessionIds> => {
    if (triedFillFromDetail) {
      return getFallbackSessionIds()
    }

    setTriedFillFromDetail(true)
    if (!product?.id) {
      return getFallbackSessionIds()
    }

    debugLog('ReservationPage', 'Starting auto-fill check for session/zone')

    try {
      const res = await fetchCollectionItemDetail(Number(product.id))
      const data = extractData(res)

      if (data) {
        let detailSessionId = data.session_id ?? data.sessionId ?? data.session?.id ?? data.session?.session_id

        let detailZoneId = data.zone_id ?? data.price_zone_id ?? data.zoneId ?? data.priceZoneId ?? data.zone?.id

        let detailZoneMaxPrice: number | string | undefined
        if (data.price_zone) {
          const parsedPrice = extractPriceFromZone(data.price_zone)
          if (parsedPrice > 0) {
            detailZoneMaxPrice = parsedPrice
          }
        }

        if (!detailZoneMaxPrice) {
          detailZoneMaxPrice =
            data.zone_max_price ?? data.zoneMaxPrice ?? data.max_price ?? data.maxPrice ?? data.zone?.max_price ?? data.price
        }

        const detailPackageId = data.package_id ?? data.packageId ?? data.package?.id

        debugLog('ReservationPage', 'Item detail fetched', {
          detailSessionId,
          detailZoneId,
          detailPackageId,
          priceZone: data.price_zone,
          parsedPriceFromZone: data.price_zone ? extractPriceFromZone(data.price_zone) : null,
          detailZoneMaxPrice,
        })

        if (detailSessionId && (data.price_zone || !detailZoneId || Number(detailZoneId) === 0)) {
          try {
            debugLog('ReservationPage', 'Zone ID missing, fetching session details to map price_zone')
            const sessionRes = await fetchCollectionSessionDetail(Number(detailSessionId))
            const sessionData = extractData(sessionRes) as CollectionSessionItem | null

            if (sessionData) {
              const detailSessionTitle = sessionData.title || sessionData.name
              const detailSessionStartTime = sessionData.start_time || sessionData.startTime
              const detailSessionEndTime = sessionData.end_time || sessionData.endTime

              if (detailSessionTitle) setSessionTitle(detailSessionTitle)
              if (detailSessionStartTime) setSessionStartTime(detailSessionStartTime)
              if (detailSessionEndTime) setSessionEndTime(detailSessionEndTime)
            }

            if (sessionData?.zones?.length) {
              let matchedZone = sessionData.zones.find((zone) => zone.name === data.price_zone)

              if (!matchedZone) {
                const targetPrice = Number(data.price)
                matchedZone = sessionData.zones.find((zone) => {
                  if (zone.name && zone.name.includes(String(Math.floor(targetPrice)))) return true
                  return false
                })
              }

              if (matchedZone) {
                debugLog('ReservationPage', 'Found matching zone from session', matchedZone)
                detailZoneId = matchedZone.id
              } else {
                warnLog('ReservationPage', 'Could not match any zone in session', detailSessionId)
              }
            }
          } catch (error: unknown) {
            errorLog('ReservationPage', 'Failed to fetch session details for zone mapping', error)
          }
        }

        if (detailSessionId) setSessionId(detailSessionId)
        if (detailZoneId && Number(detailZoneId) !== 0) setZoneId(detailZoneId)
        if (detailZoneMaxPrice && !hasUpdatedZoneMaxPrice) {
          setZoneMaxPrice(Number(detailZoneMaxPrice))
          setHasUpdatedZoneMaxPrice(true)
        }
        if (detailPackageId) setPackageId(detailPackageId)

        return {
          sessionId: detailSessionId ?? sessionId ?? product.sessionId ?? product.session_id,
          zoneId:
            detailZoneId && Number(detailZoneId) !== 0
              ? detailZoneId
              : zoneId ?? product.zoneId ?? product.zone_id,
          packageId: detailPackageId ?? packageId ?? getProductPackageId(product),
        }
      }
    } catch (error: unknown) {
      warnLog('ReservationPage', '补全场次/分区失败', error)
    }

    return getFallbackSessionIds()
  }, [getFallbackSessionIds, hasUpdatedZoneMaxPrice, packageId, product, sessionId, triedFillFromDetail, zoneId])

  useEffect(() => {
    if (hasUpdatedZoneMaxPrice) {
      return
    }

    if (sessionId && zoneId && packageId) return
    if (!product?.id) return

    void fillSessionZoneFromDetail()
  }, [fillSessionZoneFromDetail, hasUpdatedZoneMaxPrice, packageId, product?.id, sessionId, zoneId])

  return {
    sessionId,
    zoneId,
    packageId,
    zoneMaxPrice,
    fillSessionZoneFromDetail,
  }
}
