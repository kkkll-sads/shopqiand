import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  MapPin,
  ChevronRight,
  Store,
  Plus,
  WifiOff,
  RefreshCcw,
} from 'lucide-react';
import { addressApi, type AddressItem } from '../../api/modules/address';
import { shopCartApi, type ShopCartListItem } from '../../api/modules/shopCart';
import { shopOrderApi } from '../../api/modules/shopOrder';
import { getErrorMessage } from '../../api/core/errors';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';

interface CheckoutLocationState {
  cartItemIds?: number[];
}

interface CheckoutProduct {
  id: number;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  /** 是否为消费金价格 */
  isScorePrice: boolean;
}

function mapCartItems(rows: ShopCartListItem[], ids: number[]): CheckoutProduct[] {
  const idSet = new Set(ids);
  return rows
    .filter((r) => idSet.has(r.id))
    .map((r) => {
      // score_price 代表消费金价格，不需要除以 100
      const isScorePrice = r.score_price != null && r.score_price > 0;
      const price = isScorePrice ? r.score_price! : (r.flash_price ?? r.price ?? r.original_price ?? 0);
      const sku = r.source === 'flash_sale' ? '限时秒杀' : '普通';
      return {
        id: r.id,
        title: r.product_name,
        sku,
        price,
        quantity: r.quantity,
        image: r.product_thumbnail || '',
        isScorePrice,
      };
    });
}

export const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { goTo, goBack } = useAppNavigate();
  const { showToast } = useFeedback();

  const cartItemIds = (location.state as CheckoutLocationState)?.cartItemIds ?? [];
  const hasValidIds = Array.isArray(cartItemIds) && cartItemIds.length > 0;

  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [cartList, setCartList] = useState<ShopCartListItem[]>([]);
  const [buyerRemark, setBuyerRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedAddress = useMemo(() => {
    const d = addresses.find((a) => a.is_default);
    return d ?? addresses[0] ?? null;
  }, [addresses]);

  const products = useMemo(
    () => (hasValidIds ? mapCartItems(cartList, cartItemIds) : []),
    [cartList, cartItemIds, hasValidIds]
  );

  const productTotal = useMemo(
    () => products.reduce((sum, p) => sum + p.price * p.quantity, 0),
    [products]
  );
  /** 所有商品是否均为消费金价格 */
  const allScorePrice = products.length > 0 && products.every((p) => p.isScorePrice);

  const fetchData = useCallback(async () => {
    if (!hasValidIds) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setModuleError(false);
    try {
      const [listRes, addrs] = await Promise.all([
        shopCartApi.list(),
        addressApi.list().catch(() => []),
      ]);
      setCartList(listRes?.list ?? []);
      setAddresses(addrs);
    } catch (err) {
      setModuleError(true);
      showToast({ message: getErrorMessage(err) || '加载失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [hasValidIds, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!hasValidIds && !loading) {
      navigate('/cart', { replace: true });
    }
  }, [hasValidIds, loading, navigate]);

  const handleBack = () => goBack();

  const handleRetry = () => {
    setLoading(true);
    setModuleError(false);
    fetchData();
  };

  const handleSubmit = async () => {
    if (!selectedAddress) {
      showToast({ message: '请先添加收货地址', type: 'warning' });
      goTo('address');
      return;
    }
    if (products.length === 0) {
      showToast({ message: '购物车商品已变化，请返回重新选择', type: 'warning' });
      navigate('/cart', { replace: true });
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const result = await shopOrderApi.create({
        cart_ids: cartItemIds,
        address_id: selectedAddress.id,
        remark: buyerRemark.trim() || undefined,
      });
      const cashierParams = new URLSearchParams({
        order_id: String(result.order_id),
        amount: String(result.total_amount),
        total_score: String(result.total_score),
        order_no: result.order_no,
        pay_type: result.pay_type,
        balance: result.balance_available,
        score_balance: result.score,
      });
      navigate(`/cashier?${cashierParams.toString()}`, { replace: true });
    } catch (err) {
      showToast({ message: getErrorMessage(err) || '创建订单失败', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-border-light">
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}
      <div className="h-12 flex items-center justify-between px-3 pt-safe">
        <div className="w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-xl font-bold text-text-main text-center w-1/3">确认订单</h1>
        <div className="w-1/3" />
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-3">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 shadow-sm">
        <div className="flex items-center mb-2">
          <Skeleton className="w-16 h-5 mr-2" />
          <Skeleton className="w-24 h-5" />
        </div>
        <Skeleton className="w-full h-4 mb-1" />
        <Skeleton className="w-2/3 h-4" />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 shadow-sm">
        <div className="flex items-center mb-4">
          <Skeleton className="w-5 h-5 rounded-full mr-2" />
          <Skeleton className="w-24 h-5 rounded" />
        </div>
        <div className="flex">
          <Skeleton className="w-[80px] h-[80px] rounded-lg mr-3 shrink-0" />
          <div className="flex-1">
            <Skeleton className="w-full h-4 mb-1" />
            <Skeleton className="w-3/4 h-4 mb-2" />
            <div className="flex justify-between mt-4">
              <Skeleton className="w-16 h-5" />
              <Skeleton className="w-8 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (moduleError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <RefreshCcw size={32} className="text-text-aux mb-3" />
          <p className="text-md text-text-sub mb-4">加载失败，请检查网络</p>
          <button
            onClick={handleRetry}
            className="px-6 py-2 border border-border-light rounded-full text-base text-text-main bg-white dark:bg-gray-900 shadow-sm active:bg-bg-base"
          >
            重试
          </button>
        </div>
      );
    }

    if (loading) return renderSkeleton();

    const noAddress = addresses.length === 0;

    return (
      <div className="p-3 pb-24">
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 shadow-sm active:bg-bg-base transition-colors relative overflow-hidden cursor-pointer"
          onClick={() => goTo('address')}
        >
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0Ij48cGF0aCBkPSJNMCAwaDIwbDIwIDRIMHoiIGZpbGw9IiNGRjRkNGQiIG9wYWNpdHk9IjAuOCIvPjxwYXRoIGQ9Ik0yMCAwaDIwbDIwIDRIMjB6IiBmaWxsPSIjNGQ4OGZmIiBvcGFjaXR5PSIwLjgiLz48L3N2Zz4=')] bg-repeat-x opacity-50" />
          <div className="flex items-center justify-between">
            {noAddress ? (
              <div className="flex items-center py-2">
                <div className="w-8 h-8 rounded-full bg-primary-start/10 flex items-center justify-center mr-3">
                  <Plus size={16} className="text-primary-start" />
                </div>
                <span className="text-lg font-medium text-text-main">新增收货地址</span>
              </div>
            ) : selectedAddress ? (
              <div className="flex-1 pr-4">
                <div className="flex items-center mb-1.5">
                  <span className="text-xl font-bold text-text-main mr-2">{selectedAddress.name}</span>
                  <span className="text-md text-text-main font-medium">{selectedAddress.phone}</span>
                  {selectedAddress.is_default && (
                    <span className="ml-2 px-1.5 py-0.5 bg-primary-start text-white text-xs rounded leading-none">默认</span>
                  )}
                </div>
                <div className="flex items-start">
                  <MapPin size={14} className="text-primary-start mt-0.5 mr-1 shrink-0" />
                  <span className="text-base text-text-sub leading-snug line-clamp-2">
                    {selectedAddress.region} {selectedAddress.detail}
                  </span>
                </div>
              </div>
            ) : null}
            <ChevronRight size={16} className="text-text-aux shrink-0" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-border-light/50">
            <Store size={16} className="text-text-main mr-1.5" />
            <span className="text-md font-bold text-text-main">树交所自营</span>
          </div>
          <div className="p-4">
            {products.length === 0 ? (
              <p className="text-text-sub text-center py-4">购物车商品已变化，请返回重新选择</p>
            ) : (
              products.map((item) => (
                <div key={item.id} className="flex mb-4 last:mb-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-[80px] h-[80px] rounded-lg object-cover shrink-0 mr-3 border border-border-light/50"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 flex flex-col min-w-0">
                    <h3 className="text-base text-text-main font-medium line-clamp-2 leading-snug mb-1">
                      {item.title}
                    </h3>
                    <div className="text-s text-text-sub bg-bg-base px-1.5 py-0.5 rounded self-start mb-2 truncate max-w-full">
                      {item.sku}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="text-primary-start font-bold leading-none">
                        {item.isScorePrice ? (
                          <>
                            <span className="text-xl">{item.price}</span>
                            <span className="text-s ml-0.5">消费金</span>
                          </>
                        ) : (
                          <>
                            <span className="text-s">¥</span>
                            <span className="text-xl">{item.price.toFixed(2).split('.')[0]}</span>
                            <span className="text-s">.{item.price.toFixed(2).split('.')[1]}</span>
                          </>
                        )}
                      </div>
                      <span className="text-sm text-text-main font-medium">x{item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-3 bg-bg-base/50 border-t border-border-light/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-sub">免运费</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 px-4 py-1">
          <div className="flex items-center justify-between py-3">
            <span className="text-md text-text-main shrink-0 mr-4">订单备注</span>
            <input
              type="text"
              placeholder="选填，建议留言前先与商家沟通确认"
              className="flex-1 text-right text-base text-text-main outline-none placeholder:text-text-aux"
              value={buyerRemark}
              onChange={(e) => setBuyerRemark(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-base text-text-sub">商品总价</span>
            <span className="text-base text-text-main">{allScorePrice ? `${productTotal}消费金` : `¥${productTotal.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-end pt-3 mt-1 border-t border-border-light/50">
            <span className="text-md text-text-main font-bold mr-2">应付金额:</span>
            <span className="text-primary-start font-bold">
              {allScorePrice ? (
                <>
                  <span className="text-3xl">{productTotal}</span>
                  <span className="text-sm ml-0.5">消费金</span>
                </>
              ) : (
                <>
                  <span className="text-sm">¥</span>
                  <span className="text-3xl">{productTotal.toFixed(2).split('.')[0]}</span>
                  <span className="text-sm">.{productTotal.toFixed(2).split('.')[1]}</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const canSubmit = hasValidIds && !loading && !moduleError && products.length > 0 && selectedAddress;

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative h-full overflow-hidden">
      {renderHeader()}
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderContent()}
      </div>
      {!moduleError && hasValidIds && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border-light px-4 h-14 flex items-center justify-between z-40 pb-safe">
          <div className="flex items-baseline">
            <span className="text-base text-text-main font-bold mr-1">应付:</span>
            <span className="text-primary-start font-bold">
              {allScorePrice ? (
                <>
                  <span className="text-4xl">{productTotal}</span>
                  <span className="text-md ml-0.5">消费金</span>
                </>
              ) : (
                <>
                  <span className="text-md">¥</span>
                  <span className="text-4xl">{productTotal.toFixed(2).split('.')[0]}</span>
                  <span className="text-md">.{productTotal.toFixed(2).split('.')[1]}</span>
                </>
              )}
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="h-10 px-8 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white text-md font-medium shadow-sm active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '提交订单'}
          </button>
        </div>
      )}
    </div>
  );
};
