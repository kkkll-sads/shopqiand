import type { ChangeEventHandler, ComponentProps } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

const smsFieldRowClassName = 'flex items-center gap-3';
const smsButtonClassName = 'min-w-[104px] whitespace-nowrap px-4 text-primary-start';

interface AuthSmsFieldProps {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onSend: () => void;
  buttonText: string;
  canSend: boolean;
  sending?: boolean;
  message?: string;
  placeholder?: string;
  inputClassName?: string;
  buttonClassName?: string;
  inputProps?: Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'placeholder' | 'className'>;
}

// Encapsulates the "code input + send button + helper text" pattern used across auth flows.
export const AuthSmsField = ({
  value,
  onChange,
  onSend,
  buttonText,
  canSend,
  sending = false,
  message,
  placeholder = '\u8BF7\u8F93\u5165\u9A8C\u8BC1\u7801',
  inputClassName = '',
  buttonClassName = '',
  inputProps,
}: AuthSmsFieldProps) => {
  return (
    <div className="space-y-2">
      <div className={smsFieldRowClassName}>
        <Input
          placeholder={placeholder}
          className={`flex-1 ${inputClassName}`.trim()}
          value={value}
          onChange={onChange}
          {...inputProps}
        />
        <Button
          type="button"
          size="md"
          variant="secondary"
          fullWidth={false}
          loading={sending}
          disabled={!canSend}
          className={`${smsButtonClassName} ${buttonClassName}`.trim()}
          onClick={onSend}
        >
          {buttonText}
        </Button>
      </div>
      {message ? <p className="px-1 text-s text-primary-start">{message}</p> : null}
    </div>
  );
};
