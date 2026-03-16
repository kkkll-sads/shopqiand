import type { MouseEventHandler, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface SettingsSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

type SettingsActionVariant = 'jump' | 'secondary' | 'danger' | 'static';

interface SettingsActionItemProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  value?: ReactNode;
  variant?: SettingsActionVariant;
  hideChevron?: boolean;
  borderless?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

interface SettingsNoticeProps {
  tone?: 'default' | 'warning';
  title?: string;
  children: ReactNode;
  className?: string;
}

const actionVariantClassName: Record<SettingsActionVariant, string> = {
  jump: 'text-text-main active:bg-bg-hover',
  secondary: 'text-text-main active:bg-bg-hover',
  danger: 'text-primary-start active:bg-red-50/70',
  static: 'text-text-main',
};

const iconVariantClassName: Record<SettingsActionVariant, string> = {
  jump: 'bg-bg-base text-text-sub',
  secondary: 'bg-bg-base text-text-sub',
  danger: 'bg-red-50 text-primary-start',
  static: 'bg-bg-base text-text-sub',
};

const descriptionVariantClassName: Record<SettingsActionVariant, string> = {
  jump: 'text-text-sub',
  secondary: 'text-text-sub',
  danger: 'text-primary-start/80',
  static: 'text-text-sub',
};

export const SettingsSection = ({
  title,
  description,
  children,
  className = '',
  contentClassName = '',
}: SettingsSectionProps) => {
  return (
    <section
      className={`overflow-hidden rounded-[24px] border border-border-light/60 bg-bg-card shadow-soft ${className}`.trim()}
    >
      {title || description ? (
        <div className="border-b border-border-light/80 px-4 py-4">
          {title ? <div className="text-lg font-medium text-text-main">{title}</div> : null}
          {description ? <div className="mt-1 text-s leading-5 text-text-sub">{description}</div> : null}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  );
};

export const SettingsActionItem = ({
  label,
  description,
  icon,
  value,
  variant = 'jump',
  hideChevron = false,
  borderless = false,
  className = '',
  disabled,
  onClick,
}: SettingsActionItemProps) => {
  const showChevron = !hideChevron && variant !== 'static' && !disabled;
  const showValueOnly = variant === 'static' || disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between px-4 py-4 text-left transition-colors ${actionVariantClassName[variant]} ${borderless ? '' : 'border-b border-border-light/80 last:border-b-0'} ${disabled ? 'cursor-default opacity-100' : ''} ${className}`.trim()}
      disabled={disabled}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconVariantClassName[variant]}`}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className={`truncate text-lg ${variant === 'danger' ? 'text-primary-start' : 'text-text-main'}`}>{label}</div>
          {description ? (
            <div className={`mt-1 text-s leading-5 ${descriptionVariantClassName[variant]}`}>{description}</div>
          ) : null}
        </div>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2">
        {value ? <div className={`text-sm ${showValueOnly ? 'text-text-sub' : 'text-text-aux'}`}>{value}</div> : null}
        {showChevron ? <ChevronRight size={16} className="text-text-aux" /> : null}
      </div>
    </button>
  );
};

export const SettingsNotice = ({
  tone = 'default',
  title,
  children,
  className = '',
}: SettingsNoticeProps) => {
  const toneClassName =
    tone === 'warning'
      ? 'border-red-100 bg-red-50/80 text-primary-start'
      : 'border-border-light/80 bg-bg-base text-text-sub';

  return (
    <div className={`rounded-[20px] border px-4 py-3 ${toneClassName} ${className}`.trim()}>
      {title ? <div className="text-sm font-medium">{title}</div> : null}
      <div className={`${title ? 'mt-1' : ''} text-s leading-5`}>{children}</div>
    </div>
  );
};
