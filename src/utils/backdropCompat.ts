type BackdropCompatResult = {
  disabled: boolean;
  reasons: string[];
};

const getAndroidMajorVersion = (ua: string): number | null => {
  const match = ua.match(/Android\s+(\d+)/i);
  if (!match) return null;

  const major = Number(match[1]);
  if (!Number.isFinite(major)) return null;
  return major;
};

const hasBackdropSupport = (): boolean => {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return false;
  }

  try {
    return CSS.supports('backdrop-filter: blur(1px)') || CSS.supports('-webkit-backdrop-filter: blur(1px)');
  } catch {
    return false;
  }
};

const evaluateBackdropCompat = (): BackdropCompatResult => {
  const reasons: string[] = [];
  const ua = navigator.userAgent || '';
  const androidMajor = getAndroidMajorVersion(ua);
  const deviceMemory = Number((navigator as any).deviceMemory || 0);

  if (!hasBackdropSupport()) {
    reasons.push('no_backdrop_support');
  }

  // Android 9 及以下机型上，backdrop-filter 经常出现渲染异常或性能退化
  if (androidMajor !== null && androidMajor <= 9) {
    reasons.push('legacy_android');
  }

  // 低内存设备即使支持，也容易出现掉帧和颜色渲染异常
  if (deviceMemory > 0 && deviceMemory <= 2) {
    reasons.push('low_memory');
  }

  return {
    disabled: reasons.length > 0,
    reasons,
  };
};

export const applyBackdropBlurCompatibilityClass = (): BackdropCompatResult => {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') {
    return { disabled: false, reasons: [] };
  }

  const result = evaluateBackdropCompat();
  const root = document.documentElement;

  root.classList.toggle('no-backdrop-blur', result.disabled);
  root.setAttribute('data-backdrop-blur', result.disabled ? 'disabled' : 'enabled');

  if (result.disabled && result.reasons.length) {
    root.setAttribute('data-backdrop-blur-reasons', result.reasons.join(','));
  } else {
    root.removeAttribute('data-backdrop-blur-reasons');
  }

  return result;
};

