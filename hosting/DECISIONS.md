# Architectural Decisions Log (ADL)

Short, focused records of notable technical decisions. Keep entries concise (what, why, trade‑offs) and append new sections rather than rewriting history.

## 2025-08-14 – Path Aliases Adoption

**What**: Introduced TS + Vite path aliases (@components, @features, @layouts, @pages, @config, @lib, @services).
**Why**: Reduce brittle deep relative paths (../../..), improve refactor safety & readability.
**Trade‑offs**: Slight mental overhead; tooling must stay in sync (tsconfig.app.json + vite.config.ts). No alias for hooks yet (kept one relative import to avoid over-aliasing prematurely).
**Follow‑ups**: Optionally add @hooks if hook import churn increases.

## 2025-08-14 – Central Error & Logging Module

**What**: Expanded lib/errors.ts with domains, structured AppError, lightweight `log()` helper, serialization, guards.
**Why**: Consistent error taxonomy and machine-readable codes to ease future telemetry / observability layers.
**Trade‑offs**: Minimal added abstraction; still console-based; no batching/remote sink yet.
**Follow‑ups**: Add correlation IDs, remote transport (e.g. fetch to logging CF) once volume or analysis needs grow.

## 2025-08-14 – User Profile vs Settings Separation

**What**: Kept `users` collection lean (identity + displayName) and moved UI prefs to `userSettings/{uid}` (ui.scale, updatedAt).
**Why**: Prevent profile doc bloat, isolate write-frequency (debounced settings), align with principle of least privilege in rules.
**Trade‑offs**: Two reads on cold load (profile + settings). Acceptable due to small doc size and potential caching.
**Follow‑ups**: Optional real-time listener for settings for multi-tab sync; add more prefs (theme, notifications) incrementally.

## 2025-08-14 – Accessibility Enhancements

**What**: (Originally) added skip link and global aria-live region; replaced text buttons (password visibility, copy) with icon + hidden text, animated fades. Skip link later removed (2025-08-14) per product preference; live region retained.
**Why**: Improve keyboard navigation & assistive tech experience; skip link removed after UX review (minimal global nav on login made it feel redundant to product owner).
**Trade‑offs**: Removal slightly reduces WCAG 2.4.1 compliance strength but low impact given small nav footprint.
**Follow‑ups**: Re‑introduce skip link if header grows or accessibility audit requires it; add focus outlines audit, announce toast messages via centralized live region if needed.

## 2025-08-14 – Skip Link Removal

**What**: Removed `<SkipLink />` component and anchor injection in `App.tsx`.
**Reason**: Product preference; perceived visual clutter / redundancy with minimal navigation.
**Impact**: Slight reduction in immediate bypass navigation; acceptable given current lightweight header.
**Reversal**: Re-add component and target `id="main-content"` wrapper; optionally style via focus-only CSS.

## 2025-08-14 – Legacy Scale Migration Removal

**What**: Removed legacy `profile.uiScale` references; now solely from `userSettings` with persistence + debounce.
**Why**: Eliminate dead code paths and confusion after migration.
**Trade‑offs**: Older stale profile docs may still have `uiScale`; harmless.
**Follow‑ups**: Optional one-off cleanup script or scheduled function to strip old field if desired.

---

Add new entries above this line with newest first (reverse chronological).
