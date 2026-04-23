/**
 * ProtectedRoute.tsx
 *
 * Wraps any route that requires the user to be logged in.
 * If they have no active Supabase session, they get redirected
 * to /login automatically.
 */

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient"; // ← adjust to match your project

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // Check whether there is an active session right now
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // While we're checking, show nothing (avoids a flash of the wrong page)
  if (checking) return null;

  // Not logged in → redirect to login
  if (!loggedIn) return <Navigate to="/login" replace />;

  // Logged in → show the page as normal
  return <>{children}</>;
}