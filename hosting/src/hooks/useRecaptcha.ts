import { useCallback, useEffect, useRef, useState } from 'react';
import { RECAPTCHA_SITE_KEY, FUNCTIONS_ORIGIN } from '@config/env';

interface UseRecaptchaResult {
  ready: boolean;
  loading: boolean;
  lastError: string | null;
  execute: (action?: string) => Promise<string | null>;
  verify: (action?: string) => Promise<boolean>;
  resetError: () => void;
}

/**
 * Centralized invisible reCAPTCHA (v2) handling.
 * - Loads script once (idempotent) if site key configured
 * - Provides execute(action) to get token
 * - Provides verify(action) to both execute & call backend /verifyRecaptcha
 * - Gracefully no-ops if site key absent (treats as always verified)
 */
export function useRecaptcha(): UseRecaptchaResult {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const scriptRequested = useRef(false);
  const grecaptchaRef = useRef<any>(null);
  const cachedRef = useRef<{
    token: string;
    action: string;
    created: number;
    consumed: boolean;
  } | null>(null);
  const MAX_CACHE_MS = 10000; // 10s reuse window for unconsumed token

  // Load script
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return; // feature disabled
    if (ready) return;
    if (typeof window !== 'undefined' && (window as any).grecaptcha) {
      grecaptchaRef.current = (window as any).grecaptcha;
      setReady(true);
      return;
    }
    if (scriptRequested.current) return;
    scriptRequested.current = true;
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      grecaptchaRef.current = (window as any).grecaptcha;
      if (grecaptchaRef.current) setReady(true);
    };
    script.onerror = () => {
      scriptRequested.current = false; // allow retry
      setLastError('Failed to load reCAPTCHA');
    };
    document.head.appendChild(script);
  }, [ready]);

  const execute = useCallback(async (action = 'default'): Promise<string | null> => {
    if (!RECAPTCHA_SITE_KEY) return null; // disabled
    const grecaptcha = grecaptchaRef.current || (window as any).grecaptcha;
    if (!grecaptcha) return null;
    try {
      // Reuse cached token if same action, fresh, and not consumed yet
      const c = cachedRef.current;
      if (c && !c.consumed && c.action === action && Date.now() - c.created < MAX_CACHE_MS) {
        return c.token;
      }
      setLoading(true);
      await grecaptcha.ready();
      const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
      cachedRef.current = { token, action, created: Date.now(), consumed: false };
      return token as string;
    } catch (e) {
      setLastError('reCAPTCHA execution failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const verify = useCallback(async (action = 'verify'): Promise<boolean> => {
    if (!RECAPTCHA_SITE_KEY) return true; // treat as pass
    const token = await execute(action);
    if (!token) return false;
    try {
      setLoading(true);
      const resp = await fetch(`${FUNCTIONS_ORIGIN}/verifyRecaptcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      const success = !!data.success;
      if (success && cachedRef.current && cachedRef.current.token === token) {
        cachedRef.current.consumed = true; // single-use post-success
      } else if (!success && cachedRef.current && cachedRef.current.token === token) {
        // discard failed token to force fresh attempt next time
        cachedRef.current = null;
      }
      return success;
    } catch (e) {
      setLastError('Verification request failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [execute]);

  const resetError = () => setLastError(null);

  return { ready, loading, lastError, execute, verify, resetError };
}

export default useRecaptcha;
