import type { AddressItem } from '@/services';

export const isDefaultAddress = (address: AddressItem) => {
  return ['1', 1, true, 'true'].includes(address.is_default);
};

export const formatFullAddress = (address: AddressItem) => {
  return [address.province, address.city, address.district, address.address]
    .filter(Boolean)
    .join(' ');
};
