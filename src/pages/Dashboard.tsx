import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type NextAction = {
  action_type: string;
  priority: number;
  quote_pair_id: string | null;
  quote_pair_code: string | null;
  theme_label: string | null;
  title: string;
  reason: string;
  action_url: string;
};

const Dashboard = () => {
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [loadingAction, setLoadingAction] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingAction(true);
      setActionError(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      const studentId = userData.user?.id;

      if (userError) {
        setActionError(userError.message);
        setLoadingAction(false);
        return;
      }

      if (!studentId) {
        setLoadingAction(false);
        return;
      }

      const { data, error } = await supabase.rpc("get_next_best_action", {
        target_student_id: studentId,
      });

      if (error) {
        setActionError(error.message);
      } else if (data && data.length > 0) {
        setNextAction(data[0] as NextAction);
      }

      setLoadingAction(false);
    };

    load();
  }, []);

  const safeActionUrl =
    nextAction?.action_url && nextAction.action_url.startsWith("/")
      ? nextAction.action_url
      : "/";

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {loadingAction && (
        <div className="border p-6 rounded-lg bg-muted">
          <h2 className="text-xl font-semibold mb-2">Next Best Action</h2>
          <p className="text-sm text-muted-foreground">Loading your next study step...</p>
        </div>
      )}

      {!loadingAction && actionError && (
        <div className="border border-destructive/40 p-6 rounded-lg bg-destructive/10">
          <h2 className="text-xl font-semibold mb-2">Next Best Action</h2>
          <p className="text-sm text-muted-foreground">{actionError}</p>
        </div>
      )}

      {!loadingAction && !actionError && !nextAction && (
        <div className="border p-6 rounded-lg bg-muted">
          <h2 className="text-xl font-semibold mb-2">Next Best Action</h2>
          <p className="text-sm text-muted-foreground">No recommendation is available yet.</p>
        </div>
      )}

      {nextAction && (
        <div className="border p-6 rounded-lg bg-muted">
          <h2 className="text-xl font-semibold mb-2">Next Best Action</h2>
          <p className="font-medium">{nextAction.title}</p>
          <p className="text-sm text-muted-foreground mb-4">{nextAction.reason}</p>

          <Link
            to={safeActionUrl}
            className="inline-block px-4 py-2 bg-primary text-white rounded"
          >
            Start →
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
