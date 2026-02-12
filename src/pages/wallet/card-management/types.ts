import type { PaymentAccountType } from '@/services';

export type CardManagementMode = 'list' | 'add' | 'edit';

export type PaymentAccountFormValues = {
  type: PaymentAccountType;
  bank_name: string;
  account_name: string;
  account_number: string;
  bank_branch: string;
  screenshot: File | null;
  is_default: boolean;
};

export const createInitialFormValues = (): PaymentAccountFormValues => ({
  type: 'bank_card',
  bank_name: '',
  account_name: '',
  account_number: '',
  bank_branch: '',
  screenshot: null,
  is_default: false,
});
