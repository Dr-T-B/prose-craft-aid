import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [nextAction, setNextAction] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const user = await supabase.auth.getUser();
      const studentId = user.data.user?.id;

      if (!studentId) return;

      const { data } = await supabase.rpc('get_next_best_action', {
        target_student_id: studentId,
      });

      if (data && data.length > 0) setNextAction(data[0]);
    };

    load();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {nextAction && (
        <div className="border p-6 rounded-lg bg-muted">
          <h2 className="text-xl font-semibold mb-2">Next Best Action</h2>
          <p className="font-medium">{nextAction.title}</p>
          <p className="text-sm text-muted-foreground mb-4">{nextAction.reason}</p>

          <Link
            to={nextAction.action_url}
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
