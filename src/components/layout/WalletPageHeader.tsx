import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { lightButtonStateClass } from '../ui/Button';

interface WalletHeaderAction {
  ariaLabel?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
}

interface WalletPageHeaderProps {
  action?: WalletHeaderAction;
  className?: string;
  hideBackButton?: boolean;
  offline?: boolean;
  onBack?: () => void;
  onRefresh?: () => void;
  rightAction?: ReactNode;
  title: string;
}

export function WalletHeaderActionButton({
  ariaLabel,
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: WalletHeaderAction) {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border border-primary-start/12 bg-primary-start/[0.08] px-3 text-sm font-medium text-primary-start shadow-[0_8px_20px_rgba(233,59,59,0.08)] ${lightButtonStateClass}`.trim()}
    >
      {Icon ? <Icon size={14} /> : null}
      <span>{label}</span>
    </button>
  );
}

export function WalletPageHeader({
  action,
  className = '',
  hideBackButton = false,
  offline = false,
  onBack,
  onRefresh,
  rightAction,
  title,
}: WalletPageHeaderProps) {
  return (
    <PageHeader
      title={title}
      onBack={onBack}
      hideBackButton={hideBackButton}
      offline={offline}
      onRefresh={onRefresh}
      className={`border-b border-border-light/70 bg-bg-card/95 shadow-[0_8px_24px_rgba(17,24,39,0.04)] backdrop-blur-sm ${className}`.trim()}
      contentClassName="h-12 px-4 pt-safe"
      titleClassName="text-xl font-semibold tracking-[0.01em]"
      backButtonClassName="rounded-full active:bg-bg-hover"
      rightClassName="items-center"
      rightAction={rightAction ?? (action ? <WalletHeaderActionButton {...action} /> : null)}
    />
  );
}
