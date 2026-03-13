interface OrderStatusTabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export const OrderStatusTabs = ({
  tabs,
  activeTab,
  onChange,
}: OrderStatusTabsProps) => (
  <div className="z-10 shrink-0 bg-bg-card border-b border-border-light">
    <div className="flex min-w-0 overflow-x-auto overflow-y-hidden no-scrollbar overscroll-x-contain px-2">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`${tabs.length <= 5 ? 'flex-1' : ''} px-4 py-3 text-base whitespace-nowrap relative ${
            activeTab === tab ? 'text-primary-start font-bold' : 'text-text-main'
          }`}
        >
          {tab}
          {activeTab === tab && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[3px] bg-primary-start rounded-t-full"></div>
          )}
        </button>
      ))}
    </div>
  </div>
);
