import { useEffect, useMemo, useState } from "react";
import { useContent } from "@/lib/ContentProvider";
import { QUESTION_FAMILY_LABELS, type QuestionFamily, type SourceText, type QuoteMethod } from "@/data/seed";
import { LibraryPageHeader, SearchInput, FilterPills, EmptyState, sourceAccent, PrintButton } from "./_shared";

const SOURCES = ["All", "Hard Times", "Atonement", "Comparative"] as const;
type Src = (typeof SOURCES)[number];
const VIEWS = ["By quote", "By theme"] as const;
type View = (typeof VIEWS)[number];

const AO_COLOURS: Record<string, string> = {
  AO1: "bg-blue-50 border-blue-200 text-blue-700",
  AO2: "bg-green-50 border-green-200 text-green-700",
  AO3: "bg-amber-50 border-amber-200 text-amber-700",
};

function QuoteCard({ qm }: { qm: QuoteMethod }) {
  const hasEnriched =
    qm.plain_english_meaning ||
    (qm.opening_stems?.length ?? 0) > 0 ||
    (qm.comparative_prompts?.length ?? 0) > 0 ||
    (qm.linked_context?.length ?? 0) > 0;

  return (
    <article className={`border border-rule bg-paper rounded-sm shadow-card p-4 pl-5 ${sourceAccent(qm.source_text)}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="label-eyebrow">{qm.source_text}</span>
        <div className="flex items-center gap-1.5">
          {qm.ao_priority?.map((ao) => (
            <span
              key={ao}
              className={`text-[9px] font-mono px-1.5 py-0.5 border rounded-sm ${AO_COLOURS[ao] ?? "bg-paper-dim/60 border-rule text-ink-muted"}`}
            >
              {ao}
            </span>
          ))}
          <span className="meta-mono">{qm.level_tag.replace("_", " ")}</span>
        </div>
      </div>

      {/* Quote */}
      <p className="font-serif italic text-base leading-snug mb-3">"{qm.quote_text}"</p>

      {/* Core analysis fields */}
      <dl className="text-xs leading-relaxed space-y-1.5 mb-3">
        {qm.method && (
          <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Method · </dt><dd className="inline text-ink-muted">{qm.method}</dd></div>
        )}
        {qm.effect_prompt && (
          <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Effect · </dt><dd className="inline text-ink-muted">{qm.effect_prompt}</dd></div>
        )}
        {qm.meaning_prompt && (
          <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Meaning · </dt><dd className="inline text-ink-muted">{qm.meaning_prompt}</dd></div>
        )}
        {qm.speaker_or_narrator && (
          <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Speaker · </dt><dd className="inline text-ink-muted">{qm.speaker_or_narrator}</dd></div>
        )}
      </dl>

      {/* Enriched collapsible sections */}
      {hasEnriched && (
        <div className="space-y-1 mb-3 border-t border-rule pt-2">
          {qm.plain_english_meaning && (
            <details className="group/det">
              <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink">
                <span className="group-open/det:hidden">▸</span>
                <span className="hidden group-open/det:inline">▾</span>
                What this means
              </summary>
              <p className="mt-1.5 text-xs text-ink-muted leading-relaxed pl-3">{qm.plain_english_meaning}</p>
            </details>
          )}

          {(qm.opening_stems?.length ?? 0) > 0 && (
            <details className="group/det">
              <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink">
                <span className="group-open/det:hidden">▸</span>
                <span className="hidden group-open/det:inline">▾</span>
                How to open with this quote
              </summary>
              <ul className="mt-1.5 pl-3 space-y-1">
                {qm.opening_stems!.map((s, i) => (
                  <li key={i} className="text-xs text-ink-muted leading-relaxed list-disc list-inside">{s}</li>
                ))}
              </ul>
            </details>
          )}

          {(qm.comparative_prompts?.length ?? 0) > 0 && (
            <details className="group/det">
              <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink">
                <span className="group-open/det:hidden">▸</span>
                <span className="hidden group-open/det:inline">▾</span>
                How to compare
              </summary>
              <ul className="mt-1.5 pl-3 space-y-1">
                {qm.comparative_prompts!.map((p, i) => (
                  <li key={i} className="text-xs text-ink-muted leading-relaxed list-disc list-inside">{p}</li>
                ))}
              </ul>
            </details>
          )}

          {(qm.linked_context?.length ?? 0) > 0 && (
            <details className="group/det">
              <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink">
                <span className="group-open/det:hidden">▸</span>
                <span className="hidden group-open/det:inline">▾</span>
                Context
              </summary>
              <ul className="mt-1.5 pl-3 space-y-1">
                {qm.linked_context!.map((c, i) => (
                  <li key={i} className="text-xs text-ink-muted leading-relaxed list-disc list-inside">{c}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Theme pills */}
      <div className="flex flex-wrap gap-1">
        {qm.best_themes.map((t) => (
          <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t]}</span>
        ))}
      </div>
    </article>
  );
}

export default function LibraryQuotes() {
  const { quote_methods } = useContent();
  const [view, setView] = useState<View>("By quote");
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<Src>("All");
  const [theme, setTheme] = useState<"All" | QuestionFamily>("All");

  const themeOptions = useMemo<("All" | QuestionFamily)[]>(() => {
    const set = new Set<QuestionFamily>();
    quote_methods.forEach((qm) => qm.best_themes.forEach((t) => set.add(t)));
    return ["All", ...Array.from(set)];
  }, [quote_methods]);

  const ql = q.trim().toLowerCase();

  const matchesText = (qm: QuoteMethod) =>
    !ql ||
    qm.quote_text.toLowerCase().includes(ql) ||
    qm.method.toLowerCase().includes(ql) ||
    qm.effect_prompt.toLowerCase().includes(ql) ||
    qm.meaning_prompt.toLowerCase().includes(ql);

  const matchesSource = (qm: QuoteMethod) => src === "All" || qm.source_text === (src as SourceText);

  // ---- By quote (existing behaviour) ----
  const filtered = useMemo(() => {
    return quote_methods.filter((qm) => {
      if (!matchesSource(qm)) return false;
      if (theme !== "All" && !qm.best_themes.includes(theme)) return false;
      return matchesText(qm);
    });
  }, [quote_methods, ql, src, theme]);

  // ---- By theme (grouped) ----
  // Build groups: theme family -> quotes that include the family in best_themes,
  // also pass source + search filters. Quotes can appear under multiple families
  // because best_themes is multi-tag — that is the intent of the pivot.
  const groups = useMemo(() => {
    const familiesPresent: QuestionFamily[] = [];
    const seen = new Set<QuestionFamily>();
    quote_methods.forEach((qm) =>
      qm.best_themes.forEach((t) => {
        if (!seen.has(t)) {
          seen.add(t);
          familiesPresent.push(t);
        }
      }),
    );
    // Stable order matching QUESTION_FAMILY_LABELS keys
    const ordered = (Object.keys(QUESTION_FAMILY_LABELS) as QuestionFamily[]).filter((k) => seen.has(k));
    const useOrder = ordered.length === familiesPresent.length ? ordered : familiesPresent;

    return useOrder
      .filter((fam) => theme === "All" || theme === fam)
      .map((fam) => ({
        family: fam,
        quotes: quote_methods.filter((qm) => qm.best_themes.includes(fam) && matchesSource(qm) && matchesText(qm)),
      }))
      .filter((g) => g.quotes.length > 0);
  }, [quote_methods, ql, src, theme]);

  // Quotes with no best_themes at all — surface gracefully under "By theme"
  const untagged = useMemo(
    () => (view === "By theme" ? quote_methods.filter((qm) => qm.best_themes.length === 0 && matchesSource(qm) && matchesText(qm)) : []),
    [quote_methods, view, ql, src],
  );

  // Unique quote count after filters in By-theme mode (de-dupes multi-tag quotes
  // that appear in multiple theme groups). Untagged quotes are included.
  const uniqueThemeQuoteCount = useMemo(() => {
    if (view !== "By theme") return 0;
    const ids = new Set<string>();
    groups.forEach((g) => g.quotes.forEach((qm) => ids.add(qm.id)));
    untagged.forEach((qm) => ids.add(qm.id));
    return ids.size;
  }, [view, groups, untagged]);

  const shownTotal = view === "By quote" ? filtered.length : uniqueThemeQuoteCount;
  const visibleGroupCount = groups.length + (untagged.length > 0 ? 1 : 0);

  // Controlled open-state for theme sections so Expand/Collapse all can drive them.
  // Keys: theme family ids + "__untagged". Default seeded each time the visible
  // group set changes: first group open, rest closed; or all open when a single
  // theme is selected.
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const groupSignature = useMemo(
    () => groups.map((g) => g.family).join("|") + "::" + (untagged.length > 0 ? "u" : ""),
    [groups, untagged.length],
  );
  useEffect(() => {
    if (view !== "By theme") return;
    const next: Record<string, boolean> = {};
    groups.forEach((g, idx) => {
      next[g.family] = idx === 0 || theme !== "All";
    });
    if (untagged.length > 0) next.__untagged = false;
    setOpenMap(next);
    // theme dep handled implicitly via groupSignature when filter narrows groups
  }, [groupSignature, view, theme, untagged.length, groups]);

  const setAllOpen = (open: boolean) => {
    const next: Record<string, boolean> = {};
    groups.forEach((g) => (next[g.family] = open));
    if (untagged.length > 0) next.__untagged = open;
    setOpenMap(next);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 lg:py-12 library-print">
      <div className="flex items-start justify-between gap-4">
        <LibraryPageHeader
          eyebrow="Quote bank"
          title="Quotes"
          description="Every quote with its method, effect, meaning and best-fit themes. Browse the bank as a flat list, or pivot by theme family to revise thematically."
          total={quote_methods.length}
          shown={shownTotal}
        />
        <div className="shrink-0 pt-2">
          <PrintButton />
        </div>
      </div>

      {view === "By theme" && shownTotal > 0 && (
        <p className="meta-mono -mt-3 mb-5 text-ink-muted">
          across {visibleGroupCount} theme group{visibleGroupCount === 1 ? "" : "s"}
          <span className="ml-1 italic">· quotes with multiple themes appear in more than one group</span>
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center mb-5">
        <FilterPills options={VIEWS} value={view} onChange={(v) => setView(v)} />
        <div className="flex-1"><SearchInput value={q} onChange={setQ} placeholder="Search quote text, method, effect…" /></div>
        <FilterPills options={SOURCES} value={src} onChange={(v) => setSrc(v)} />
      </div>

      <div className="flex flex-wrap gap-1 mb-6">
        {themeOptions.map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`text-[10px] font-mono px-2 py-1 border rounded-sm transition-colors ${
              theme === t ? "border-primary bg-primary/10 text-ink" : "border-rule bg-paper-dim/40 text-ink-muted hover:text-ink"
            }`}
          >
            {t === "All" ? "All themes" : QUESTION_FAMILY_LABELS[t]}
          </button>
        ))}
      </div>

      {view === "By quote" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((qm) => <QuoteCard key={qm.id} qm={qm} />)}
          {filtered.length === 0 && <EmptyState>No quotes match your filters.</EmptyState>}
        </div>
      )}

      {view === "By theme" && (
        <div className="space-y-4">
          {visibleGroupCount > 1 && (
            <div className="flex items-center justify-end gap-3 -mt-1 mb-1">
              <button
                onClick={() => setAllOpen(true)}
                className="text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink underline-offset-4 hover:underline"
              >
                Expand all
              </button>
              <span className="text-ink-muted/40 text-[10px]">·</span>
              <button
                onClick={() => setAllOpen(false)}
                className="text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink underline-offset-4 hover:underline"
              >
                Collapse all
              </button>
            </div>
          )}

          {groups.map((g) => (
            <details
              key={g.family}
              open={!!openMap[g.family]}
              onToggle={(e) => {
                const open = (e.currentTarget as HTMLDetailsElement).open;
                setOpenMap((m) => (m[g.family] === open ? m : { ...m, [g.family]: open }));
              }}
              className="group border border-rule bg-paper rounded-sm shadow-card"
            >
              <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-paper-dim/40 rounded-sm">
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted shrink-0">Theme family</span>
                  <h2 className="font-serif text-lg lg:text-xl truncate">{QUESTION_FAMILY_LABELS[g.family]}</h2>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="meta-mono">{g.quotes.length} quote{g.quotes.length === 1 ? "" : "s"}</span>
                  <span className="text-ink-muted text-xs font-mono">
                    <span className="group-open:hidden">▸</span>
                    <span className="hidden group-open:inline">▾</span>
                  </span>
                </div>
              </summary>
              <div className="border-t border-rule px-5 py-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.quotes.map((qm) => <QuoteCard key={`${g.family}-${qm.id}`} qm={qm} />)}
              </div>
            </details>
          ))}

          {untagged.length > 0 && (
            <details
              open={!!openMap.__untagged}
              onToggle={(e) => {
                const open = (e.currentTarget as HTMLDetailsElement).open;
                setOpenMap((m) => (m.__untagged === open ? m : { ...m, __untagged: open }));
              }}
              className="group border border-rule border-dashed bg-paper-dim/40 rounded-sm"
            >
              <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted shrink-0">Untagged</span>
                  <h2 className="font-serif text-lg italic text-ink-muted truncate">No theme family assigned</h2>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="meta-mono">{untagged.length} quote{untagged.length === 1 ? "" : "s"}</span>
                  <span className="text-ink-muted text-xs font-mono">
                    <span className="group-open:hidden">▸</span>
                    <span className="hidden group-open:inline">▾</span>
                  </span>
                </div>
              </summary>
              <div className="border-t border-rule px-5 py-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {untagged.map((qm) => <QuoteCard key={`untagged-${qm.id}`} qm={qm} />)}
              </div>
            </details>
          )}

          {groups.length === 0 && untagged.length === 0 && (
            <EmptyState>No quotes match your filters.</EmptyState>
          )}
        </div>
      )}
    </div>
  );
}
