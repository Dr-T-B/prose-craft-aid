import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { migrateLocalPlansToCloud } from "@/lib/planRepository";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (uid: string | undefined) => {
    if (!uid) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // defer supabase calls to avoid deadlock
      setTimeout(() => {
        fetchRole(newSession?.user?.id);
      }, 0);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      fetchRole(s?.user?.id).finally(() => setLoading(false));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("essay_plans")
      .select("id")
      .limit(1)
      .then(({ error }: { error: { code?: string } | null }) => {
        if (error?.code === "42P01") {
          console.error(
            "[ProseCraft] essay_plans table missing — run the Supabase migration before enabling cloud sync."
          );
          return;
        }
        migrateLocalPlansToCloud().catch((err) => {
          console.error("[ProseCraft] migrateLocalPlansToCloud failed:", err);
          toast.warning("Some saved plans couldn't sync — try logging out and back in.");
        });
      });
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshRole = async () => {
    await fetchRole(user?.id);
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, loading, signOut, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
