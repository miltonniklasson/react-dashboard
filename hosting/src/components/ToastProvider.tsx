import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface Toast {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
  ttl: number; // ms
}

interface ToastContextValue {
  push: (
    message: string,
    opts?: { type?: Toast["type"]; ttl?: number }
  ) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, any>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const handle = timers.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback<ToastContextValue["push"]>(
    (message, opts) => {
      const id = Math.random().toString(36).slice(2);
      const toast: Toast = {
        id,
        message,
        type: opts?.type,
        ttl: opts?.ttl ?? 4000,
      };
      setToasts((t) => [...t, toast]);
      const handle = setTimeout(() => remove(id), toast.ttl);
      timers.current.set(id, handle);
    },
    [remove]
  );

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="toast-region"
        role="status"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type || "info"}`}>
            <span>{t.message}</span>
            <button
              className="toast-close"
              aria-label="Dismiss"
              onClick={() => remove(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
