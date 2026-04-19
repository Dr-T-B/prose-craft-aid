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
  rankEvidenceForCard,
  recomputeSuggestions,
  type RankedEvidence,
  type CardSuggestions,
  type SuggestableField,
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

  /** Per-card set of fields the student has explicitly edited. Auto-refresh
   *  must never overwrite anything in here. Keyed by `${cardId}:${field}`. */
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());
  /** Per-card pending suggestions surfaced after an evidence swap when the
   *  field has been student-edited. Cleared when accepted/dismissed. */
  const [pendingSuggestions, setPendingSuggestions] = useState<
    Record<string, CardSuggestions>
  >({});

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

  /** Patch a card. When `markEdited` is supplied, those fields are recorded
   *  in editedFields so future auto-refresh leaves them alone. */
  const patchCard = (
    id: string,
    patch: Partial<ParagraphCard>,
    markEdited?: SuggestableField[],
  ) => {
    setCards(cards.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    if (markEdited && markEdited.length) {
      setEditedFields((prev) => {
        const next = new Set(prev);
        markEdited.forEach((f) => next.add(`${id}:${f}`));
        return next;
      });
      // If the student edits a field, drop any pending suggestion for it
      // (their version wins until they trigger another evidence swap).
      setPendingSuggestions((prev) => {
        const cur = prev[id];
        if (!cur) return prev;
        const cleaned: CardSuggestions = { ...cur };
        markEdited.forEach((f) => delete cleaned[f]);
        if (Object.keys(cleaned).length === 0) {
          const { [id]: _drop, ...rest } = prev;
          return rest;
        }
        return { ...prev, [id]: cleaned };
      });
    }
  };

  /** Toggle an evidence pick on a card, then recompute derived suggestions.
   *  Auto-applies the new value to fields the student hasn't touched, and
   *  surfaces it as a dismissible suggestion for fields they have. */
  const toggleEvidence = (
    cardId: string,
    quoteId: string,
    source: "Hard Times" | "Atonement" | "Comparative",
  ) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const key = source === "Hard Times" ? "evidence_ht_ids" : source === "Atonement" ? "evidence_at_ids" : "evidence_cmp_ids";
    const current = card[key];
    const nextIds = current.includes(quoteId)
      ? current.filter((x) => x !== quoteId)
      : [...current, quoteId];
    const nextCard: ParagraphCard = { ...card, [key]: nextIds };

    // Recompute against the post-toggle card so suggestions reflect the
    // student's latest pick.
    const fresh = recomputeSuggestions({
      card: nextCard,
      family: plan.family,
      bundle: content,
    });

    const auto: Partial<ParagraphCard> = { [key]: nextIds };
    const pending: CardSuggestions = {};
    (Object.keys(fresh) as SuggestableField[]).forEach((field) => {
      const newValue = fresh[field];
      if (!newValue) return;
      const isEdited = editedFields.has(`${cardId}:${field}`);
      const currentValue = (card[field] as string) ?? "";
      // No-op suggestions are skipped.
      if (newValue.trim() === currentValue.trim()) return;

      if (isEdited) {
        pending[field] = newValue;
      } else {
        (auto as Record<string, unknown>)[field] = newValue;
      }
    });

    setCards(cards.map((c) => (c.id === cardId ? { ...c, ...auto } : c)));
    setPendingSuggestions((prev) => {
      const cur = prev[cardId] ?? {};
      const merged: CardSuggestions = { ...cur, ...pending };
      // Drop any pending entries that now match the (possibly auto-applied)
      // current value, so stale chips don't linger.
      (Object.keys(merged) as SuggestableField[]).forEach((f) => {
        const cardAfter = { ...card, ...auto } as ParagraphCard;
        if ((merged[f] ?? "").trim() === ((cardAfter[f] as string) ?? "").trim()) {
          delete merged[f];
        }
      });
      if (Object.keys(merged).length === 0) {
        const { [cardId]: _drop, ...rest } = prev;
        return rest;
      }
      return { ...prev, [cardId]: merged };
    });
  };

  /** Accept a pending suggestion: write it to the card, mark the field as
   *  edited (so the student's intentional acceptance isn't overwritten by
   *  the next swap), and clear the pending entry. */
  const acceptSuggestion = (cardId: string, field: SuggestableField) => {
    const value = pendingSuggestions[cardId]?.[field];
    if (value === undefined) return;
    patchCard(cardId, { [field]: value } as Partial<ParagraphCard>, [field]);
  };

  const dismissSuggestion = (cardId: string, field: SuggestableField) => {
    setPendingSuggestions((prev) => {
      const cur = prev[cardId];
      if (!cur || cur[field] === undefined) return prev;
      const cleaned: CardSuggestions = { ...cur };
      delete cleaned[field];
      if (Object.keys(cleaned).length === 0) {
        const { [cardId]: _drop, ...rest } = prev;
        return rest;
      }
      return { ...prev, [cardId]: cleaned };
    });
  };

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
              suggestions={pendingSuggestions[card.id]}
              onSelect={() => setActiveId(card.id)}
              onPatch={(patch, edited) => patchCard(card.id, patch, edited)}
              onMove={(dir) => moveCard(card.id, dir)}
              onRemove={() => removeCard(card.id)}
              onDuplicate={() => duplicateCard(card.id)}
              onAcceptSuggestion={(field) => acceptSuggestion(card.id, field)}
              onDismissSuggestion={(field) => dismissSuggestion(card.id, field)}
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
              onToggle={(quoteId, source) =>
                toggleEvidence(activeCard.id, quoteId, source)
              }
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
  suggestions,
  onSelect,
  onPatch,
  onMove,
  onRemove,
  onDuplicate,
  onAcceptSuggestion,
  onDismissSuggestion,
}: {
  card: ParagraphCard;
  index: number;
  total: number;
  isActive: boolean;
  /** Pending suggestions to surface (one per suggestable field). */
  suggestions?: CardSuggestions;
  onSelect: () => void;
  /** When `edited` is supplied, those fields are flagged as
   *  student-edited and won't be auto-overwritten on later evidence swaps. */
  onPatch: (patch: Partial<ParagraphCard>, edited?: SuggestableField[]) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onAcceptSuggestion: (field: SuggestableField) => void;
  onDismissSuggestion: (field: SuggestableField) => void;
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
        {/* Claim — always student-owned, no auto-suggestion ever shown. */}
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
            onChange={(e) =>
              onPatch({ comparative_direction: e.target.value }, ["comparative_direction"])
            }
            rows={2}
            placeholder="Where do the texts converge or diverge here?"
          />
          <SuggestionChip
            value={suggestions?.comparative_direction}
            onAccept={() => onAcceptSuggestion("comparative_direction")}
            onDismiss={() => onDismissSuggestion("comparative_direction")}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Method focus">
            <Textarea
              value={card.method_focus}
              onChange={(e) => onPatch({ method_focus: e.target.value }, ["method_focus"])}
              rows={2}
              placeholder="Which methods drive the analysis?"
            />
            <SuggestionChip
              value={suggestions?.method_focus}
              onAccept={() => onAcceptSuggestion("method_focus")}
              onDismiss={() => onDismissSuggestion("method_focus")}
            />
          </Field>
          <Field label="Context anchor">
            <Textarea
              value={card.context_anchor}
              onChange={(e) =>
                onPatch({ context_anchor: e.target.value }, ["context_anchor"])
              }
              rows={2}
              placeholder="Which contextual frame supports the claim?"
            />
            <SuggestionChip
              value={suggestions?.context_anchor}
              onAccept={() => onAcceptSuggestion("context_anchor")}
              onDismiss={() => onDismissSuggestion("context_anchor")}
            />
          </Field>
        </div>

        <Field label="AO5 prompt (optional)">
          <Textarea
            value={card.ao5_prompt}
            onChange={(e) => onPatch({ ao5_prompt: e.target.value }, ["ao5_prompt"])}
            rows={2}
            placeholder="Optional interpretive tension"
          />
          <SuggestionChip
            value={suggestions?.ao5_prompt}
            onAccept={() => onAcceptSuggestion("ao5_prompt")}
            onDismiss={() => onDismissSuggestion("ao5_prompt")}
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

/** Inline suggestion chip rendered beneath a suggestable field. Renders
 *  nothing when there's no pending suggestion. Lets the student accept
 *  (write to the field) or dismiss (keep their version). */
function SuggestionChip({
  value,
  onAccept,
  onDismiss,
}: {
  value: string | undefined;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  if (!value) return null;
  return (
    <div
      className="mt-1.5 border border-primary/40 bg-highlight/40 rounded-sm px-2.5 py-1.5 text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="meta-mono text-primary">Suggested from new evidence</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onAccept}
            className="meta-mono text-primary hover:underline"
          >
            Accept
          </button>
          <span className="text-ink-muted">·</span>
          <button
            type="button"
            onClick={onDismiss}
            className="meta-mono text-ink-muted hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      </div>
      <p className="text-ink leading-snug">{value}</p>
    </div>
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

/* ------------ evidence option (ranked row) ------------ */

function EvidenceOption({
  rank,
  ranked,
  isSelected,
  onToggle,
  compact = false,
}: {
  rank: string;
  ranked: RankedEvidence;
  isSelected: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  const { quote, why } = ranked;
  const isRecommended = rank === "Recommended";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isSelected}
      className={`w-full text-left ${compact ? "px-2.5 py-1.5" : "px-3 py-2"} text-xs border rounded-sm transition-colors ${
        isSelected
          ? "border-primary bg-highlight/60"
          : isRecommended
            ? "border-rule-strong bg-paper hover:border-primary/60"
            : "border-rule bg-paper hover:border-rule-strong"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className={`meta-mono ${
            isRecommended ? "text-primary" : "text-ink-muted"
          }`}
        >
          {rank}
        </span>
        {isSelected && (
          <span className="meta-mono text-success">· selected</span>
        )}
      </div>
      <p className="font-serif italic leading-snug text-ink">
        "{quote.quote_text}"
      </p>
      <p className="text-ink-muted font-mono mt-1 text-[11px]">
        {quote.method}
      </p>
      <p className="text-ink-muted mt-1 text-[11px] leading-snug">
        {why}.
      </p>
    </button>
  );
}

/* ------------ evidence panel ------------ */

function EvidencePanel({
  card,
  onToggle,
}: {
  card: ParagraphCard;
  /** Toggling delegates to the parent so it can recompute derived
   *  suggestions (method/context/AO5/comparative direction) for the card. */
  onToggle: (quoteId: string, source: "Hard Times" | "Atonement" | "Comparative") => void;
}) {
  const content = useContent();
  const { plan } = useCurrentPlan();
  const family = plan.family;

  const selected = useMemo(() => new Set([
    ...card.evidence_ht_ids,
    ...card.evidence_at_ids,
    ...card.evidence_cmp_ids,
  ]), [card]);

  const sourceOf = (qid: string): "Hard Times" | "Atonement" | "Comparative" => {
    const q = content.quote_methods.find((x) => x.id === qid);
    return (q?.source_text as "Hard Times" | "Atonement" | "Comparative") ?? "Comparative";
  };

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

        {family && (["Hard Times", "Atonement", "Comparative"] as const).map((src) => {
          const ranked = rankEvidenceForCard(card, src, family, content, 5);
          if (!ranked.length) return null;
          const [recommended, ...alternatives] = ranked;
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

              {/* Recommended pick */}
              <EvidenceOption
                rank="Recommended"
                ranked={recommended}
                isSelected={selected.has(recommended.quote.id)}
                onToggle={() => toggle(recommended.quote.id, src)}
              />

              {/* Ranked alternatives — kept short */}
              {alternatives.length > 0 && (
                <div className="mt-2 pl-3 border-l border-rule">
                  <p className="meta-mono text-ink-muted mb-1.5">Alternatives</p>
                  <ul className="flex flex-col gap-1.5">
                    {alternatives.map((r, i) => (
                      <li key={r.quote.id}>
                        <EvidenceOption
                          rank={`#${i + 2}`}
                          ranked={r}
                          isSelected={selected.has(r.quote.id)}
                          onToggle={() => toggle(r.quote.id, src)}
                          compact
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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

/* ============================== helpers ============================ */

/** Cheap stable fingerprint of the cards array. JSON.stringify is fine here:
 *  arrays are short (<= 5 cards) and we only need equality. */
function fingerprint(cards: ParagraphCard[] | undefined): string {
  if (!cards || cards.length === 0) return "[]";
  try {
    return JSON.stringify(cards);
  } catch {
    return String(cards.length);
  }
}

/** Small status indicator next to the Save action. Shows dirty / saving /
 *  last-saved relative time. Restrained, no animation. */
function SaveStatus({
  isDirty,
  saving,
  lastSavedAt,
}: {
  isDirty: boolean;
  saving: boolean;
  lastSavedAt: number | null;
}) {
  // Re-render the relative timestamp every 30s.
  const [, force] = useState(0);
  useEffect(() => {
    if (!lastSavedAt) return;
    const t = window.setInterval(() => force((n) => n + 1), 30_000);
    return () => window.clearInterval(t);
  }, [lastSavedAt]);

  if (saving) {
    return <span className="text-xs text-ink-muted ml-auto">Saving…</span>;
  }
  if (isDirty) {
    return (
      <span className="text-xs text-ink-muted ml-auto inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden />
        Unsaved changes
      </span>
    );
  }
  if (lastSavedAt) {
    return (
      <span className="text-xs text-ink-muted ml-auto">
        Last saved {relativeTime(lastSavedAt)}
      </span>
    );
  }
  return <span className="ml-auto" />;
}

function relativeTime(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  if (diff < 45_000) return "just now";
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(ts).toLocaleString();
}
