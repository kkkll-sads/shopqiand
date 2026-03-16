import { ChevronLeft } from 'lucide-react';

interface MyCollectionDetailHeaderProps {
  onBack: () => void;
}

export function MyCollectionDetailHeader({ onBack }: MyCollectionDetailHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border-light bg-bg-card/90 px-4 py-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onBack}
        className="rounded-full p-2 text-text-main transition-colors active:bg-bg-hover"
        aria-label="返回"
      >
        <ChevronLeft size={24} />
      </button>
      <h1 className="text-lg font-bold text-text-main">数字资产持有凭证</h1>
      <div className="w-10" />
    </header>
  );
}
