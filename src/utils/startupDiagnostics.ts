export interface StartupDiagnosticsEntry {
  at: number;
  sinceMs: number;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  details?: string;
}

interface StartupDiagnosticsController {
  mark: (source: string, message: string, details?: unknown) => void;
  warn: (source: string, message: string, details?: unknown) => void;
  error: (source: string, message: string, details?: unknown) => void;
  fatal: (source: string, error: unknown, details?: unknown) => void;
  ready: (meta?: unknown) => void;
  show: (reason?: string) => void;
  hide: () => void;
  clear: () => void;
  getEntries: () => StartupDiagnosticsEntry[];
  exportText: () => string;
}

declare global {
  interface Window {
    __SHOPQIAND_STARTUP_DIAG__?: StartupDiagnosticsController;
  }
}

const withController = (callback: (controller: StartupDiagnosticsController) => void) => {
  if (typeof window === 'undefined') {
    return;
  }

  const controller = window.__SHOPQIAND_STARTUP_DIAG__;
  if (!controller) {
    return;
  }

  callback(controller);
};

export const startupDiagnostics = {
  mark(source: string, message: string, details?: unknown) {
    withController((controller) => controller.mark(source, message, details));
  },
  warn(source: string, message: string, details?: unknown) {
    withController((controller) => controller.warn(source, message, details));
  },
  error(source: string, message: string, details?: unknown) {
    withController((controller) => controller.error(source, message, details));
  },
  fatal(source: string, error: unknown, details?: unknown) {
    withController((controller) => controller.fatal(source, error, details));
  },
  ready(meta?: unknown) {
    withController((controller) => controller.ready(meta));
  },
  show(reason?: string) {
    withController((controller) => controller.show(reason));
  },
  hide() {
    withController((controller) => controller.hide());
  },
  clear() {
    withController((controller) => controller.clear());
  },
  getEntries(): StartupDiagnosticsEntry[] {
    if (typeof window === 'undefined' || !window.__SHOPQIAND_STARTUP_DIAG__) {
      return [];
    }

    return window.__SHOPQIAND_STARTUP_DIAG__.getEntries();
  },
  exportText(): string {
    if (typeof window === 'undefined' || !window.__SHOPQIAND_STARTUP_DIAG__) {
      return '';
    }

    return window.__SHOPQIAND_STARTUP_DIAG__.exportText();
  },
};

export default startupDiagnostics;
