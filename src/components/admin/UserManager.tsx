import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from "lucide-react";

export default function UserManager() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" />
            User management
          </CardTitle>
          <Badge variant="secondary">Not enabled</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          User invitations and full user listing are disabled until the matching
          admin RPC and invite edge function are deployed.
        </p>
        <p>
          Admin role assignment should continue to be handled directly in
          Supabase until this backend surface is implemented.
        </p>
      </CardContent>
    </Card>
  );
}
