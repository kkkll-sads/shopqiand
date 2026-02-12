/**
 * CollectionCertificate - 藏品证书详情页
 *
 * 专门用于数字藏品/权益证书的详情展示
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common';
import PopupAnnouncementModal from '@/components/common/PopupAnnouncementModal';
import { Product } from '@/types';
import {
  fetchCollectionItemDetail,
  CollectionItemDetailData,
  fetchAnnouncements,
  AnnouncementItem,
} from '@/services';
import { useNotification } from '@/context/NotificationContext';
import { debugLog, errorLog } from '@/utils/logger';
import { isSuccess, extractData } from '@/utils/apiHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { copyToClipboard } from '@/utils/clipboard';
import CertificateBottomAction from './components/CertificateBottomAction';
import CertificateDocument from './components/CertificateDocument';
import CertificatePageHeader from './components/CertificatePageHeader';
import {
  extractPriceFromZone,
  getAssetAnchorInfo,
  getDisplayPrice,
  getSessionInfo,
} from './helpers';

// 全局预加载数据存储
declare global {
  var __preloadedReservationData: {
    userInfo?: { availableHashrate: number; accountBalance: number };
    sessionDetail?: CollectionItemDetailData | null;
    zoneMaxPrice?: number;
    sessionId?: number | string;
    zoneId?: number | string;
    packageId?: number | string;
  } | null;
}

interface CertificateDetailData extends CollectionItemDetailData {
  priceZone?: string;
  sessionId?: number | string;
  zoneId?: number | string;
  zone_max_price?: number | string;
  zoneMaxPrice?: number | string;
  max_price?: number | string;
  maxPrice?: number | string;
  price_zone_id?: number | string;
  session?: {
    id?: number | string;
  };
}

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
};

interface CollectionCertificateProps {
  product: Product;
  /** 是否隐藏底部操作区域 */
  hideActions?: boolean;
  /** 预加载的详情数据 */
  initialData?: CollectionItemDetailData | null;
  /** 更新选中产品信息的回调 */
  onProductUpdate?: (updatedProduct: Product) => void;
}

const CollectionCertificate: React.FC<CollectionCertificateProps> = ({
  product,
  hideActions = false,
  initialData = null,
  onProductUpdate,
}) => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const { errorMessage, hasError, handleError, clearError } = useErrorHandler();

  const [detailData, setDetailData] = useState<CollectionItemDetailData | null>(initialData);

  const [showTradingNotice, setShowTradingNotice] = useState(false);
  const [tradingNoticeAnnouncement, setTradingNoticeAnnouncement] =
    useState<AnnouncementItem | null>(null);

  const detailMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: initialData ? LoadingState.SUCCESS : LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });

  const loading = detailMachine.state === LoadingState.LOADING;

  useEffect(() => {
    document.body.classList.add('certificate-page');

    return () => {
      document.body.classList.remove('certificate-page');
    };
  }, []);

  useEffect(() => {
    if (initialData) {
      setDetailData(initialData);
      detailMachine.send(LoadingEvent.SUCCESS);
      return;
    }

    const loadDetail = async () => {
      try {
        detailMachine.send(LoadingEvent.LOAD);
        clearError();

        const response = await fetchCollectionItemDetail(product.id);
        const data = extractData(response);

        if (data) {
          setDetailData(data);
          detailMachine.send(LoadingEvent.SUCCESS);
        } else {
          handleError(response, {
            persist: true,
            showToast: false,
            customMessage: '获取证书详情失败',
          });
          detailMachine.send(LoadingEvent.ERROR);
        }
      } catch (err: unknown) {
        handleError(err, {
          persist: true,
          showToast: false,
          customMessage: '数据同步延迟，请重试',
          context: { productId: product.id },
        });
        detailMachine.send(LoadingEvent.ERROR);
      }
    };

    loadDetail();
  }, [product.id, initialData]);

  useEffect(() => {
    const loadTradingNotice = async () => {
      try {
        const response = await fetchAnnouncements({ page: 1, limit: 10, type: 'normal' });
        if (isSuccess(response) && response.data?.list) {
          const notice = response.data.list.find(
            (item: AnnouncementItem) => item.title && item.title.includes('交易须知')
          );
          if (notice) {
            const dismissedKey = `trading_notice_dismissed_${notice.id}`;
            const dismissedDate = localStorage.getItem(dismissedKey);
            const today = new Date().toDateString();
            if (dismissedDate !== today) {
              setTradingNoticeAnnouncement(notice);
              setShowTradingNotice(true);
            }
          }
        }
      } catch (error) {
        errorLog('CollectionCertificate', '加载交易须知失败', error);
      }
    };

    loadTradingNotice();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <LoadingSpinner />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-gray-500">
        {errorMessage}
      </div>
    );
  }

  const displayTitle = detailData?.title || product.title;
  const txHash = detailData?.tx_hash;
  const assetCode = detailData?.asset_code;
  const supplierName = detailData?.supplier_name;

  const { sessionName, sessionTime } = getSessionInfo(detailData);
  const { coreEnterprise, farmerInfo, assetStatus } = getAssetAnchorInfo(detailData, supplierName);

  const normalizedDetail = detailData as CertificateDetailData | null;
  const displayPriceNum = getDisplayPrice(detailData, Number(product.price));
  const priceZone = normalizedDetail?.price_zone || normalizedDetail?.priceZone;

  const detailSessionId: Product['sessionId'] =
    normalizedDetail?.session_id || normalizedDetail?.sessionId || normalizedDetail?.session?.id;
  const detailZoneId: Product['zoneId'] =
    normalizedDetail?.zone_id || normalizedDetail?.price_zone_id || normalizedDetail?.zoneId;

  if (!product.sessionId && detailSessionId) {
    product.sessionId = detailSessionId;
  }
  if (!product.zoneId && detailZoneId) {
    product.zoneId = detailZoneId;
  }

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      showToast('success', '复制成功', 'Tx Hash 已复制到剪贴板');
    } else {
      showToast('error', '复制失败', '请手动复制');
    }
  };

  const handleApplyConfirmation = () => {
    debugLog('collectionCertificate.applyConfirmation', '点击申请确权', {
      id: product.id,
      title: product.title,
    });

    if (detailData && onProductUpdate) {
      const detailForUpdate = detailData as CertificateDetailData;
      const updatedProduct: Product = {
        ...product,
        sessionId: detailForUpdate.session_id || detailForUpdate.sessionId || product.sessionId,
        zoneId: detailForUpdate.zone_id || detailForUpdate.price_zone_id || product.zoneId,
      };
      onProductUpdate(updatedProduct);
    }

    if (detailData) {
      const detailForCalc = detailData as CertificateDetailData;
      let zoneMaxPrice: number | undefined;

      if (detailForCalc.price_zone) {
        const parsedPrice = extractPriceFromZone(detailForCalc.price_zone);
        if (parsedPrice > 0) zoneMaxPrice = parsedPrice;
      }

      if (!zoneMaxPrice) {
        zoneMaxPrice =
          toNumberOrUndefined(detailForCalc.zone_max_price) ??
          toNumberOrUndefined(detailForCalc.zoneMaxPrice) ??
          toNumberOrUndefined(detailForCalc.max_price) ??
          toNumberOrUndefined(detailForCalc.maxPrice) ??
          toNumberOrUndefined(detailForCalc.price);
      }

      if (zoneMaxPrice) {
        if (!globalThis.__preloadedReservationData) {
          globalThis.__preloadedReservationData = {};
        }
        globalThis.__preloadedReservationData.zoneMaxPrice = zoneMaxPrice;
      }
    }

    navigate('/reservation');
  };

  return (
    <div
      className={`min-h-screen bg-[#FDFBF7] text-gray-900 font-serif ${
        hideActions ? 'pb-6' : 'pb-24'
      } relative overflow-hidden`}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />

      <CertificatePageHeader onBack={() => navigate(-1)} />

      <CertificateDocument
        assetCode={assetCode}
        displayTitle={displayTitle}
        artist={product.artist}
        description={detailData?.description}
        sessionName={sessionName}
        sessionTime={sessionTime}
        priceZone={priceZone}
        coreEnterprise={coreEnterprise}
        farmerInfo={farmerInfo}
        assetStatus={assetStatus}
        txHash={txHash}
        supplierName={supplierName}
        onCopyTxHash={handleCopy}
      />

      {!hideActions && (
        <CertificateBottomAction
          displayPriceNum={displayPriceNum}
          hasReservation={Boolean(product.reservationId)}
          onApplyConfirmation={handleApplyConfirmation}
        />
      )}

      <PopupAnnouncementModal
        visible={showTradingNotice}
        announcement={tradingNoticeAnnouncement}
        onClose={() => setShowTradingNotice(false)}
        onDontShowToday={() => {
          if (tradingNoticeAnnouncement) {
            const dismissedKey = `trading_notice_dismissed_${tradingNoticeAnnouncement.id}`;
            localStorage.setItem(dismissedKey, new Date().toDateString());
          }
        }}
      />
    </div>
  );
};

export default CollectionCertificate;
