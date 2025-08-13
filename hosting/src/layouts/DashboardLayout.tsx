import { Link, Outlet, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@config/firebase";
import { useAuth } from "@features/auth/AuthProvider";

// Fixed top navigation and responsive content area.
function Breadcrumbs({ path }: { path: string }) {
  const segments = path.replace(/^\/+|\/+$/g, "").split("/");
  if (segments[0] !== "dashboard" || segments.length < 2) return null;
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    profile: "Profile",
    settings: "Settings",
  };
  const items = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    return {
      label: labels[seg] || seg,
      href,
      isLast: idx === segments.length - 1,
    };
  });
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={item.href} className="crumb-wrapper">
          {i > 0 && <span className="crumb-sep"> / </span>}
          {item.isLast ? (
            <span aria-current="page">{item.label}</span>
          ) : (
            <Link to={item.href}>{item.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function DashboardLayout() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const displayName =
    profile?.displayName || user?.displayName || user?.email || "User";

  // Active nav helper
  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(path + "/"));

  return (
    <div className="app-shell">
      <header className="app-navbar">
        <strong className="app-logo">Dashboard</strong>
        <nav className="app-nav" aria-label="Main navigation">
          <Link
            to="/dashboard"
            className={`nav-link${isActive("/dashboard") ? " is-active" : ""}`}
            aria-current={isActive("/dashboard") ? "page" : undefined}
          >
            Home
          </Link>
          <Link
            to="/dashboard/settings"
            className={`nav-link${
              isActive("/dashboard/settings") ? " is-active" : ""
            }`}
            aria-current={isActive("/dashboard/settings") ? "page" : undefined}
          >
            Settings
          </Link>
        </nav>
        <div className="app-user" aria-live="polite">
          {loading ? (
            <span className="skeleton skeleton-text" aria-busy="true" />
          ) : (
            <Link
              to="/dashboard/profile"
              className="user-name-link"
              title="View profile"
            >
              {displayName}
            </Link>
          )}
          <button className="btn btn-quiet" onClick={() => signOut(auth)}>
            Logout
          </button>
        </div>
      </header>
      <main className="app-content">
        <Breadcrumbs path={location.pathname} />
        <Outlet />
      </main>
    </div>
  );
}
