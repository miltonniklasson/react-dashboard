import { Navigate } from "react-router-dom";
import { useAuth } from "@features/auth/AuthProvider";
import { Spinner } from "./Spinner";
import type { JSX } from "react/jsx-dev-runtime";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
