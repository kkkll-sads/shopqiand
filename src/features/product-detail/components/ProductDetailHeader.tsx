import { ChevronLeft } from 'lucide-react';

interface ProductDetailHeaderProps {
  isScrolled: boolean;
  onBack: () => void;
  title?: string;
}

export const ProductDetailHeader = ({
  isScrolled,
  onBack,
  title,
}: ProductDetailHeaderProps) => (
  <header
    className={`fixed left-0 right-0 top-0 z-40 transition-all duration-200 ${
      isScrolled ? 'border-b border-[#ececec] bg-white shadow-sm' : 'bg-transparent'
    }`}
  >
    <div className="flex h-12 items-center px-2 pt-safe">
      <button
        type="button"
        onClick={onBack}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          isScrolled ? 'text-text-main active:bg-[#f5f5f5]' : 'bg-black/20 text-white active:bg-black/30'
        }`}
      >
        <ChevronLeft size={20} />
      </button>

      <div
        className={`flex flex-1 items-center justify-center px-4 text-center transition-opacity duration-200 ${
          isScrolled ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <span className="line-clamp-1 text-sm font-medium text-text-main">
          {title || '商品详情'}
        </span>
      </div>

      <div className="w-8 shrink-0" />
    </div>
  </header>
);
