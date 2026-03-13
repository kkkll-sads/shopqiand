import type { PropsWithChildren } from 'react';

type BadgeVariant = 'default' | 'primary' | 'score' | 'solid';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
}

export const Badge = ({
  children,
  variant = 'default',
  className = '',
}: PropsWithChildren<BadgeProps>) => {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-bg-base text-text-sub border border-border-light',
    primary: 'bg-red-50 text-primary-start border border-red-100',
    score: 'bg-amber-500 text-white font-medium',
    solid: 'bg-gradient-to-r from-primary-start to-primary-end text-white',
  };

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded flex items-center ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
