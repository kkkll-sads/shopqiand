import type { OrderType } from '../types';

interface OrderTypeSwitcherProps {
  orderType: OrderType;
  onChange: (type: OrderType) => void;
}

export const OrderTypeSwitcher = ({
  orderType,
  onChange,
}: OrderTypeSwitcherProps) => (
  <div className="bg-bg-card px-4 py-3 border-b border-border-light">
    <div className="flex bg-bg-base rounded-lg p-1">
      <button
        className={`flex-1 py-1.5 text-md font-medium rounded-md transition-colors ${
          orderType === 'mall' ? 'bg-white dark:bg-gray-900 text-primary-start shadow-sm dark:text-red-300' : 'text-text-sub'
        }`}
        onClick={() => onChange('mall')}
      >
        商城订单
      </button>
      <button
        className={`flex-1 py-1.5 text-md font-medium rounded-md transition-colors ${
          orderType === 'collectible' ? 'bg-white dark:bg-gray-900 text-primary-start shadow-sm dark:text-red-300' : 'text-text-sub'
        }`}
        onClick={() => onChange('collectible')}
      >
        藏品订单
      </button>
    </div>
  </div>
);

