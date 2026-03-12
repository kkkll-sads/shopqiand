import { Headset } from 'lucide-react';
import { openCustomerServiceLink } from '../../../lib/customerService';
import { Button } from '../../ui/Button';
import { useFeedback } from '../../ui/FeedbackProvider';

const backButtonClassName = '-ml-2 p-2 text-text-main active:opacity-70';
const supportButtonClassName = 'border-border-light/70 bg-bg-card/60 backdrop-blur-md';

interface AuthTopBarProps {
  onBack: () => void;
  showSupport?: boolean;
}

// Shared top bar for auth pages so back/support actions stay consistent.
export const AuthTopBar = ({ onBack, showSupport = true }: AuthTopBarProps) => {
  const { showToast } = useFeedback();

  const handleOpenSupport = () => {
    void openCustomerServiceLink(({ duration, message, type }) => {
      showToast({ duration, message, type });
    });
  };

  return (
    <div className="absolute left-4 right-4 top-4 z-20 flex justify-between">
      <button type="button" className={backButtonClassName} onClick={onBack}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      {showSupport ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth={false}
          className={supportButtonClassName}
          onClick={handleOpenSupport}
        >
          <Headset size={14} />
          客服
        </Button>
      ) : (
        <div aria-hidden="true" />
      )}
    </div>
  );
};
