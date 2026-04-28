import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { ParagraphBuilderContext } from '@/types/thesisRoutes';

type TextareaBlockProps = {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
};

function TextareaBlock({ title, subtitle, value, onChange }: TextareaBlockProps) {
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

async function fetchContext(params: { quotePairId: string | null }) {
  const { quotePairId } = params;

  if (!quotePairId) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(quotePairId);
  const query = supabase.from('quote_pairs').select('*');
  const { data, error } = isUuid
    ? await query.eq('id', quotePairId).maybeSingle()
    : await query.eq('quote_pair_code', quotePairId).maybeSingle();

  if (error) throw error;
  return data as ParagraphBuilderContext | null;
}

export default function ParagraphBuilderPage() {
  const [searchParams] = useSearchParams();
  const quotePairId = searchParams.get('quotePairId');

  const { data: context, error: contextError, isLoading } = useQuery({
    queryKey: ['context', quotePairId],
    queryFn: () => fetchContext({ quotePairId }),
    enabled: !!quotePairId,
  });

  const [topic, setTopic] = useState('');
  const [ht, setHt] = useState('');
  const [at, setAt] = useState('');
  const [comparison, setComparison] = useState('');
  const [ao3, setAo3] = useState('');
  const [ao5, setAo5] = useState('');
  const [saving, setSaving] = useState(false);

  const assembled = useMemo(() => [topic, ht, at, comparison, ao3, ao5].join(' '), [topic, ht, at, comparison, ao3, ao5]);

  const handleSave = async () => {
    setSaving(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const studentId = userData.user?.id;

      if (userError) throw userError;
      if (!studentId) throw new Error('You must be signed in to save paragraph progress.');
      if (!context?.id) throw new Error('Choose a quote pair before saving paragraph progress.');

      const { error: attemptError } = await supabase.from('paragraph_attempts').insert({
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

      if (attemptError) throw attemptError;

      const { data: existing, error: existingError } = await supabase
        .from('student_quote_pair_mastery')
        .select('*')
        .eq('student_id', studentId)
        .eq('quote_pair_id', context.id)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        const { error: updateError } = await supabase.from('student_quote_pair_mastery').update({
          used_in_paragraph_count: (existing.used_in_paragraph_count || 0) + 1,
          mastery_status: 'paragraph_ready',
          last_practised_at: new Date().toISOString(),
          needs_review: false,
        }).eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('student_quote_pair_mastery').insert({
          student_id: studentId,
          quote_pair_id: context.id,
          used_in_paragraph_count: 1,
          mastery_status: 'paragraph_ready',
          last_practised_at: new Date().toISOString(),
        });

        if (insertError) throw insertError;
      }

      toast.success('Paragraph saved and progress tracked.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save paragraph progress.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const contextErrorMessage = contextError instanceof Error ? contextError.message : null;

  return (
    <div className="p-6 space-y-6">
      <Badge>Paragraph Builder (Tracked)</Badge>

      {!quotePairId && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Open this builder from a dashboard recommendation or quote-pair route so progress can be tracked.
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Loading quote pair...</CardContent>
        </Card>
      )}

      {contextErrorMessage && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="pt-6 text-sm text-muted-foreground">{contextErrorMessage}</CardContent>
        </Card>
      )}

      {quotePairId && !isLoading && !contextErrorMessage && !context && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            This quote pair could not be found.
          </CardContent>
        </Card>
      )}

      {context && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{context.quote_pair_code}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {context.theme_label}
          </CardContent>
        </Card>
      )}

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

      <Button onClick={handleSave} disabled={saving || !context}>
        {saving ? 'Saving...' : 'Save + Track Progress'}
      </Button>
    </div>
  );
}
