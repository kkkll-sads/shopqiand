/**
 * @file ProductDetail/index.tsx - 商品详情页面
 * @description 展示商品详细信息，包括图片、价格、规格、评价、加入购物车等。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'; // React 核心 Hook
import { useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/core/errors';
import { addressApi, shopCartApi, shopOrderApi, shopProductApi } from '../../api';
import type { AddressItem } from '../../api/modules/address';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { ErrorState } from '../../components/ui/ErrorState';
import { ProductAddressManageSheet } from '../../features/product-detail/components/ProductAddressManageSheet';
import { ProductDetailHeader } from '../../features/product-detail/components/ProductDetailHeader';
import { ProductAddressFormSheet, type ProductAddressFormValue } from '../../features/product-detail/components/ProductAddressFormSheet';
import { ProductOverviewSection } from '../../features/product-detail/components/ProductOverviewSection';
import { ProductPurchaseBar } from '../../features/product-detail/components/ProductPurchaseBar';
import { ProductReviewsSection } from '../../features/product-detail/components/ProductReviewsSection';
import { ProductSkuSheet } from '../../features/product-detail/components/ProductSkuSheet';
import { ProductServiceSheet } from '../../features/product-detail/components/ProductServiceSheet';
import { ProductTabsSection } from '../../features/product-detail/components/ProductTabsSection';
import type { ProductDetailTab, SkuMode } from '../../features/product-detail/types';
import {
  buildShopProductOptionGroups,
  buildShopProductPath,
  buildShopProductQaPath,
  buildShopProductReviewsPath,
  buildShopProductSelectedSummary,
  getSelectedSkuId,
} from '../../features/shop-product/utils';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useAppNavigate } from '../../lib/navigation';
import { openCustomerServiceLink } from '../../lib/customerService';
import { RegionPickerSheet } from '../../components/biz/RegionPickerSheet';

const EMPTY_REVIEW_SUMMARY = {
  follow_up_count: 0,
  good_rate: 100,
  preview: [],
  total: 0,
  with_media_count: 0,
};

const EMPTY_ADDRESS_FORM: ProductAddressFormValue = {
  name: '',
  phone: '',
  region: '',
  detail: '',
  isDefault: true,
};

export const ProductDetailPage = () => {
  const params = useParams();
  const { goBack, goTo, navigate } = useAppNavigate();
  const { showToast, showConfirm } = useFeedback();
  const { isOffline, refreshStatus } = useNetworkStatus();

  const routeProductId = Number(params.id);
  const hasValidProductId = Number.isFinite(routeProductId) && routeProductId > 0;

  const [showSkuSheet, setShowSkuSheet] = useState(false);
  const [showServiceSheet, setShowServiceSheet] = useState(false);
  const [skuMode, setSkuMode] = useState<SkuMode>('select');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ProductDetailTab>('details');
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressItem | null>(null);
  const [showAddressManageSheet, setShowAddressManageSheet] = useState(false);
  const [showAddressFormSheet, setShowAddressFormSheet] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [addressForm, setAddressForm] = useState<ProductAddressFormValue>(EMPTY_ADDRESS_FORM);
  const [addressFormErrors, setAddressFormErrors] = useState<Partial<Record<keyof ProductAddressFormValue, string>>>({});
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState(false);
  const [settingDefaultAddressId, setSettingDefaultAddressId] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const fallbackProductRequest = useRequest(
    (signal) =>
      hasValidProductId
        ? Promise.resolve(null)
        : shopProductApi
            .latest({ limit: 1, page: 1 }, signal)
            .then((response) => response.list[0] ?? null),
    {
      deps: [hasValidProductId],
      initialData: null,
    },
  );

  const resolvedProductId = hasValidProductId ? routeProductId : fallbackProductRequest.data?.id ?? 0;

  useEffect(() => {
    if (!hasValidProductId && fallbackProductRequest.data?.id) {
      navigate(buildShopProductPath(fallbackProductRequest.data.id), { replace: true });
    }
  }, [fallbackProductRequest.data, hasValidProductId, navigate]);

  const productRequest = useRequest(
    (signal) =>
      resolvedProductId > 0 ? shopProductApi.detail(resolvedProductId, signal) : Promise.resolve(null),
    {
      cacheKey: `product:detail:${resolvedProductId}`,
      deps: [resolvedProductId],
      initialData: null,
      keepPreviousData: true,
    },
  );

  const reviewSummaryRequest = useRequest(
    (signal) =>
      resolvedProductId > 0
        ? shopProductApi.reviewSummary(resolvedProductId, signal)
        : Promise.resolve(EMPTY_REVIEW_SUMMARY),
    {
      cacheKey: `product:reviews-summary:${resolvedProductId}`,
      deps: [resolvedProductId],
      initialData: EMPTY_REVIEW_SUMMARY,
      keepPreviousData: true,
    },
  );

  const product = productRequest.data;
  const optionGroups = useMemo(() => buildShopProductOptionGroups(product), [product]);
  const selectedSummary = buildShopProductSelectedSummary(optionGroups, selectedOptions, quantity);

  useEffect(() => {
    setSelectedOptions((previous) => {
      const nextSelections: Record<string, string> = {};
      for (const group of optionGroups) {
        const previousValue = previous[group.name];
        nextSelections[group.name] = group.options.includes(previousValue)
          ? previousValue
          : group.options[0];
      }
      return nextSelections;
    });
  }, [optionGroups]);

  useEffect(() => {
    const currentRef = scrollRef.current;
    if (!currentRef) {
      return undefined;
    }

    const handleScroll = () => {
      setIsScrolled(currentRef.scrollTop > 100);
    };

    currentRef.addEventListener('scroll', handleScroll);
    return () => currentRef.removeEventListener('scroll', handleScroll);
  }, []);

  const loadAddresses = useCallback(async () => {
    const list = await addressApi.list().catch(() => []);
    setAddresses(list);
    setSelectedAddress((current) => {
      if (current) {
        const matched = list.find((item) => item.id === current.id);
        if (matched) {
          return matched;
        }
      }

      return list.find((item) => item.is_default) ?? list[0] ?? null;
    });
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const openSkuSheet = (mode: SkuMode) => {
    setSkuMode(mode);
    void loadAddresses();
    setShowSkuSheet(true);
  };

  const closeSkuSheet = () => {
    setShowSkuSheet(false);
  };

  const resetAddressForm = useCallback(() => {
    setAddressForm(EMPTY_ADDRESS_FORM);
    setAddressFormErrors({});
    setSavingAddress(false);
    setDeletingAddress(false);
    setEditingAddress(null);
  }, []);

  const handleCloseAddressForm = useCallback(() => {
    setShowAddressFormSheet(false);
    setShowRegionPicker(false);
    resetAddressForm();
  }, [resetAddressForm]);

  const openAddAddressForm = useCallback(() => {
    resetAddressForm();
    setShowAddressFormSheet(true);
  }, [resetAddressForm]);

  const openEditAddressForm = useCallback((address: AddressItem) => {
    setEditingAddress(address);
    setAddressForm({
      name: address.name,
      phone: address.phone,
      region: address.region,
      detail: address.detail,
      isDefault: address.is_default,
    });
    setAddressFormErrors({});
    setSavingAddress(false);
    setDeletingAddress(false);
    setShowAddressFormSheet(true);
  }, []);

  const validateAddressForm = useCallback(() => {
    const nextErrors: Partial<Record<keyof ProductAddressFormValue, string>> = {};
    if (!addressForm.name.trim()) nextErrors.name = '收货人姓名不能为空';
    if (!addressForm.phone.trim()) {
      nextErrors.phone = '手机号不能为空';
    } else if (!/^1[3-9]\d{9}$/.test(addressForm.phone.trim())) {
      nextErrors.phone = '手机号格式不正确';
    }
    if (!addressForm.region.trim()) nextErrors.region = '所在地区不能为空';
    if (!addressForm.detail.trim()) nextErrors.detail = '详细地址不能为空';
    setAddressFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [addressForm]);

  const handleSubmitAddress = useCallback(async () => {
    if (!validateAddressForm() || savingAddress) {
      return;
    }

    setSavingAddress(true);
    try {
      let targetId = editingAddress?.id ?? 0;
      if (editingAddress) {
        await addressApi.edit({
          id: editingAddress.id,
          name: addressForm.name.trim(),
          phone: addressForm.phone.trim(),
          region: addressForm.region.trim(),
          address: addressForm.detail.trim(),
          is_default: addressForm.isDefault,
        });
      } else {
        targetId = await addressApi.add({
          name: addressForm.name.trim(),
          phone: addressForm.phone.trim(),
          region: addressForm.region.trim(),
          address: addressForm.detail.trim(),
          is_default: addressForm.isDefault,
        });
      }

      const list = await addressApi.list().catch(() => []);
      setAddresses(list);
      const nextSelected =
        list.find((item) => item.id === targetId) ??
        list.find((item) => item.id === selectedAddress?.id) ??
        list.find((item) => item.is_default) ??
        list[0] ??
        null;
      setSelectedAddress(nextSelected);
      showToast({ message: editingAddress ? '地址已更新' : '地址已添加', type: 'success' });
      setShowAddressFormSheet(false);
      setShowRegionPicker(false);
      resetAddressForm();
    } catch (err) {
      showToast({ message: getErrorMessage(err) || '保存地址失败', type: 'error' });
      setSavingAddress(false);
    }
  }, [addressForm, editingAddress, resetAddressForm, savingAddress, selectedAddress?.id, showToast, validateAddressForm]);

  const handleDeleteAddress = useCallback(async () => {
    if (!editingAddress || deletingAddress) {
      return;
    }
    const confirmed = await showConfirm({
      title: '删除地址',
      message: '确定要删除这条收货地址吗？',
      confirmText: '确认删除',
      cancelText: '取消',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    setDeletingAddress(true);
    try {
      await addressApi.delete(editingAddress.id);
      const list = await addressApi.list().catch(() => []);
      setAddresses(list);
      setSelectedAddress((current) => {
        if (current?.id === editingAddress.id) {
          return list.find((item) => item.is_default) ?? list[0] ?? null;
        }
        return list.find((item) => item.id === current?.id) ?? list.find((item) => item.is_default) ?? list[0] ?? null;
      });
      showToast({ message: '地址已删除', type: 'success' });
      setShowAddressFormSheet(false);
      setShowRegionPicker(false);
      resetAddressForm();
    } catch (err) {
      showToast({ message: getErrorMessage(err) || '删除地址失败', type: 'error' });
      setDeletingAddress(false);
    }
  }, [deletingAddress, editingAddress, resetAddressForm, showToast]);

  const handleSetDefaultAddress = useCallback(async (address: AddressItem) => {
    if (address.is_default || settingDefaultAddressId != null) {
      return;
    }

    setSettingDefaultAddressId(address.id);
    try {
      await addressApi.setDefault(address.id);
      const list = await addressApi.list().catch(() => []);
      setAddresses(list);
      setSelectedAddress((current) =>
        list.find((item) => item.id === (current?.id ?? address.id)) ??
        list.find((item) => item.id === address.id) ??
        list.find((item) => item.is_default) ??
        list[0] ??
        null,
      );
      showToast({ message: '已设为默认地址', type: 'success' });
    } catch (err) {
      showToast({ message: getErrorMessage(err) || '设置默认地址失败', type: 'error' });
    } finally {
      setSettingDefaultAddressId(null);
    }
  }, [settingDefaultAddressId, showToast]);

  const handleManageAddress = useCallback(() => {
    if (addresses.length === 0) {
      openAddAddressForm();
      return;
    }
    setShowAddressManageSheet(true);
  }, [addresses.length, openAddAddressForm]);

  const handleAddToCart = useCallback(async () => {
    if (!product?.id) {
      showToast({ message: '商品信息异常', type: 'warning' });
      return;
    }
    const skuId = getSelectedSkuId(product, optionGroups, selectedOptions);
    if (optionGroups.length > 0 && (skuId == null || !Number.isFinite(skuId))) {
      showToast({ message: '请先选择完整规格', type: 'warning' });
      return;
    }
    try {
      await shopCartApi.add(
        {
          product_id: product.id,
          quantity,
          ...(skuId != null ? { sku_id: skuId } : {}),
          source: 'normal',
        },
        undefined,
      );
      closeSkuSheet();
      showToast({ message: '已加入购物车', type: 'success' });
    } catch (err) {
      showToast({ message: getErrorMessage(err) || '加入购物车失败', type: 'error' });
    }
  }, [
    product,
    optionGroups,
    selectedOptions,
    quantity,
    showToast,
    closeSkuSheet,
  ]);

  const handleBuyNow = useCallback(async () => {
    if (!product?.id) {
      showToast({ message: '商品信息异常', type: 'warning' });
      return;
    }
    const skuId = getSelectedSkuId(product, optionGroups, selectedOptions);
    if (optionGroups.length > 0 && (skuId == null || !Number.isFinite(skuId))) {
      showToast({ message: '请先选择完整规格', type: 'warning' });
      return;
    }

    if (!selectedAddress) {
      showToast({ message: '请先添加收货地址', type: 'warning' });
      if (addresses.length === 0) {
        openAddAddressForm();
      } else {
        setShowAddressManageSheet(true);
      }
      return;
    }

    try {
      closeSkuSheet();

      // 直接传商品 ID 创建订单，跳过购物车
      const result = await shopOrderApi.create({
        items: [{
          product_id: product.id,
          quantity,
          ...(skuId != null ? { sku_id: skuId } : {}),
        }],
        address_id: selectedAddress.id,
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
    }
  }, [product, optionGroups, selectedOptions, quantity, selectedAddress, addresses.length, showToast, closeSkuSheet, navigate, openAddAddressForm]);

  const handleOpenSupport = useCallback(() => {
    void openCustomerServiceLink(({ duration, message, type }) => {
      showToast({ duration, message, type });
    });
  }, [showToast]);

  const isLoading =
    (productRequest.loading && !product) || (!hasValidProductId && fallbackProductRequest.loading);
  const hasBlockingError =
    !isLoading &&
    !product &&
    (Boolean(productRequest.error) || (!hasValidProductId && Boolean(fallbackProductRequest.error)));

  return (
    <div className="product-detail-dark-scope relative flex flex-1 flex-col overflow-hidden bg-bg-base">
      {isOffline && (
        <OfflineBanner
          onAction={refreshStatus}
          className="absolute left-0 right-0 top-0 z-50"
        />
      )}

      <ProductDetailHeader isScrolled={isScrolled} onBack={goBack} title={product?.name} />

      {hasBlockingError ? (
        <ErrorState
          message="商品详情加载失败"
          onRetry={() => {
            void Promise.allSettled([fallbackProductRequest.reload(), productRequest.reload()]);
          }}
        />
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-bg-base pb-[72px]">
            <ProductOverviewSection
              loading={isLoading}
              onOpenServiceDescription={() => setShowServiceSheet(true)}
              onOpenSku={openSkuSheet}
              product={product}
              quantity={quantity}
              selectedSummary={selectedSummary}
            />
            <ProductReviewsSection
              loading={reviewSummaryRequest.loading && reviewSummaryRequest.data?.total === 0}
              moduleError={Boolean(reviewSummaryRequest.error)}
              onRetry={() => void reviewSummaryRequest.reload().catch(() => undefined)}
              onOpenReviews={() => goTo(buildShopProductReviewsPath(resolvedProductId))}
              onOpenQa={() => goTo(buildShopProductQaPath(resolvedProductId))}
              summary={reviewSummaryRequest.data}
            />
            <ProductTabsSection
              activeTab={activeTab}
              loading={isLoading}
              onChange={setActiveTab}
              product={product}
            />
          </div>

          <ProductPurchaseBar
            onOpenStore={() => goTo('store')}
            onOpenHelp={handleOpenSupport}
            onOpenCart={() => goTo('cart')}
            onAddToCart={() => openSkuSheet('cart')}
            onBuyNow={() => openSkuSheet('buy')}
          />

          <ProductSkuSheet
            addresses={addresses}
            isOpen={showSkuSheet}
            mode={skuMode}
            onAddToCart={handleAddToCart}
            onClose={closeSkuSheet}
            onConfirm={handleBuyNow}
            onDecreaseQuantity={() => setQuantity((previous) => Math.max(1, previous - 1))}
            onIncreaseQuantity={() => setQuantity((previous) => previous + 1)}
            onManageAddress={handleManageAddress}
            onSelectOption={(groupName, option) =>
              setSelectedOptions((previous) => ({
                ...previous,
                [groupName]: option,
              }))
            }
            optionGroups={optionGroups}
            product={product}
            quantity={quantity}
            selectedAddress={selectedAddress}
            setSelectedAddress={setSelectedAddress}
            selectedOptions={selectedOptions}
          />

          <ProductServiceSheet
            isOpen={showServiceSheet}
            onClose={() => setShowServiceSheet(false)}
            product={product}
          />

          <ProductAddressManageSheet
            addresses={addresses}
            isOpen={showAddressManageSheet}
            isSettingDefault={settingDefaultAddressId != null}
            onAdd={() => {
              setShowAddressManageSheet(false);
              openAddAddressForm();
            }}
            onClose={() => setShowAddressManageSheet(false)}
            onEdit={(address) => {
              setShowAddressManageSheet(false);
              openEditAddressForm(address);
            }}
            onSelect={(address) => {
              setSelectedAddress(address);
              setShowAddressManageSheet(false);
            }}
            onSetDefault={(address) => void handleSetDefaultAddress(address)}
            selectedAddress={selectedAddress}
          />

          <ProductAddressFormSheet
            editingAddressName={editingAddress?.name}
            errors={addressFormErrors}
            isOpen={showAddressFormSheet}
            isDeleting={deletingAddress}
            isEditing={Boolean(editingAddress)}
            isSaving={savingAddress}
            onChange={(patch) => {
              setAddressForm((previous) => ({ ...previous, ...patch }));
              setAddressFormErrors((previous) => ({ ...previous, ...Object.keys(patch).reduce((acc, key) => {
                acc[key as keyof ProductAddressFormValue] = '';
                return acc;
              }, {} as Partial<Record<keyof ProductAddressFormValue, string>>) }));
            }}
            onClose={handleCloseAddressForm}
            onDelete={() => void handleDeleteAddress()}
            onOpenRegionPicker={() => setShowRegionPicker(true)}
            onSubmit={() => void handleSubmitAddress()}
            value={addressForm}
          />

          <RegionPickerSheet
            isOpen={showRegionPicker}
            value={addressForm.region}
            onCancel={() => setShowRegionPicker(false)}
            onConfirm={(region) => {
              setAddressForm((previous) => ({ ...previous, region }));
              setAddressFormErrors((previous) => ({ ...previous, region: '' }));
              setShowRegionPicker(false);
            }}
          />
        </>
      )}
    </div>
  );
};

