import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, loading, isEnabled } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <p className="text-sm text-ink-2">Carregando...</p>
      </div>
    );
  }

  if (!isEnabled) {
    return <>{children}</>;
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/auth/login" />;
  }

  return <>{children}</>;
}
