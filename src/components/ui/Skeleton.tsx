import React from 'react';

export const Skeleton = ({ className = '' }: any) => {
  return <div className={`animate-pulse bg-border-light rounded-lg ${className}`}></div>;
};
