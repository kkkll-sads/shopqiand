import React from 'react';
import { MapPin } from 'lucide-react';
import type { AddressFormValues } from '../types';

interface AddressFormProps {
  formValues: AddressFormValues;
  formLoading: boolean;
  hasFormError: boolean;
  formErrorMessage: string;
  onSubmit: (event: React.FormEvent) => void;
  onInputChange: (field: keyof AddressFormValues, value: string | boolean) => void;
  onOpenRegionPicker: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({
  formValues,
  formLoading,
  hasFormError,
  formErrorMessage,
  onSubmit,
  onInputChange,
  onOpenRegionPicker,
}) => {
  return (
    <form className="bg-white mt-2 px-4" onSubmit={onSubmit}>
      <div className="py-4 border-b border-gray-100">
        <span className="block text-sm text-gray-500 mb-1">
          收货人姓名 <span className="text-red-500">*</span>
        </span>
        <input
          className="w-full text-base text-gray-900 outline-none placeholder:text-gray-300 bg-transparent font-medium"
          type="text"
          placeholder="请输入收货人姓名"
          value={formValues.name}
          onChange={(e) => onInputChange('name', e.target.value)}
        />
      </div>

      <div className="py-4 border-b border-gray-100">
        <span className="block text-sm text-gray-500 mb-1">
          手机号 <span className="text-red-500">*</span>
        </span>
        <input
          className="w-full text-base text-gray-900 outline-none placeholder:text-gray-300 bg-transparent font-medium"
          type="tel"
          placeholder="请输入手机号"
          value={formValues.phone}
          onChange={(e) => onInputChange('phone', e.target.value)}
        />
      </div>

      <div className="py-4 border-b border-gray-100" onClick={onOpenRegionPicker}>
        <span className="block text-sm text-gray-500 mb-1">
          所在地区 <span className="text-red-500">*</span>
        </span>
        <div className="flex items-center justify-between">
          <div className={`text-base font-medium ${formValues.province ? 'text-gray-900' : 'text-gray-300'}`}>
            {formValues.province && formValues.city
              ? `${formValues.province} ${formValues.city} ${formValues.district || ''}`
              : '点击选择省市区'}
          </div>
          <MapPin size={18} className="text-gray-400" />
        </div>
      </div>

      <div className="py-4 border-b border-gray-100">
        <span className="block text-sm text-gray-500 mb-1">
          详细地址 <span className="text-red-500">*</span>
        </span>
        <textarea
          className="w-full text-base text-gray-900 outline-none placeholder:text-gray-300 bg-transparent font-medium resize-none min-h-[80px]"
          placeholder="街道、小区、楼栋、门牌号等"
          value={formValues.address}
          onChange={(e) => onInputChange('address', e.target.value)}
        />
      </div>

      <label className="flex items-center justify-between py-4">
        <span className="text-base text-gray-800">设为默认地址</span>
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

      {hasFormError && (
        <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-md mb-4">
          {formErrorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={formLoading}
        className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white text-base font-bold py-3.5 rounded-full shadow-lg shadow-red-200 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed mt-4 mb-8"
      >
        {formLoading ? '提交中...' : '保存地址'}
      </button>
    </form>
  );
};

export default AddressForm;
