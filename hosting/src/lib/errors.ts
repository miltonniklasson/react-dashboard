// Central error types & helpers (guidelines: structured, fail fast, domain codes)

export type AppErrorDomain = 'AUTH' | 'FIRESTORE' | 'VALIDATION' | 'NETWORK' | 'INTERNAL' | 'UI';

export interface AppError extends Error {
  code: string;          // MACHINE_READABLE e.g. FIRESTORE_NOT_FOUND
  userMessage?: string;  // Safe message for UI display
  cause?: unknown;       // Original thrown error
  domain?: AppErrorDomain; // High-level domain bucket
  details?: unknown;     // Optional structured context
}

interface ErrorInit {
  code: string;
  message: string;
  userMessage?: string;
  cause?: unknown;
  domain?: AppErrorDomain;
  details?: unknown;
}

export function createAppError(init: ErrorInit): AppError {
  const err = new Error(init.message) as AppError;
  err.code = init.code;
  if (init.userMessage) err.userMessage = init.userMessage;
  if (init.cause) err.cause = init.cause;
  if (init.domain) err.domain = init.domain;
  if (init.details !== undefined) err.details = init.details;
  return err;
}

// Convert unknown → AppError (idempotent)
export function toAppError(e: unknown, fallback: Partial<ErrorInit> & { code: string }): AppError {
  if (e && typeof e === 'object' && 'code' in e && 'message' in e) {
    const fe = e as any;
    if (fe.code && typeof fe.code === 'string' && fe.message) {
      return createAppError({
        code: normalizeFirebaseCode(fe.code) ?? fallback.code,
        message: fe.message,
        userMessage: fallback.userMessage,
    cause: e,
    domain: fallback.domain,
    details: fallback.details
      });
    }
  }
  return createAppError({
    code: fallback.code,
    message: fallback.message || (e instanceof Error ? e.message : 'Unknown error'),
    userMessage: fallback.userMessage,
  cause: e,
  domain: fallback.domain,
  details: fallback.details
  });
}

function normalizeFirebaseCode(code: string): string | null {
  if (code.startsWith('auth/')) return 'AUTH_' + code.slice(5).replace(/-/g, '_').toUpperCase();
  if (code.startsWith('firestore/')) return 'FIRESTORE_' + code.slice(10).replace(/-/g, '_').toUpperCase();
  // Firestore SDK typically returns bare codes like 'failed-precondition', 'permission-denied'
  const firestoreBare = new Set([
    'cancelled','unknown','invalid-argument','deadline-exceeded','not-found','already-exists',
    'permission-denied','resource-exhausted','failed-precondition','aborted','out-of-range',
    'unimplemented','internal','unavailable','data-loss'
  ]);
  if (firestoreBare.has(code)) return 'FIRESTORE_' + code.replace(/-/g, '_').toUpperCase();
  return null;
}

export function isFirestoreNotInitialized(appError: AppError): boolean {
  return appError.code === 'FIRESTORE_FAILED_PRECONDITION' ||
    /not been used|not enabled|enable.*Firestore/i.test(appError.message);
}

// Narrow type guard
export function isAppError(e: unknown): e is AppError {
  return !!e && typeof e === 'object' && 'code' in e && 'message' in e;
}

// Lightweight logger (can be swapped for structured transport later)
export interface LogFields {
  event: string; // e.g. user_profile_load
  level?: 'debug' | 'info' | 'warn' | 'error';
  context?: Record<string, unknown>;
  error?: unknown;
}

export function log(fields: LogFields): void {
  const { level = 'info', event, context, error } = fields;
  const base = { t: new Date().toISOString(), event, ...context };
  if (error) (base as any).error = serializeError(error);
  // eslint-disable-next-line no-console
  (console as any)[level] ? (console as any)[level](base) : console.log(base);
}

function serializeError(e: unknown): any {
  if (!e) return e;
  if (isAppError(e)) {
    const { code, message, domain, userMessage } = e;
    return { code, message, domain, userMessage };
  }
  if (e instanceof Error) return { message: e.message, name: e.name };
  return e;
}

