import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const buttonStateClass =
  'transition-[transform,background-color,border-color,color,opacity,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-start/20 disabled:cursor-not-allowed disabled:opacity-50 enabled:active:scale-[0.985]';

export const lightButtonStateClass =
  'transition-[transform,background-color,border-color,color,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-start/20 disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-bg-hover enabled:hover:text-text-main enabled:active:scale-[0.985] enabled:active:bg-bg-hover';

export const textButtonStateClass =
  'transition-[transform,color,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-start/20 disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:opacity-85 enabled:active:scale-[0.985] enabled:active:opacity-75';

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-[36px] rounded-[16px] px-3 text-[13px]',
  md: 'h-[42px] rounded-[18px] px-4 text-[14px]',
  lg: 'h-[48px] rounded-2xl px-4 text-lg',
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-primary-start to-primary-end text-white shadow-soft enabled:hover:brightness-[1.03] enabled:active:brightness-[0.98]',
  secondary:
    'border border-border-light bg-bg-card text-text-main shadow-soft enabled:hover:border-border-main enabled:hover:bg-bg-hover enabled:active:border-border-main enabled:active:bg-bg-hover',
  outline:
    'border border-primary-start/60 bg-transparent text-primary-start enabled:hover:border-primary-start enabled:hover:bg-primary-start/8 enabled:active:bg-primary-start/12',
  ghost:
    'bg-transparent text-text-sub enabled:hover:bg-bg-hover enabled:hover:text-text-main enabled:active:bg-bg-hover',
  danger:
    'bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-soft enabled:hover:brightness-[1.03] enabled:active:brightness-[0.98]',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'lg',
  className = '',
  fullWidth = true,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: PropsWithChildren<ButtonProps>) => {
  const isDisabled = disabled || loading;
  const baseStyle = `inline-flex items-center justify-center gap-2 font-medium ${buttonStateClass}`;

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : leftIcon}
      <span>{children}</span>
      {!loading ? rightIcon : null}
    </button>
  );
};
