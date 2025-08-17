import { Link, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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
  const [navOpen, setNavOpen] = useState(false);
  const displayName =
    profile?.displayName || user?.displayName || user?.email || "User";

  // Active nav helper
  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(path + "/"));

  // Close mobile menu when route changes
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <header className="app-navbar">
        <Link
          to="/dashboard"
          className="app-logo"
          style={{ textDecoration: "none", color: "inherit", fontWeight: 600 }}
        >
          Dashboard
        </Link>
        <button
          className="nav-toggle btn-quiet"
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
          aria-controls="main-nav"
          onClick={() => setNavOpen((o) => !o)}
        >
          <span className={"burger" + (navOpen ? " is-open" : "")}>
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </span>
        </button>
        <nav
          id="main-nav"
          className={`app-nav${navOpen ? " is-open" : ""}`}
          aria-label="Main navigation"
        >
          <Link
            to="/dashboard"
            className={`nav-link${isActive("/dashboard") ? " is-active" : ""}`}
            aria-current={isActive("/dashboard") ? "page" : undefined}
          >
            Home
          </Link>
          <Link
            to="/dashboard/profile"
            className={`nav-link${
              isActive("/dashboard/profile") ? " is-active" : ""
            }`}
            aria-current={isActive("/dashboard/profile") ? "page" : undefined}
          >
            Profile
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
          {/* Mobile-only user section */}
          <div className="nav-mobile-user">
            {loading ? (
              <span className="skeleton skeleton-text" aria-busy="true" />
            ) : (
              <span className="user-name" aria-label="Signed in user">
                {displayName}
              </span>
            )}
            <button
              className="btn btn-quiet logout-btn"
              onClick={() => signOut(auth)}
            >
              Logout
            </button>
          </div>
        </nav>
        <div className="app-user" aria-live="polite">
          {loading ? (
            <span className="skeleton skeleton-text" aria-busy="true" />
          ) : (
            <span className="user-name" aria-label="Signed in user">
              {displayName}
            </span>
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
