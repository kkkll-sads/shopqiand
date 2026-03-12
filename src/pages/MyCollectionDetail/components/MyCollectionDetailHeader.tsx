import { ChevronLeft } from 'lucide-react';

interface MyCollectionDetailHeaderProps {
  onBack: () => void;
}

export function MyCollectionDetailHeader({ onBack }: MyCollectionDetailHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-amber-900/5 bg-[#FDFBF7]/90 px-4 py-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onBack}
        className="rounded-full p-2 text-gray-800 transition-colors active:bg-black/5"
        aria-label="返回"
      >
        <ChevronLeft size={24} />
      </button>
      <h1 className="text-lg font-bold text-gray-900">数字资产持有凭证</h1>
      <div className="w-10" />
    </header>
  );
}
