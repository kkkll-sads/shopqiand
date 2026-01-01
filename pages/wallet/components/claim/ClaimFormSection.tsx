import React from 'react';
import { ChevronLeft } from 'lucide-react';
import ClaimUploadZone from './ClaimUploadZone';
import { ImageUploadState } from '../../hooks/useImageUploads';
import { ClaimFormState } from '../../hooks/useClaimForm';

interface ClaimFormSectionProps {
  form: ClaimFormState;
  onVoucherChange: (value: ClaimFormState['voucher_type']) => void;
  onAmountChange: (value: string) => void;
  onRemarkChange: (value: string) => void;
  userBalance?: number | string;
  uploadStates: ImageUploadState[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (idx: number) => void;
  onAddClick: () => void;
  onSubmit: () => void;
  loading: boolean;
  showAmountError: boolean;
}

const ClaimFormSection: React.FC<ClaimFormSectionProps> = ({
  form,
  onVoucherChange,
  onAmountChange,
  onRemarkChange,
  userBalance,
  uploadStates,
  fileInputRef,
  onFileChange,
  onRemoveImage,
  onAddClick,
  onSubmit,
  loading,
  showAmountError,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm shadow-orange-100/50 space-y-6">
      <div>
        <div className="flex items-center mb-3">
          <div className="w-1 h-4 bg-[#FF4500] rounded-full mr-2"></div>
          <h3 className="text-[#333333] font-bold text-base">凭证类型</h3>
        </div>
        <div className="relative">
          <select
            className="w-full appearance-none bg-[#F9F9F9] border border-[#EEEEEE] text-[#333333] text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#FF4500] focus:border-[#FF4500] transition-all"
            value={form.voucher_type}
            onChange={(e) => onVoucherChange(e.target.value as ClaimFormState['voucher_type'])}
          >
            <option value="screenshot">余额截图</option>
            <option value="transfer_record">转账记录</option>
            <option value="other">其他凭证</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#999999]">
            <ChevronLeft size={20} className="-rotate-90" />
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <div className="w-1 h-4 bg-[#FF4500] rounded-full mr-2"></div>
            <h3 className="text-[#333333] font-bold text-base">确权金额</h3>
          </div>
          <span className="text-xs text-[#666666]">
            当前余额: <span className="font-bold text-[#333333]">¥{userBalance || '0.00'}</span>
          </span>
        </div>
        <div className="relative">
          <input
            type="number"
            className="w-full bg-[#F9F9F9] border border-[#EEEEEE] text-[#333333] text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#FF4500] focus:border-[#FF4500] transition-all placeholder-[#CCCCCC]"
            placeholder="确权金额"
            value={form.amount}
            onChange={(e) => onAmountChange(e.target.value)}
          />
        </div>
        <p className="mt-2 text-xs text-[#FF4D4F]">提示：请严格按照截图金额填写，虚假申报将导致封号</p>
      </div>

      <div>
        <div className="flex items-center mb-3">
          <div className="w-1 h-4 bg-[#FF4500] rounded-full mr-2"></div>
          <h3 className="text-[#333333] font-bold text-base">备注说明</h3>
        </div>
        <div className="relative">
          <textarea
            className="w-full bg-[#F9F9F9] border border-[#EEEEEE] text-[#333333] text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#FF4500] focus:border-[#FF4500] transition-all placeholder-[#CCCCCC] resize-none"
            placeholder="可选：添加备注说明（最多200字符）"
            rows={3}
            maxLength={200}
            value={form.remark}
            onChange={(e) => onRemarkChange(e.target.value)}
          />
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-xs text-[#999999]">可不填</p>
          <p className="text-xs text-[#999999]">{form.remark.length}/200</p>
        </div>
      </div>

      <div>
        <div className="flex items-center mb-3">
          <div className="w-1 h-4 bg-[#FF4500] rounded-full mr-2"></div>
          <h3 className="text-[#333333] font-bold text-base">凭证上传</h3>
        </div>
        <ClaimUploadZone
          imageUploadStates={uploadStates}
          onAddClick={onAddClick}
          onRemove={onRemoveImage}
          onFileChange={onFileChange}
          fileInputRef={fileInputRef}
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        className={`w-full py-3.5 rounded-full text-lg font-bold text-white shadow-lg transition-all active:scale-[0.98] mt-2
          ${loading ? 'bg-gray-300 shadow-none cursor-not-allowed' : 'bg-gradient-to-r from-[#FF6B00] to-[#FF4500] shadow-orange-200'}`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            提交中 <span className="animate-spin">◌</span>
          </span>
        ) : '提 交'}
      </button>

      {showAmountError && (
        <div className="text-xs text-[#FF4D4F] -mt-3">请输入有效的确权金额</div>
      )}
    </div>
  );
};

export default ClaimFormSection;

