import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, loading } = useAuth();
  const [verifying, setVerifying] = useState(requireAdmin);
  const [serverIsAdmin, setServerIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!requireAdmin) {
      setVerifying(false);
      return;
    }
    if (!user) {
      setVerifying(false);
      setServerIsAdmin(false);
      return;
    }
    setVerifying(true);
    // Server-side verification: trust only the database, never client state.
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data, error }) => {
        if (cancelled) return;
        setServerIsAdmin(!error && data === true);
        setVerifying(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requireAdmin, user]);

  if (loading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (requireAdmin && !serverIsAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
