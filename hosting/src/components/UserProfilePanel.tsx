import { useEffect, useState } from "react";
import { useAuth } from "@features/auth/AuthProvider";
import {
  getUserProfile,
  updateUserProfile,
  type UserProfile,
} from "@services/users";
import { getFirestoreUnavailableReason } from "@lib/firestoreStatus";
import { Spinner } from "./Spinner";
import { useToast } from "./ToastProvider";

export function UserProfilePanel() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { push } = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await getUserProfile(user.uid);
        if (!cancelled) setProfile(p);
      } catch (e) {
        if (!cancelled) setError("Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;
  const unavailable = getFirestoreUnavailableReason();
  if (unavailable) {
    // Show underlying reason (sanitized) plus guidance.
    return (
      <div style={{ color: "#666", lineHeight: 1.4 }}>
        <strong>Firestore unavailable</strong>
        <div style={{ marginTop: 4 }}>{unavailable}</div>
        <div style={{ marginTop: 4 }}>
          Enable Firestore in the Firebase console (Build → Firestore Database)
          then reload.
        </div>
      </div>
    );
  }
  if (loading)
    return (
      <div className="card card-pad center">
        <Spinner />
      </div>
    );
  if (error)
    return (
      <div className="card card-pad error-text" role="alert">
        {error}
      </div>
    );
  if (!profile) return <div className="card card-pad">No profile yet.</div>;

  return (
    <div className="card profile-card">
      <div className="card-header">
        <h3 className="card-title">Account</h3>
        <p className="card-sub">Basic information about your account.</p>
      </div>
      <div className="profile-grid">
        <div className="profile-label">Email</div>
        <div className="profile-value mono">{profile.email}</div>

        <div className="profile-label">Display Name</div>
        <div className="profile-value">
          {!isEditing && (
            <div className="name-row">
              <span>
                {profile.displayName || <em className="dim">— none —</em>}
              </span>
              <button
                type="button"
                className="link-btn small"
                onClick={() => {
                  setDraftName(profile.displayName || "");
                  setSaveError(null);
                  setIsEditing(true);
                }}
              >
                Edit
              </button>
            </div>
          )}
          {isEditing && (
            <form
              className="edit-row"
              onSubmit={async (e) => {
                e.preventDefault();
                const trimmed = draftName.trim();
                if (trimmed.length > 50) {
                  setSaveError("Display name must be ≤ 50 characters.");
                  return;
                }
                setSaving(true);
                setSaveError(null);
                try {
                  const updated = await updateUserProfile(profile.id, {
                    displayName: trimmed || null,
                  });
                  setProfile(updated);
                  setIsEditing(false);
                } catch {
                  setSaveError("Failed to save.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <input
                className="input narrow"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                aria-label="Display name"
                disabled={saving}
                maxLength={60}
              />
              <div className="edit-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  className="btn-quiet"
                  onClick={() => {
                    setIsEditing(false);
                    setSaveError(null);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {saveError && (
            <div className="error-text" style={{ marginTop: 4 }}>
              {saveError}
            </div>
          )}
        </div>

        <div
          className="profile-label"
          style={{ display: "flex", alignItems: "center", gap: ".5rem" }}
        >
          <span>Advanced</span>
          <button
            type="button"
            className="link-btn small adv-toggle"
            aria-expanded={showAdvanced}
            aria-controls="adv-collapse"
            onClick={() => setShowAdvanced((o) => !o)}
          >
            {showAdvanced ? "Hide" : "Show"} details
          </button>
        </div>
        <div className="profile-value" />
        <div
          id="adv-collapse"
          className={"advanced-collapse" + (showAdvanced ? " open" : "")}
          aria-hidden={!showAdvanced}
        >
          <div
            className="advanced-box"
            role="region"
            aria-label="Advanced account details"
          >
            <div className="adv-row" style={{ gap: ".75rem" }}>
              <span className="adv-key">User ID</span>
              <span
                className="adv-val mono"
                style={{ wordBreak: "break-all", flex: "1 1 auto" }}
              >
                {profile.id}
              </span>
              <button
                type="button"
                className="link-btn small copy-btn"
                style={{
                  marginLeft: "auto",
                  flex: "0 0 auto",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: ".35rem .45rem",
                }}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(profile.id);
                    setCopied(true);
                    push("User ID copied", { type: "info", ttl: 2500 });
                    setTimeout(() => setCopied(false), 1800);
                  } catch {
                    push("Copy failed", { type: "error", ttl: 3000 });
                  }
                }}
                aria-label={
                  copied ? "User ID copied" : "Copy user ID to clipboard"
                }
                title={copied ? "Copied!" : "Copy user ID"}
              >
                <span className="copy-icon-wrap" aria-hidden="true">
                  <svg
                    className={
                      "copy-icon base-icon" + (copied ? "" : " is-visible")
                    }
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                  </svg>
                  <svg
                    className={
                      "check-icon base-icon" + (copied ? " is-visible" : "")
                    }
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span className="visually-hidden">
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
