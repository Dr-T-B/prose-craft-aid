import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ParagraphBuilderContext } from '@/types/thesisRoutes';

function TextareaBlock({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-28 w-full rounded-md border bg-background p-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </CardContent>
    </Card>
  );
}

async function fetchParagraphContext(params: {
  quotePairId: string | null;
  routeCode: string | null;
  position: string | null;
}): Promise<ParagraphBuilderContext | null> {
  const { quotePairId, routeCode, position } = params;

  let resolvedQuotePairId = quotePairId;
  let route = null;
  let paragraphStep = null;

  if (routeCode) {
    const { data: routeData, error: routeError } = await supabase
      .from('thesis_routes')
      .select('*')
      .eq('route_code', routeCode)
      .single();

    if (routeError) throw routeError;
    route = routeData;

    const sequence = Array.isArray(routeData?.paragraph_sequence)
      ? routeData.paragraph_sequence
      : [];

    paragraphStep = position
      ? sequence.find((step: any) => String(step.position) === String(position)) ?? null
      : sequence[0] ?? null;

    resolvedQuotePairId = resolvedQuotePairId ?? paragraphStep?.quote_pair_id ?? null;
  }

  if (!resolvedQuotePairId) return route ? ({ thesis_route: route, paragraph_step: paragraphStep } as ParagraphBuilderContext) : null;

  const { data: quotePair, error: quotePairError } = await supabase
    .from('quote_pairs')
    .select('*')
    .or(`id.eq.${resolvedQuotePairId},quote_pair_code.eq.${resolvedQuotePairId}`)
    .maybeSingle();

  if (quotePairError) throw quotePairError;
  if (!quotePair) return null;

  return {
    ...quotePair,
    quote_pair_id: quotePair.id,
    thesis_route: route,
    paragraph_step: paragraphStep,
  } as ParagraphBuilderContext;
}

export default function ParagraphBuilderPage() {
  const [searchParams] = useSearchParams();
  const quotePairId = searchParams.get('quotePairId');
  const routeCode = searchParams.get('routeCode');
  const position = searchParams.get('position');

  const { data: context, isLoading, error } = useQuery({
    queryKey: ['paragraph-builder-context', quotePairId, routeCode, position],
    queryFn: () => fetchParagraphContext({ quotePairId, routeCode, position }),
  });

  const [topic, setTopic] = useState('');
  const [ht, setHt] = useState('');
  const [at, setAt] = useState('');
  const [comparison, setComparison] = useState('');
  const [ao3, setAo3] = useState('');
  const [ao5, setAo5] = useState('');

  const assembled = useMemo(
    () => [topic, ht, at, comparison, ao3, ao5].filter(Boolean).join(' '),
    [topic, ht, at, comparison, ao3, ao5],
  );

  if (isLoading) return <div className="p-6">Loading paragraph builder...</div>;
  if (error) return <div className="p-6 text-destructive">Unable to load paragraph context.</div>;

  return (
    <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <main className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Paragraph Builder</Badge>
              {context?.thesis_route?.route_code && <Badge variant="outline">{context.thesis_route.route_code}</Badge>}
              {context?.quote_pair_code && <Badge variant="outline">{context.quote_pair_code}</Badge>}
            </div>
            <CardTitle className="text-2xl">AO2 / AO3 / AO4 Comparative Paragraph</CardTitle>
            <p className="text-sm text-muted-foreground">
              Build a method-led comparative paragraph for Hard Times and Atonement.
            </p>
          </CardHeader>
        </Card>

        <TextareaBlock
          title="1. Comparative Topic Sentence (AO1 + AO4)"
          subtitle="State the argument comparatively. Mention both writers or both texts."
          value={topic}
          onChange={setTopic}
        />
        <TextareaBlock
          title="2. Hard Times AO2 Analysis"
          subtitle={context?.hard_times_method || 'Use Method → Word/Image → Effect → Theme.'}
          value={ht}
          onChange={setHt}
        />
        <TextareaBlock
          title="3. Atonement AO2 Analysis"
          subtitle={context?.atonement_method || 'Use Method → Word/Image → Effect → Theme.'}
          value={at}
          onChange={setAt}
        />
        <TextareaBlock
          title="4. AO4 Comparative Bridge"
          subtitle={context?.how_they_compare || 'Explain how the writers compare, not just what is similar or different.'}
          value={comparison}
          onChange={setComparison}
        />
        <TextareaBlock
          title="5. AO3 Context Integration"
          subtitle={context?.ao3_context_trigger_sentence || 'Integrate context through meaning and method.'}
          value={ao3}
          onChange={setAo3}
        />
        <TextareaBlock
          title="6. AO5 Evaluation"
          subtitle={context?.ao5_tension || 'Add an alternative interpretation or evaluative tension.'}
          value={ao5}
          onChange={setAo5}
        />

        <Card>
          <CardHeader>
            <CardTitle>Final Paragraph</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-md border bg-muted/30 p-4 text-sm leading-7 whitespace-pre-wrap">
              {assembled || 'Your paragraph will assemble here as you write each section.'}
            </p>
            <Button disabled={!assembled}>Save Paragraph</Button>
          </CardContent>
        </Card>
      </main>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quote Pair</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold">Hard Times</p>
              <p className="text-muted-foreground">{context?.hard_times_quote || 'No Hard Times quote loaded.'}</p>
            </div>
            <div>
              <p className="font-semibold">Atonement</p>
              <p className="text-muted-foreground">{context?.atonement_quote || 'No Atonement quote loaded.'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AO2 Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="font-semibold">Category:</span> {context?.method_category || 'Not set'}</p>
            <p><span className="font-semibold">Hard Times:</span> {context?.hard_times_method || 'Not set'}</p>
            <p><span className="font-semibold">Atonement:</span> {context?.atonement_method || 'Not set'}</p>
            <p><span className="font-semibold">Key focus:</span> {context?.key_word_image_focus || 'Not set'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AO3 / AO4 Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="font-semibold">AO3:</span> {context?.ao3_historical_context || context?.ao3_context_trigger_sentence || 'Not set'}</p>
            <p><span className="font-semibold">AO4 type:</span> {context?.ao4_comparison_type || 'Not set'}</p>
            <p><span className="font-semibold">Why useful:</span> {context?.why_useful_in_essay || 'Not set'}</p>
            <p><span className="font-semibold">Student action:</span> {context?.student_action || 'Build a comparative paragraph using this pair.'}</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
