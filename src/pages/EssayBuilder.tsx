import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  QUESTIONS, ROUTES, QUESTION_FAMILY_LABELS,
  type QuestionFamily, type Level,
} from "@/data/seed";
import { useCurrentPlan, savePlan, consumeQueuedQuote, consumeQueuedFamily } from "@/lib/planStore";
import {
  findThesis, resolveParagraphJobs, findQuotesForFamily, groupQuotesBySource,
  findAO5, getQuestion, getRoute, renderPlanText,
} from "@/lib/planLogic";

const STEPS = ["Question", "Route", "Thesis", "Paragraphs", "AO5", "Save / Export"] as const;
const LEVELS: Level[] = ["secure", "strong", "top_band"];
const LEVEL_LABEL: Record<Level, string> = { secure: "Secure", strong: "Strong", top_band: "Top-band" };

export default function EssayBuilder() {
  const { plan, update } = useCurrentPlan();
  const navigate = useNavigate();

  // Accept queued quote / theme family from Toolkit
  useEffect(() => {
    const queued = consumeQueuedQuote();
    if (queued && !plan.selected_quote_ids.includes(queued)) {
      update({ selected_quote_ids: [...plan.selected_quote_ids, queued] });
      toast.success("Quote added from toolkit");
    }
    const queuedFamily = consumeQueuedFamily();
    if (queuedFamily && plan.family !== queuedFamily) {
      update({ family: queuedFamily, question_id: undefined, route_id: undefined });
      toast.success("Theme loaded — pick a question");
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
  const paragraphJobs = resolveParagraphJobs(plan.family, plan.route_id, thesis);
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
        <nav className="px-6 lg:px-8 py-3 border-b border-rule bg-paper-dim/60 flex items-center gap-2 lg:gap-3 text-xs font-mono overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <span className={i === stepIdx
                ? "text-ink border-b-2 border-primary pb-0.5"
                : i < stepIdx ? "text-ink" : "text-ink-muted"}>
                {String(i + 1).padStart(2, "0")} · {s}
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
                  className={`px-3 py-1.5 text-xs font-mono rounded-sm border transition-colors ${
                    plan.family === f
                      ? "border-primary bg-highlight text-ink"
                      : "border-rule bg-paper hover:border-rule-strong hover:bg-paper-dim"
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
                    className={`text-left border rounded-sm p-3 bg-paper hover:border-rule-strong transition-colors ${
                      plan.question_id === q.id ? "border-primary bg-highlight/40 shadow-card" : "border-rule"
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
                {[primaryRoute, secondaryRoute].filter(Boolean).map((r, i) => {
                  const selected = plan.route_id === r!.id;
                  return (
                    <button
                      key={r!.id}
                      onClick={() => update({ route_id: r!.id, thesis_id: undefined })}
                      className={`text-left p-4 bg-paper border rounded-sm transition-colors flex flex-col gap-2 ${
                        selected ? "border-primary bg-highlight/40 shadow-card" : "border-rule hover:border-rule-strong"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="label-eyebrow">{i === 0 ? "Recommended" : "Alternative"}</p>
                        {selected && <span className="meta-mono text-primary">selected</span>}
                      </div>
                      <p className="font-serif text-lg leading-snug">{r!.name}</p>
                      <p className="text-xs text-ink-muted leading-relaxed">{r!.core_question}</p>
                      <div className="border-t border-rule pt-2 mt-1">
                        <p className="meta-mono mb-1">Why this fits</p>
                        <p className="text-xs text-ink leading-relaxed">{r!.best_use}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <details className="mt-3">
                <summary className="text-xs text-ink-muted cursor-pointer hover:text-ink font-mono">Show all routes</summary>
                <div className="grid sm:grid-cols-2 gap-2 mt-3">
                  {ROUTES.filter((r) => r.id !== primaryRoute?.id && r.id !== secondaryRoute?.id).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => update({ route_id: r.id, thesis_id: undefined })}
                      className={`text-left p-3 bg-paper border rounded-sm text-xs ${
                        plan.route_id === r.id ? "border-primary bg-highlight/40" : "border-rule hover:border-rule-strong"
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
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((lv, i) => {
                  const active = plan.thesis_level === lv;
                  const reached = LEVELS.indexOf(plan.thesis_level) >= i;
                  return (
                    <button
                      key={lv}
                      onClick={() => update({ thesis_level: lv })}
                      className={`text-left px-3 py-2.5 border rounded-sm transition-colors ${
                        active
                          ? "border-primary bg-highlight/60 shadow-card"
                          : reached
                          ? "border-rule-strong bg-paper hover:bg-paper-dim"
                          : "border-rule bg-paper hover:bg-paper-dim"
                      }`}
                    >
                      <p className="meta-mono">Level {String(i + 1).padStart(2, "0")}</p>
                      <p className={`font-medium text-sm mt-0.5 ${active ? "text-primary" : ""}`}>{LEVEL_LABEL[lv]}</p>
                    </button>
                  );
                })}
              </div>
              {thesis ? (
                <div className="mt-4 border-l-4 border-primary bg-paper rounded-sm p-4 shadow-card">
                  <p className="meta-mono mb-1">Thesis · {LEVEL_LABEL[plan.thesis_level]}</p>
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
                    <article key={j.id} className="border border-rule bg-paper rounded-sm shadow-card overflow-hidden">
                      <header className="border-b border-rule px-3 py-2 bg-paper-dim/60 flex items-center gap-3">
                        <span className="font-mono text-ink-muted text-xs">§{String(i + 1).padStart(2, "0")}</span>
                        <h4 className="text-sm font-medium">{j.job_title}</h4>
                      </header>
                      <div className="p-3 grid gap-2 text-sm">
                        <Row label="Hard Times" accent="hard-times">{j.text1_prompt}</Row>
                        <Row label="Atonement" accent="atonement">{j.text2_prompt}</Row>
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
                  const dot = src === "Hard Times" ? "bg-hard-times" : src === "Atonement" ? "bg-atonement" : "bg-primary-soft";
                  return (
                    <div key={src} className="mb-3">
                      <p className="label-eyebrow mb-1.5 flex items-center gap-2">
                        <span className={`inline-block size-2 rounded-full ${dot}`} style={src === "Comparative" ? { backgroundColor: "hsl(var(--primary-soft))" } : undefined} />
                        {src}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {items.map((qm) => {
                          const sel = plan.selected_quote_ids.includes(qm.id);
                          return (
                            <button
                              key={qm.id}
                              onClick={() => toggleQuote(qm.id)}
                              title={qm.method}
                              className={`text-left px-2.5 py-1.5 text-xs border rounded-sm max-w-full transition-colors ${
                                sel ? "border-primary bg-highlight" : "border-rule bg-paper hover:border-rule-strong"
                              }`}
                            >
                              <span className="font-serif italic">"{qm.quote_text}"</span>
                              <span className="text-ink-muted font-mono"> — {qm.method}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected quotes tray — live */}
              {plan.selected_quote_ids.length > 0 && (
                <div className="mt-5 border border-primary/40 bg-highlight/40 rounded-sm p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="label-eyebrow">Selected quotes ({plan.selected_quote_ids.length})</p>
                    <button
                      onClick={() => update({ selected_quote_ids: [] })}
                      className="meta-mono hover:text-primary"
                    >
                      Clear all
                    </button>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {QUOTE_METHODS.filter((qm) => plan.selected_quote_ids.includes(qm.id)).map((qm) => (
                      <li key={qm.id} className="flex items-start justify-between gap-2 text-xs">
                        <span className="min-w-0">
                          <span className="meta-mono mr-1.5">
                            {qm.source_text === "Hard Times" ? "HT" : qm.source_text === "Atonement" ? "AT" : "CMP"}
                          </span>
                          <span className="font-serif italic">"{qm.quote_text}"</span>
                          <span className="text-ink-muted"> — {qm.method}</span>
                        </span>
                        <button
                          onClick={() => toggleQuote(qm.id)}
                          aria-label="Remove quote"
                          className="shrink-0 text-ink-muted hover:text-primary px-1"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          )}

          {/* 5. AO5 — collapsed by default, secondary */}
          {plan.route_id && (
            <Section eyebrow="05" title="AO5 critical tensions">
              <details className="group" open={plan.ao5_enabled}>
                <summary className="flex items-center gap-2 cursor-pointer text-sm text-ink-muted hover:text-ink list-none">
                  <span className="meta-mono">Optional</span>
                  <span>+ Add a critical tension (max 3)</span>
                </summary>
                <div className="mt-3">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={plan.ao5_enabled}
                      onChange={(e) => update({ ao5_enabled: e.target.checked, selected_ao5_ids: e.target.checked ? plan.selected_ao5_ids : [] })}
                      className="size-4 accent-primary"
                    />
                    Include AO5 in this plan
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
                            className={`text-left p-3 bg-paper border rounded-sm text-sm transition-colors ${
                              sel ? "border-primary bg-highlight/40 shadow-card" : "border-rule hover:border-rule-strong"
                            }`}
                          >
                            <p className="font-medium">{a.focus}</p>
                            <p className="text-xs text-ink-muted mt-1 leading-relaxed">{a.safe_stem}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </details>
            </Section>
          )}

          {/* 6. Save / Export / Timed */}
          {plan.route_id && (
            <Section eyebrow="06" title="Save & continue">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/timed")}
                  className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-sm shadow-card hover:bg-primary/90 transition-colors"
                >
                  Start timed writing →
                </button>
                <button onClick={handleSave} className="px-4 py-2 border border-rule-strong text-sm font-medium bg-paper rounded-sm hover:bg-paper-dim">
                  Save plan
                </button>
                <button onClick={handleCopy} className="px-4 py-2 border border-rule-strong text-sm font-medium bg-paper rounded-sm hover:bg-paper-dim">
                  Copy as text
                </button>
                <button onClick={handlePrint} className="px-4 py-2 border border-rule-strong text-sm font-medium bg-paper rounded-sm hover:bg-paper-dim">
                  Print
                </button>
              </div>
              <p className="text-xs text-ink-muted mt-3">
                Need a quote? <Link to="/toolkit" className="underline">Open the retrieval toolkit</Link>.
              </p>
            </Section>
          )}
          <DebugFooter
            family={plan.family}
            route_id={plan.route_id}
            level={plan.thesis_level}
            thesis_id={thesis?.id}
            jobs_count={paragraphJobs.length}
            quotes_count={quoteGroups["Hard Times"].length + quoteGroups["Atonement"].length + quoteGroups["Comparative"].length}
          />
        </div>
      </section>

      {/* RIGHT: LIVE OUTPUT */}
      <aside className="lg:w-[42%] xl:w-[45%] bg-white print:bg-white">
        <LiveOutput />
      </aside>
    </div>
  );
}

function DebugFooter(props: {
  family?: string; route_id?: string; level?: string; thesis_id?: string;
  jobs_count: number; quotes_count: number;
}) {
  const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");
  if (!debug) return null;
  return (
    <pre className="mt-8 p-3 border border-rule rounded-sm bg-paper-dim/40 text-[10px] font-mono text-ink-muted whitespace-pre-wrap leading-relaxed no-print">
{`[debug]
family       : ${props.family ?? "—"}
route_id     : ${props.route_id ?? "—"}
thesis_level : ${props.level ?? "—"}
thesis_id    : ${props.thesis_id ?? "(none)"}
jobs_count   : ${props.jobs_count}
quotes_count : ${props.quotes_count}`}
    </pre>
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

function Row({ label, children, accent }: { label: string; children: React.ReactNode; accent?: "hard-times" | "atonement" }) {
  const dot = accent === "hard-times" ? "bg-hard-times" : accent === "atonement" ? "bg-atonement" : "";
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 w-24 label-eyebrow pt-0.5 flex items-center gap-1.5">
        {accent && <span className={`inline-block size-1.5 rounded-full ${dot}`} />}
        {label}
      </span>
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
  const jobs = resolveParagraphJobs(plan.family, plan.route_id, t);
  const quotes = QUOTE_METHODS.filter((qm) => plan.selected_quote_ids.includes(qm.id));
  const ao5s = AO5_TENSIONS.filter((a) => plan.selected_ao5_ids.includes(a.id));

  const empty = !q && !r && !t;

  return (
    <div className="h-full overflow-y-auto px-6 lg:px-12 py-10 lg:py-16 bg-paper">
      <article className="max-w-[60ch] mx-auto flex flex-col gap-8 print:gap-6">
        <header className="border-b border-rule-strong pb-6">
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
            <p className="font-serif text-base leading-relaxed bg-paper-dim/50 border-l-4 border-primary p-4 rounded-sm">{t.thesis_text}</p>
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
