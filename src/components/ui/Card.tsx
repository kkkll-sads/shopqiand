import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => {
  return (
    <div className={`bg-bg-card rounded-2xl p-4 shadow-soft ${className}`} {...rest}>
      {children}
    </div>
  );
};
