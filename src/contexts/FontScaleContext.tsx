import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type FontScale = 'normal' | 'large' | 'xlarge' | 'xxlarge';

interface FontScaleContextType {
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
}

const STORAGE_KEY = 'app-font-scale';

const FontScaleContext = createContext<FontScaleContextType | undefined>(undefined);

function normalizeFontScale(value: string | null): FontScale {
  if (value === 'large' || value === 'xlarge' || value === 'xxlarge') {
    return value;
  }

  return 'normal';
}

function readStoredFontScale(): FontScale {
  try {
    return normalizeFontScale(localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'normal';
  }
}

function applyFontScale(scale: FontScale) {
  const root = document.documentElement;
  if (scale === 'normal') {
    root.removeAttribute('data-font-scale');
    return;
  }

  root.setAttribute('data-font-scale', scale);
}

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>(readStoredFontScale);

  const setFontScale = useCallback((scale: FontScale) => {
    setFontScaleState(scale);
    try {
      localStorage.setItem(STORAGE_KEY, scale);
    } catch {
      // Ignore storage failures on restricted browsers.
    }
  }, []);

  useEffect(() => {
    applyFontScale(fontScale);
  }, [fontScale]);

  return (
    <FontScaleContext.Provider value={{ fontScale, setFontScale }}>
      {children}
    </FontScaleContext.Provider>
  );
}

export function useFontScale(): FontScaleContextType {
  const context = useContext(FontScaleContext);
  if (!context) {
    throw new Error('useFontScale must be used within a FontScaleProvider');
  }

  return context;
}
