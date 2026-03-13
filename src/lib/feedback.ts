export type GlobalToastType = 'info' | 'success' | 'error' | 'warning';

export interface GlobalToastPayload {
  message: string;
  type?: GlobalToastType;
  duration?: number;
}

export const GLOBAL_TOAST_EVENT = 'member-global-toast';

export function emitGlobalToast(payload: GlobalToastPayload) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<GlobalToastPayload>(GLOBAL_TOAST_EVENT, {
      detail: payload,
    }),
  );
}

export function subscribeGlobalToast(listener: (payload: GlobalToastPayload) => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleToast = (event: Event) => {
    const detail = (event as CustomEvent<GlobalToastPayload>).detail;
    if (!detail?.message) {
      return;
    }

    listener(detail);
  };

  window.addEventListener(GLOBAL_TOAST_EVENT, handleToast);
  return () => window.removeEventListener(GLOBAL_TOAST_EVENT, handleToast);
}
