import { useCallback, useMemo, useState } from 'react';

export type ClaimFormState = {
  voucher_type: 'screenshot' | 'transfer_record' | 'other';
  amount: string;
  images: string[];
  remark: string;
};

export type ClaimFormValidation = {
  valid: boolean;
  validAmount: boolean;
  hasImages: boolean;
};

type ImagesUpdater = ClaimFormState['images'] | ((prev: ClaimFormState['images']) => ClaimFormState['images']);

const createInitialForm = (): ClaimFormState => ({
  voucher_type: 'screenshot',
  amount: '',
  images: [],
  remark: '',
});

/**
 * 管理确权表单状态与校验
 */
export const useClaimForm = () => {
  const initialForm = useMemo(createInitialForm, []);
  const [form, setForm] = useState<ClaimFormState>(initialForm);
  const [amountErrorVisible, setAmountErrorVisible] = useState(false);

  const updateField = useCallback(<K extends keyof ClaimFormState>(key: K, value: ClaimFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const replaceImages = useCallback((images: ImagesUpdater) => {
    setForm((prev) => ({
      ...prev,
      images: typeof images === 'function' ? images(prev.images) : images,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(createInitialForm());
  }, []);

  const hideAmountError = useCallback(() => setAmountErrorVisible(false), []);

  const validateForm = useCallback((): ClaimFormValidation => {
    const validAmount = form.amount.trim() !== '' && parseFloat(form.amount) > 0;
    const hasImages = form.images.length > 0;
    if (!validAmount) {
      setAmountErrorVisible(true);
      setTimeout(() => setAmountErrorVisible(false), 3000);
    }
    return {
      valid: validAmount && hasImages,
      validAmount,
      hasImages,
    };
  }, [form.amount, form.images.length]);

  return {
    form,
    updateField,
    replaceImages,
    resetForm,
    validateForm,
    amountErrorVisible,
    hideAmountError,
  };
};

export default useClaimForm;

