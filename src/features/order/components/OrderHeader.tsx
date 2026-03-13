import { Search } from 'lucide-react';

interface OrderHeaderProps {
  hidden?: boolean;
  onSearch: () => void;
}

export const OrderHeader = ({ hidden = false, onSearch }: OrderHeaderProps) => (
  <div
    className={`overflow-hidden border-b border-border-light bg-bg-card transition-[max-height,opacity] duration-300 ${
      hidden ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'
    }`}
  >
    <div
      className={`flex items-center justify-between px-4 py-3 transition-transform duration-300 ${
        hidden ? '-translate-y-4' : 'translate-y-0'
      }`}
    >
      <div className="w-6"></div>
      <h1 className="text-3xl font-bold text-text-main">订单</h1>
      <button className="text-text-main p-1 -mr-1 active:opacity-70" onClick={onSearch}>
        <Search size={20} />
      </button>
    </div>
  </div>
);
