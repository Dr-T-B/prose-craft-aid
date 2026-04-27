import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ThesisRouteDetailPage() {
  const { routeCode } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['thesis-route', routeCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thesis_routes')
        .select('*')
        .eq('route_code', routeCode)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">Route not found</div>;

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-bold">{data.route_title}</h1>
          <div className="flex gap-2">
            <Badge>{data.grade_level}</Badge>
            <Badge variant="outline">{data.exam_question_family}</Badge>
          </div>
          <p>{data.thesis_sentence}</p>
          {data.conceptual_upgrade && (
            <p className="text-sm text-muted-foreground">{data.conceptual_upgrade}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold">AO3 Context</h2>
          <p>{data.ao3_context_frame}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold">AO5 Tension</h2>
          <p>{data.ao5_tension}</p>
        </CardContent>
      </Card>

      <Button>Use This Route</Button>
    </div>
  );
}
