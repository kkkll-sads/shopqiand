import { textButtonStateClass } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';

interface AuthAgreementProps {
  checked: boolean;
  onChange: () => void;
  onOpenAgreement: () => void;
  onOpenPrivacy: () => void;
  mode: 'login' | 'register';
}

export const AuthAgreement = ({
  checked,
  onChange,
  onOpenAgreement,
  onOpenPrivacy,
  mode,
}: AuthAgreementProps) => {
  const prefix = mode === 'register' ? '注册' : '登录';

  return (
    <div className="flex items-start justify-center">
      <Checkbox checked={checked} onChange={onChange} className="mt-0.5" />
      <div className="ml-2 text-s leading-tight text-text-sub">
        {prefix}即代表你已同意
        <button
          type="button"
          className={`mx-1 inline-flex font-medium text-primary-start ${textButtonStateClass}`}
          onClick={onOpenAgreement}
        >
          用户协议
        </button>
        和
        <button
          type="button"
          className={`mx-1 inline-flex font-medium text-primary-start ${textButtonStateClass}`}
          onClick={onOpenPrivacy}
        >
          隐私政策
        </button>
      </div>
    </div>
  );
};
