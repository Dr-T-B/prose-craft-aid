import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  QUESTION_FAMILY_LABELS,
  type QuestionFamily, type Level, type QuoteMethod, type AO5Tension,
} from "@/data/seed";
import QuotePicker from "@/components/QuotePicker";
import { useCurrentPlan, savePlan, consumeQueuedQuote, consumeQueuedFamily, type EssayPlan } from "@/lib/planStore";
import {
  consumeQueuedBuilderHandoffs,
  mergeBuilderHandoffsIntoPlan,
  removeBuilderHandoff,
  type BuilderHandoffItem,
} from "@/lib/builderHandoff";
import { persistPlan } from "@/lib/persistence";
import { useContent } from "@/lib/ContentProvider";
import {
  findThesis, resolveParagraphJobs, findQuotesForFamily, groupQuotesBySource,
  findAO5, getQuestion, getRoute, renderPlanText,
} from "@/lib/planLogic";
import { useGradeBMode } from "@/contexts/GradeBModeContext";
import { getHandoffGradeBHints } from "@/lib/gradeBSupport";
import ParagraphEngine from "@/components/ParagraphEngine";
import { LocalOnlyNotice } from "@/components/LocalOnlyNotice";

const STEPS = ["Question", "Route", "Thesis", "Paragraphs", "AO5", "Save / Export"] as const;
const LEVELS: Level[] = ["secure", "strong", "top_band"];
const LEVEL_LABEL: Record<Level, string> = { secure: "Secure", strong: "Strong", top_band: "Top-band" };

const LEVEL_BAND_LABEL: Record<string, string> = { secure: "Secure", strong: "Strong", top_band: "A*" };

export default function EssayBuilder() {
  const { plan, update } = useCurrentPlan();
  const { gradeBMode } = useGradeBMode();
  const navigate = useNavigate();

  const content = useContent();
  const QUESTIONS = content.questions;
  const ROUTES = content.routes;
  const QUOTE_METHODS = content.quote_methods;
  const [saving, setSaving] = useState(false);

  // REQ-P3: Comparative pairing selection
  const [selectedPairingId, setSelectedPairingId] = useState<string | null>(null);

  // REQ-P2: Per-paragraph quote / AO5 state (indices 0–2)
  const [activeParaIdx, setActiveParaIdx] = useState(0);
  const [paraHtIds, setParaHtIds] = useState<(string | null)[]>([null, null, null]);
  const [paraAtIds, setParaAtIds] = useState<(string | null)[]>([null, null, null]);
  const [paraAo5Ids, setParaAo5Ids] = useState<(string | null)[]>([null, null, null]);

  // Explore handoffs now live on the current plan before navigation. Consume
  // the legacy transport queue only if an older in-flight item is still present.
  useEffect(() => {
    const queuedHandoffs = consumeQueuedBuilderHandoffs();
    if (queuedHandoffs.length > 0) {
      update(mergeBuilderHandoffsIntoPlan(plan, queuedHandoffs) as Partial<EssayPlan>);
      toast.success(`${queuedHandoffs.length} Explore item${queuedHandoffs.length === 1 ? "" : "s"} imported`);
      return;
    }

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

  // REQ-P3: Comparative pairings filtered by question family, grouped by level_band
  const pairings = useMemo(() => {
    if (!plan.family) return [];
    return content.comparative_matrix
      .filter((cm) => Array.isArray(cm.themes) && (cm.themes as string[]).includes(plan.family!))
      .sort((a, b) => {
        const order: Record<string, number> = { secure: 0, strong: 1, top_band: 2 };
        return (order[a.level_band ?? "secure"] ?? 0) - (order[b.level_band ?? "secure"] ?? 0);
      });
  }, [plan.family, content.comparative_matrix]);

  const pairingGroups = useMemo(() => ({
    secure: pairings.filter((p) => !p.level_band || p.level_band === "secure"),
    strong: pairings.filter((p) => p.level_band === "strong"),
    top_band: pairings.filter((p) => p.level_band === "top_band"),
  }), [pairings]);

  const selectedPairing = useMemo(
    () => pairings.find((p) => p.id === selectedPairingId) ?? pairingGroups.secure[0] ?? null,
    [pairings, selectedPairingId, pairingGroups],
  );

  const families = useMemo(
    () => Array.from(new Set(QUESTIONS.map((q) => q.family))) as QuestionFamily[],
    [QUESTIONS]
  );
  // Cap stems shown per family so bulk-imported question banks stay scannable.
  const STEM_CAP = 8;
  const stemsAll = useMemo(
    () => (plan.family ? QUESTIONS.filter((q) => q.family === plan.family) : []),
    [plan.family, QUESTIONS]
  );
  const [showAllStems, setShowAllStems] = useState(false);
  const stems = showAllStems ? stemsAll : stemsAll.slice(0, STEM_CAP);
  const question = getQuestion(plan.question_id, content);
  const primaryRoute = question ? getRoute(question.primary_route_id, content) : undefined;
  const secondaryRoute = question ? getRoute(question.secondary_route_id, content) : undefined;
  const route = getRoute(plan.route_id, content);
  const thesis = findThesis(plan.route_id, plan.family, plan.thesis_level, content);
  const paragraphJobs = resolveParagraphJobs(plan.family, plan.route_id, thesis, content);
  const quoteGroups = groupQuotesBySource(findQuotesForFamily(plan.family, content));
  const ao5s = findAO5(plan.family, content);

  // Step progress
  const stepIdx = (() => {
    if (!plan.family || !plan.question_id) return 0;
    if (!plan.route_id) return 1;
    if (!plan.thesis_level) return 2;
    if (paragraphJobs.length === 0) return 3;
    if (!plan.ao5_enabled && plan.selected_quote_ids.length === 0) return 3;
    return 5;
  })();

  const setFamily = (f: QuestionFamily) => { setShowAllStems(false); update({ family: f, question_id: undefined, route_id: undefined }); };
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

  // REQ-P2: Per-paragraph quote selection handlers
  const handleHtSelect = (idx: number) => (quote: QuoteMethod) => {
    const current = paraHtIds[idx];
    const newId = current === quote.id ? null : quote.id;
    setParaHtIds((prev) => { const n = [...prev]; n[idx] = newId; return n; });
    if (newId && !plan.selected_quote_ids.includes(newId)) {
      update({ selected_quote_ids: [...plan.selected_quote_ids, newId] });
    }
  };

  const handleAtSelect = (idx: number) => (quote: QuoteMethod) => {
    const current = paraAtIds[idx];
    const newId = current === quote.id ? null : quote.id;
    setParaAtIds((prev) => { const n = [...prev]; n[idx] = newId; return n; });
    if (newId && !plan.selected_quote_ids.includes(newId)) {
      update({ selected_quote_ids: [...plan.selected_quote_ids, newId] });
    }
  };

  const handleParaAo5Select = (idx: number, ao5: AO5Tension) => {
    const current = paraAo5Ids[idx];
    const newId = current === ao5.id ? null : ao5.id;
    setParaAo5Ids((prev) => { const n = [...prev]; n[idx] = newId; return n; });
    if (newId && !plan.selected_ao5_ids.includes(newId)) {
      update({ ao5_enabled: true, selected_ao5_ids: [...plan.selected_ao5_ids, newId].slice(0, 3) });
    }
  };

  // REQ-P4: Start timed essay — save plan then navigate with plan_id
  const handleStartTimed = async () => {
    if (!plan.question_id) { toast.error("Pick a question first"); return; }
    setSaving(true);
    const stamped = { ...plan, thesis_id: thesis?.id };
    savePlan(stamped);
    const res = await persistPlan(stamped, question?.stem);
    setSaving(false);
    const planId = res.remoteId ?? plan.id;
    navigate(`/timed?plan_id=${encodeURIComponent(planId)}`);
  };

  const handleSave = async () => {
    if (!plan.question_id) { toast.error("Pick a question first"); return; }
    setSaving(true);
    const stamped = { ...plan, thesis_id: thesis?.id };
    savePlan(stamped);
    const res = await persistPlan(stamped, question?.stem);
    setSaving(false);
    if (res.ok) {
      toast.success("Saved to your account", {
        description: (plan.builder_handoffs?.length ?? 0) > 0
          ? "Core plan saved across devices. Imported Explore notes stay on this device."
          : "You can access this plan across devices when signed in.",
      });
    } else {
      toast.success("Plan saved locally", {
        description: (plan.builder_handoffs?.length ?? 0) > 0
          ? "Imported Explore notes stay with this local plan."
          : undefined,
      });
    }
  };

  const handleCopy = async () => {
    const txt = renderPlanText({ ...plan, thesis_id: thesis?.id }, content);
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
          {(plan.builder_handoffs?.length ?? 0) > 0 && (
            <ExploreIntake
              items={plan.builder_handoffs ?? []}
              gradeBMode={gradeBMode}
              onRemove={(id) => update({ builder_handoffs: removeBuilderHandoff(plan.builder_handoffs, id) })}
              onClear={() => update({ builder_handoffs: [] })}
            />
          )}

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
                  {QUESTION_FAMILY_LABELS[f as QuestionFamily] ?? f.replace(/_/g, " ")}
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
                {!showAllStems && stemsAll.length > STEM_CAP && (
                  <button
                    onClick={() => setShowAllStems(true)}
                    className="self-start text-xs font-mono text-ink-muted hover:text-ink mt-1"
                  >
                    Show all ({stemsAll.length}) →
                  </button>
                )}
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

              {/* REQ-P3: Comparative pairings */}
              {pairings.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <p className="label-eyebrow">Comparative pairing</p>
                    {selectedPairing && (
                      <span className="text-[10px] font-mono text-ink-muted">
                        {selectedPairing.level_band ? LEVEL_BAND_LABEL[selectedPairing.level_band] : "Secure"}
                      </span>
                    )}
                  </div>

                  {/* Secure group — always visible */}
                  {pairingGroups.secure.length > 0 && (
                    <PairingGroup
                      label="Primary pairings"
                      pairings={pairingGroups.secure}
                      selectedId={selectedPairing?.id ?? null}
                      onSelect={(id) => setSelectedPairingId(id)}
                      defaultOpen
                    />
                  )}

                  {/* Strong + Top band — collapsible */}
                  {pairingGroups.strong.length > 0 && (
                    <PairingGroup
                      label="Secondary pairings"
                      pairings={pairingGroups.strong}
                      selectedId={selectedPairing?.id ?? null}
                      onSelect={(id) => setSelectedPairingId(id)}
                    />
                  )}
                  {pairingGroups.top_band.length > 0 && (
                    <PairingGroup
                      label="Advanced pairings — A*"
                      pairings={pairingGroups.top_band}
                      selectedId={selectedPairing?.id ?? null}
                      onSelect={(id) => setSelectedPairingId(id)}
                    />
                  )}

                  {/* Selected pairing detail */}
                  {selectedPairing && (
                    <div className="border border-rule bg-paper rounded-sm p-4 flex flex-col gap-2.5 mt-1">
                      <p className="font-medium text-sm">{selectedPairing.axis}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="label-eyebrow mb-1 text-[10px]">Hard Times</p>
                          <p className="text-xs text-ink leading-relaxed">{selectedPairing.hard_times}</p>
                        </div>
                        <div>
                          <p className="label-eyebrow mb-1 text-[10px]">Atonement</p>
                          <p className="text-xs text-ink leading-relaxed">{selectedPairing.atonement}</p>
                        </div>
                      </div>
                      <div className="border-t border-rule pt-2">
                        <p className="label-eyebrow mb-1 text-[10px]">The key divergence</p>
                        <p className="text-xs text-ink-muted italic leading-relaxed">{selectedPairing.divergence}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
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

          {/* 4. Paragraph engine — converts the thesis into editable cards */}
          {plan.route_id && (
            <Section eyebrow="04" title="Paragraph engine">
              {/* REQ-P2: Per-paragraph evidence selection */}
              {paragraphJobs.length > 0 && plan.question_id && (
                <div className="mb-6 flex flex-col gap-3">
                  {/* Paragraph tab strip */}
                  <div className="flex gap-1 border-b border-rule pb-1">
                    {paragraphJobs.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveParaIdx(i)}
                        className={`px-3 py-1 text-xs font-mono rounded-t-sm transition-colors ${
                          activeParaIdx === i
                            ? "border border-b-paper border-rule bg-paper text-ink"
                            : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        §{i + 1}
                      </button>
                    ))}
                    <span className="ml-auto text-[10px] font-mono text-ink-muted self-center">
                      Para {activeParaIdx + 1} of {paragraphJobs.length}
                    </span>
                  </div>

                  {/* Active paragraph content */}
                  {paragraphJobs[activeParaIdx] && (
                    <ParaEvidencePanel
                      job={paragraphJobs[activeParaIdx]}
                      paraIdx={activeParaIdx}
                      questionId={plan.question_id}
                      family={plan.family}
                      ao5s={ao5s}
                      htQuoteId={paraHtIds[activeParaIdx]}
                      atQuoteId={paraAtIds[activeParaIdx]}
                      ao5Id={paraAo5Ids[activeParaIdx]}
                      ao5Enabled={plan.ao5_enabled}
                      usedHtIds={paraHtIds.filter((id, i) => id && i !== activeParaIdx) as string[]}
                      usedAtIds={paraAtIds.filter((id, i) => id && i !== activeParaIdx) as string[]}
                      onHtSelect={handleHtSelect(activeParaIdx)}
                      onAtSelect={handleAtSelect(activeParaIdx)}
                      onAo5Select={(ao5) => handleParaAo5Select(activeParaIdx, ao5)}
                    />
                  )}
                </div>
              )}

              <ParagraphEngine embedded />
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

          {/* 6. Save / Export */}
          {plan.route_id && (
            <Section eyebrow="06" title="Save & continue">
              <LocalOnlyNotice className="mb-3" />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-sm shadow-card hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save plan"}
                </button>
                {/* REQ-P4: Start timed essay handoff */}
                <button
                  onClick={handleStartTimed}
                  disabled={saving || !plan.question_id}
                  className="px-5 py-2.5 bg-paper border border-rule-strong text-sm font-medium rounded-sm hover:bg-paper-dim transition-colors disabled:opacity-50"
                  title={!plan.question_id ? "Pick a question first" : undefined}
                >
                  Start timed essay →
                </button>
                <Link
                  to="/paragraph-engine"
                  className="px-4 py-2 border border-rule-strong text-sm font-medium bg-paper rounded-sm hover:bg-paper-dim"
                >
                  Open Paragraph Engine →
                </Link>
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
              <details className="mt-4 border border-dashed border-rule rounded-sm bg-paper-dim/30 group max-w-prose">
                <summary className="cursor-pointer list-none px-3 py-2 flex items-center justify-between text-xs text-ink-muted hover:text-ink">
                  <span className="flex items-center gap-2">
                    <span className="meta-mono text-[10px] uppercase tracking-wider">Later phase</span>
                    <span>Timed writing mode</span>
                  </span>
                  <span className="meta-mono text-[10px] group-open:rotate-90 transition-transform">›</span>
                </summary>
                <div className="px-3 pb-3 pt-1 text-xs text-ink-muted leading-relaxed border-t border-rule">
                  v1 of the Essay Builder is untimed by design — the priority is a calm, structured planning experience. Timers, session tracking, and exam simulation will be added in a later phase, once the construction workflow is verified end-to-end.
                </div>
              </details>
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
        <LiveOutput plan={plan} />
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

function ExploreIntake({
  items,
  gradeBMode,
  onRemove,
  onClear,
}: {
  items: BuilderHandoffItem[];
  gradeBMode: boolean;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, BuilderHandoffItem[]>();
    items.forEach((item) => {
      const list = map.get(item.label) ?? [];
      list.push(item);
      map.set(item.label, list);
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <Section eyebrow="Explore" title="Imported from Explore">
      <div className="border border-rule bg-paper rounded-sm shadow-card p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="text-sm text-ink-muted leading-relaxed space-y-1">
            <p>These items are attached to the current plan and can guide your choices below.</p>
            <p className="text-xs">They stay with this device&apos;s current plan and local saved plans; remote saved plans keep the core plan only.</p>
          </div>
          <button
            onClick={onClear}
            className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink"
          >
            Clear
          </button>
        </div>

        <div className="space-y-3">
          {groups.map(([label, group]) => (
            <div key={label}>
              <p className="label-eyebrow mb-1">{label}</p>
              <div className="space-y-1.5">
                {group.map((item) => (
                  <div key={item.id} className="border border-rule bg-paper-dim/35 rounded-sm px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">{item.title}</p>
                        <p className="text-xs text-ink-muted leading-relaxed mt-0.5 line-clamp-2">{item.text}</p>
                        {(item.sourceText || item.routeLabel) && (
                          <p className="meta-mono mt-1 text-ink-muted">
                            {[item.sourceText, item.routeLabel].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {gradeBMode && getHandoffGradeBHints(item).length > 0 && (
                          <ul className="mt-2 space-y-1 border-t border-rule pt-2">
                            {getHandoffGradeBHints(item).map((hint, index) => (
                              <li key={`${item.id}-hint-${index}`} className="text-xs text-ink-muted leading-relaxed">
                                <span className="font-mono text-[10px] uppercase tracking-wider text-ink">Guide · </span>
                                {hint}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink"
                        aria-label={`Remove ${item.label} from Builder intake`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
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

/* ----- REQ-P3: Comparative pairing group (collapsible) ----- */
function PairingGroup({
  label,
  pairings,
  selectedId,
  onSelect,
  defaultOpen = false,
}: {
  label: string;
  pairings: { id: string; axis: string; level_band?: string | null }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-mono text-ink-muted hover:text-ink py-1">
        <span>{label}</span>
        <span className="group-open:rotate-90 transition-transform text-rule">›</span>
      </summary>
      <div className="mt-1.5 flex flex-col gap-1">
        {pairings.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`text-left px-3 py-2 border rounded-sm text-xs transition-colors ${
              selectedId === p.id
                ? "border-primary bg-highlight/30 text-ink"
                : "border-rule bg-paper hover:border-rule-strong text-ink-muted hover:text-ink"
            }`}
          >
            {p.axis}
          </button>
        ))}
      </div>
    </details>
  );
}

/* ----- REQ-P2: Per-paragraph evidence panel ----- */
function ParaEvidencePanel({
  job,
  paraIdx,
  questionId,
  family,
  ao5s,
  htQuoteId,
  atQuoteId,
  ao5Id,
  ao5Enabled,
  usedHtIds,
  usedAtIds,
  onHtSelect,
  onAtSelect,
  onAo5Select,
}: {
  job: { id: string; job_title: string; text1_prompt: string; text2_prompt: string; divergence_prompt: string; judgement_prompt: string };
  paraIdx: number;
  questionId: string;
  family?: string;
  ao5s: AO5Tension[];
  htQuoteId: string | null;
  atQuoteId: string | null;
  ao5Id: string | null;
  ao5Enabled: boolean;
  usedHtIds: string[];
  usedAtIds: string[];
  onHtSelect: (q: QuoteMethod) => void;
  onAtSelect: (q: QuoteMethod) => void;
  onAo5Select: (a: AO5Tension) => void;
}) {
  const themes = family ? [family] : [];

  return (
    <div className="border border-rule rounded-sm bg-paper-dim/30 flex flex-col divide-y divide-rule">
      <div className="px-4 py-3">
        <p className="font-medium text-sm">{job.job_title}</p>
      </div>

      {/* HT evidence */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <p className="label-eyebrow text-[10px]">Hard Times · evidence</p>
        <p className="text-xs text-ink-muted leading-relaxed italic">{job.text1_prompt}</p>
        <QuotePicker
          questionId={questionId}
          routeThemes={themes}
          sourceText="Hard Times"
          selectedQuoteId={htQuoteId}
          onSelect={onHtSelect}
          excludeQuoteIds={usedHtIds}
        />
      </div>

      {/* AT evidence */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <p className="label-eyebrow text-[10px]">Atonement · evidence</p>
        <p className="text-xs text-ink-muted leading-relaxed italic">{job.text2_prompt}</p>
        <QuotePicker
          questionId={questionId}
          routeThemes={themes}
          sourceText="Atonement"
          selectedQuoteId={atQuoteId}
          onSelect={onAtSelect}
          excludeQuoteIds={usedAtIds}
        />
      </div>

      {/* Comparative pivot + mini-judgement */}
      <div className="px-4 py-3 flex flex-col gap-1.5">
        <p className="label-eyebrow text-[10px]">Comparative pivot</p>
        <p className="text-xs text-ink-muted leading-relaxed italic">{job.divergence_prompt}</p>
        <p className="label-eyebrow text-[10px] mt-1">Mini-judgement</p>
        <p className="text-xs text-ink-muted leading-relaxed italic">{job.judgement_prompt}</p>
      </div>

      {/* AO5 (shown when ao5_enabled on the plan) */}
      {ao5Enabled && ao5s.length > 0 && (
        <div className="px-4 py-3 flex flex-col gap-2">
          <p className="label-eyebrow text-[10px]">AO5 — §{paraIdx + 1}</p>
          <div className="flex flex-col gap-1">
            {ao5s.map((a) => (
              <button
                key={a.id}
                onClick={() => onAo5Select(a)}
                className={`text-left px-3 py-2 border rounded-sm text-xs transition-colors ${
                  ao5Id === a.id
                    ? "border-primary bg-highlight/30 text-ink"
                    : "border-rule bg-paper hover:border-rule-strong text-ink-muted hover:text-ink"
                }`}
              >
                <p className="font-medium">{a.focus}</p>
                <p className="text-ink-muted mt-0.5 line-clamp-1">{a.dominant_reading}</p>
              </button>
            ))}
          </div>
          {ao5Id && ao5s.find((a) => a.id === ao5Id) && (
            <p className="text-xs border border-rule rounded-sm px-3 py-2 bg-paper italic leading-relaxed">
              {ao5s.find((a) => a.id === ao5Id)!.safe_stem}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ----- LIVE OUTPUT (separate component for clarity) ----- */
function LiveOutput({ plan }: { plan: EssayPlan }) {
  const content = useContent();
  const q = getQuestion(plan.question_id, content);
  const r = getRoute(plan.route_id, content);
  const t = findThesis(plan.route_id, plan.family, plan.thesis_level, content);
  const jobs = resolveParagraphJobs(plan.family, plan.route_id, t, content);
  const quotes = content.quote_methods.filter((qm) => plan.selected_quote_ids.includes(qm.id));
  const ao5s = content.ao5_tensions.filter((a) => plan.selected_ao5_ids.includes(a.id));

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
