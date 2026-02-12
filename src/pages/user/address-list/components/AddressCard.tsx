import React from 'react';
import { MapPin, Pencil, Trash2 } from 'lucide-react';
import type { AddressItem } from '@/services';
import { formatFullAddress, isDefaultAddress } from '../helpers';

interface AddressCardProps {
  address: AddressItem;
  onEdit: (address: AddressItem) => void;
  onDelete: (id?: number | string) => void;
  onSetDefault: (address: AddressItem) => void;
}

const AddressCard: React.FC<AddressCardProps> = ({ address, onEdit, onDelete, onSetDefault }) => {
  const isDefault = isDefaultAddress(address);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">{address.name}</span>
          <span className="text-gray-500 text-sm">{address.phone}</span>
          {isDefault && (
            <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded-full">默认</span>
          )}
        </div>
        <button className="text-gray-400 p-1" onClick={() => onEdit(address)}>
          <Pencil size={16} />
        </button>
      </div>

      <div className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed pr-8 mb-3">
        <MapPin size={14} className="mt-0.5 text-gray-400" />
        <span>{formatFullAddress(address)}</span>
      </div>

      <div className="border-t border-gray-50 pt-3 flex justify-between items-center">
        <div
          className="flex items-center gap-2 cursor-pointer active:opacity-60 transition-opacity"
          onClick={() => onSetDefault(address)}
        >
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              isDefault ? 'border-red-500 bg-red-500' : 'border-gray-300'
            }`}
          >
            {isDefault && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
          </div>
          <span className={`text-xs ${isDefault ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
            默认地址
          </span>
        </div>
        <button className="flex items-center gap-1 text-xs text-gray-500" onClick={() => onDelete(address.id)}>
          <Trash2 size={14} />
          删除
        </button>
      </div>
    </div>
  );
};

export default AddressCard;
