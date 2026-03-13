import React from 'react';
import { Check } from 'lucide-react';

export const Checkbox = ({ checked, onChange, label, className = '' }: any) => {
  return (
    <label className={`flex items-center cursor-pointer ${className}`}>
      <div
        className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
          checked ? 'auth-checkbox-checked' : 'auth-checkbox-unchecked'
        }`}
      >
        {checked && <Check size={12} className="text-white" />}
      </div>
      {label && <span className="auth-checkbox-label ml-2 text-sm">{label}</span>}
      <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
    </label>
  );
};
