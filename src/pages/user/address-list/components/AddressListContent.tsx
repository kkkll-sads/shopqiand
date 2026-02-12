import React from 'react';
import type { AddressItem } from '@/services';
import AddressCard from './AddressCard';

interface AddressListContentProps {
  loading: boolean;
  hasListError: boolean;
  listErrorMessage: string;
  addresses: AddressItem[];
  onEdit: (address: AddressItem) => void;
  onDelete: (id?: number | string) => void;
  onSetDefault: (address: AddressItem) => void;
}

const AddressListContent: React.FC<AddressListContentProps> = ({
  loading,
  hasListError,
  listErrorMessage,
  addresses,
  onEdit,
  onDelete,
  onSetDefault,
}) => {
  return (
    <>
      {hasListError && (
        <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">{listErrorMessage}</div>
      )}

      {loading && (
        <div className="text-center text-xs text-gray-400 py-4">正在加载收货地址...</div>
      )}

      {!loading && !addresses.length && !hasListError && (
        <div className="text-center text-xs text-gray-400 py-8">暂无收货地址，请点击下方按钮新增</div>
      )}

      {addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          onEdit={onEdit}
          onDelete={onDelete}
          onSetDefault={onSetDefault}
        />
      ))}
    </>
  );
};

export default AddressListContent;
