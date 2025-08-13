# Coding Guidelines (Concise)

> React + Firebase dashboard. Keep it simple, fail fast, explicit, and incremental. (See `coding_guidelines_full.md` for deep detail.)

## Purpose

Minimal operational rules for humans + AI agents to produce consistent, safe, and maintainable code quickly. Optimize for clarity over exhaustiveness.

## Quick Reference

| Topic       | Rule / Convention                                                              |
| ----------- | ------------------------------------------------------------------------------ |
| Components  | Functional + hooks only                                                        |
| Naming      | `camelCase` vars, `PascalCase` components/types, `UPPER_SNAKE_CASE` constants  |
| Booleans    | Prefix with `is/has/can/should/did/needs`                                      |
| State       | Local first; Context only for auth; Redux @ >3 shared features / caching need  |
| Errors      | Fail fast; meaningful message + optional `code`; no silent catches             |
| Error Codes | Pattern: `DOMAIN_DESCRIPTION` (AUTH, FIRESTORE, VALIDATION, NETWORK, INTERNAL) |
| Imports     | 3rd-party → aliases → relative; avoid deep `../../..` after aliases            |
| Functions   | Single purpose, early returns, <40 LOC target                                  |
| Firebase    | Thin service wrappers; least-privilege security rules                          |
| Logging     | Structured backend logs (JSON); minimal purposeful UI logs                     |
| Styling     | Minimal CSS; defer design system; avoid premature utility framework            |
| Performance | Ship first; measure before optimizing (`// PERF:` comment for hotspots)        |
| Env Vars    | Frontend vars must start with `VITE_`; provide `.env.example`                  |
| PR Size     | Prefer < ~400 LOC diff; focused scope                                          |

## Architecture

```
src/
  components/    # Reusable UI (Button, Modal)
  features/      # Business logic (auth/, dashboard/)
  pages/         # Route components
  layouts/       # Page structures
  services/      # Firebase wrappers
  lib/           # Utilities
  config/        # App constants
```

## Core Principles

1. **Simplicity first** - MVP before abstraction
2. **Single Responsibility** - one thing per file/component
3. **Fail Fast** - validate early, descriptive errors
4. **Explicit over implicit** - no magic, be obvious
5. **Performance later** - measure before optimizing

## React Patterns

```tsx
// Component structure
interface Props {
  user: User;
  onSave?: (data: UserData) => void;
}

export function UserProfile({ user, onSave }: Props) {
  // Early return for loading/error states
  if (!user) return <Spinner />;

  // Local state first
  const [isEditing, setIsEditing] = useState(false);

  return <div>...</div>;
}

// Loading states
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

// Form pattern
const [formData, setFormData] = useState({ email: "", password: "" });
const [errors, setErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

## Security & Environment

```bash
# Required environment variables (.env.local)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123
```

- Never commit secrets/API keys
- Validate all inputs (client + server)
- Firestore rules: principle of least privilege (audit quarterly)
- Sanitize user content (React escapes by default; avoid `dangerouslySetInnerHTML`)
- Add `.env.example` with placeholders (no secrets) for onboarding

## Firebase Usage

```tsx
// Config (config/firebase.ts)
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Service wrapper (fail fast)
export async function getUserById(id: string) {
  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) throw new Error(`User ${id} not found`);
  return { id: snap.id, ...snap.data() } as User;
}
```

### Protected Route Pattern

```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

Redirects unauthenticated users to `/login`; optionally redirect authenticated users away from `/login`.

## Git Workflow

- Branches: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`
- Commits (Conventional): `<type>(scope): <summary>` where type ∈ `feat|fix|chore|docs|refactor|test|perf|build|ci`
- Rebase small feature branches before merge when clean
- PRs: ≤400 LOC preferred; include purpose + UI screenshot/GIF if visual

### Mini PR Checklist

- Lint passes / types clean
- Focused scope / no drive-by refactors
- Added/updated tests (where logic added)
- No stray debug `console.log`
- Updated docs/config if behavior or structure changed

## Accessibility

- Accessible names for interactive elements (visible text or `aria-label`)
- Keyboard navigation (Tab, Enter, Escape, Arrow keys where appropriate)
- Manage focus in modals/menus; trap focus & return on close
- Maintain WCAG AA contrast (avoid color-only meaning)

## Routing (React Router v6)

```text
/login            public
/                 redirect -> /dashboard or /login
/dashboard        protected layout
/dashboard/*      nested protected routes
/404              fallback
```

Lazy load heavier feature pages only after bundle size pressure.

## Error Handling & Logging

```tsx
// AppError interface
interface AppError extends Error {
  code: string; // AUTH_INVALID_CREDENTIALS
  userMessage?: string; // User-safe message
}

// Error boundary (layouts/ErrorBoundary.tsx)
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? <ErrorFallback /> : this.props.children;
  }
}
```

Guidelines:

- Throw early with contextual message (`Auth: email required`).
- Map internal errors to user-safe `userMessage`.
- Backend logs structured:

```js
console.log(JSON.stringify({ level: "info", event: "auth_login", uid }));
```

- Avoid logging secrets / tokens; redact when uncertain.

## State Management Evolution

- Phase 1 (MVP): React Context for auth only
- Phase 2: Redux Toolkit (RTK) once >3 cross-feature shared concerns OR caching complexity
- Triggers: persistent prop drilling, complex derived data, real-time shared updates, team >3 devs
- Add RTK Query for Firestore caching when repeated identical reads become a bottleneck

## Testing Priority

1. Unit: pure functions (utilities, data transforms)
2. Integration: auth flow, Firestore wrappers (Firebase Emulator Suite)
3. E2E: login → dashboard happy path (later: critical regression flows)

Principles:

- Test public APIs only; avoid brittle implementation details
- Deterministic emulator seed data
- Target ≥70% line coverage for core services before expanding breadth

## TypeScript

```tsx
// Strict mode enabled
// Prefer interfaces for props, type aliases for unions
interface User {
  id: string;
  email: string;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

// No 'any' except with TODO comment
const data: any = response; // TODO: define proper type
```

## AI Agent Rules

1. Produce minimal working solution first; refine only if needed
2. Conform to existing structure & naming (no unsolicited reorganizing)
3. Include types; no `any` unless annotated `// TODO: refine type`
4. Comment only where intent is non-obvious or trade-off made
5. Prefer pure functions; isolate side effects (I/O, network)
6. Ask only essential clarifications; infer from patterns when safe
7. Run lint/type checks (where tooling available) before final output
8. Provide brief rationale + potential follow-up (1–2 bullets max) if applicable

## Performance (When Needed)

- Ship correctness first; optimize after measurement
- Mark suspected hotspots with `// PERF: <reason>`
- Use React Profiler & Firebase metrics prior to changes
- Lazy-load only after bundle analysis indicates need (> ~200KB gzip main chunk)

## Styling & Theming

- Start with minimal CSS / small utility classes
- Avoid global overrides beyond reset + layout scaffolding
- Introduce design system / utility framework only after repeated duplication

## Path Aliases (Planned)

Add to `tsconfig` & Vite config when needed:

```
@components/*  -> src/components/*
@features/*    -> src/features/*
@lib/*         -> src/lib/*
@services/*    -> src/services/*
@config/*      -> src/config/*
```

Refactor imports opportunistically (not in unrelated PRs).

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Build production
npm run test             # Run tests
npm run lint             # Check code
firebase emulators:start # Start Firebase locally
firebase deploy          # Deploy to production
```

---

## Operational Reminders

- Review & tighten Firestore rules before any production launch (no lingering test-wide allows)
- Audit dependencies monthly (`npm audit` / GitHub alerts)
- Rotate any temporary credentials promptly

---

_Goal: keep ≤250 lines. For rationale & extended patterns see `coding_guidelines_full.md`._
