import React from 'react';
import { Wallet, Receipt, Leaf, CreditCard } from 'lucide-react';
import { Route } from '../../../../router/routes';

interface AssetActionsGridProps {
  onNavigate: (route: Route) => void;
}

const AssetActionsGrid: React.FC<AssetActionsGridProps> = ({ onNavigate }) => {
  const actions = [
    { label: '申购专项金', icon: Wallet, route: { name: 'balance-recharge', source: 'asset-view', back: { name: 'asset-view' } } as Route, color: 'text-orange-600' },
    { label: '收益提现', icon: Receipt, route: { name: 'balance-withdraw', source: 'asset-view', back: { name: 'asset-view' } } as Route, color: 'text-orange-600' },
    { label: '算力补充', icon: Leaf, route: { name: 'hashrate-exchange', source: 'asset-view', back: { name: 'asset-view' } } as Route, color: 'text-green-600' },
    { label: '确权金划转', icon: CreditCard, route: { name: 'service-recharge', source: 'asset-view', back: { name: 'asset-view' } } as Route, color: 'text-purple-600' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {actions.map((item, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onNavigate(item.route)}
          className="flex flex-col items-center group active:scale-95 transition-transform"
        >
          <div className="w-full aspect-[4/3] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center mb-1.5 relative overflow-hidden group-hover:shadow-md transition-shadow">
            <div className={`mb-1 ${item.color}`}>
              <item.icon size={22} />
            </div>
          </div>
          <span className="text-[11px] font-medium text-gray-600 leading-tight text-center">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default AssetActionsGrid;

