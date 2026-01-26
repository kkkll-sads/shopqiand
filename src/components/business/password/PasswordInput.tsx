/**
 * PasswordInput - 密码输入框组件
 */
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  disabled?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  disabled = false,
}) => {
  return (
    <div className="py-4 border-b border-gray-100">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="flex items-center">
        <input
          type={showPassword ? "text" : "password"}
          className="flex-1 text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-300 font-medium"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="p-2 text-gray-400 focus:outline-none"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;
