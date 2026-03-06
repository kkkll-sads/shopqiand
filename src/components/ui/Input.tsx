import React from 'react';

export const Input = ({ icon, rightIcon, className = '', ...props }: any) => {
  return (
    <div className={`flex items-center h-[48px] bg-bg-card rounded-2xl px-4 shadow-soft border border-transparent focus-within:border-primary-start transition-colors ${className}`}>
      {icon && <div className="mr-2 text-text-aux">{icon}</div>}
      <input className="flex-1 bg-transparent outline-none text-lg text-text-main placeholder:text-text-aux w-full" {...props} />
      {rightIcon && <div className="ml-2 text-text-aux">{rightIcon}</div>}
    </div>
  );
};
