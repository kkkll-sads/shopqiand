import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { PaymentAccountFormValues, CardManagementMode } from '../types';
import type { PaymentAccountType } from '@/services';

interface AccountFormProps {
  mode: CardManagementMode;
  formValues: PaymentAccountFormValues;
  formLoading: boolean;
  hasFormError: boolean;
  formErrorMessage: string;
  onSubmit: (event: React.FormEvent) => void;
  onInputChange: (
    field: keyof PaymentAccountFormValues,
    value: string | File | null | boolean
  ) => void;
  onOpenBankPicker: () => void;
}

const ACCOUNT_TYPE_OPTIONS: Array<{ value: PaymentAccountType; label: string }> = [
  { value: 'bank_card', label: '银行卡' },
  { value: 'alipay', label: '支付宝' },
];

const getAccountPlaceholder = (type: PaymentAccountType): string => {
  if (type === 'alipay') return '请输入支付宝账号（手机号或邮箱）';
  return '请输入银行卡号';
};

const AccountForm: React.FC<AccountFormProps> = ({
  mode,
  formValues,
  formLoading,
  hasFormError,
  formErrorMessage,
  onSubmit,
  onInputChange,
  onOpenBankPicker,
}) => {
  return (
    <form className="bg-white mt-2 px-4" onSubmit={onSubmit}>
      <div className="py-4 border-b border-gray-100">
        <span className="block text-sm text-gray-500 mb-2">
          账户类型 <span className="text-red-500">*</span>
        </span>
        <div className="flex flex-wrap gap-3">
          {ACCOUNT_TYPE_OPTIONS.map((option) => {
            const active = formValues.type === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                disabled={mode === 'edit'}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-red-50 text-red-600 border-red-200 border'
                    : 'bg-gray-50 text-gray-600 border border-transparent'
                } ${mode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={() => onInputChange('type', option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {mode === 'edit' && (
          <p className="text-xs text-gray-400 mt-2">编辑模式下账户类型不可修改</p>
        )}
      </div>

      {formValues.type === 'bank_card' && (
        <button
          type="button"
          className="w-full py-4 border-b border-gray-100 flex flex-col gap-1 cursor-pointer text-left bg-transparent"
          onClick={onOpenBankPicker}
        >
          <span className="block text-sm text-gray-500 mb-1">
            银行名称 <span className="text-red-500">*</span>
          </span>
          <div className="flex items-center justify-between">
            <span className={`text-base font-medium ${formValues.bank_name ? 'text-gray-900' : 'text-gray-300'}`}>
              {formValues.bank_name || '点击选择银行'}
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </button>
      )}

      <div className="py-4 border-b border-gray-100">
        <span className="block text-sm text-gray-500 mb-1">
          账户名称 / 持卡人 <span className="text-red-500">*</span>
        </span>
        <input
          className="w-full text-base text-gray-900 outline-none placeholder:text-gray-300 bg-transparent font-medium"
          type="text"
          placeholder="请输入账户名或持卡人姓名"
          value={formValues.account_name}
          onChange={(e) => onInputChange('account_name', e.target.value)}
        />
      </div>

      <div className="py-4 border-b border-gray-100">
        <span className="block text-sm text-gray-500 mb-1">
          账号 / 卡号 <span className="text-red-500">*</span>
        </span>
        <input
          className="w-full text-base text-gray-900 outline-none placeholder:text-gray-300 bg-transparent font-medium"
          type="text"
          placeholder={getAccountPlaceholder(formValues.type)}
          value={formValues.account_number}
          onChange={(e) => onInputChange('account_number', e.target.value)}
        />
        {formValues.type === 'alipay' && (
          <p className="text-xs text-gray-400 mt-1">仅支持手机号或邮箱格式</p>
        )}
      </div>

      {formValues.type === 'bank_card' && (
        <div className="py-4 border-b border-gray-100">
          <span className="block text-sm text-gray-500 mb-1">开户行 / 支行（选填）</span>
          <input
            className="w-full text-base text-gray-900 outline-none placeholder:text-gray-300 bg-transparent font-medium"
            type="text"
            placeholder="如：招商银行上海徐家汇支行"
            value={formValues.bank_branch}
            onChange={(e) => onInputChange('bank_branch', e.target.value)}
          />
        </div>
      )}

      {mode === 'edit' && (
        <label className="flex items-center justify-between py-4">
          <span className="text-base text-gray-800">设为默认账户</span>
          <div className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formValues.is_default}
              onChange={(e) => onInputChange('is_default', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600" />
          </div>
        </label>
      )}

      {hasFormError && (
        <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-md mt-2 mb-2">
          {formErrorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={formLoading}
        className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white text-base font-bold py-3.5 rounded-full shadow-lg shadow-red-200 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed mt-8 mb-8"
      >
        {formLoading ? '提交中...' : '提交保存'}
      </button>
    </form>
  );
};

export default AccountForm;
