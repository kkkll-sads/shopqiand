import React from 'react';
import ClaimFormSection from './ClaimFormSection';
import { useNotification } from '../../../../../context/NotificationContext';
import useClaimForm from '../../hooks/useClaimForm';
import useImageUploads from '../../hooks/useImageUploads';
import useClaimSubmit from '../../hooks/useClaimSubmit';

type ReviewStats = {
  pending_count: number;
  approved_count: number;
  isLoading: boolean;
};

interface ClaimFormProps {
  userBalance?: number | string;
  reviewStats: ReviewStats;
  loadHistory: (token?: string) => Promise<void>;
  loadReviewStats: (token?: string) => Promise<void>;
  onNavigateHistory?: () => void;
}

const ClaimForm: React.FC<ClaimFormProps> = ({
  userBalance,
  reviewStats,
  loadHistory,
  loadReviewStats,
  onNavigateHistory,
}) => {
  const { showToast } = useNotification();
  const {
    form,
    updateField,
    replaceImages,
    resetForm,
    validateForm,
    amountErrorVisible,
  } = useClaimForm();

  const {
    fileInputRef,
    imageUploadStates,
    selectFiles,
    removeImage,
    resetUploads,
    triggerSelect,
  } = useImageUploads({
    showToast,
    onImagesChange: replaceImages,
    currentUrls: form.images,
  });

  const { submitting, submit } = useClaimSubmit({
    form,
    validateForm,
    reviewStats,
    resetForm,
    resetUploads,
    loadHistory,
    loadReviewStats,
    onNavigateHistory,
    showToast,
  });

  return (
    <ClaimFormSection
      form={form}
      onVoucherChange={(value) => updateField('voucher_type', value)}
      onAmountChange={(value) => updateField('amount', value)}
      onRemarkChange={(value) => updateField('remark', value)}
      userBalance={userBalance}
      uploadStates={imageUploadStates}
      fileInputRef={fileInputRef}
      onFileChange={(e) => selectFiles(e.target.files)}
      onRemoveImage={removeImage}
      onAddClick={triggerSelect}
      onSubmit={submit}
      loading={submitting}
      showAmountError={amountErrorVisible}
    />
  );
};

export default ClaimForm;

