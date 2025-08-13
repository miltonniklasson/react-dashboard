import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@config/firebase";
import { useAuth } from "@features/auth/AuthProvider";
import { Navigate } from "react-router-dom";
import { useToast } from "@components/ToastProvider";
import { RECAPTCHA_SITE_KEY } from "@config/env";
import useRecaptcha from "../hooks/useRecaptcha";

type Mode = "login" | "register" | "reset";

export function LoginPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [lastAttemptAt, setLastAttemptAt] = useState<number | null>(null);
  const COOLDOWN_MS = 2500; // throttle window
  const { push } = useToast();
  const { verify: verifyRecaptcha, loading: recaptchaLoading } = useRecaptcha();

  if (user) return <Navigate to="/dashboard" replace />;

  const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/; // simple sanity check

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.email) e.email = "Email required";
    else if (!emailPattern.test(form.email)) e.email = "Invalid email format";
    if (mode !== "reset") {
      if (!form.password) e.password = "Password required";
    }
    if (mode === "register") {
      if (form.password.length < 6) e.password = "Min 6 chars";
      if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setAuthError(null);
    // Throttle rapid submissions
    if (lastAttemptAt && Date.now() - lastAttemptAt < COOLDOWN_MS) {
      const remaining = Math.ceil(
        (COOLDOWN_MS - (Date.now() - lastAttemptAt)) / 1000
      );
      setAuthError(`Please wait ${remaining}s before trying again.`);
      return;
    }
    if (!validate()) return;
    setBusy(true);
    try {
      // For register and reset flows, obtain & verify reCAPTCHA first (if configured)
      if (mode === "register" || mode === "reset") {
        const ok = await verifyRecaptcha(mode);
        if (!ok) {
          setAuthError("Bot verification failed. Please retry.");
          return;
        }
      }
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        push("Signed in", { type: "success", ttl: 3000 });
      } else if (mode === "register") {
        await createUserWithEmailAndPassword(auth, form.email, form.password);
        push("Account created", { type: "success", ttl: 3500 });
      } else if (mode === "reset") {
        await sendPasswordResetEmail(auth, form.email);
        setMessage("Password reset email sent (check your inbox).");
        push("Reset email sent", { type: "info", ttl: 4000 });
      }
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === "auth/user-not-found" || code === "auth/wrong-password")
        setAuthError("Invalid credentials");
      else if (code === "auth/email-already-in-use")
        setAuthError("Email already in use");
      else if (code === "auth/too-many-requests")
        setAuthError("Too many attempts. Try again later.");
      else setAuthError("Authentication failed");
    } finally {
      setBusy(false);
      setLastAttemptAt(Date.now());
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setAuthError(null);
    setMessage(null);
  }

  return (
    <div className="auth-container">
      <div className="auth-card" role="form" aria-labelledby="auth-heading">
        <h2 id="auth-heading" className="auth-title">
          {mode === "login"
            ? "Sign In"
            : mode === "register"
            ? "Create Account"
            : "Reset Password"}
        </h2>
        {authError && (
          <div className="error-text" role="alert">
            {authError}
          </div>
        )}
        {message && (
          <div className="info-text" role="status">
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={errors.email ? "input invalid" : "input"}
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              autoComplete="email"
              required
            />
            {errors.email && <div className="error-text">{errors.email}</div>}
          </div>
          {mode !== "reset" && (
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="pw-wrapper">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  className={errors.password ? "input invalid" : "input"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  required
                />
                <button
                  type="button"
                  className="pw-toggle link-btn pw-visibility-btn"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  aria-pressed={showPw}
                  onClick={() => setShowPw((s) => !s)}
                  title={showPw ? "Hide password" : "Show password"}
                >
                  <span className="icon-fade-wrap" aria-hidden="true">
                    {/* Eye (show) */}
                    <svg
                      className={"fade-icon" + (!showPw ? " is-visible" : "")}
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {/* Eye off (hide) */}
                    <svg
                      className={"fade-icon" + (showPw ? " is-visible" : "")}
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.83 21.83 0 0 1-2.16 3.19M14.12 14.12A3 3 0 0 1 9.88 9.88M1 1l22 22" />
                    </svg>
                  </span>
                  <span className="visually-hidden">
                    {showPw ? "Hide password" : "Show password"}
                  </span>
                </button>
              </div>
              {errors.password && (
                <div className="error-text">{errors.password}</div>
              )}
            </div>
          )}
          {mode === "register" && (
            <div className="field">
              <label htmlFor="confirm">Confirm Password</label>
              <div className="pw-wrapper">
                <input
                  id="confirm"
                  type={showPw ? "text" : "password"}
                  className={errors.confirm ? "input invalid" : "input"}
                  value={form.confirm}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, confirm: e.target.value }))
                  }
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="pw-toggle link-btn pw-visibility-btn"
                  aria-label={
                    showPw
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                  aria-pressed={showPw}
                  onClick={() => setShowPw((s) => !s)}
                  title={showPw ? "Hide password" : "Show password"}
                >
                  <span className="icon-fade-wrap" aria-hidden="true">
                    <svg
                      className={"fade-icon" + (!showPw ? " is-visible" : "")}
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <svg
                      className={"fade-icon" + (showPw ? " is-visible" : "")}
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.83 21.83 0 0 1-2.16 3.19M14.12 14.12A3 3 0 0 1 9.88 9.88M1 1l22 22" />
                    </svg>
                  </span>
                  <span className="visually-hidden">
                    {showPw ? "Hide password" : "Show password"}
                  </span>
                </button>
              </div>
              {errors.confirm && (
                <div className="error-text">{errors.confirm}</div>
              )}
            </div>
          )}
          <div className="form-actions">
            <button
              type="submit"
              disabled={busy || recaptchaLoading}
              className="btn-primary"
              aria-busy={busy}
            >
              {busy
                ? mode === "reset"
                  ? "Sending…"
                  : recaptchaLoading
                  ? "Verifying…"
                  : "Processing…"
                : mode === "login"
                ? "Sign In"
                : mode === "register"
                ? "Create Account"
                : "Send Reset Email"}
            </button>
            {lastAttemptAt &&
              !busy &&
              Date.now() - lastAttemptAt < COOLDOWN_MS && (
                <div className="cooldown-text" aria-live="polite">
                  Please wait…
                </div>
              )}
          </div>
        </form>
        <div className="auth-alt">
          {mode !== "login" && (
            <button
              type="button"
              className="link-btn"
              onClick={() => switchMode("login")}
            >
              Have an account? Sign in
            </button>
          )}
          {mode !== "register" && (
            <button
              type="button"
              className="link-btn"
              onClick={() => switchMode("register")}
            >
              Create an account
            </button>
          )}
          {mode !== "reset" && (
            <button
              type="button"
              className="link-btn"
              onClick={() => switchMode("reset")}
            >
              Forgot password?
            </button>
          )}
        </div>
        <div className="support-box" role="contentinfo">
          <p className="support-heading">Need help?</p>
          <p className="support-text">
            Contact support:{" "}
            <a href="mailto:support@example.com" className="link-inline">
              miltonniklasson@gmail.com
            </a>
          </p>
          {RECAPTCHA_SITE_KEY && (
            <p className="support-text recaptcha-note">
              Protected by reCAPTCHA –{" "}
              <a
                className="link-inline"
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy
              </a>{" "}
              ·{" "}
              <a
                className="link-inline"
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
