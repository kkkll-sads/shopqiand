import type { RealNameContext, RealNameState } from './state';

export interface UseRealNameAuthReturn {
  state: RealNameState;
  context: RealNameContext;
  canSubmit: boolean;
  isLoading: boolean;
  showForm: boolean;
  showSuccess: boolean;
  showPending: boolean;
  showError: boolean;
  handleSubmit: () => Promise<void>;
  handleRetry: () => void;
  handleRetryLoad: () => void;
  updateForm: (data: { realName?: string; idCard?: string }) => void;
}
