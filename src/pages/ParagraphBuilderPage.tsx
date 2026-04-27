import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ParagraphBuilderContext } from '@/types/thesisRoutes';

function TextareaBlock({ title, subtitle, value, onChange }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-28 w-full border p-3"
        />
      </CardContent>
    </Card>
  );
}

async function fetchContext(params: any) {
  const { quotePairId } = params;

  if (!quotePairId) return null;

  const { data, error } = await supabase
    .from('quote_pairs')
    .select('*')
    .or(`id.eq.${quotePairId},quote_pair_code.eq.${quotePairId}`)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export default function ParagraphBuilderPage() {
  const [searchParams] = useSearchParams();
  const quotePairId = searchParams.get('quotePairId');

  const { data: context } = useQuery({
    queryKey: ['context', quotePairId],
    queryFn: () => fetchContext({ quotePairId }),
  });

  const [topic, setTopic] = useState('');
  const [ht, setHt] = useState('');
  const [at, setAt] = useState('');
  const [comparison, setComparison] = useState('');
  const [ao3, setAo3] = useState('');
  const [ao5, setAo5] = useState('');

  const assembled = useMemo(() => [topic, ht, at, comparison, ao3, ao5].join(' '), [topic, ht, at, comparison, ao3, ao5]);

  const handleSave = async () => {
    const user = await supabase.auth.getUser();
    const studentId = user.data.user?.id;

    if (!studentId || !context?.id) return;

    // 1. Save paragraph attempt
    await supabase.from('paragraph_attempts').insert({
      student_id: studentId,
      quote_pair_id: context.id,
      topic_sentence: topic,
      hard_times_analysis: ht,
      atonement_analysis: at,
      ao4_comparison: comparison,
      ao3_context_integration: ao3,
      ao5_evaluation: ao5,
      final_paragraph: assembled,
      draft_status: 'complete',
    });

    // 2. Upsert mastery tracking
    const { data: existing } = await supabase
      .from('student_quote_pair_mastery')
      .select('*')
      .eq('student_id', studentId)
      .eq('quote_pair_id', context.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('student_quote_pair_mastery').update({
        used_in_paragraph_count: (existing.used_in_paragraph_count || 0) + 1,
        mastery_status: 'paragraph_ready',
        last_practised_at: new Date().toISOString(),
        needs_review: false,
      }).eq('id', existing.id);
    } else {
      await supabase.from('student_quote_pair_mastery').insert({
        student_id: studentId,
        quote_pair_id: context.id,
        used_in_paragraph_count: 1,
        mastery_status: 'paragraph_ready',
        last_practised_at: new Date().toISOString(),
      });
    }

    alert('Paragraph saved + progress tracked');
  };

  return (
    <div className="p-6 space-y-6">
      <Badge>Paragraph Builder (Tracked)</Badge>

      <TextareaBlock title="Topic Sentence" value={topic} onChange={setTopic} />
      <TextareaBlock title="Hard Times" value={ht} onChange={setHt} />
      <TextareaBlock title="Atonement" value={at} onChange={setAt} />
      <TextareaBlock title="Comparison" value={comparison} onChange={setComparison} />
      <TextareaBlock title="Context" value={ao3} onChange={setAo3} />
      <TextareaBlock title="Evaluation" value={ao5} onChange={setAo5} />

      <Card>
        <CardContent>
          <p>{assembled}</p>
        </CardContent>
      </Card>

      <Button onClick={handleSave}>Save + Track Progress</Button>
    </div>
  );
}
