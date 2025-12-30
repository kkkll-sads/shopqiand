
import React, { useState, useEffect } from 'react';
import { FileText, ShoppingBag, X, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { LoadingSpinner, EmptyState, LazyImage } from '../../components/common';
import { formatAmount } from '../../utils/format';
import {
  getAllLog,
  AllLogItem,
  getMyCollection,
  MyCollectionItem,
  fetchProfile,
  AUTH_TOKEN_KEY,
  USER_INFO_KEY,
  normalizeAssetUrl,
} from '../../services/api';
import { Product, UserInfo } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { Route } from '../../router/routes';
import AssetHeaderCard from './components/asset/AssetHeaderCard';
import AssetActionsGrid from './components/asset/AssetActionsGrid';
import AssetTabSwitcher from './components/asset/AssetTabSwitcher';
// ✅ 引入统一 API 处理工具
import { isSuccess, extractData, extractError } from '../../utils/apiHelpers';
// ✅ 引入枚举常量替换魔法数字
import { ConsignmentStatus, DeliveryStatus } from '../../constants/statusEnums';
// ✅ 引入操作弹窗状态机Hook
import { useAssetActionModal, ActionModalState } from '../../hooks/useAssetActionModal';
// ✅ 引入标签页数据管理Hook
import { useAssetTabs, TabConfig } from '../../hooks/useAssetTabs';

interface AssetViewProps {
  onBack: () => void;
  onNavigate: (route: Route) => void;
  onProductSelect?: (product: Product) => void;
  initialTab?: number; // 初始标签页索引
}

const AssetView: React.FC<AssetViewProps> = ({ onBack, onNavigate, onProductSelect, initialTab = 0 }) => {
  const { showToast, showDialog } = useNotification();

  // 用户信息
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    try {
      const cached = localStorage.getItem(USER_INFO_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('解析本地用户信息失败:', error);
      return null;
    }
  });

  // 寄售券数量
  const [consignmentTicketCount, setConsignmentTicketCount] = useState<number>(0);

  // ✅ 定义标签页配置
  const tabConfigs: TabConfig[] = [
    // Tab 0: 资金明细 (Unified)
    {
      id: 0,
      name: '资金明细',
      fetchData: ({ page, limit, token }) => getAllLog({ page, limit, type: 'all', token }),
      parseData: (response) => {
        const data = extractData(response);
        return {
          list: data?.list || [],
          hasMore: (data?.list?.length || 0) >= 10,
        };
      },
    },
    // Tab 1: 我的藏品
    {
      id: 1,
      name: '我的藏品',
      fetchData: ({ page, limit, token }) => getMyCollection({ page, token }),
      parseData: (response) => {
        const data = extractData(response);
        return {
          list: data?.list || [],
          hasMore: (data?.list?.length || 0) >= 10 && data?.has_more !== false,
          extra: { consignment_coupon: data?.consignment_coupon },
        };
      },
      handleExtra: (extra) => {
        if (typeof extra.consignment_coupon === 'number') {
          setConsignmentTicketCount(extra.consignment_coupon);
        }
      },
    },
  ];

  // ✅ 使用标签页数据管理Hook
  const tabs = useAssetTabs(tabConfigs, initialTab);

  // ✅ 使用操作弹窗状态机Hook
  const actionModal = useAssetActionModal(consignmentTicketCount, () => {
    // 操作成功后刷新当前标签页
    tabs.refresh();
  });

  // ✅ 保留用于renderCollectionItem的辅助函数
  const hasConsignedBefore = (item: MyCollectionItem): boolean => {
    const status = item.consignment_status;
    return typeof status === 'number' && status !== ConsignmentStatus.NOT_CONSIGNED;
  };

  const hasConsignedSuccessfully = (item: MyCollectionItem): boolean => {
    return item.consignment_status === ConsignmentStatus.SOLD;
  };

  const isConsigning = (item: MyCollectionItem): boolean => {
    return item.consignment_status === ConsignmentStatus.CONSIGNING || item.consignment_status === ConsignmentStatus.PENDING;
  };

  const isDelivered = (item: MyCollectionItem): boolean => {
    return item.delivery_status === DeliveryStatus.DELIVERED;
  };

  // ✅ 重写handleItemClick，使用Hook方法
  const handleItemClick = (item: MyCollectionItem) => {
    // 根据藏品状态决定打开提货还是寄售弹窗
    if (isConsigning(item) || hasConsignedSuccessfully(item) || hasConsignedBefore(item)) {
      // 正在寄售、已售出、曾经寄售过 → 只能提货
      actionModal.openDelivery(item);
    } else if (item.delivery_status === DeliveryStatus.NOT_DELIVERED) {
      // 未提货 → 默认提货标签
      actionModal.openDelivery(item);
    } else if (item.consignment_status === ConsignmentStatus.NOT_CONSIGNED) {
      // 未寄售 → 默认寄售标签
      actionModal.openConsignment(item);
    } else {
      // 其他情况 → 提货标签
      actionModal.openDelivery(item);
    }
  };

  const tabNames = ['资金明细', '我的藏品'];

  // 加载用户信息和寄售券数量
  useEffect(() => {
    const loadUserInfo = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;

      try {
        // 从本地存储读取用户信息
        const cached = localStorage.getItem(USER_INFO_KEY);
        if (cached) {
          try {
            const cachedUserInfo = JSON.parse(cached);
            setUserInfo(cachedUserInfo);
          } catch (e) {
            console.warn('解析本地用户信息失败:', e);
          }
        }

        // ✅ 获取最新的用户信息
        const response = await fetchProfile(token);
        const profileData = extractData(response);
        if (profileData?.userInfo) {
          setUserInfo(profileData.userInfo);
          localStorage.setItem(USER_INFO_KEY, JSON.stringify(profileData.userInfo));
        }

        // ✅ 获取寄售券数量
        const collectionRes = await getMyCollection({ page: 1, limit: 1, token });
        const collectionData = extractData(collectionRes);
        if (collectionData) {
          const count = collectionData.consignment_coupon ?? 0;
          setConsignmentTicketCount(count);
        }
      } catch (err) {
        console.error('加载用户信息失败:', err);
      }
    };

    loadUserInfo();
  }, []);

  const formatTime = (timestamp: number | string | null): string => {
    if (!timestamp) return '';
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderAllLogItem = (item: AllLogItem) => {
    // 格式化金额，根据正负加颜色
    const amountVal = Number(item.amount);
    const isPositive = amountVal > 0;

    // 翻译/格式化 type
    let typeText = item.type;
    switch (item.type) {
      case 'balance_available': typeText = '专项金'; break;
      case 'withdrawable_money': typeText = '收益'; break;
      case 'service_fee_balance': typeText = '确权金'; break;
      case 'score': typeText = '消费金'; break;
      case 'green_power': typeText = '绿色积分'; break;
    }

    return (
      <div key={item.id} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800 mb-1">{item.memo || item.remark || '资金变动'}</div>
            <div className="text-xs text-gray-500">{formatTime(item.createtime || item.create_time)}</div>
          </div>
          <div className={`text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif] ${isPositive ? 'text-[#FF6B00]' : 'text-gray-900'}`}>
            {isPositive ? '+' : ''}{Number(amountVal).toFixed(2)}
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
          <span>{typeText}</span>
          <span>余额: {Number(item.after_value || item.after_balance).toFixed(2)}</span>
        </div>
      </div>
    );
  };

  const renderCollectionItem = (item: MyCollectionItem) => {
    // 兼容后端返回字段 item_title/item_image
    const title = item.item_title || item.title || '未命名藏品';
    const image = item.item_image || item.image || '';

    return (
      <div
        key={item.id}
        className="bg-white rounded-lg p-4 mb-3 shadow-sm cursor-pointer active:bg-gray-50 transition-colors"
        onClick={() => handleItemClick(item)}
      >
        <div className="flex gap-3">
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={normalizeAssetUrl(image) || undefined}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.visibility = 'hidden';
              }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-1">
              <div className="text-sm font-medium text-gray-800 flex-1">{title}</div>
              <ArrowRight size={16} className="text-gray-400 ml-2 flex-shrink-0" />
            </div>
            <div className="text-xs text-gray-500 mb-2">购买时间: {item.pay_time_text || item.buy_time_text}</div>
            <div className="text-sm font-bold text-gray-900 mb-2">¥ {item.price}</div>

            <div className="flex gap-2 flex-wrap">
              {/* 优先使用 status_text 字段显示状态 */}
              {item.status_text ? (
                <div className={`text-xs px-2 py-1 rounded-full border ${item.status_text.includes('寄售') || item.status_text.includes('出售')
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : item.status_text.includes('确权') || item.status_text.includes('成功') || item.status_text.includes('已售出')
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : item.status_text.includes('失败') || item.status_text.includes('取消')
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : item.status_text.includes('提货') || item.status_text.includes('待')
                          ? 'bg-orange-50 text-orange-600 border-orange-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                  {item.status_text}
                </div>
              ) : (
                /* 回退到原有的逻辑（如果没有 status_text 字段） */
                item.consignment_status === ConsignmentStatus.SOLD ? (
                  <div className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
                    已售出
                  </div>
                ) : item.consignment_status === ConsignmentStatus.CONSIGNING ? (
                  /* 如果正在寄售中，只显示"寄售中"标签 */
                  <div className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                    寄售中
                  </div>
                ) : item.delivery_status === DeliveryStatus.DELIVERED ? (
                  /* 如果已提货且未寄售，只显示"已提货"标签 */
                  <div className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
                    ✓ 已提货
                  </div>
                ) : hasConsignedBefore(item) ? (
                  <div className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                    待提货
                  </div>
                ) : (
                  <>
                    <div className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                      ○ 未提货
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${item.consignment_status === ConsignmentStatus.NOT_CONSIGNED
                        ? 'bg-gray-50 text-gray-600 border border-gray-200'
                        : item.consignment_status === ConsignmentStatus.PENDING
                          ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                          : item.consignment_status === ConsignmentStatus.REJECTED
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-green-50 text-green-600 border border-green-200'
                      }`}>
                      {item.consignment_status_text || '未寄售'}
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ 重写renderContent，使用Hook提供的数据
  const renderContent = () => {
    // Loading状态
    if (tabs.isLoading && tabs.data.length === 0) {
      return <LoadingSpinner text="加载中..." />;
    }

    // Error状态
    if (tabs.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-red-400">
          <div className="w-16 h-16 mb-4 border-2 border-red-200 rounded-lg flex items-center justify-center">
            <FileText size={32} className="opacity-50" />
          </div>
          <span className="text-xs">{tabs.error}</span>
        </div>
      );
    }

    // Empty状态
    if (tabs.data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="w-16 h-16 mb-4 border-2 border-gray-200 rounded-lg flex items-center justify-center">
            {tabs.activeTab === 1 ? (
              <ShoppingBag size={32} className="opacity-50" />
            ) : (
              <FileText size={32} className="opacity-50" />
            )}
          </div>
          <span className="text-xs">{tabs.activeTab === 1 ? '暂无藏品' : '暂无数据'}</span>
        </div>
      );
    }

    // Data渲染
    return (
      <div>
        {tabs.activeTab === 0 && tabs.data.map(renderAllLogItem)}
        {tabs.activeTab === 1 && tabs.data.map(renderCollectionItem)}

        {/* 加载更多按钮 */}
        {tabs.hasMore && (
          <button
            onClick={tabs.loadMore}
            disabled={tabs.isLoading}
            className="w-full py-2 text-sm text-orange-600 disabled:opacity-50"
          >
            {tabs.isLoading ? '加载中...' : '加载更多'}
          </button>
        )}
      </div>
    );
  };

  return (
    <PageContainer
      title="数字资产总权益"
      onBack={onBack}
      rightAction={
        <button
          onClick={() => onNavigate({ name: 'asset-history', type: 'all', back: { name: 'asset-view' } })}
          className="text-sm text-orange-600"
        >
          历史记录
        </button>
      }
      padding={false}
    >
      <div className="p-3 pb-20">
        <AssetHeaderCard userInfo={userInfo} onNavigate={onNavigate} />
        <AssetActionsGrid onNavigate={onNavigate} />
        <AssetTabSwitcher tabs={tabNames} activeTab={tabs.activeTab} onChange={tabs.setActiveTab} />

        {/* Content */}
        {renderContent()}
      </div>

      {/* ✅ 操作弹窗（使用状态机Hook） */}
      {actionModal.isOpen && actionModal.context.selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={actionModal.close}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              type="button"
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
              onClick={actionModal.close}
            >
              <X size={20} />
            </button>

            {/* 藏品信息 */}
            <div className="flex gap-3 mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={normalizeAssetUrl(actionModal.context.selectedItem.image) || undefined}
                  alt={actionModal.context.selectedItem.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.visibility = 'hidden';
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800 mb-1">{actionModal.context.selectedItem.title}</div>
                <div className="text-xs text-gray-500">购买时间: {actionModal.context.selectedItem.pay_time_text || actionModal.context.selectedItem.buy_time_text}</div>
                <div className="text-sm font-bold text-gray-900 mt-1">¥ {actionModal.context.selectedItem.price}</div>
              </div>
            </div>

            {/* 标签切换 */}
            {(() => {
              const item = actionModal.context.selectedItem;
              // 如果正在寄售中、已寄售成功、已提货、或曾经寄售过，不显示任何标签
              if (isConsigning(item) ||
                hasConsignedSuccessfully(item) ||
                isDelivered(item) ||
                hasConsignedBefore(item)) {
                return null;
              }

              // 显示提货和寄售两个标签
              return (
                <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                  <button
                    onClick={actionModal.switchToDelivery}
                    className={`flex-1 py-2 text-xs rounded-md transition-colors ${actionModal.context.actionType === 'delivery'
                        ? 'bg-white text-orange-600 font-medium shadow-sm'
                        : 'text-gray-600'
                      }`}
                  >
                    权益分割
                  </button>
                  <button
                    onClick={actionModal.switchToConsignment}
                    className={`flex-1 py-2 text-xs rounded-md transition-colors ${actionModal.context.actionType === 'consignment'
                        ? 'bg-white text-orange-600 font-medium shadow-sm'
                        : 'text-gray-600'
                      }`}
                  >
                    寄售
                  </button>
                </div>
              );
            })()}

            {/* ✅ 检查信息显示（使用Hook提供的检查结果） */}
            <div className="space-y-3 mb-4">
              {actionModal.context.actionType === 'delivery' ? (
                <>
                  {actionModal.deliveryCheckResult && (() => {
                    const check = actionModal.deliveryCheckResult;

                    return (
                      <>
                        {/* 寄售中检查 */}
                        {check.isConsigning && (
                          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle size={16} />
                            <span>该藏品正在寄售中，无法提货</span>
                          </div>
                        )}

                        {/* 已寄售成功检查 */}
                        {!check.isConsigning && check.hasConsignedSuccessfully && (
                          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle size={16} />
                            <span>该藏品已经寄售成功（已售出），无法提货</span>
                          </div>
                        )}

                        {/* 已提货检查 */}
                        {!check.isConsigning && !check.hasConsignedSuccessfully && check.isDelivered && (
                          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle size={16} />
                            <span>该藏品已经提货，无法再次提货</span>
                          </div>
                        )}

                        {/* 48小时检查 */}
                        {!check.isConsigning && !check.hasConsignedSuccessfully && !check.isDelivered && (
                          check.can48Hours ? (
                            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                              <CheckCircle size={16} />
                              <span>已满足48小时提货条件</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                              <AlertCircle size={16} />
                              <span>还需等待 {check.hoursLeft} 小时才能提货</span>
                            </div>
                          )
                        )}

                        {/* 寄售历史检查 */}
                        {!check.isConsigning && !check.hasConsignedSuccessfully && !check.isDelivered && check.hasConsignedBefore && (
                          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle size={16} />
                            <span>该藏品曾经寄售过，将执行强制提货</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  {actionModal.consignmentCheckResult && actionModal.deliveryCheckResult && (() => {
                    const consignCheck = actionModal.consignmentCheckResult;
                    const deliveryCheck = actionModal.deliveryCheckResult;

                    return (
                      <>
                        {/* 寄售中检查 */}
                        {deliveryCheck.isConsigning && (
                          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle size={16} />
                            <span>该藏品正在寄售中，无法再次寄售</span>
                          </div>
                        )}

                        {/* 已寄售成功检查 */}
                        {!deliveryCheck.isConsigning && deliveryCheck.hasConsignedSuccessfully && (
                          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle size={16} />
                            <span>该藏品已经寄售成功（已售出），无法再次寄售</span>
                          </div>
                        )}

                        {/* 48小时倒计时 */}
                        {!deliveryCheck.isConsigning && !deliveryCheck.hasConsignedSuccessfully && (
                          consignCheck.unlocked ? (
                            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                              <CheckCircle size={16} />
                              <span>已满足48小时寄售条件</span>
                            </div>
                          ) : (
                            <div className="bg-orange-50 px-3 py-2 rounded-lg">
                              <div className="flex items-center gap-2 text-xs text-orange-600 mb-1">
                                <AlertCircle size={16} />
                                <span>距离可寄售时间还有：</span>
                              </div>
                              {consignCheck.remainingText ? (
                                <div className="text-sm font-bold text-orange-700 text-center">
                                  {consignCheck.remainingText}
                                </div>
                              ) : actionModal.context.countdown ? (
                                <div className="text-sm font-bold text-orange-700 text-center">
                                  {String(actionModal.context.countdown.hours).padStart(2, '0')}:
                                  {String(actionModal.context.countdown.minutes).padStart(2, '0')}:
                                  {String(actionModal.context.countdown.seconds).padStart(2, '0')}
                                </div>
                              ) : consignCheck.remainingSeconds !== null ? (
                                <div className="text-sm font-bold text-orange-700 text-center">
                                  {Math.floor(consignCheck.remainingSeconds / 3600)}h {Math.floor((consignCheck.remainingSeconds % 3600) / 60)}m {consignCheck.remainingSeconds % 60}s
                                </div>
                              ) : (
                                <div className="text-xs text-orange-600 text-center">
                                  计算中...
                                </div>
                              )}
                            </div>
                          )
                        )}

                        {/* 寄售券数量显示 */}
                        {!deliveryCheck.isConsigning && !deliveryCheck.hasConsignedSuccessfully && (
                          <div className="bg-orange-50 px-3 py-2 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-orange-600">
                                <ShoppingBag size={16} />
                                <span>我的寄售券：</span>
                              </div>
                              <div className="text-sm font-bold text-orange-700">
                                {consignmentTicketCount} 张
                              </div>
                            </div>
                            {consignmentTicketCount === 0 && (
                              <div className="text-xs text-red-600 mt-1">
                                您没有寄售券，无法进行寄售
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>

            {/* ✅ 错误信息 */}
            {actionModal.context.error && (
              <div className="text-xs text-red-600 mb-2">{actionModal.context.error}</div>
            )}

            {/* ✅ 确认按钮（使用Hook提供的方法和状态） */}
            <button
              onClick={actionModal.handleSubmit}
              disabled={actionModal.isSubmitting || !actionModal.canSubmit}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${!actionModal.isSubmitting && actionModal.canSubmit
                  ? 'bg-orange-600 text-white active:bg-orange-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {actionModal.isSubmitting
                ? '提交中...'
                : actionModal.context.actionType === 'delivery'
                  ? '权益分割'
                  : '确认寄售'}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default AssetView;
