import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "@features/auth/AuthProvider";
import { ProtectedRoute } from "@components/ProtectedRoute";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { ToastProvider } from "@components/ToastProvider";
import { UiScaleProvider } from "@features/ui/UiScaleProvider";
import { SettingsProvider } from "@features/settings/SettingsProvider";

// Lazy-loaded route components (code splitting)
const DashboardLayout = lazy(() =>
  import("./layouts/DashboardLayout").then((m) => ({
    default: m.DashboardLayout,
  }))
);
const DashboardHomePage = lazy(() =>
  import("./pages/DashboardHomePage").then((m) => ({
    default: m.DashboardHomePage,
  }))
);
const UserProfilePage = lazy(() =>
  import("./pages/UserProfilePage").then((m) => ({
    default: m.UserProfilePage,
  }))
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null; // spinner already handled in ProtectedRoute when needed
  return user ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <UiScaleProvider>
            <ToastProvider>
              <BrowserRouter>
                <div
                  id="app-live-region"
                  aria-live="polite"
                  className="visually-hidden"
                />
                <Suspense
                  fallback={<div style={{ padding: "2rem" }}>Loading…</div>}
                >
                  <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<DashboardHomePage />} />
                      <Route path="profile" element={<UserProfilePage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ToastProvider>
          </UiScaleProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
