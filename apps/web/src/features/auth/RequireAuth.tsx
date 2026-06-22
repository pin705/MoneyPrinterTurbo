import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/store/auth";

/** Gate a route behind a session. Redirects to /login when signed out. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
