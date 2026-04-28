import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { UserPlus, RefreshCw, Mail, ShieldCheck, User } from "lucide-react";

interface UserRow {
  user_id: string;
  email: string;
  confirmed: boolean;
  joined_at: string;
  last_sign: string | null;
  role: string;
}

export default function UserManager() {
  const [users, setUsers]       = useState<UserRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_admin_user_list");
    if (error) {
      toast.error("Could not load users: " + error.message);
    } else {
      setUsers(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;

    setInviting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      }
    );

    const json = await res.json();
    setInviting(false);

    if (!res.ok || json.error) {
      toast.error(json.error ?? "Invite failed");
    } else {
      toast.success(`Invite sent to ${json.email}`);
      setInviteEmail("");
      loadUsers();
    }
  };

  const fmt = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" /> Invite a new user
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              required
              placeholder="student@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit" disabled={inviting}>
              {inviting ? "Sending…" : "Send invite"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            The user will receive an email with a link to set their password and sign in.
          </p>
        </CardContent>
      </Card>

      {/* User list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">
            All users ({users.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => (
                <div key={u.user_id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {u.role === "admin"
                      ? <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                      : <User className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className="font-mono text-sm truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    {u.confirmed ? (
                      <Badge variant="outline" className="text-xs border-success text-success">confirmed</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-destructive text-destructive flex items-center gap-1">
                        <Mail className="h-3 w-3" /> pending
                      </Badge>
                    )}
                    <span>Joined {fmt(u.joined_at)}</span>
                    {u.last_sign && <span>· Last in {fmt(u.last_sign)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
