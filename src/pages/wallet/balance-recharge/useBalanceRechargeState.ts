import { useCallback, useState, type ChangeEvent } from 'react';
import type { CompanyAccountItem } from '@/services';
import type { BalanceRechargeViewState } from './types';

type ShowToast = (type: string, title: string, message?: string) => void;

interface UseBalanceRechargeStateParams {
  initialAmount?: string;
  showToast: ShowToast;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export function useBalanceRechargeState({ initialAmount, showToast }: UseBalanceRechargeStateParams) {
  const [amount, setAmount] = useState<string>(initialAmount || '');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [viewState, setViewState] = useState<BalanceRechargeViewState>('input');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [matchedAccount, setMatchedAccount] = useState<CompanyAccountItem | null>(null);

  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [showPaymentBrowser, setShowPaymentBrowser] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const [lastFourDigits, setLastFourDigits] = useState<string>('');

  const handleImageSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        showToast('error', '格式错误', '只支持 JPG、PNG、GIF 格式');
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        showToast('error', '文件过大', '图片大小不能超过 5MB');
        return;
      }

      setUploadedImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [showToast],
  );

  const handleImageRemove = useCallback(() => {
    setUploadedImage(null);
    setImagePreview(null);
  }, []);

  const resetMatchedFlow = useCallback(() => {
    setViewState('input');
    setMatchedAccount(null);
    setUploadedImage(null);
    setImagePreview(null);
  }, []);

  const resetAfterSubmit = useCallback(() => {
    setAmount('');
    setSelectedMethod(null);
    setUploadedImage(null);
    setImagePreview(null);
    setMatchedAccount(null);
    setLastFourDigits('');
    setViewState('input');
  }, []);

  const navigateToDetail = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    setViewState('detail');
  }, []);

  const openPaymentBrowser = useCallback((url: string, orderId: string | null) => {
    setPaymentUrl(url);
    setPendingOrderId(orderId);
    setShowPaymentBrowser(true);
  }, []);

  const hidePaymentBrowser = useCallback(() => {
    setShowPaymentBrowser(false);
    setPaymentUrl('');
  }, []);

  const closePaymentBrowserToInput = useCallback(() => {
    hidePaymentBrowser();
    setViewState('input');
  }, [hidePaymentBrowser]);

  return {
    amount,
    setAmount,
    selectedMethod,
    setSelectedMethod,
    viewState,
    setViewState,
    selectedOrderId,
    matchedAccount,
    setMatchedAccount,
    uploadedImage,
    imagePreview,
    showPaymentBrowser,
    paymentUrl,
    pendingOrderId,
    lastFourDigits,
    setLastFourDigits,
    handleImageSelect,
    handleImageRemove,
    resetMatchedFlow,
    resetAfterSubmit,
    navigateToDetail,
    openPaymentBrowser,
    hidePaymentBrowser,
    closePaymentBrowserToInput,
  };
}
