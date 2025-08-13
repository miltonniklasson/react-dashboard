# Coding Guidelines

> Living document. Keep concise, pragmatic, and updated as architecture evolves. Prefer small iterative improvements over large rewrites. Optimize for clarity and onboarding speed.

## 0. Quick Reference (TL;DR)

| Topic           | Rule                                                                          |
| --------------- | ----------------------------------------------------------------------------- |
| Component style | Functional + hooks only                                                       |
| Naming          | `camelCase` vars, `PascalCase` components/types, `UPPER_SNAKE_CASE` constants |
| Booleans        | Prefix with `is/has/can/should/did/needs`                                     |
| State           | Local first, lift only when necessary                                         |
| Errors          | Fail fast, descriptive, never swallow silently                                |
| Imports         | 3rd party → internal aliases → relative                                       |
| Functions       | Single purpose, early returns, < ~40 LOC target                               |
| Firebase        | Thin service wrappers; least privilege rules                                  |
| Styling         | Keep minimal; defer design system until repetition                            |
| AI agents       | Minimal working code first, then refine                                       |
| Env Vars (Vite) | Must start with `VITE_` on frontend                                           |

---

## 1. Purpose & Scope

Defines shared principles, style, architecture boundaries, and working agreements for the React + Firebase dashboard project (web app + Firebase Functions). Applies to all contributors (humans + AI agents).

## 2. Current MVP Goals

- Firebase Auth login/logout (email/password, later providers).
- Auth‑guarded dashboard shell (layout + navbar + placeholder tabs/pages).
- Home page (post-login) with basic structure ready for future widgets.
- Clean navigation & route structure ready for incremental expansion.

## 3. Tech Stack

| Layer          | Choice                                |
| -------------- | ------------------------------------- |
| Frontend       | React + Vite + TypeScript             |
| Backend        | Firebase Cloud Functions (TypeScript) |
| Auth           | Firebase Authentication               |
| Data           | Firestore (document model)            |
| Hosting        | Firebase Hosting (SPA)                |
| Storage        | Firebase Storage (as needed)          |
| CI/CD (future) | GitHub Actions (planned)              |

Assume latest LTS Node runtime supported by Firebase Functions.

### Non-Goals (for now)

- Advanced theming/design system.
- Internationalization infrastructure.
- Real-time presence indicators.
- Heavy analytics/event pipeline.

### State Management Evolution Plan

- **Phase 1 (MVP)**: React state + Context for auth only
- **Phase 2 (expansion)**: Introduce Redux Toolkit when we have >3 features sharing state
- **Trigger point**: When prop drilling becomes painful or we need client-side caching

Document scope creep decisions in `DECISIONS.md` before implementing non-goals.

## 4. High-Level Architecture

```
root/
  hosting/            # Frontend (Vite React app)
    src/
      components/
      features/       # Feature folders (each: index.ts, hooks.ts, types.ts, etc.)
      pages/          # Route-level components
      layouts/
      hooks/
      lib/            # Generic utilities (non-feature specific)
      services/       # Firebase wrappers (auth, firestore, storage)
      config/         # App config constants (non-secret)
  functions/          # Firebase Cloud Functions (TypeScript)
    src/
      index.ts        # Function exports registry
      modules/        # Business logic / domain modules
      utils/          # Shared helpers
  coding_guidelines.md
  firestore.rules
  storage.rules
  firebase.json
```

Keep boundaries clear: frontend never embeds backend secrets; backend functions expose narrow APIs (HTTPS callable / triggers).

### Path Aliases (planned)

Configure in `tsconfig.json` / `vite.config.ts`:

```
@components/* -> src/components/*
@features/*   -> src/features/*
@lib/*        -> src/lib/*
@services/*   -> src/services/*
@config/*     -> src/config/*
```

Avoid deep relative paths (`../../../../`). Use aliases once configured.

## 5. Core Principles

1. Simplicity first – minimal viable implementation before abstraction.
2. Single Responsibility – each file/component/function does one thing well.
3. Fail Fast – detect invalid state early; throw or reject with context.
4. Clear Errors – descriptive messages (who/what/why/next step). Avoid silent catches.
5. Modular Growth – introduce patterns only when duplication is proven.
6. Explicit Over Implicit – avoid magic; be obvious.
7. Consistency Beats Cleverness – follow the guideline even if another style is marginally shorter.
8. Performance Later – optimize only with data; leave a note (// PERF: ...) where relevant.
9. Secure By Default – principle of least privilege (Firestore rules, Functions).
10. Accessibility Included – semantic HTML, ARIA when needed, keyboard paths.
11. Observability – logs + (later) metrics/events should enable root-cause within minutes.

## 6. Naming & Style

- Languages: TypeScript strict mode (enable strict flags if not already).
- Files: `kebab-case.ts[x]`; React components colocated or in `components/` folder.
- Components: PascalCase (`UserMenu.tsx`). Hooks: `useXyz.ts`. Types/interfaces: PascalCase.
- Variables/functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` (scoped; export only when shared). Prefix with domain if ambiguous.
- Enums (prefer union string literals unless many members): PascalCase enum name, ALL_CAPS members.
- Booleans: prefix with `is`, `has`, `can`, `should`, `did`, `needs`.
- Avoid unclear abbreviations. Approved short forms: `id`, `UI`, `URL`, `DTO`.
- Max function length: aim < 40 LOC; if longer, justify with comment or refactor.
- Early returns to reduce nesting. Avoid `else` after a `return`/`throw`.
- One default export per module only when it improves clarity; otherwise named exports.
- Import grouping order: (1) React/3rd-party, (2) absolute/root aliases, (3) relative, blank line between groups.
- Prefer composition over inheritance.
- No unused variables / imports (enforced by ESLint). Remove dead code quickly.

### Formatting & Linting

- Use Prettier for formatting (single source of truth). Prefer default settings except: print width 100 (if changed later, document), trailing commas = all.
- ESLint base: `eslint:recommended`, `@typescript-eslint/recommended`, `plugin:react-hooks/recommended`.
- Add rule examples (enforce later):
  - `no-console` warn (allow in Functions & structured logs) – frontend UI logs should be purposeful.
  - `@typescript-eslint/explicit-module-boundary-types` off initially (can enable once stable).
  - Disallow `any` except with `// TODO(any): reason`.
- Run lint in pre-commit (Husky + lint-staged) once tooling added.

### TypeScript

- Strict mode enabled: `strict`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`.
- Prefer type aliases for union shapes, interfaces for object contracts consumed externally.
- Use discriminated unions for result/error pattern:

```ts
type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };
```

## 7. React Component Guidelines

- Functional components only; use hooks.
- Keep presentational vs container separation where complexity grows.
- Prop interfaces: define at top (`interface DashboardProps { ... }`). Optional props use `?`; default values in destructure.
- Avoid prop drilling >2 levels: introduce context or feature-level provider.
- Local state vs global: start local; lift only when clearly shared.
- Side effects: isolate in `useEffect`; always declare dependencies intentionally. If intentionally omitting, comment `// eslint-disable-line react-hooks/exhaustive-deps` and justify above.
- Hooks naming: `use<Domain><Action>` (e.g., `useAuthUser`). Custom hooks return stable object shapes.
- Conditional rendering: guard quickly (`if (!data) return <Spinner />`).
- Accessibility: label form elements, support keyboard nav in menus/modal.
- Avoid over-optimizing with `React.memo` prematurely; add only when profiling shows re-render cost.
- Derived state: compute on render unless expensive—then memoize with `useMemo` + clear dependency list.

### Component Composition Patterns

- **Layout Components**: `<DashboardLayout>`, `<AuthLayout>` - handle structure, not business logic.
- **UI Components**: `<Button>`, `<Input>`, `<Modal>` - reusable, no external dependencies.
- **Feature Components**: `<LoginForm>`, `<UserProfile>` - contain business logic and state.
- **Page Components**: `<HomePage>`, `<LoginPage>` - route-level orchestration only.

### Loading & Error States

Standardize async UI patterns:

```tsx
// Loading pattern
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState message="No data found" />;

// Form submission pattern
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
```

## 8. Routing & Navigation

- Use React Router v6 for client-side routing.
- Route structure: `/login`, `/`, `/dashboard/*` (nested routes for tabs).
- Protected routes: wrap with `<ProtectedRoute>` component that checks auth state.
- Route guards: redirect unauthenticated users to `/login`, authenticated users away from `/login`.
- URL state: prefer URL params for shareable state (`/dashboard/profile?tab=settings`).
- Navigation: use `useNavigate()` hook; avoid `window.location` manipulation.
- Route-level code splitting: `const Dashboard = lazy(() => import('./Dashboard'))`.

### Route Structure

```
/login                    # Public: login form
/                        # Redirect: -> /dashboard or /login
/dashboard               # Protected: main layout + home tab
/dashboard/profile       # Protected: user profile tab
/dashboard/settings      # Protected: app settings tab
/404                     # Fallback: not found page
```

### Navigation Pattern

```tsx
// In navbar/sidebar
<NavLink
  to="/dashboard/profile"
  className={({ isActive }) => (isActive ? "nav-active" : "nav-link")}
>
  Profile
</NavLink>
```

## 9. Forms & Validation

- Use controlled components with React Hook Form for complex forms.
- Simple forms (login): use `useState` + basic validation.
- Validation: client-side for UX, server-side for security (never trust client).
- Error display: show field errors inline, general errors at form level.
- Submit states: disable form during submission, show loading indicator.
- Success feedback: clear success message or redirect (avoid toast overuse).

### Form Pattern

```tsx
const [formData, setFormData] = useState({ email: "", password: "" });
const [errors, setErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);

const validateForm = () => {
  const newErrors: Record<string, string> = {};
  if (!formData.email) newErrors.email = "Email is required";
  if (!formData.password) newErrors.password = "Password is required";
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## 10. State & Data

### Current Approach (MVP)

- Lightweight approach: React state + context + hooks.
- Auth state via `AuthProvider` context only.
- Local component state for forms and UI interactions.
- Firestore access via thin service modules (e.g., `services/firestore/users.ts`).

### Redux Migration Path (Phase 2)

When we hit the trigger point (>3 features sharing state or complex caching needs):

**Redux Toolkit Setup:**

- Use Redux Toolkit (RTK) - modern Redux with less boilerplate.
- RTK Query for data fetching and caching (replaces manual Firestore service calls).
- Keep auth in Redux store alongside other app state.
- Migrate incrementally - auth first, then feature by feature.

**Redux Guidelines (when implemented):**

- **Slice Structure**: One slice per domain (`authSlice`, `userSlice`, `dashboardSlice`).
- **Actions**: Use `createSlice` - auto-generates action creators and types.
- **Async Logic**: Use `createAsyncThunk` for Firebase calls.
- **Selectors**: Colocate with slices; use `createSelector` for derived data.
- **DevTools**: Always enable Redux DevTools in development.

**File Structure (future):**

```
src/
  store/
    index.ts           # Store configuration
    slices/
      authSlice.ts     # Auth state + actions
      userSlice.ts     # User profile data
    api/
      firebaseApi.ts   # RTK Query Firebase integration
```

**Migration Strategy:**

1. Set up Redux store alongside existing Context
2. Migrate auth state from Context to Redux
3. Replace Firestore service calls with RTK Query
4. Remove old Context providers as features migrate

### Current Service Pattern

- Firestore access via thin service modules: `getUserById(id)`, `subscribeUser(id, cb)`.
- Avoid writing Firestore queries directly inside UI components (except trivial prototypes).
- Centralize in service modules for testability and future Redux migration.

## 11. Firebase Usage

### Environment Configuration

Required environment variables (`.env.local`):

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123
```

### Firebase Config Setup

```tsx
// config/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Auth

- Central auth listener sets user in context provider (`AuthProvider`).
- Protected routes redirect unauthenticated users to `/login`.
- Auth state: loading, authenticated (with user), unauthenticated.
- Persist auth across refreshes using Firebase's built-in persistence.
- Logout: clear auth state and redirect to `/login`.

### AuthProvider Pattern

```tsx
// providers/AuthProvider.tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { user, loading, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

### Firestore

- Data model documented under `docs/data_model.md` (placeholder now).
- Always validate inputs before writes (frontend + backend if function used).
- Use converters (withFirestoreDataConverter) for strong typing where helpful.
- Prefer minimal document fan-out; keep nested objects cohesive instead of fragmented subcollections unless real-time granular updates needed.
- Indexes: commit generated composite indexes (`firestore.indexes.json`). Remove obsolete ones periodically.

### Functions

- Keep `index.ts` only for export wiring. Each function in its own module under `modules/`.
- Validate request body early; return 400 on validation failure.
- Log structured JSON (e.g., `console.log(JSON.stringify({ label: 'userCreated', userId }))`).
- Naming: `on<User>Created`, `call<Domain><Verb>` for callable functions.
- Resource limits: default memory unless justified (add comment when adjusting).
- Use `try/catch` at function boundary; rethrow known `AppError` with code; mask internal details from caller.

### Security Rules

- Deny by default; open minimal paths.
- Mirror critical validation both client and rules (defense in depth).
- Keep rule files commented with rationale per collection block.
- Run emulator tests for sensitive paths when rules grow.

## 10. Error Handling & Logging

- Frontend: throw Errors with meaningful message objects OR return `Result` types (union) if flow control needs it.
- Use an error boundary at layout level to catch render errors.
- Differentiate user-facing vs developer detail. Keep internal stack traces out of UI.
- Standard error shape (Cloud Function responses):

```jsonc
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found",
    "details": { "userId": "..." }
  }
}
```

- Add context prefix: `Auth: Invalid token`, `Firestore: Missing user document`.

### Error Taxonomy

Define an internal `AppError` shape:

```ts
interface AppError extends Error {
  code: string; // MACHINE readable, e.g. AUTH_INVALID_CREDENTIALS
  userMessage?: string; // Clean UI-safe message
  details?: unknown; // Extra debug info (NOT for UI)
}
```

Codes pattern: `<DOMAIN>_<DESCRIPTION>` (UPPER_SNAKE_CASE). Domains: `AUTH`, `FIRESTORE`, `VALIDATION`, `NETWORK`, `INTERNAL`.

### Logging Correlation

Add a `requestId` (UUID or provided by Firebase if available) per inbound function request and include it in every log line for tracing.

## 11. Validation

- Early return invalid params: `if (!email) throw new Error('Auth: email required');`
- Consider lightweight schema library (e.g., Zod) ONLY when forms grow complex. Avoid upfront if trivial.
- Prefer explicit field presence checks over broad truthy checks (avoid accidentally rejecting `0`/`false`).
- For multi-field forms, aggregate validation errors to help the user fix everything in one pass.

## 12. Modularity Boundaries

- Feature folder contains: `index.tsx` (entry component), `hooks.ts`, `types.ts`, `service.ts` (if needed), `components/` (subcomponents), `__tests__/` (when tests added).
- Cross-feature utilities live in `src/lib`.
- Do not import from another feature's internals; only its public exports (barrel file) to prevent tight coupling.
- Barrel file (`index.ts`) should re-export only stable surface; keep internal helpers private.

## 13. Performance (When Needed)

- Measure first (React Profiler, Firebase metrics).
- Cache Firestore queries only if same query repeated frequently and cost is significant.
- Defer large component loads with dynamic import (`React.lazy`) only after evidence of load bottleneck.
- Initial soft budget: first meaningful bundle < 200KB gzip (adjust when measured). Document exceptions.
- Use `console.time` / `performance.now()` for quick exploratory profiling; remove timing once decision made.

## 16. Testing Strategy (Incremental)

Initial focus: critical auth + key services.
Priority order:

1. **Unit**: pure functions (utilities, data transforms).
2. **Integration**: auth flow, Firestore service wrappers (can use emulator suite).
3. **E2E** (future): Cypress or Playwright for login + navigation path.

Naming: `*.test.ts(x)` adjacent or under `__tests__/`.

- Prefer testing public APIs of modules, not internal implementation details.
- Use Firebase Emulator Suite for integration tests (Auth + Firestore) – ensure deterministic seed data.
- Add coverage thresholds later (target: line 70%+ for core services before expanding).

### Testing Examples

**Service Layer Test:**

```ts
// services/auth.test.ts
import { loginUser } from "./auth";
import { auth } from "../config/firebase";

jest.mock("../config/firebase");

test("loginUser should authenticate with valid credentials", async () => {
  const mockUser = { uid: "123", email: "test@example.com" };
  (auth.signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
    user: mockUser,
  });

  const result = await loginUser("test@example.com", "password");
  expect(result).toEqual(mockUser);
});
```

**Component Test:**

```tsx
// components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "./LoginForm";

test("should show error for invalid email", async () => {
  render(<LoginForm />);

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "invalid" },
  });
  fireEvent.click(screen.getByRole("button", { name: /login/i }));

  await waitFor(() => {
    expect(screen.getByText(/valid email required/i)).toBeInTheDocument();
  });
});
```

## 15. Development Workflow

### Local Development Setup

1. Install dependencies: `npm install` (both root and `functions/` if separate)
2. Start Firebase emulators: `firebase emulators:start`
3. Start dev server: `npm run dev` (Vite)
4. Access app: `http://localhost:5173` (or configured port)

### Key Commands

```bash
# Development
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Run tests
npm run lint             # Run ESLint
npm run lint:fix         # Fix auto-fixable lint issues

# Firebase
firebase emulators:start # Start local emulators
firebase deploy          # Deploy to production
firebase deploy --only hosting  # Deploy only frontend
firebase deploy --only functions # Deploy only functions
```

### Environment Files

- `.env.local` - Local development (gitignored)
- `.env.example` - Template showing required variables (committed)
- Firebase project config via `firebase use` command

## 16. Git & Branching

- Default branch: `main` (always deployable).
- Feature branches: `feat/<short-scope>`.
- Bugfix: `fix/<issue-id-or-scope>`.
- Chore/infra: `chore/<scope>`.
- Rebase small feature branches before PR when feasible.
- Avoid long-lived branches (> 1 week) – slice features smaller.
- Hotfix to production: branch `hotfix/<scope>` off `main`, merge back with PR.

## 16. Commit Messages (Conventional Commits)

Format: `<type>(optional scope): <summary>`
Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`.
Examples:

- `feat(auth): add AuthProvider with user context`
- `fix(nav): correct active tab highlight`
- Keep summary ≤ 72 chars; wrap body at ~100 chars.
- If breaking change (later), append `BREAKING CHANGE:` section in body.

## 17. Pull Request Checklist

- Purpose clearly stated (What + Why).
- Small & focused (<= ~400 LOC diff preferred; larger justify).
- All new code typed and lint passes.
- No unused / debug code (`console.log` allowed only for structured logs or behind DEBUG flag).
- Updated docs if behaviour or structure changed.
- Screenshots/GIF for UI-affecting changes.
- Added or updated tests for new logic (where practical).
- No `TODO` without owner/context (format: `// TODO(username/date): explanation`).

## 18. AI Agent Instructions

When generating or modifying code:

1. Confirm understanding of requested change; ask only essential clarifications.
2. Produce minimal working solution first; refactor only if needed.
3. Respect existing structure & naming conventions; do not reorganize broadly without explicit request.
4. Add concise inline comments ONLY where non-obvious decisions are made.
5. Include types; avoid `any` unless strictly necessary (then `// TODO: refine type`).
6. Prefer pure functions; isolate side effects.
7. Provide short summary of changes + rationale.
8. If risk or ambiguity, list options with trade-offs before implementing.
9. Never introduce heavy dependencies without prior approval; suggest alternatives.
10. Keep function lengths reasonable; factor helpers when complexity grows.
11. Verify build/lint locally (or via provided tools) before finalizing answer.
12. Provide suggested follow-ups only if high impact / low effort.

## 19. Security & Secrets

- Never commit secrets / API keys. Use `.env.local` (ignored) for local config; for Functions use Firebase config (`firebase functions:config:set`).
- Validate all external inputs.
- Principle of least privilege in Firestore rules and custom claims.
- Sanitize user-generated data before display (React auto-escapes; avoid `dangerouslySetInnerHTML`).
- Frontend env vars must be prefixed `VITE_` (Vite requirement). NEVER leak service account keys client-side.
- Pin dependency versions; upgrade promptly on security advisories (track with `npm audit` or GitHub alerts).
- Remove unused Firebase services (principle of minimal attack surface).

## 20. Accessibility

- Every interactive element: accessible name (aria-label or visible text).
- Keyboard navigable focus order preserved.
- Color contrast meets WCAG AA (future theming to enforce).
- Provide focus styles (do not remove outline without replacement).
- Avoid using only color to convey meaning.

## 21. Internationalization (Future)

- Initially hard-coded English strings; wrap in simple `t()` adapter once >1 locale required.
- Avoid concatenated UI strings; use template placeholders.
- Centralize user-facing strings in a `strings.ts` once i18n introduced.

## 22. Logging Conventions

- Level strategy (later integration w/ tool): `console.error` (unexpected failures), `console.warn` (recoverable), `console.log` (structured info events). Avoid noise.
- Structure: `console.log(JSON.stringify({ level: 'info', event: 'auth_login', userId }))` for backend.
- Avoid logging PII (emails okay only when necessary for debugging; mask if stored).
- Redact tokens/credentials before logging.

## 23. Styling (UI) (Future Expansion)

- Start with minimal CSS / utility classes.
- Introduce design system only when repetition emerges.
- Keep global styles lean; prefer component-scoped styles or CSS modules.
- Consider utility-first (e.g., Tailwind) only after repetition analysis; document decision.
- Dark mode: treat as future enhancement (non-goal until specified).

## 25. Common UI Patterns

### Loading States

```tsx
// Global loading for route changes
if (isLoading) return <div className="loading-spinner">Loading...</div>;

// Inline loading for actions
<button disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</button>;

// Skeleton loading for data
{
  isLoading ? <UserSkeleton /> : <UserProfile user={user} />;
}
```

### Error Boundaries

```tsx
// layouts/ErrorBoundary.tsx
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Empty States

```tsx
// Consistent empty state pattern
function EmptyState({
  title = "No data found",
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && action}
    </div>
  );
}
```

### Modal Pattern

```tsx
// Accessible modal with focus management
function Modal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
```

## 26. Sample Patterns

### Early Return

```ts
function getDisplayName(user: User | null): string {
  if (!user) return "Guest";
  const { firstName, lastName } = user;
  if (!firstName || !lastName) return "User";
  return `${firstName} ${lastName}`;
}
```

### Service Wrapper

```ts
// services/firestore/users.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export async function getUserById(id: string) {
  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) throw new Error(`Firestore: user ${id} not found`);
  return { id: snap.id, ...snap.data() } as User;
}
```

### Async Guard (Fail Fast)

```ts
export async function loadDashboard(userId: string) {
  if (!userId) throw new Error("VALIDATION: userId required");
  const user = await getUserById(userId); // throws if missing
  return buildDashboard(user);
}
```

### Redux Sample Patterns (Future Reference)

**Slice Example:**

```ts
// store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";

export const loginAsync = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { uid: result.user.uid, email: result.user.email };
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

**Component Usage:**

```tsx
// components/LoginForm.tsx
import { useDispatch, useSelector } from "react-redux";
import { loginAsync } from "../store/slices/authSlice";

function LoginForm() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await dispatch(loginAsync({ email, password }));
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <button disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
```

## 27. TODO / Future Sections

- Theming strategy
- Analytics & event taxonomy
- Error code catalog
- Data model diagrams
- CI/CD pipeline doc
- Observability / metrics strategy
- Privacy & data retention policy
- Component library documentation
- Performance monitoring setup
- Redux migration checklist (when trigger point reached)

### State Management Decision Matrix

Use this when deciding to migrate to Redux:

| Scenario                          | Keep Context | Migrate to Redux |
| --------------------------------- | ------------ | ---------------- |
| Auth + 1-2 simple features        | ✅           | ❌               |
| >3 features sharing state         | ❌           | ✅               |
| Complex data caching needed       | ❌           | ✅               |
| Real-time updates across features | ❌           | ✅               |
| Time-travel debugging needed      | ❌           | ✅               |
| Team >3 developers                | ❌           | ✅               |

## 28. Glossary

- SRP: Single Responsibility Principle.
- MVP: Minimum Viable Product.
- Feature Folder: Directory grouping domain logic/UI for a feature.
- PII: Personally Identifiable Information.
- ADR: Architecture / Decision Record (see `DECISIONS.md`).
- HOC: Higher-Order Component (prefer hooks/composition).

## 29. Change Management

Updates to this document require a PR titled `docs(guidelines): ...` with rationale in description.

---

Last updated: 2025-08-13
