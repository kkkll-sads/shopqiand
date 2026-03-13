type AbortEventListener = EventListenerOrEventListenerObject;

export interface CompatAbortController {
  abort: () => void;
  signal: AbortSignal;
  supportsNativeAbortSignal: boolean;
}

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

function createAbortEvent(): Event {
  if (typeof Event === 'function') {
    return new Event('abort');
  }

  return { type: 'abort' } as Event;
}

function invokeAbortEventListener(listener: AbortEventListener, event: Event) {
  if (typeof listener === 'function') {
    listener(event);
    return;
  }

  listener.handleEvent(event);
}

function createAbortSignalShim(): AbortSignal {
  let aborted = false;
  const listeners = new Set<AbortEventListener>();
  const signal = {
    aborted: false,
    onabort: null,
    addEventListener(type: string, listener: AbortEventListener | null) {
      if (type !== 'abort' || !listener) {
        return;
      }

      listeners.add(listener);
    },
    removeEventListener(type: string, listener: AbortEventListener | null) {
      if (type !== 'abort' || !listener) {
        return;
      }

      listeners.delete(listener);
    },
    dispatchEvent(event: Event) {
      if (event.type !== 'abort') {
        return true;
      }

      listeners.forEach((listener) => {
        invokeAbortEventListener(listener, event);
      });
      return true;
    },
    throwIfAborted() {
      if (aborted) {
        const error = new Error('The operation was aborted.');
        error.name = 'AbortError';
        throw error;
      }
    },
  } as AbortSignal & {
    aborted: boolean;
    onabort: ((event: Event) => void) | null;
    throwIfAborted?: () => void;
  };

  Object.defineProperty(signal, 'aborted', {
    get() {
      return aborted;
    },
  });

  Object.defineProperty(signal, 'reason', {
    get() {
      return aborted ? createAbortEvent() : undefined;
    },
  });

  return signal;
}

export function createCompatAbortController(): CompatAbortController {
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    return {
      abort: () => controller.abort(),
      signal: controller.signal,
      supportsNativeAbortSignal: true,
    };
  }

  const signal = createAbortSignalShim();

  return {
    signal,
    supportsNativeAbortSignal: false,
    abort() {
      if (signal.aborted) {
        return;
      }

      const abortSignal = signal as AbortSignal & {
        dispatchEvent?: (event: Event) => boolean;
        onabort?: ((event: Event) => void) | null;
      };
      const event = createAbortEvent();

      abortSignal.onabort?.(event);
      abortSignal.dispatchEvent?.(event);
    },
  };
}

export function addMediaQueryChangeListener(
  mediaQueryList: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void,
) {
  const legacyMediaQueryList = mediaQueryList as LegacyMediaQueryList;

  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', listener);
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }

  legacyMediaQueryList.addListener?.(listener);
  return () => {
    legacyMediaQueryList.removeListener?.(listener);
  };
}

export function getViewportHeight(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  return window.innerHeight || document.documentElement.clientHeight || 0;
}

export function supportsIntersectionObserver(): boolean {
  return typeof window !== 'undefined' && 'IntersectionObserver' in window;
}
