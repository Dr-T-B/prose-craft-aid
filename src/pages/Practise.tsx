import { useState } from "react";
import { cn } from "@/lib/utils";

interface ModelParagraph {
  id: string;
  source: string;
  prompt: string;
  paragraph: string;
  notes: string[];
}

interface AssessmentObjective {
  code: string;
  label: string;
  description: string;
}

const MODELS: ModelParagraph[] = [
  {
    id: "model-ht-1",
    source: "Hard Times",
    prompt: "How does Dickens present the consequences of Gradgrind's utilitarian philosophy?",
    paragraph:
      "Dickens's critique of Gradgrindian education operates through a sustained assault on the senses: the schoolroom, described as 'a vault' in which children sit 'in ranks' awaiting the deposit of Facts, translates the human mind into a commodity processed by an industrial system. The metaphor of the vault is not incidental — it performs burial, suggesting that Gradgrind's pedagogy entombs feeling before it can breathe. Crucially, the novel refuses to contain this damage to the schoolroom alone. Louisa, the principal victim, carries the vault inside her; her famous stare into the factory furnace ('There seems to be nothing there but languid and monotonous smoke') enacts the extinguishing of imagination from within. Dickens argues, with increasing urgency, that what is destroyed in childhood is not recoverable — the utilitarian system does not merely suppress but amputates.",
    notes: [
      "Opens with a precise critical claim about method and consequence (AO1 + AO2).",
      "Short integrated quotation analysed for its metaphorical register, not just its surface meaning (AO2).",
      "Tracks the thesis across two locations in the novel — the move avoids single-scene anchoring (structural awareness, AO1).",
      "Closes with an interpretive judgement that goes beyond summary (AO5 — own engaged reading).",
    ],
  },
  {
    id: "model-at-1",
    source: "Atonement",
    prompt: "How does McEwan use narrative perspective to explore the limits of fiction?",
    paragraph:
      "McEwan's decision to delay the revelation of Briony's authorship until the metafictional coda is itself a formal argument: the reader's complicity in accepting the novel's events as 'real' mirrors the problem the novel interrogates. In Part Three, Briony describes her writing as a 'crime' she has 'tried to expiate' — a legal-theological compound that refuses to separate artistic failure from moral failure. The free indirect discourse that permeates the novel, slipping between consciousness without announcement, performs its own version of the unreliable narrator: we do not know whose perception we inhabit until the moment our confidence is withdrawn. McEwan is interested, finally, not in guilt as feeling but in guilt as structure — the form of the novel is not a vehicle for the story but the condition of its possibility. A novelist who writes ending after ending cannot undo what was done; she can only testify to the irremediability of the original wound.",
    notes: [
      "Engages immediately with form as argument — treats narrative choice as meaning-making (AO2).",
      "Quotation unpacked at the level of connotation (legal + theological) rather than denotation (AO2).",
      "Moves from local technique (FID) to structural claim — sustained analytical arc (AO1).",
      "Final sentence offers a judged, personal reading that earns its weight (AO5).",
    ],
  },
];

const ASSESSMENT_OBJECTIVES: AssessmentObjective[] = [
  {
    code: "AO1",
    label: "Informed, coherent argument",
    description:
      "Articulate informed, personal and creative responses to literary texts, using associated concepts and terminology, and coherent, accurate written expression.",
  },
  {
    code: "AO2",
    label: "Analysis of authorial method",
    description:
      "Analyse ways in which meanings are shaped in literary texts — form, structure, language — and evaluate significant aspects of literary form and structure.",
  },
  {
    code: "AO3",
    label: "Contexts",
    description:
      "Demonstrate understanding of the significance and influence of the contexts in which literary texts are written and received, including historical, social and literary contexts.",
  },
  {
    code: "AO4",
    label: "Connections across texts",
    description:
      "Explore connections across literary texts, including thematic, structural and contextual connections. On Component 2, this means Hard Times ↔ Atonement.",
  },
  {
    code: "AO5",
    label: "Different interpretations",
    description:
      "Explore literary texts informed by different interpretations. Engagement with multiple readings is expected; verbatim citation of named critics is not required — your own reasoned interpretation counts.",
  },
];

const AO_COLOUR: Record<string, string> = {
  AO1: "border-blue-300 text-blue-700",
  AO2: "border-green-300 text-green-700",
  AO3: "border-amber-300 text-amber-700",
  AO4: "border-purple-300 text-purple-700",
  AO5: "border-rose-300 text-rose-700",
};

export default function Practise() {
  const [openNotes, setOpenNotes] = useState<string | null>(MODELS[0]?.id ?? null);

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
      <header className="mb-12 max-w-3xl">
        <p className="label-eyebrow mb-3 text-primary">Discipline II</p>
        <h1 className="font-serif text-4xl lg:text-5xl mb-4">Practise</h1>
        <p className="font-serif text-lg text-ink-muted leading-relaxed">
          Two model paragraphs and a clear restatement of the assessment
          objectives. Read closely; imitate the moves, not the wording.
        </p>
      </header>

      {/* Model paragraphs */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl border-b border-rule pb-4 mb-8">Model paragraphs</h2>
        <div className="space-y-12">
          {MODELS.map((m) => {
            const open = openNotes === m.id;
            return (
              <article key={m.id} className="grid md:grid-cols-12 gap-8">
                <header className="md:col-span-4">
                  <p className="label-eyebrow text-primary">{m.source}</p>
                  <h3 className="font-serif text-xl mt-2 leading-snug">{m.prompt}</h3>
                  <button
                    onClick={() => setOpenNotes(open ? null : m.id)}
                    className="mt-4 text-xs font-mono uppercase tracking-wider text-ink-muted hover:text-primary"
                  >
                    {open ? "Hide annotations" : "Show annotations"}
                  </button>
                </header>
                <div className="md:col-span-8">
                  <div className="bg-paper border border-rule rounded-sm p-8 shadow-card">
                    <p className="font-serif text-lg leading-relaxed">
                      {m.paragraph}
                    </p>
                  </div>
                  <ol
                    className={cn(
                      "mt-5 space-y-2 list-decimal list-inside text-sm text-ink-muted transition-all",
                      open ? "block" : "hidden",
                    )}
                  >
                    {m.notes.map((n, i) => (
                      <li key={i} className="leading-relaxed">{n}</li>
                    ))}
                  </ol>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Assessment objectives */}
      <section>
        <h2 className="font-serif text-2xl border-b border-rule pb-4 mb-8">Assessment objectives</h2>
        <p className="text-sm text-ink-muted max-w-2xl mb-6 font-serif italic">
          AO5 asks for engagement with different interpretations. That includes
          critical perspectives — but does not require verbatim citation of named critics.
          Your own reasoned reading, argued coherently, fulfils AO5.
        </p>
        <dl className="grid md:grid-cols-2 gap-x-10 gap-y-6">
          {ASSESSMENT_OBJECTIVES.map((ao) => (
            <div key={ao.code} className={cn("border-l-2 pl-5", AO_COLOUR[ao.code] ?? "border-rule text-ink")}>
              <dt className="font-mono text-[10px] uppercase tracking-wider">
                {ao.code} · {ao.label}
              </dt>
              <dd className="mt-1 text-sm text-ink-muted leading-relaxed">{ao.description}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
