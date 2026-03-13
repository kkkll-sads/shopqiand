import React from 'react';

export const Input = ({ icon, rightIcon, className = '', ...props }: any) => {
  // 密码输入框使用 Verdana 字体，避免中文字体将密码遮罩字符渲染为菱形
  const isPassword = props.type === 'password';
  const inputStyle = isPassword ? { fontFamily: 'Verdana, sans-serif' } : undefined;

  return (
    <div className={`flex items-center h-[48px] bg-bg-card rounded-2xl px-4 shadow-soft border border-transparent focus-within:border-primary-start transition-colors ${className}`}>
      {icon && <div className="mr-2 text-text-aux">{icon}</div>}
      <input
        className="flex-1 bg-transparent outline-none text-lg text-text-main placeholder:text-text-aux w-full"
        style={inputStyle}
        {...props}
      />
      {rightIcon && <div className="ml-2 text-text-aux">{rightIcon}</div>}
    </div>
  );
};
