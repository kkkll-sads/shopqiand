import type { ReactNode } from 'react';

const sectionRootClassName = 'mt-16 flex flex-1 flex-col';
const sectionHeaderClassName = 'mb-10';
const sectionFieldGroupClassName = 'space-y-4';

interface AuthFormSectionProps {
  title?: string;
  description?: string;
  headerExtra?: ReactNode;
  auxiliary?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

// Keeps auth pages aligned without forcing page-level wrappers to duplicate spacing.
export const AuthFormSection = ({
  title,
  description,
  headerExtra,
  auxiliary,
  actions,
  footer,
  children,
  className = '',
}: AuthFormSectionProps) => {
  const showHeader = Boolean(title || description);

  return (
    <div className={`${sectionRootClassName} ${className}`.trim()}>
      {showHeader ? (
        <div className={sectionHeaderClassName}>
          {title ? <h1 className="text-5_5xl font-bold text-text-main">{title}</h1> : null}
          {description ? <p className="mt-2 text-md text-text-sub">{description}</p> : null}
        </div>
      ) : null}

      {headerExtra ? <div className="mb-4">{headerExtra}</div> : null}

      <div className={sectionFieldGroupClassName}>{children}</div>

      {auxiliary ? <div className="mt-4">{auxiliary}</div> : null}

      {actions ? <div className="mt-6">{actions}</div> : null}

      {footer ? <div className="mt-auto space-y-4 pt-4">{footer}</div> : null}
    </div>
  );
};
