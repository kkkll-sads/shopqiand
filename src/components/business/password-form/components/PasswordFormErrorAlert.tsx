import React from 'react';

interface PasswordFormErrorAlertProps {
  message: string;
}

const PasswordFormErrorAlert: React.FC<PasswordFormErrorAlertProps> = ({ message }) => {
  return (
    <div className="mb-4 rounded-lg bg-red-50 p-3 flex items-start gap-2">
      <div className="text-red-500 mt-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm text-red-600 font-medium">{message}</p>
    </div>
  );
};

export default PasswordFormErrorAlert;
