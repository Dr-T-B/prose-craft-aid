/**
 * ProtectedRoute.tsx
 *
 * Wraps routes that require authentication.
 * Pass requireAdmin={true} to also enforce admin role.
 * Consumes useAuth() from AuthContext — single Supabase client, no race conditions.
 */
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
