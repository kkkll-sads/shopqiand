/**
 * @file 商品服务信息底部弹窗
 * @description 展示商品的配送与售后服务详情，从底部滑入。
 */

import { Package, RotateCcw, ShieldCheck, Truck, X } from 'lucide-react';
import type { ShopProductDetail } from '../../../api/modules/shopProduct';
import { buildShopProductServiceItems } from '../../shop-product/utils';

interface ProductServiceSheetProps {
  /** 弹窗是否可见 */
  isOpen: boolean;
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 商品数据 */
  product: ShopProductDetail | null;
}

/** 服务项对应的图标映射 */
function getServiceIcon(text: string) {
  if (text.includes('包邮') || text.includes('发货')) return Truck;
  if (text.includes('退') || text.includes('换')) return RotateCcw;
  if (text.includes('质保') || text.includes('保修')) return ShieldCheck;
  return Package;
}

export const ProductServiceSheet = ({
  isOpen,
  onClose,
  product,
}: ProductServiceSheetProps) => {
  if (!isOpen) {
    return null;
  }

  const serviceItems = buildShopProductServiceItems(product);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* 弹窗内容 */}
      <div className="relative z-10 flex max-h-[60vh] w-full flex-col rounded-t-[24px] bg-white dark:bg-gray-900">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-text-sub active:bg-bg-base"
        >
          <X size={20} />
        </button>

        {/* 标题 */}
        <div className="border-b border-border-light px-4 pb-3 pt-4">
          <h3 className="text-lg font-bold text-text-main">服务说明</h3>
        </div>

        {/* 服务列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {serviceItems.map((item) => {
              const Icon = getServiceIcon(item);
              return (
                <div key={item} className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-start/10">
                    <Icon size={16} className="text-primary-start" />
                  </div>
                  <div className="flex-1 pt-1">
                    <span className="text-base text-text-main">{item}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 平台保障说明 */}
          <div className="mt-6 rounded-xl bg-bg-base p-4">
            <h4 className="mb-2 text-sm font-bold text-text-main">平台保障</h4>
            <ul className="space-y-1.5 text-sm text-text-sub">
              <li className="flex items-center">
                <ShieldCheck size={12} className="mr-2 shrink-0 text-primary-start" />
                自营商品由平台直接发货，品质保证
              </li>
              <li className="flex items-center">
                <ShieldCheck size={12} className="mr-2 shrink-0 text-primary-start" />
                支持7天无理由退换货
              </li>
              <li className="flex items-center">
                <ShieldCheck size={12} className="mr-2 shrink-0 text-primary-start" />
                如商品有质量问题，可联系客服处理
              </li>
            </ul>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="border-t border-border-light p-4 pb-safe">
          <button
            type="button"
            className="w-full rounded-full bg-gradient-to-r from-primary-start to-primary-end py-3 text-base font-medium text-white active:opacity-90"
            onClick={onClose}
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};
