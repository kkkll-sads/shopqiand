interface CartCountBadgeProps {
  count: number;
  className?: string;
}

export const CartCountBadge = ({ count, className = '' }: CartCountBadgeProps) => {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      className={`pointer-events-none absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full border border-white bg-primary-start px-1 text-[10px] font-semibold leading-[16px] text-white ${className}`.trim()}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
