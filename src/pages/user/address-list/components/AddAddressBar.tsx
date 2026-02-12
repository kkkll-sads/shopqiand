import React from 'react';
import { Plus } from 'lucide-react';

interface AddAddressBarProps {
  onAdd: () => void;
}

const AddAddressBar: React.FC<AddAddressBarProps> = ({ onAdd }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe max-w-md mx-auto">
      <button
        className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-red-200"
        onClick={onAdd}
      >
        <Plus size={20} />
        新增收货地址
      </button>
    </div>
  );
};

export default AddAddressBar;
