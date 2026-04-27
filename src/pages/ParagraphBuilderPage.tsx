import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ParagraphBuilderPage() {
  const [topic, setTopic] = useState('');
  const [ht, setHt] = useState('');
  const [at, setAt] = useState('');
  const [comparison, setComparison] = useState('');
  const [context, setContext] = useState('');
  const [evaluation, setEvaluation] = useState('');

  const assembled = [topic, ht, at, comparison, context, evaluation]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">Topic Sentence</h2>
          <textarea value={topic} onChange={e => setTopic(e.target.value)} className="w-full border p-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">Hard Times Analysis</h2>
          <textarea value={ht} onChange={e => setHt(e.target.value)} className="w-full border p-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">Atonement Analysis</h2>
          <textarea value={at} onChange={e => setAt(e.target.value)} className="w-full border p-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">Comparison</h2>
          <textarea value={comparison} onChange={e => setComparison(e.target.value)} className="w-full border p-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">Context</h2>
          <textarea value={context} onChange={e => setContext(e.target.value)} className="w-full border p-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="font-semibold">Evaluation (AO5)</h2>
          <textarea value={evaluation} onChange={e => setEvaluation(e.target.value)} className="w-full border p-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold">Final Paragraph</h2>
          <p className="mt-2">{assembled}</p>
        </CardContent>
      </Card>

      <Button>Save Paragraph</Button>
    </div>
  );
}
