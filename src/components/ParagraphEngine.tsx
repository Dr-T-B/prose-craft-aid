// Paragraph Engine — converts a selected thesis into 3-5 editable, structured
// comparative paragraph cards. Self-contained: mounted both as a standalone
// page (/paragraph-engine) and embedded inside the Essay Builder paragraph
// step. Reads from useCurrentPlan and writes paragraph_cards back through it.
//
// Calm academic style. Desktop-first. No new visible chrome unless needed.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useBlocker } from "react-router-dom";
import { toast } from "sonner";
import { useContent } from "@/lib/ContentProvider";
import {
  useCurrentPlan,
  savePlan,
  type ParagraphCard,
} from "@/lib/planStore";
import { persistPlan } from "@/lib/persistence";
import {
  findThesis,
  getQuestion,
  getRoute,
} from "@/lib/planLogic";
import {
  seedParagraphCards,
  assessCoverage,
  comparisonGuardrail,
} from "@/lib/paragraphEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowDown,
  ArrowUp,
  Copy as CopyIcon,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

interface Props {
  /** When true, omits the page-level outer chrome (used inside Essay Builder). */
  embedded?: boolean;
}

export default function ParagraphEngine({ embedded = false }: Props) {
  const { plan, update } = useCurrentPlan();
  const content = useContent();
  const question = getQuestion(plan.question_id, content);
  const route = getRoute(plan.route_id, content);
  const thesis = findThesis(plan.route_id, plan.family, plan.thesis_level, content);

  const [count, setCount] = useState<3 | 4 | 5>(3);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /** Fingerprint of paragraph_cards as last persisted. Compared against the
   *  current cards fingerprint to derive dirty state. Initialised to the
   *  current value so a fresh load is never falsely "dirty". */
  const [savedFingerprint, setSavedFingerprint] = useState<string>(() =>
    fingerprint(plan.paragraph_cards),
  );
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const cards = plan.paragraph_cards ?? [];
  const ready = Boolean(plan.family && plan.route_id);
  const currentFingerprint = useMemo(() => fingerprint(cards), [cards]);
  const isDirty = currentFingerprint !== savedFingerprint;

  // Auto-seed on first entry when ready and empty. Treat the seeded cards as
  // the new "saved" baseline so initial seeding doesn't mark the plan dirty.
  const didSeedRef = useRef(false);
  useEffect(() => {
    if (!ready || cards.length > 0 || didSeedRef.current) return;
    const seeded = seedParagraphCards({
      family: plan.family,
      route_id: plan.route_id,
      thesis,
      bundle: content,
      count,
    });
    if (seeded.length) {
      didSeedRef.current = true;
      update({ paragraph_cards: seeded });
      setActiveId(seeded[0].id);
      setSavedFingerprint(fingerprint(seeded));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Keep activeId valid as cards change.
  useEffect(() => {
    if (cards.length === 0) {
      setActiveId(null);
    } else if (!cards.find((c) => c.id === activeId)) {
      setActiveId(cards[0].id);
    }
  }, [cards, activeId]);

  const activeCard = cards.find((c) => c.id === activeId) ?? null;

  /* --------- card mutations --------- */
  const setCards = (next: ParagraphCard[]) => update({ paragraph_cards: next });

  const patchCard = (id: string, patch: Partial<ParagraphCard>) =>
    setCards(cards.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const moveCard = (id: string, dir: -1 | 1) => {
    const idx = cards.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= cards.length) return;
    const next = [...cards];
    [next[idx], next[target]] = [next[target], next[idx]];
    setCards(next);
  };

  const removeCard = (id: string) => setCards(cards.filter((c) => c.id !== id));

  const duplicateCard = (id: string) => {
    const idx = cards.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const original = cards[idx];
    const copy: ParagraphCard = {
      ...original,
      id: `card_dup_${Date.now()}`,
      title: `${original.title} (copy)`,
    };
    const next = [...cards];
    next.splice(idx + 1, 0, copy);
    setCards(next);
    setActiveId(copy.id);
  };

  const addBlankCard = () => {
    const blank: ParagraphCard = {
      id: `card_blank_${Date.now()}`,
      title: `§${String(cards.length + 1).padStart(2, "0")} · New paragraph`,
      claim: "",
      comparative_direction: "",
      evidence_ht_ids: [],
      evidence_at_ids: [],
      evidence_cmp_ids: [],
      method_focus: "",
      context_anchor: "",
      ao5_prompt: "",
      notes: "",
    };
    setCards([...cards, blank]);
    setActiveId(blank.id);
  };

  const reseed = () => {
    if (!ready) return;
    const seeded = seedParagraphCards({
      family: plan.family,
      route_id: plan.route_id,
      thesis,
      bundle: content,
      count,
    });
    setCards(seeded);
    if (seeded[0]) setActiveId(seeded[0].id);
    toast.success(`Re-seeded ${seeded.length} cards from thesis`);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const stamped = { ...plan, thesis_id: thesis?.id };
    savePlan(stamped);
    const res = await persistPlan(stamped, question?.stem);
    setSaving(false);
    // Mark the just-saved cards as the new clean baseline.
    setSavedFingerprint(fingerprint(stamped.paragraph_cards));
    setLastSavedAt(Date.now());
    toast.success(res.ok ? "Plan saved" : "Plan saved locally");
  };

  // Warn on tab close / refresh while there are unsaved card edits.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Block in-app navigation while dirty; ask for confirmation.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    const ok = window.confirm(
      "You have unsaved paragraph edits. Leave without saving?",
    );
    if (ok) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  /* --------- render --------- */

  if (!ready) {
    return (
      <EmptyState embedded={embedded} />
    );
  }

  const Wrapper = embedded ? EmbeddedWrapper : PageWrapper;

  return (
    <Wrapper question={question?.stem} thesisText={thesis?.thesis_text} routeName={route?.name}>
      {/* Context bar */}
      <header className="border-b border-rule pb-4 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <p className="label-eyebrow mb-1">Thesis context</p>
            {question && (
              <p className="font-serif text-base leading-snug text-ink mb-1.5">
                {question.stem}
              </p>
            )}
            {thesis ? (
              <p className="text-sm text-ink-muted leading-relaxed border-l-2 border-primary/60 pl-3">
                {thesis.thesis_text}
              </p>
            ) : (
              <p className="text-sm text-ink-muted italic">
                No thesis selected — paragraph seeds will use the route's family fallback.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <p className="label-eyebrow">Paragraph count</p>
            <div className="flex gap-1">
              {([3, 4, 5] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-sm border transition-colors ${
                    count === n
                      ? "border-primary bg-highlight text-ink"
                      : "border-rule bg-paper hover:border-rule-strong"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={reseed}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono border border-rule rounded-sm hover:border-rule-strong hover:bg-paper-dim text-ink-muted hover:text-ink"
              title="Re-seed all cards from current thesis"
            >
              <RefreshCw className="size-3" />
              Re-seed
            </button>
          </div>
        </div>
      </header>

      {/* Two-column workspace */}
      <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
        {/* LEFT: card list */}
        <section className="flex flex-col gap-4">
          {cards.map((card, i) => (
            <CardEditor
              key={card.id}
              card={card}
              index={i}
              total={cards.length}
              isActive={card.id === activeId}
              onSelect={() => setActiveId(card.id)}
              onPatch={(patch) => patchCard(card.id, patch)}
              onMove={(dir) => moveCard(card.id, dir)}
              onRemove={() => removeCard(card.id)}
              onDuplicate={() => duplicateCard(card.id)}
            />
          ))}
          <button
            onClick={addBlankCard}
            className="inline-flex items-center justify-center gap-2 py-3 border border-dashed border-rule-strong rounded-sm text-sm text-ink-muted hover:text-ink hover:border-primary hover:bg-paper-dim/40 transition-colors"
          >
            <Plus className="size-4" />
            Add a blank paragraph card
          </button>

          <div className="flex flex-wrap items-center gap-3 mt-2 pt-4 border-t border-rule">
            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
              variant="default"
            >
              {saving ? "Saving…" : isDirty ? "Save plan" : "Saved"}
            </Button>
            <Link
              to="/timed"
              className="px-4 py-2 border border-rule-strong text-sm font-medium bg-paper rounded-sm hover:bg-paper-dim"
            >
              Continue to timed →
            </Link>
            <SaveStatus
              isDirty={isDirty}
              saving={saving}
              lastSavedAt={lastSavedAt}
            />
            <p className="text-xs text-ink-muted">
              {cards.length} card{cards.length === 1 ? "" : "s"}
            </p>
          </div>
        </section>

        {/* RIGHT: evidence detail */}
        <aside className="lg:sticky lg:top-24 self-start">
          {activeCard ? (
            <EvidencePanel
              card={activeCard}
              onPatch={(patch) => patchCard(activeCard.id, patch)}
            />
          ) : (
            <div className="border border-rule rounded-sm p-6 bg-paper-dim/40 text-sm text-ink-muted">
              Select a card to see evidence suggestions, method tags, and AO5 prompts.
            </div>
          )}
        </aside>
      </div>
    </Wrapper>
  );
}

/* ============================== sub-components ============================ */

function EmptyState({ embedded }: { embedded: boolean }) {
  const Wrapper = embedded ? EmbeddedWrapper : PageWrapper;
  return (
    <Wrapper>
      <div className="border border-rule rounded-sm p-8 bg-paper text-center">
        <p className="label-eyebrow mb-2">Paragraph engine</p>
        <h2 className="font-serif text-xl mb-2">Pick a question, route, and thesis first</h2>
        <p className="text-sm text-ink-muted mb-4 max-w-prose mx-auto">
          The Paragraph Engine reads from your selected thesis to seed comparative paragraph cards. Open the Essay Builder, choose a question family, route, and thesis level, then return here.
        </p>
        <Link
          to="/builder"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:bg-primary/90"
        >
          Open Essay Builder →
        </Link>
      </div>
    </Wrapper>
  );
}

function PageWrapper({
  children,
  question,
  thesisText,
  routeName,
}: {
  children: React.ReactNode;
  question?: string;
  thesisText?: string;
  routeName?: string;
}) {
  return (
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8">
      <div className="mb-6">
        <p className="label-eyebrow">Component 2 prose</p>
        <h1 className="font-serif text-2xl lg:text-3xl mt-1">Paragraph Engine</h1>
        <p className="text-sm text-ink-muted mt-1.5 max-w-prose">
          Convert your thesis into editable comparative paragraph cards. Each card carries a claim, a comparative direction, evidence, method focus, context anchor, and an optional AO5 prompt.
        </p>
        {(question || thesisText || routeName) && (
          <span className="sr-only">Working from: {question} · {routeName} · {thesisText}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function EmbeddedWrapper({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

/* ------------ card editor ------------ */

function CardEditor({
  card,
  index,
  total,
  isActive,
  onSelect,
  onPatch,
  onMove,
  onRemove,
  onDuplicate,
}: {
  card: ParagraphCard;
  index: number;
  total: number;
  isActive: boolean;
  onSelect: () => void;
  onPatch: (patch: Partial<ParagraphCard>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const coverage = useMemo(() => assessCoverage(card), [card]);
  const guardrail = useMemo(() => comparisonGuardrail(card), [card]);

  return (
    <article
      onClick={onSelect}
      className={`border rounded-sm bg-paper transition-all cursor-pointer ${
        isActive
          ? "border-primary shadow-card"
          : "border-rule hover:border-rule-strong"
      }`}
    >
      <header className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-rule bg-paper-dim/40">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="meta-mono text-ink-muted shrink-0">
            §{String(index + 1).padStart(2, "0")}
          </span>
          <Input
            value={card.title}
            onChange={(e) => onPatch({ title: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="h-7 text-sm font-medium border-transparent bg-transparent px-1 hover:bg-paper focus:bg-paper"
            placeholder="Paragraph title"
          />
        </div>
        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <IconBtn label="Move up" onClick={() => onMove(-1)} disabled={index === 0}>
            <ArrowUp className="size-3.5" />
          </IconBtn>
          <IconBtn label="Move down" onClick={() => onMove(1)} disabled={index === total - 1}>
            <ArrowDown className="size-3.5" />
          </IconBtn>
          <IconBtn label="Duplicate" onClick={onDuplicate}>
            <CopyIcon className="size-3.5" />
          </IconBtn>
          <IconBtn label="Remove" onClick={onRemove}>
            <Trash2 className="size-3.5" />
          </IconBtn>
        </div>
      </header>

      <div className="p-4 grid gap-3">
        <Field label="Conceptual claim">
          <Textarea
            value={card.claim}
            onChange={(e) => onPatch({ claim: e.target.value })}
            rows={2}
            placeholder="What does this paragraph argue?"
          />
        </Field>
        <Field label="Comparative direction">
          <Textarea
            value={card.comparative_direction}
            onChange={(e) => onPatch({ comparative_direction: e.target.value })}
            rows={2}
            placeholder="Where do the texts converge or diverge here?"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Method focus">
            <Textarea
              value={card.method_focus}
              onChange={(e) => onPatch({ method_focus: e.target.value })}
              rows={2}
              placeholder="Which methods drive the analysis?"
            />
          </Field>
          <Field label="Context anchor">
            <Textarea
              value={card.context_anchor}
              onChange={(e) => onPatch({ context_anchor: e.target.value })}
              rows={2}
              placeholder="Which contextual frame supports the claim?"
            />
          </Field>
        </div>
        <Field label="AO5 prompt (optional)">
          <Textarea
            value={card.ao5_prompt}
            onChange={(e) => onPatch({ ao5_prompt: e.target.value })}
            rows={2}
            placeholder="Optional interpretive tension"
          />
        </Field>
        <Field label="Notes">
          <Textarea
            value={card.notes}
            onChange={(e) => onPatch({ notes: e.target.value })}
            rows={2}
            placeholder="Anything else you want to remember"
          />
        </Field>

        {/* Guardrail */}
        {guardrail && (
          <div className="text-xs border-l-2 border-destructive/60 pl-3 py-1 bg-destructive/5 text-ink-muted">
            <span className="meta-mono text-destructive mr-1.5">Guardrail</span>
            {guardrail}
          </div>
        )}

        {/* AO coverage strip */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-rule">
          <AOPill name="AO1" {...coverage.ao1} colorVar="--ao1" />
          <AOPill name="AO2" {...coverage.ao2} colorVar="--ao2" />
          <AOPill name="AO3" {...coverage.ao3} colorVar="--ao3" />
          <AOPill name="AO4" {...coverage.ao4} colorVar="--ao4" />
          <AOPill name="AO5" {...coverage.ao5} colorVar="--ao5" optional />
        </div>
      </div>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label-eyebrow">{label}</span>
      {children}
    </label>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="size-7 inline-flex items-center justify-center rounded-sm text-ink-muted hover:text-ink hover:bg-paper disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function AOPill({
  name,
  ok,
  note,
  colorVar,
  optional,
}: {
  name: string;
  ok: boolean;
  note: string;
  colorVar: string;
  optional?: boolean;
}) {
  const dotStyle = { backgroundColor: `hsl(var(${colorVar}))` };
  return (
    <span
      title={note}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono rounded-sm border ${
        ok
          ? "border-rule bg-paper text-ink"
          : optional
            ? "border-rule bg-paper-dim/60 text-ink-muted"
            : "border-destructive/40 bg-destructive/5 text-ink-muted"
      }`}
    >
      <span className="size-1.5 rounded-full" style={dotStyle} />
      {name}
      <span className="text-ink-muted">· {ok ? "ok" : optional ? "optional" : "needed"}</span>
    </span>
  );
}

/* ------------ evidence panel ------------ */

function EvidencePanel({
  card,
  onPatch,
}: {
  card: ParagraphCard;
  onPatch: (patch: Partial<ParagraphCard>) => void;
}) {
  const content = useContent();
  const { plan } = useCurrentPlan();
  const family = plan.family;

  // Quote pool for the family
  const pool = useMemo(() => {
    if (!family) return [];
    return content.quote_methods.filter((q) => q.best_themes.includes(family));
  }, [family, content.quote_methods]);

  const selected = useMemo(() => new Set([
    ...card.evidence_ht_ids,
    ...card.evidence_at_ids,
    ...card.evidence_cmp_ids,
  ]), [card]);

  const toggle = (qid: string, source: "Hard Times" | "Atonement" | "Comparative") => {
    if (source === "Hard Times") {
      const next = card.evidence_ht_ids.includes(qid)
        ? card.evidence_ht_ids.filter((x) => x !== qid)
        : [...card.evidence_ht_ids, qid];
      onPatch({ evidence_ht_ids: next });
    } else if (source === "Atonement") {
      const next = card.evidence_at_ids.includes(qid)
        ? card.evidence_at_ids.filter((x) => x !== qid)
        : [...card.evidence_at_ids, qid];
      onPatch({ evidence_at_ids: next });
    } else {
      const next = card.evidence_cmp_ids.includes(qid)
        ? card.evidence_cmp_ids.filter((x) => x !== qid)
        : [...card.evidence_cmp_ids, qid];
      onPatch({ evidence_cmp_ids: next });
    }
  };

  const buckets = (["Hard Times", "Atonement", "Comparative"] as const).map((src) => ({
    src,
    items: pool.filter((q) => q.source_text === src),
  }));

  return (
    <div className="border border-rule rounded-sm bg-paper">
      <header className="px-4 py-3 border-b border-rule bg-paper-dim/40">
        <p className="label-eyebrow">Evidence detail</p>
        <p className="text-sm font-medium mt-1 line-clamp-1">{card.title}</p>
      </header>

      <div className="p-4 max-h-[70vh] overflow-y-auto">
        {!family && (
          <p className="text-xs text-ink-muted italic">
            Pick a question family to see suggested evidence.
          </p>
        )}

        {family && buckets.map(({ src, items }) => {
          if (!items.length) return null;
          const dotClass =
            src === "Hard Times"
              ? "bg-hard-times"
              : src === "Atonement"
                ? "bg-atonement"
                : "";
          const dotStyle = src === "Comparative" ? { backgroundColor: "hsl(var(--primary-soft))" } : undefined;
          return (
            <div key={src} className="mb-5 last:mb-0">
              <p className="label-eyebrow mb-2 flex items-center gap-2">
                <span className={`inline-block size-2 rounded-full ${dotClass}`} style={dotStyle} />
                {src}
              </p>
              <ul className="flex flex-col gap-2">
                {items.map((qm) => {
                  const isSel = selected.has(qm.id);
                  return (
                    <li key={qm.id}>
                      <button
                        type="button"
                        onClick={() => toggle(qm.id, src)}
                        className={`w-full text-left px-3 py-2 text-xs border rounded-sm transition-colors ${
                          isSel
                            ? "border-primary bg-highlight/60"
                            : "border-rule bg-paper hover:border-rule-strong"
                        }`}
                      >
                        <p className="font-serif italic leading-snug">"{qm.quote_text}"</p>
                        <p className="text-ink-muted font-mono mt-1">
                          {qm.method}
                          {qm.best_themes.length > 0 && (
                            <span className="ml-2 text-[10px]">
                              · {qm.best_themes.slice(0, 3).join(", ")}
                            </span>
                          )}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {/* Selected evidence summary */}
        {selected.size > 0 && (
          <div className="mt-2 pt-3 border-t border-rule">
            <p className="label-eyebrow mb-2">Selected on this card ({selected.size})</p>
            <ul className="flex flex-col gap-1">
              {content.quote_methods
                .filter((q) => selected.has(q.id))
                .map((q) => (
                  <li key={q.id} className="flex items-start justify-between gap-2 text-xs">
                    <span className="min-w-0">
                      <span className="meta-mono mr-1.5">
                        {q.source_text === "Hard Times" ? "HT" : q.source_text === "Atonement" ? "AT" : "CMP"}
                      </span>
                      <span className="font-serif italic">"{q.quote_text}"</span>
                    </span>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => toggle(q.id, q.source_text)}
                      className="shrink-0 text-ink-muted hover:text-primary px-1"
                    >
                      <X className="size-3" />
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
