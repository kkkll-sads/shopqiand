import { Button } from '../../ui/Button';

const footerButtonClassName = 'text-md font-medium text-text-main';

interface AuthFooterLinkProps {
  text: string;
  accentText?: string;
  onClick: () => void;
}

// Bottom switch action shared by login/register-style screens.
export const AuthFooterLink = ({ text, accentText, onClick }: AuthFooterLinkProps) => {
  return (
    <div className="mt-12 text-center">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        fullWidth={false}
        className={footerButtonClassName}
        onClick={onClick}
      >
        <span>{text}</span>
        {accentText ? <span className="text-primary-start">{accentText}</span> : null}
      </Button>
    </div>
  );
};
