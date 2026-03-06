import React from 'react';

export const Card = ({ children, className = '' }: any) => {
  return (
    <div className={`bg-bg-card rounded-2xl p-4 shadow-soft ${className}`}>
      {children}
    </div>
  );
};
