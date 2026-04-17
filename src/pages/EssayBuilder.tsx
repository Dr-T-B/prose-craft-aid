import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  QUESTIONS, ROUTES, QUESTION_FAMILY_LABELS,
  type QuestionFamily, type Level,
} from "@/data/seed";
import { useCurrentPlan, savePlan, consumeQueuedQuote } from "@/lib/planStore";
import {
  findThesis, findParagraphJobs, findQuotesForFamily, groupQuotesBySource,
  findAO5, getQuestion, getRoute, renderPlanText,
} from "@/lib/planLogic";

const STEPS = ["Question", "Route", "Thesis", "Paragraphs", "AO5", "Save / Export"] as const;
const LEVELS: Level[] = ["secure", "strong", "top_band"];
const LEVEL_LABEL: Record<Level, string> = { secure: "Secure", strong: "Strong", top_band: "Top-band" };

export default function EssayBuilder() {
  const { plan, update } = useCurrentPlan();
  const navigate = useNavigate();

  // Accept queued quote from Toolkit
  useEffect(() => {
    const queued = consumeQueuedQuote();
    if (queued && !plan.selected_quote_ids.includes(queued)) {
      update({ selected_quote_ids: [...plan.selected_quote_ids, queued] });
      toast.success("Quote added from toolkit");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const families = useMemo(
    () => Array.from(new Set(QUESTIONS.map((q) => q.family))) as QuestionFamily[],
    []
  );
  const stems = useMemo(
    () => (plan.family ? QUESTIONS.filter((q) => q.family === plan.family) : []),
    [plan.family]
  );
  const question = getQuestion(plan.question_id);
  const primaryRoute = question ? getRoute(question.primary_route_id) : undefined;
  const secondaryRoute = question ? getRoute(question.secondary_route_id) : undefined;
  const route = getRoute(plan.route_id);
  const thesis = findThesis(plan.route_id, plan.family, plan.thesis_level);
  const paragraphJobs = findParagraphJobs(plan.family, plan.route_id);
  const quoteGroups = groupQuotesBySource(findQuotesForFamily(plan.family));
  const ao5s = findAO5(plan.family);

  // Step progress
  const stepIdx = (() => {
    if (!plan.family || !plan.question_id) return 0;
    if (!plan.route_id) return 1;
    if (!plan.thesis_level) return 2;
    if (paragraphJobs.length === 0) return 3;
    if (!plan.ao5_enabled && plan.selected_quote_ids.length === 0) return 3;
    return 5;
  })();

  const setFamily = (f: QuestionFamily) => update({ family: f, question_id: undefined, route_id: undefined });
  const setQuestion = (qid: string) => {
    const q = QUESTIONS.find((x) => x.id === qid);
    update({
      question_id: qid,
      route_id: q?.primary_route_id,
      thesis_id: undefined,
      selected_quote_ids: [],
      selected_ao5_ids: [],
    });
  };

  const toggleQuote = (id: string) => {
    update({
      selected_quote_ids: plan.selected_quote_ids.includes(id)
        ? plan.selected_quote_ids.filter((x) => x !== id)
        : [...plan.selected_quote_ids, id],
    });
  };
  const toggleAO5 = (id: string) => {
    update({
      selected_ao5_ids: plan.selected_ao5_ids.includes(id)
        ? plan.selected_ao5_ids.filter((x) => x !== id)
        : [...plan.selected_ao5_ids, id].slice(0, 3),
    });
  };

  const handleSave = () => {
    if (!plan.question_id) { toast.error("Pick a question first"); return; }
    savePlan({ ...plan, thesis_id: thesis?.id });
    toast.success("Plan saved");
  };

  const handleCopy = async () => {
    const txt = renderPlanText({ ...plan, thesis_id: thesis?.id });
    try {
      await navigator.clipboard.writeText(txt);
      toast.success("Plan copied to clipboard");
    } catch {
      toast.error("Copy failed — try Print instead");
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row min-h-[calc(100dvh-65px)]">
      {/* LEFT: BUILDER */}
      <section className="lg:w-[58%] xl:w-[55%] border-b lg:border-b-0 lg:border-r border-rule flex flex-col no-print">
        {/* Step strip */}
        <nav className="px-6 lg:px-8 py-3 border-b border-rule bg-paper-dim flex items-center gap-2 lg:gap-3 text-xs font-medium overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <span className={i === stepIdx ? "text-ink border-b border-ink pb-0.5" : i < stepIdx ? "text-ink" : "text-ink-muted"}>
                {i + 1}. {s}
              </span>
              {i < STEPS.length - 1 && <span className="text-rule">/</span>}
            </div>
          ))}
        </nav>

        <div className="p-6 lg:p-8 flex flex-col gap-10 overflow-y-auto">
          {/* 1. Question */}
          <Section eyebrow="01" title="Choose a question">
            <div className="flex flex-wrap gap-2 mb-4">
              {families.map((f) => (
                <button
                  key={f}
                  onClick={() => setFamily(f)}
                  className={`px-3 py-1.5 text-xs border ${
                    plan.family === f
                      ? "border-ink bg-ink text-paper"
                      : "border-rule bg-white hover:border-ink"
                  }`}
                >
                  {QUESTION_FAMILY_LABELS[f]}
                </button>
              ))}
            </div>
            {plan.family && (
              <div className="flex flex-col gap-2">
                {stems.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setQuestion(q.id)}
                    className={`text-left border p-3 bg-white hover:border-ink transition-colors ${
                      plan.question_id === q.id ? "border-ink shadow-press" : "border-rule"
                    }`}
                  >
                    <p className="font-serif text-base leading-snug">{q.stem}</p>
                  </button>
                ))}
              </div>
            )}
          </Section>

          {/* 2. Route */}
          {question && (
            <Section eyebrow="02" title="Pick a route">
              <div className="grid sm:grid-cols-2 gap-3">
                {[primaryRoute, secondaryRoute].filter(Boolean).map((r, i) => (
                  <button
                    key={r!.id}
                    onClick={() => update({ route_id: r!.id, thesis_id: undefined })}
                    className={`text-left p-4 bg-white border ${
                      plan.route_id === r!.id ? "border-ink shadow-press" : "border-rule hover:border-ink"
                    }`}
                  >
                    <p className="label-eyebrow mb-1">{i === 0 ? "Recommended" : "Alternative"}</p>
                    <p className="font-serif text-lg leading-snug mb-1">{r!.name}</p>
                    <p className="text-xs text-ink-muted leading-relaxed">{r!.core_question}</p>
                  </button>
                ))}
              </div>
              <details className="mt-3">
                <summary className="text-xs text-ink-muted cursor-pointer hover:text-ink">Show all routes</summary>
                <div className="grid sm:grid-cols-2 gap-2 mt-3">
                  {ROUTES.filter((r) => r.id !== primaryRoute?.id && r.id !== secondaryRoute?.id).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => update({ route_id: r.id, thesis_id: undefined })}
                      className={`text-left p-3 bg-white border text-xs ${
                        plan.route_id === r.id ? "border-ink" : "border-rule hover:border-ink"
                      }`}
                    >
                      <p className="font-medium">{r.name}</p>
                      <p className="text-ink-muted mt-1 line-clamp-2">{r.core_question}</p>
                    </button>
                  ))}
                </div>
              </details>
            </Section>
          )}

          {/* 3. Thesis level */}
          {plan.route_id && (
            <Section eyebrow="03" title="Thesis level">
              <div className="inline-flex border border-ink">
                {LEVELS.map((lv) => (
                  <button
                    key={lv}
                    onClick={() => update({ thesis_level: lv })}
                    className={`px-4 py-2 text-xs font-medium border-r border-ink last:border-r-0 ${
                      plan.thesis_level === lv ? "bg-ink text-paper" : "bg-white hover:bg-paper-dim"
                    }`}
                  >
                    {LEVEL_LABEL[lv]}
                  </button>
                ))}
              </div>
              {thesis ? (
                <div className="mt-4 border-l-4 border-ink bg-white p-4">
                  <p className="font-serif text-base leading-relaxed">{thesis.thesis_text}</p>
                </div>
              ) : (
                <p className="mt-4 text-xs text-ink-muted italic">
                  No exact thesis seeded for this combination yet — paragraph jobs will still match the question family.
                </p>
              )}
            </Section>
          )}

          {/* 4. Paragraph jobs + quotes */}
          {plan.route_id && (
            <Section eyebrow="04" title="Paragraph jobs">
              {paragraphJobs.length === 0 && thesis ? (
                <ParagraphFallback labels={[thesis.paragraph_job_1_label, thesis.paragraph_job_2_label, thesis.paragraph_job_3_label].filter(Boolean) as string[]} />
              ) : (
                <div className="flex flex-col gap-3">
                  {paragraphJobs.map((j, i) => (
                    <article key={j.id} className="border border-rule bg-white">
                      <header className="border-b border-rule px-3 py-2 bg-paper-dim flex items-center gap-3">
                        <span className="font-serif italic text-ink-muted text-sm">§{i + 1}</span>
                        <h4 className="text-sm font-medium">{j.job_title}</h4>
                      </header>
                      <div className="p-3 grid gap-2 text-sm">
                        <Row label="Hard Times">{j.text1_prompt}</Row>
                        <Row label="Atonement">{j.text2_prompt}</Row>
                        <Row label="Divergence">{j.divergence_prompt}</Row>
                        <Row label="Judgement">{j.judgement_prompt}</Row>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Quote suggestions */}
              <div className="mt-6">
                <p className="label-eyebrow mb-2">Quote & method suggestions</p>
                {(["Hard Times", "Atonement", "Comparative"] as const).map((src) => {
                  const items = quoteGroups[src];
                  if (!items.length) return null;
                  return (
                    <div key={src} className="mb-3">
                      <p className="text-[11px] uppercase tracking-wider text-ink-muted mb-1.5">{src}</p>
                      <div className="flex flex-wrap gap-2">
                        {items.map((qm) => {
                          const sel = plan.selected_quote_ids.includes(qm.id);
                          return (
                            <button
                              key={qm.id}
                              onClick={() => toggleQuote(qm.id)}
                              title={qm.method}
                              className={`text-left px-2.5 py-1.5 text-xs border max-w-full ${
                                sel ? "border-ink bg-highlight" : "border-rule bg-white hover:border-ink"
                              }`}
                            >
                              <span className="font-serif italic">"{qm.quote_text}"</span>
                              <span className="text-ink-muted"> — {qm.method}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* 5. AO5 */}
          {plan.route_id && (
            <Section eyebrow="05" title="AO5 critical tensions">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={plan.ao5_enabled}
                  onChange={(e) => update({ ao5_enabled: e.target.checked, selected_ao5_ids: e.target.checked ? plan.selected_ao5_ids : [] })}
                  className="size-4 accent-ink"
                />
                Include AO5 (max 3 tensions)
              </label>
              {plan.ao5_enabled && (
                <div className="flex flex-col gap-2">
                  {ao5s.length === 0 && <p className="text-xs text-ink-muted italic">No AO5 tensions for this family.</p>}
                  {ao5s.map((a) => {
                    const sel = plan.selected_ao5_ids.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleAO5(a.id)}
                        className={`text-left p-3 bg-white border text-sm ${
                          sel ? "border-ink shadow-press" : "border-rule hover:border-ink"
                        }`}
                      >
                        <p className="font-medium">{a.focus}</p>
                        <p className="text-xs text-ink-muted mt-1 leading-relaxed">{a.safe_stem}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </Section>
          )}

          {/* 6. Save / Export / Timed */}
          {plan.route_id && (
            <Section eyebrow="06" title="Save & export">
              <div className="flex flex-wrap gap-3">
                <button onClick={handleSave} className="px-4 py-2 bg-ink text-paper text-sm font-medium shadow-press hover:bg-ink/90">
                  Save plan
                </button>
                <button onClick={handleCopy} className="px-4 py-2 border border-ink text-sm font-medium bg-white hover:bg-paper-dim">
                  Copy as text
                </button>
                <button onClick={handlePrint} className="px-4 py-2 border border-ink text-sm font-medium bg-white hover:bg-paper-dim">
                  Print
                </button>
                <button
                  onClick={() => navigate("/timed")}
                  className="px-4 py-2 border border-ink text-sm font-medium bg-white hover:bg-paper-dim"
                >
                  Start timed writing →
                </button>
              </div>
              <p className="text-xs text-ink-muted mt-3">
                Need a quote? <Link to="/toolkit" className="underline">Open the retrieval toolkit</Link>.
              </p>
            </Section>
          )}
        </div>
      </section>

      {/* RIGHT: LIVE OUTPUT */}
      <aside className="lg:w-[42%] xl:w-[45%] bg-white print:bg-white">
        <LiveOutput />
      </aside>
    </div>
  );
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between border-b border-rule pb-1.5">
        <h3 className="font-serif text-lg">{title}</h3>
        <span className="label-eyebrow">{eyebrow}</span>
      </header>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 w-24 label-eyebrow pt-0.5">{label}</span>
      <span className="text-ink leading-relaxed">{children}</span>
    </div>
  );
}

function ParagraphFallback({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      {labels.map((lbl, i) => (
        <article key={i} className="border border-rule bg-white p-3">
          <p className="label-eyebrow mb-1">§{i + 1}</p>
          <p className="text-sm">{lbl}</p>
        </article>
      ))}
    </div>
  );
}

/* ----- LIVE OUTPUT (separate component for clarity) ----- */
import { QUOTE_METHODS, AO5_TENSIONS } from "@/data/seed";

function LiveOutput() {
  const { plan } = useCurrentPlan();
  const q = getQuestion(plan.question_id);
  const r = getRoute(plan.route_id);
  const t = findThesis(plan.route_id, plan.family, plan.thesis_level);
  const jobs = findParagraphJobs(plan.family, plan.route_id);
  const quotes = QUOTE_METHODS.filter((qm) => plan.selected_quote_ids.includes(qm.id));
  const ao5s = AO5_TENSIONS.filter((a) => plan.selected_ao5_ids.includes(a.id));

  const empty = !q && !r && !t;

  return (
    <div className="h-full overflow-y-auto px-6 lg:px-12 py-10 lg:py-16">
      <article className="max-w-[60ch] mx-auto flex flex-col gap-8 print:gap-6">
        <header className="border-b-2 border-ink pb-6">
          <p className="label-eyebrow mb-2">Live plan</p>
          {q ? (
            <h1 className="font-serif text-2xl lg:text-[28px] leading-snug text-balance">{q.stem}</h1>
          ) : (
            <h1 className="font-serif text-2xl text-ink-muted italic">Your plan will appear here as you build it.</h1>
          )}
        </header>

        {empty && (
          <p className="text-sm text-ink-muted">
            Pick a question family on the left to begin. The plan updates live as you make choices.
          </p>
        )}

        {r && (
          <section>
            <p className="label-eyebrow mb-1">Route</p>
            <p className="font-serif text-lg">{r.name}</p>
            <p className="text-sm text-ink-muted leading-relaxed mt-1">{r.comparative_insight}</p>
          </section>
        )}

        {t && (
          <section>
            <p className="label-eyebrow mb-1">Thesis · {plan.thesis_level}</p>
            <p className="font-serif text-base leading-relaxed bg-paper border-l-4 border-ink p-4">{t.thesis_text}</p>
          </section>
        )}

        {jobs.length > 0 && (
          <section className="flex flex-col gap-5">
            <p className="label-eyebrow">Paragraph jobs</p>
            {jobs.map((j, i) => (
              <div key={j.id} className="flex gap-4">
                <div className="font-serif italic text-ink-muted shrink-0">§{i + 1}</div>
                <div className="flex flex-col gap-1.5">
                  <p className="font-medium text-sm">{j.job_title}</p>
                  <p className="text-sm text-ink-muted leading-relaxed"><b className="text-ink">HT:</b> {j.text1_prompt}</p>
                  <p className="text-sm text-ink-muted leading-relaxed"><b className="text-ink">AT:</b> {j.text2_prompt}</p>
                  <p className="text-sm text-ink-muted leading-relaxed italic">{j.judgement_prompt}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {quotes.length > 0 && (
          <section>
            <p className="label-eyebrow mb-2">Selected quotes</p>
            <ul className="flex flex-col gap-2">
              {quotes.map((qm) => (
                <li key={qm.id} className="text-sm">
                  <span className="label-eyebrow mr-2">{qm.source_text === "Comparative" ? "CMP" : qm.source_text === "Hard Times" ? "HT" : "AT"}</span>
                  <span className="font-serif italic">"{qm.quote_text}"</span>
                  <span className="text-ink-muted"> — {qm.method}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {plan.ao5_enabled && ao5s.length > 0 && (
          <section>
            <p className="label-eyebrow mb-2">AO5</p>
            <ul className="flex flex-col gap-2">
              {ao5s.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-medium">{a.focus}</p>
                  <p className="text-ink-muted">{a.safe_stem}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
