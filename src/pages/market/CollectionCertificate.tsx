/**
 * CollectionCertificate - 藏品证书详情页
 * 
 * 专门用于数字藏品/权益证书的详情展示
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, Shield, Award, Gavel, TrendingUp, BadgeCheck } from 'lucide-react';
import { LoadingSpinner } from '../../../components/common';
import PopupAnnouncementModal from '../../../components/common/PopupAnnouncementModal';
import { Product } from '../../../types';
import {
  fetchCollectionItemDetail,
  CollectionItemDetailData,
  fetchAnnouncements,
  AnnouncementItem,
} from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { debugLog } from '../../../utils/logger';
import { isSuccess, extractData } from '../../../utils/apiHelpers';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '../../../types/states';

// 全局预加载数据存储
declare global {
  var __preloadedReservationData: {
    userInfo?: { availableHashrate: number; accountBalance: number };
    sessionDetail?: any;
    zoneMaxPrice?: number;
    sessionId?: number | string;
    zoneId?: number | string;
    packageId?: number | string;
  } | null;
}

/**
 * 从价格分区字符串中提取价格数字
 */
const extractPriceFromZone = (priceZone?: string): number => {
  if (!priceZone) return 0;
  
  const upperZone = priceZone.toUpperCase();
  if (upperZone.includes('K')) {
    const match = upperZone.match(/(\d+)\s*K/i);
    if (match) return Number(match[1]) * 1000;
  }
  
  const match = priceZone.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
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
  onProductUpdate 
}) => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const {
    errorMessage,
    hasError,
    handleError,
    clearError
  } = useErrorHandler();

  const [detailData, setDetailData] = useState<CollectionItemDetailData | null>(initialData);

  // 交易须知公告
  const [showTradingNotice, setShowTradingNotice] = useState(false);
  const [tradingNoticeAnnouncement, setTradingNoticeAnnouncement] = useState<AnnouncementItem | null>(null);

  // 状态机
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

  // 证书页面专用限制：挂载时添加 class，卸载时移除
  useEffect(() => {
    document.body.classList.add('certificate-page');
    
    return () => {
      document.body.classList.remove('certificate-page');
    };
  }, []);

  // 加载藏品详情
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
            customMessage: '获取证书详情失败'
          });
          detailMachine.send(LoadingEvent.ERROR);
        }
      } catch (err: any) {
        handleError(err, {
          persist: true,
          showToast: false,
          customMessage: '数据同步延迟，请重试',
          context: { productId: product.id }
        });
        detailMachine.send(LoadingEvent.ERROR);
      }
    };

    loadDetail();
  }, [product.id, initialData]);

  // 加载交易须知
  useEffect(() => {
    const loadTradingNotice = async () => {
      try {
        const response = await fetchAnnouncements({ page: 1, limit: 10, type: 'normal' });
        if (isSuccess(response) && response.data?.list) {
          const notice = response.data.list.find((item: AnnouncementItem) =>
            item.title && item.title.includes('交易须知')
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
        console.error('加载交易须知失败:', error);
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

  // 藏品数据
  const displayTitle = detailData?.title || product.title;
  const txHash = detailData?.tx_hash;
  const assetCode = detailData?.asset_code;
  const supplierName = detailData?.supplier_name;

  // 专场信息
  const sessionName = detailData?.session_name || detailData?.sessionName || detailData?.session_title || detailData?.session?.name;
  const sessionStartTime = detailData?.session_start_time || detailData?.sessionStartTime || detailData?.session?.start_time;
  const sessionEndTime = detailData?.session_end_time || detailData?.sessionEndTime || detailData?.session?.end_time;
  const sessionTime = sessionStartTime || sessionEndTime
    ? `${sessionStartTime || ''}${sessionStartTime && sessionEndTime ? ' - ' : ''}${sessionEndTime || ''}`
    : '';

  // 资产锚定
  const coreEnterprise = detailData?.core_enterprise || detailData?.coreEnterprise || supplierName;
  const farmerInfo = detailData?.farmer_info || detailData?.farmerInfo || detailData?.farmer_count_text;
  const assetStatus = detailData?.asset_status || detailData?.assetStatus || detailData?.status_text || detailData?.status;

  // 价格计算
  const actualPrice = Number(detailData?.price ?? product.price);
  const pZone = detailData?.price_zone || (detailData as any)?.priceZone;
  let displayPriceNum = actualPrice;
  
  if (pZone) {
    const zonePriceNum = extractPriceFromZone(pZone);
    if (zonePriceNum > 0) displayPriceNum = zonePriceNum;
  }

  // 更新 product 的场次/分区信息
  const detailSessionId = detailData?.session_id || detailData?.sessionId || detailData?.session?.id;
  const detailZoneId = detailData?.zone_id || detailData?.price_zone_id || detailData?.zoneId;
  
  if (!product.sessionId && detailSessionId) {
    product.sessionId = detailSessionId as any;
  }
  if (!product.zoneId && detailZoneId) {
    product.zoneId = detailZoneId as any;
  }

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  // 申请确权
  const handleApplyConfirmation = () => {
    debugLog('collectionCertificate.applyConfirmation', '点击申请确权', {
      id: product.id,
      title: product.title,
    });

    if (detailData && onProductUpdate) {
      const updatedProduct: Product = {
        ...product,
        sessionId: (detailData as any).session_id || (detailData as any).sessionId || product.sessionId,
        zoneId: (detailData as any).zone_id || (detailData as any).price_zone_id || product.zoneId,
      };
      onProductUpdate(updatedProduct);
    }

    // 设置 zoneMaxPrice 到全局预加载数据
    if (detailData) {
      let zoneMaxPrice: number | undefined;

      if ((detailData as any).price_zone) {
        const parsedPrice = extractPriceFromZone((detailData as any).price_zone);
        if (parsedPrice > 0) zoneMaxPrice = parsedPrice;
      }

      if (!zoneMaxPrice) {
        zoneMaxPrice =
          (detailData as any).zone_max_price ??
          (detailData as any).zoneMaxPrice ??
          (detailData as any).max_price ??
          (detailData as any).maxPrice ??
          (detailData as any).price;
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
    <div className={`min-h-screen bg-[#FDFBF7] text-gray-900 font-serif ${hideActions ? 'pb-6' : 'pb-24'} relative overflow-hidden`}>
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-sm px-4 py-4 flex justify-between items-center border-b border-amber-900/5">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-800">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">数字权益证书</h1>
        <div className="w-10" />
      </header>

      {/* Certificate Container */}
      <div className="p-5">
        <div className="bg-white relative shadow-2xl shadow-gray-200/50 rounded-sm overflow-hidden border-[6px] border-double border-amber-900/10 p-6 md:p-8">

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Shield size={200} />
          </div>

          {/* Top Logo Area */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-900 mb-3 border border-amber-100">
              <Award size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-wide mb-1">数字产权登记证书</h2>
            <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Digital Property Rights Certificate</div>
          </div>

          {/* Certificate Fields */}
          <div className="space-y-6 relative z-10 font-sans">
            {/* Core Info Area */}
            <div className="text-center py-6 mb-2 relative">
              <div
                className="absolute inset-0 opacity-[0.15] pointer-events-none rounded-lg border border-amber-900/5"
                style={{
                  backgroundImage: 'radial-gradient(circle, #C5A572 1px, transparent 1px), radial-gradient(circle, #C5A572 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 10px 10px',
                }}
              />

              {assetCode && (
                <div className="text-xs text-gray-500 font-[DINAlternate-Bold,Roboto,sans-serif] tracking-widest mb-3 relative z-10">
                  确权编号：{assetCode}
                </div>
              )}

              <h3 className={`${displayTitle.length > 12 ? 'text-lg' : displayTitle.length > 8 ? 'text-xl' : displayTitle.length > 5 ? 'text-2xl' : 'text-3xl'} font-extrabold text-gray-700 mb-3 font-serif tracking-tight leading-tight relative z-10 drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis px-2`}>
                【{displayTitle}】
              </h3>

              <div className="text-base font-bold text-[#C5A572] tracking-wide relative z-10">
                {product.artist || '—'}
              </div>

              {/* Official Stamp */}
              <div className="absolute -right-4 -bottom-6 w-32 h-32 opacity-90 -rotate-12 mix-blend-multiply z-20 pointer-events-none">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <path id="textCircleTop" d="M 25,100 A 75,75 0 1,1 175,100" fill="none" />
                    <filter id="roughPaper">
                      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
                      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                    </filter>
                  </defs>
                  <g filter="url(#roughPaper)" fill="#D60000" stroke="none">
                    <circle cx="100" cy="100" r="96" fill="none" stroke="#D60000" strokeWidth="3" />
                    <circle cx="100" cy="100" r="92" fill="none" stroke="#D60000" strokeWidth="1" />
                    <text fontSize="14" fontWeight="bold" fontFamily="SimSun, serif" fill="#D60000">
                      <textPath href="#textCircleTop" startOffset="50%" textAnchor="middle" spacing="auto">
                        树交所数字资产登记结算中心
                      </textPath>
                    </text>
                    <text x="100" y="100" fontSize="40" textAnchor="middle" dominantBaseline="middle" fill="#D60000">★</text>
                    <text x="100" y="135" fontSize="18" fontWeight="bold" fontFamily="SimHei, sans-serif" textAnchor="middle" fill="#D60000">确权专用章</text>
                    <text x="100" y="155" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="bold" textAnchor="middle" fill="#D60000" letterSpacing="1">37010299821</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Description */}
            {detailData?.description && (
              <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-100">
                <div className="text-xs font-bold text-amber-700 uppercase mb-1 tracking-wider">Description / 商品描述</div>
                <div className="text-sm text-amber-900 leading-relaxed">{detailData.description}</div>
              </div>
            )}

            {/* Session Info & Price Zone */}
            {(sessionName || sessionTime.trim() || detailData?.price_zone) && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Session / 专场</label>
                    <div className="text-sm font-bold text-gray-600">{sessionName || '—'}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Trading Window / 场次时间</label>
                    <div className="text-sm font-bold text-gray-600">{sessionTime || '—'}</div>
                  </div>
                </div>
                {detailData?.price_zone && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Price Zone / 价格分区</label>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                        {detailData.price_zone}
                      </span>
                      <span className="text-xs text-gray-400">（申购价按分区统一定价）</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Asset Anchor */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2">
              <div className="flex items-start gap-3">
                <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-0.5">Asset Anchor / 资产锚定</label>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-600 flex items-start gap-2">
                      <span className="whitespace-nowrap">核心企业：</span>
                      <span className="text-gray-700 break-words">{coreEnterprise || '—'}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-600 flex items-start gap-2">
                      <span className="whitespace-nowrap">关联农户：</span>
                      <span className="text-gray-700 break-words">{farmerInfo || '—'}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-600 flex items-start gap-2">
                      <span className="whitespace-nowrap">资产状态：</span>
                      <span className="text-gray-700 break-words">{assetStatus || '—'}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500">数据已脱敏，持有人可申请解密查看。</div>
                </div>
              </div>
            </div>

            {/* On-chain Info */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">On-chain Proof / 上链信息</label>
              <div className="bg-gray-900 text-green-500 font-mono text-[10px] p-3 rounded break-all leading-relaxed relative group hover:bg-gray-800 transition-colors">
                {txHash && (
                  <button
                    onClick={() => {
                      copyToClipboard(txHash).then(() => {
                        showToast('success', '复制成功', 'Tx Hash 已复制到剪贴板');
                      }).catch(() => {
                        showToast('error', '复制失败', '请手动复制');
                      });
                    }}
                    className="absolute right-2 top-2 p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
                    title="点击复制"
                  >
                    <Copy size={12} className="text-gray-500 group-hover:text-green-400" />
                  </button>
                )}
                <div className="flex items-center gap-2 mb-2 text-gray-500 font-sans font-bold">
                  <BadgeCheck size={12} />
                  <span className="uppercase">Tx Hash</span>
                </div>
                {txHash ? (
                  <div className="bg-black/30 p-2 rounded text-green-400 break-all">{txHash}</div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      <div className="absolute inset-0 border-2 border-transparent border-t-amber-500 rounded-full animate-[spin_1.5s_linear_infinite]"></div>
                      <div className="absolute inset-1 border-2 border-transparent border-b-amber-300 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
                    </div>
                    <span className="text-xs font-bold animate-pulse">⛓️ 链上节点正在算力撮合中...</span>
                  </div>
                )}
              </div>
              {supplierName && (
                <div className="bg-gray-50 border border-gray-100 rounded p-3 text-[12px] text-gray-700 flex items-center gap-2">
                  <Shield size={14} className="text-amber-600" />
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase">Supplier</div>
                    <div className="text-sm font-medium text-gray-600">{supplierName}</div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Action */}
      {!hideActions && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50">
          <div className="flex justify-end mb-2">
            <span className="text-[10px] text-gray-900 bg-white px-1 py-0.5">
              本次申购需冻结：¥{displayPriceNum.toFixed(2)} | 消耗算力：5
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-left">
              <div className="flex flex-col">
                <div className="text-xl font-bold text-gray-900 font-mono flex items-baseline leading-none">
                  ¥{displayPriceNum.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp size={10} className="text-red-500" />
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1 py-0.5 rounded border border-red-100/50">
                    预期增值 +4%~+6%
                  </span>
                </div>
              </div>
            </div>

            {product.reservationId ? (
              <button
                disabled
                className="flex-1 bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed py-3.5 rounded-lg font-bold flex items-center justify-center gap-2">
                <Gavel size={18} />
                确权中
              </button>
            ) : (
              <button
                onClick={handleApplyConfirmation}
                className="flex-1 bg-[#8B0000] text-amber-100 hover:bg-[#A00000] transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-[0.98]">
                <Gavel size={18} />
                申请确权
              </button>
            )}
          </div>
        </div>
      )}

      {/* 交易须知公告弹窗 */}
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
