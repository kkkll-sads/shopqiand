export type AddressPageMode = 'list' | 'add' | 'edit';

export type AddressFormValues = {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  is_default: boolean;
};

export const createInitialFormValues = (): AddressFormValues => ({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  address: '',
  is_default: false,
});
