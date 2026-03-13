import { MessageCircle, ShoppingCart, Store } from 'lucide-react';
import { CartCountBadge } from '../../../components/ui/CartCountBadge';

interface ProductPurchaseBarProps {
  onAddToCart: () => void;
  onBuyNow: () => void;
  onOpenCart: () => void;
  onOpenHelp: () => void;
  onOpenStore: () => void;
  cartCount?: number;
}

export const ProductPurchaseBar = ({
  onAddToCart,
  onBuyNow,
  onOpenCart,
  onOpenHelp,
  onOpenStore,
  cartCount = 0,
}: ProductPurchaseBarProps) => (
  <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex w-full max-w-[430px] items-center border-t border-[#ececec] bg-white px-3 py-2 pb-safe">
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        className="flex w-12 flex-col items-center justify-center py-0.5 text-[#6b7280] active:opacity-70"
        onClick={onOpenStore}
      >
        <Store size={18} />
        <span className="mt-0.5 text-[10px]">商城</span>
      </button>
      <button
        type="button"
        className="flex w-12 flex-col items-center justify-center py-0.5 text-[#6b7280] active:opacity-70"
        onClick={onOpenHelp}
      >
        <MessageCircle size={18} />
        <span className="mt-0.5 text-[10px]">客服</span>
      </button>
      <button
        type="button"
        className="relative flex w-12 flex-col items-center justify-center py-0.5 text-[#6b7280] active:opacity-70"
        onClick={onOpenCart}
      >
        <CartCountBadge count={cartCount} />
        <ShoppingCart size={18} />
        <span className="mt-0.5 text-[10px]">购物车</span>
      </button>
    </div>

    <div className="ml-3 flex flex-1 items-center gap-2">
      <button
        type="button"
        className="flex h-10 flex-1 items-center justify-center rounded-full border border-[#f2b5a4] bg-[#fff7f3] text-sm font-medium text-primary-start active:opacity-80"
        onClick={onAddToCart}
      >
        加入购物车
      </button>
      <button
        type="button"
        className="flex h-10 flex-1 items-center justify-center rounded-full bg-primary-start text-sm font-medium text-white active:opacity-80"
        onClick={onBuyNow}
      >
        立即购买
      </button>
    </div>
  </div>
);
