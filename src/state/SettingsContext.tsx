/** Accessibility settings: text size, contrast, motion. Applied as data
 * attributes on <html> so CSS handles the rest. Persisted per device. */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadJSON, saveJSON, KEYS } from '@/lib/storage';

export interface A11ySettings {
  textSize: 'small' | 'normal' | 'large';
  contrast: 'standard' | 'high';
  motion: 'standard' | 'reduced';
}

const DEFAULTS: A11ySettings = { textSize: 'normal', contrast: 'standard', motion: 'standard' };

interface SettingsValue {
  settings: A11ySettings;
  update: (patch: Partial<A11ySettings>) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

function apply(s: A11ySettings) {
  const html = document.documentElement;
  html.setAttribute('data-textsize', s.textSize);
  html.setAttribute('data-contrast', s.contrast);
  html.setAttribute('data-motion', s.motion);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(() => ({
    ...DEFAULTS,
    ...loadJSON<Partial<A11ySettings>>(KEYS.settings, {}),
  }));

  useEffect(() => {
    apply(settings);
    saveJSON(KEYS.settings, settings);
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      update: (patch: Partial<A11ySettings>) => setSettings((s) => ({ ...s, ...patch })),
    }),
    [settings],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
