import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const baseStyle = "h-[48px] rounded-2xl font-medium text-lg flex items-center justify-center transition-opacity active:opacity-80 w-full";
  const variants: any = {
    primary: "bg-gradient-to-r from-primary-start to-primary-end text-white shadow-soft",
    secondary: "bg-bg-card text-text-main border border-border-light shadow-soft",
    outline: "bg-transparent border border-primary-start text-primary-start",
    ghost: "bg-transparent text-text-sub",
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
