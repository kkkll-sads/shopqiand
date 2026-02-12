export type FormType = 'reset_login' | 'reset_pay' | 'reset_pay_sms' | 'forgot';

export interface PasswordFormProps {
  type: FormType;
  title: string;
  onBack?: () => void;
  onSuccess?: () => void;
  onNavigateForgotPassword?: () => void;
}

export interface PasswordFormConfig {
  oldLabel: string;
  oldPlaceholder: string;
  newLabel: string;
  newPlaceholder: string;
  confirmLabel: string;
  confirmPlaceholder: string;
  submitText: string;
  minLength: number;
  showPhone: boolean;
  showCode: boolean;
}
