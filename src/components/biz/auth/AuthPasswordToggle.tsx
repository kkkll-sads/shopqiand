import { Eye, EyeOff } from 'lucide-react';

const toggleClassName = 'rounded-full p-1 text-text-sub transition-opacity active:opacity-70';

interface AuthPasswordToggleProps {
  visible: boolean;
  onToggle: () => void;
}

// Password fields share one visibility toggle to avoid per-page icon drift.
export const AuthPasswordToggle = ({ visible, onToggle }: AuthPasswordToggleProps) => {
  return (
    <button
      type="button"
      aria-label={visible ? '隐藏密码' : '显示密码'}
      onClick={onToggle}
      className={toggleClassName}
    >
      {visible ? <Eye size={18} /> : <EyeOff size={18} />}
    </button>
  );
};
