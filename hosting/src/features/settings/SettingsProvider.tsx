import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@features/auth/AuthProvider";
import {
  ensureUserSettings,
  getUserSettings,
  updateUserSettings,
  type UserSettings,
} from "@services/userSettings";

interface SettingsContextValue {
  settings: UserSettings | null;
  updating: boolean;
  refresh: () => Promise<void>;
  setScale: (scale: number) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [updating, setUpdating] = useState(false);
  const pendingScaleRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | undefined>(undefined);
  const lastPersistedScaleRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) {
      setSettings(null);
      return () => {
        active = false;
      };
    }
    (async () => {
      try {
        const s = await ensureUserSettings(user.uid);
        if (active) {
          setSettings(s);
          lastPersistedScaleRef.current = s.ui?.scale ?? null;
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[settings] load failed", e);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // Optional: listener for multi-tab sync (cheap single doc)
  // Could be enabled later; left commented to avoid extra real-time cost.
  // useEffect(() => {
  //   if (!user) return;
  //   const unsub = onSnapshot(doc(db, 'userSettings', user.uid), (snap) => {
  //     if (snap.exists()) {
  //       const data = snap.data() as UserSettings;
  //       setSettings((prev) => {
  //         // Avoid overwriting local optimistic changes if same value
  //         return JSON.stringify(prev) === JSON.stringify(data) ? prev : data;
  //       });
  //       lastPersistedScaleRef.current = data.ui?.scale ?? lastPersistedScaleRef.current;
  //     }
  //   });
  //   return () => unsub();
  // }, [user]);

  async function refresh() {
    if (!user) return;
    try {
      const s = await getUserSettings(user.uid);
      setSettings(s);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[settings] refresh failed", e);
    }
  }

  function setScale(scale: number) {
    if (!user) return;
    const clamped = Math.min(2, Math.max(0.8, scale));
    // Optimistic local state
    setSettings((prev) => ({
      ...(prev || {}),
      ui: { ...(prev?.ui || {}), scale: clamped },
    }));
    pendingScaleRef.current = clamped;
    // Debounce persistence (500ms)
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(async () => {
      const value = pendingScaleRef.current;
      if (value == null || value === lastPersistedScaleRef.current) return;
      setUpdating(true);
      try {
        await updateUserSettings(user.uid!, { ui: { scale: value } });
        lastPersistedScaleRef.current = value;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[settings] debounced setScale failed", e);
      } finally {
        setUpdating(false);
      }
    }, 500);
  }

  // Clean up timer on unmount / user change
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current)
        window.clearTimeout(debounceTimerRef.current);
    };
  }, [user]);

  return (
    <SettingsContext.Provider value={{ settings, updating, refresh, setScale }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings must be used within <SettingsProvider>");
  return ctx;
}
