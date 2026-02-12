import { useEffect, useState } from 'react';

const BASE_PADDING = 48;
const NAVIGATION_BAR_BUFFER = 60;

export const useLoginBottomPadding = () => {
  const [bottomPadding, setBottomPadding] = useState(BASE_PADDING);

  useEffect(() => {
    const calculateBottomPadding = () => {
      const safeAreaBottomCSS = getComputedStyle(document.documentElement).getPropertyValue(
        'env(safe-area-inset-bottom)'
      );
      const safeAreaBottom = safeAreaBottomCSS
        ? parseInt(safeAreaBottomCSS.replace('px', ''), 10) || 0
        : 0;

      setBottomPadding(BASE_PADDING + safeAreaBottom + NAVIGATION_BAR_BUFFER);
    };

    calculateBottomPadding();

    const handleResize = () => {
      calculateBottomPadding();
    };

    let lastHeight = window.innerHeight;
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;

      window.requestAnimationFrame(() => {
        const currentHeight = window.innerHeight;
        if (Math.abs(currentHeight - lastHeight) > 10) {
          calculateBottomPadding();
          lastHeight = currentHeight;
        }
        ticking = false;
      });
      ticking = true;
    };

    const handleOrientationChange = () => {
      setTimeout(calculateBottomPadding, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange);

    const interval = setInterval(calculateBottomPadding, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearInterval(interval);
    };
  }, []);

  return bottomPadding;
};
