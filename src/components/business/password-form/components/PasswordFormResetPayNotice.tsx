import React from 'react';

const PasswordFormResetPayNotice: React.FC = () => {
  return (
    <div className="mx-4 mb-4 rounded-xl bg-red-50 p-4">
      <div className="flex gap-3">
        <div className="text-red-500 mt-0.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.9945 16H12.0035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm text-red-700 leading-relaxed">
          支持通过短信验证码重置交易密码；若忘记旧支付密码，请点击右上角"短信重置"。
        </p>
      </div>
    </div>
  );
};

export default PasswordFormResetPayNotice;
