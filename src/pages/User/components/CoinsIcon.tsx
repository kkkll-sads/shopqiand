import React from 'react';

/**
 * 金币图标，由于 Lucide 的 Coins 难以完美展现色彩感，这里允许注入类名
 */
const CoinsIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
};

export default CoinsIcon;
