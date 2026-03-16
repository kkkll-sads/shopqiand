import { ChevronLeft, MoreHorizontal, Share } from 'lucide-react';

interface ProductDetailHeaderProps {
  isScrolled: boolean;
  onBack: () => void;
  onMore?: () => void;
  onShare?: () => void;
  title?: string;
}

export const ProductDetailHeader = ({
  isScrolled,
  onBack,
  onMore,
  onShare,
  title,
}: ProductDetailHeaderProps) => (
  <header
    className={`fixed left-0 right-0 top-0 z-40 transition-all duration-200 ${
      isScrolled ? 'border-b border-border-light bg-white shadow-sm' : 'bg-transparent'
    }`}
  >
    <div className="flex h-12 items-center justify-between px-4 pt-safe">
      <button
        type="button"
        onClick={onBack}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          isScrolled ? 'text-text-main active:bg-bg-base' : 'bg-black/25 text-white active:bg-black/30'
        }`}
      >
        <ChevronLeft size={20} />
      </button>

      <div
        className={`flex min-w-0 flex-1 items-center justify-center px-4 text-center transition-opacity duration-200 ${
          isScrolled ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <span className="line-clamp-1 text-sm font-medium text-text-main">{title || '商品'}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="分享"
          onClick={onShare}
          disabled={!onShare}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            isScrolled ? 'text-text-main active:bg-bg-base' : 'bg-black/25 text-white active:bg-black/30'
          } ${onShare ? '' : 'pointer-events-none'}`}
        >
          <Share size={18} />
        </button>
        <button
          type="button"
          aria-label="更多"
          onClick={onMore}
          disabled={!onMore}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            isScrolled ? 'text-text-main active:bg-bg-base' : 'bg-black/25 text-white active:bg-black/30'
          } ${onMore ? '' : 'pointer-events-none'}`}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>
    </div>
  </header>
);
