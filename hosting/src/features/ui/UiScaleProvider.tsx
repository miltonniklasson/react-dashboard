import { createContext, useContext, useEffect, useState } from "react";
import { useSettings } from "@features/settings/SettingsProvider";
import type { ReactNode } from "react";

interface UiScaleContextValue {
  scale: number; // 1 = base 16px
  setScale: (value: number) => void;
  options: number[]; // allowed preset scales
}

const UiScaleContext = createContext<UiScaleContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "ui-scale";
const PRESET_SCALES = [1, 1.1, 1.15, 1.25, 1.35, 1.5];
const DEFAULT_SCALE = 1.25; // matches current root default

export function UiScaleProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState<number>(DEFAULT_SCALE);
  const { settings, setScale: setSettingsScale } = useSettings();

  // Load stored preference (local first, then profile override)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = parseFloat(raw);
        if (!Number.isNaN(parsed) && parsed >= 0.8 && parsed <= 2) {
          setScaleState(parsed);
          applyScale(parsed);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    // ensure DOM reflects default
    applyScale(DEFAULT_SCALE);
  }, []);

  // Override local with settings value.
  useEffect(() => {
    const candidate = settings?.ui?.scale;
    if (candidate && typeof candidate === "number") {
      setScaleState(candidate);
      applyScale(candidate);
      try {
        localStorage.setItem(STORAGE_KEY, String(candidate));
      } catch {
        /* ignore */
      }
    }
  }, [settings?.ui?.scale]);

  function applyScale(v: number) {
    document.documentElement.style.setProperty("--scale", String(v));
    // root font-size already multiplies by var(--scale); we only tweak the token.
  }

  function setScale(v: number) {
    const clamped = Math.min(2, Math.max(0.8, v));
    setScaleState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      /* ignore */
    }
    applyScale(clamped);
    // Persist through settings service
    setSettingsScale(clamped);
  }

  return (
    <UiScaleContext.Provider
      value={{ scale, setScale, options: PRESET_SCALES }}
    >
      {children}
    </UiScaleContext.Provider>
  );
}

export function useUiScale() {
  const ctx = useContext(UiScaleContext);
  if (!ctx) throw new Error("useUiScale must be used within <UiScaleProvider>");
  return ctx;
}
