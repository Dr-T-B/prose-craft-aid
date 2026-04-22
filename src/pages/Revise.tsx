import { useMemo, useState } from "react";
import { Eye, EyeOff, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContent } from "@/lib/ContentProvider";
import { QUESTION_FAMILY_LABELS } from "@/data/seed";
import type { QuoteMethod, QuestionFamily } from "@/data/seed";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Static glossary — key terms for A-Level English Lit Component 2
// ---------------------------------------------------------------------------

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  example?: string;
}

const GLOSSARY: GlossaryTerm[] = [
  { id: "free-indirect-discourse", term: "Free indirect discourse", definition: "A technique that merges a character's thoughts or speech with the narrator's voice, without quotation marks or attribution, collapsing the distance between narrator and character.", example: "McEwan's Briony sections in Atonement blur where observation ends and interpretation begins." },
  { id: "social-satire", term: "Social satire", definition: "Writing that uses irony, exaggeration or ridicule to expose and criticise social institutions, individuals or attitudes.", example: "Dickens's presentation of Gradgrind uses hyperbole to indict utilitarian education." },
  { id: "metafiction", term: "Metafiction", definition: "Fiction that self-consciously draws attention to its status as an artefact, undermining the illusion of reality and questioning the act of storytelling itself.", example: "The postscript of Atonement where Briony reveals she is the novel's author." },
  { id: "unreliable-narrator", term: "Unreliable narrator", definition: "A narrator whose credibility is compromised — by limited knowledge, self-interest, or psychological distortion — so that the reader cannot fully trust their account.", example: "Briony's distorted perception of the fountain scene in Part One of Atonement." },
  { id: "bildungsroman", term: "Bildungsroman", definition: "A coming-of-age novel tracing the psychological and moral development of a protagonist from youth to maturity.", example: "Hard Times traces Louisa's formation — and deformation — under Gradgrind's system." },
  { id: "utilitarianism", term: "Utilitarianism", definition: "The philosophical doctrine that the morally correct action maximises utility (happiness, pleasure) for the greatest number. Dickens satirises its reduction of human beings to economic units.", example: "Gradgrind embodies the utilitarian contempt for imagination and feeling." },
  { id: "allegory", term: "Allegory", definition: "A narrative in which characters, events and settings represent abstract ideas or moral qualities, operating on two simultaneous levels of meaning.", example: "Gradgrind, Bounderby and Sleary function allegorically as competing social philosophies." },
  { id: "dramatic-irony", term: "Dramatic irony", definition: "When the audience or reader possesses information that a character does not, creating tension or pathos.", example: "The reader understands Briony's misidentification before any character acknowledges it." },
  { id: "pastoral", term: "Pastoral", definition: "A mode that idealises rural life as a refuge from corruption or complexity. Often invoked to critique industrial or urban society by contrast.", example: "The circus folk in Hard Times represent a pastoral alternative to Coketown's mechanism." },
  { id: "atonement-reparation", term: "Atonement / Reparation", definition: "Making amends for a wrongdoing. In McEwan's novel, the question is whether narrative fiction can constitute genuine reparation — or whether it is another form of self-serving invention.", example: "The novel's final section interrogates whether writing a 'happy ending' repairs the harm Briony caused." },
  { id: "omniscient-narrator", term: "Omniscient narrator", definition: "A narrator with unlimited knowledge of events, characters and their inner states, able to move freely across time and perspective.", example: "Dickens's narrator in Hard Times addresses the reader directly, editorialising with moral authority." },
  { id: "anagnorisis", term: "Anagnorisis", definition: "The moment of critical recognition or discovery — when a character comes to know something that fundamentally changes their understanding of their situation.", example: "Louisa's collapse before Gradgrind in Book Two of Hard Times: 'How could you give me life and take from me all the inappreciable things that raise it from the state of conscious death?'" },
  { id: "juxtaposition", term: "Juxtaposition", definition: "Placing two contrasting elements — characters, settings, images, ideas — in close proximity to highlight their differences and generate meaning.", example: "Coketown's smokestacks set against Sleary's circus tents in Hard Times." },
  { id: "epistolary", term: "Epistolary", definition: "A narrative form told through letters, diary entries or other documents. Atonement's Part Two uses letters and a developing authorial voice to signal Briony's creative development.", example: "Cyril Connolly's rejection letter to Briony positions her developing craft within real literary history." },
];

// ---------------------------------------------------------------------------
// Quote Drill
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function QuoteDrill({ quotes }: { quotes: QuoteMethod[] }) {
  const sources = useMemo(() => {
    const s = new Set(quotes.map((q) => q.source_text));
    return Array.from(s).sort();
  }, [quotes]);

  const [srcFilter, setSrcFilter] = useState<string>("all");
  const pool = useMemo(
    () => (srcFilter === "all" ? quotes : quotes.filter((q) => q.source_text === srcFilter)),
    [quotes, srcFilter],
  );
  const [order, setOrder] = useState<string[]>(() => shuffle(pool).map((q) => q.id));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = pool.find((q) => q.id === order[idx % Math.max(order.length, 1)]) ?? pool[0];

  function reshuffle() {
    setOrder(shuffle(pool).map((q) => q.id));
    setIdx(0);
    setRevealed(false);
  }
  function next() {
    setIdx((i) => i + 1);
    setRevealed(false);
  }

  if (pool.length === 0) {
    return <p className="text-ink-muted text-sm">No quotes available for this filter.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Source filter */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <button
          onClick={() => { setSrcFilter("all"); setTimeout(reshuffle, 0); }}
          className={cn(
            "px-3 py-1 text-xs font-mono uppercase tracking-wider rounded-sm border transition-colors",
            srcFilter === "all"
              ? "bg-primary text-white border-primary"
              : "border-rule text-ink-muted hover:text-ink",
          )}
        >
          All texts
        </button>
        {sources.map((s) => (
          <button
            key={s}
            onClick={() => { setSrcFilter(s); setTimeout(reshuffle, 0); }}
            className={cn(
              "px-3 py-1 text-xs font-mono uppercase tracking-wider rounded-sm border transition-colors",
              srcFilter === s
                ? "bg-primary text-white border-primary"
                : "border-rule text-ink-muted hover:text-ink",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Card */}
      <article className="bg-paper border border-rule rounded-sm p-10 md:p-14 shadow-card min-h-[18rem] flex flex-col">
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          {current.source_text}
          {current.location_reference ? ` · ${current.location_reference}` : ""}
          {current.speaker_or_narrator ? ` · ${current.speaker_or_narrator}` : ""}
        </p>
        <blockquote className="mt-6 font-serif text-2xl md:text-3xl italic leading-snug border-l-2 border-primary pl-6">
          "{current.quote_text}"
        </blockquote>

        {revealed && (
          <div className="mt-8 pt-6 border-t border-rule">
            <p className="text-sm text-ink-muted leading-relaxed">{current.effect_prompt}</p>
            {current.meaning_prompt && (
              <p className="mt-2 text-sm text-ink-muted leading-relaxed italic">{current.meaning_prompt}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {current.method && (
                <span className="text-[0.7rem] text-ink-muted italic">{current.method}</span>
              )}
              {current.best_themes.map((tid) => {
                const label = QUESTION_FAMILY_LABELS[tid as QuestionFamily];
                return label ? (
                  <span key={tid} className="text-[0.7rem] font-mono uppercase tracking-wider text-primary">
                    · {label}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </article>

      {/* Controls */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={reshuffle}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink-muted hover:text-ink"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Shuffle
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRevealed((r) => !r)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-rule rounded-sm text-xs font-mono uppercase tracking-wider hover:bg-paper-dim/40 transition-colors"
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {revealed ? "Hide" : "Reveal"}
          </button>
          <button
            onClick={next}
            className="px-5 py-2 bg-primary text-white rounded-sm text-xs font-mono uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Next quote
          </button>
        </div>
      </div>
      <p className="text-center text-[10px] font-mono text-ink-muted mt-3">
        {pool.length} quote{pool.length === 1 ? "" : "s"} in pool
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------

function GlossaryView() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return GLOSSARY;
    return GLOSSARY.filter(
      (g) =>
        g.term.toLowerCase().includes(s) ||
        g.definition.toLowerCase().includes(s) ||
        (g.example?.toLowerCase().includes(s) ?? false),
    );
  }, [q]);

  return (
    <div>
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search glossary…"
          className="pl-9"
        />
      </div>
      <dl className="grid md:grid-cols-2 gap-x-10 gap-y-6">
        {filtered.map((g) => (
          <div key={g.id} className="border-l-2 border-rule pl-5">
            <dt className="font-serif text-xl">{g.term}</dt>
            <dd className="text-sm text-ink-muted leading-relaxed mt-1">{g.definition}</dd>
            {g.example && (
              <p className="mt-2 text-xs italic text-ink-muted">e.g. {g.example}</p>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-ink-muted">No terms match.</p>
        )}
      </dl>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Revise() {
  const { quote_methods } = useContent();
  // Exclude comparative quotes from the drill — use text-specific ones only
  const drillQuotes = useMemo(
    () => quote_methods.filter((q) => q.source_text !== "Comparative"),
    [quote_methods],
  );

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
      <header className="mb-12 max-w-3xl">
        <p className="label-eyebrow mb-3 text-primary">Discipline III</p>
        <h1 className="font-serif text-4xl lg:text-5xl mb-4">Revise</h1>
        <p className="font-serif text-lg text-ink-muted leading-relaxed">
          Drill the quotes; consolidate terminology. Active recall in a quiet room.
        </p>
      </header>

      <Tabs defaultValue="quotes" className="w-full">
        <TabsList className="bg-transparent border-b border-rule rounded-none w-full justify-start h-auto p-0 gap-6">
          {[["quotes", "Quote drill"], ["glossary", "Glossary"]] .map(([v, l]) => (
            <TabsTrigger
              key={v}
              value={v}
              className="bg-transparent rounded-none px-0 pb-3 font-mono uppercase tracking-wider text-xs data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-ink-muted"
            >
              {l}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="quotes" className="pt-12">
          <QuoteDrill quotes={drillQuotes} />
        </TabsContent>
        <TabsContent value="glossary" className="pt-10">
          <GlossaryView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
