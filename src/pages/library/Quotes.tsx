import { useEffect, useMemo, useState } from "react";
import { useContent } from "@/lib/ContentProvider";
import {
  getLibraryThemeLabel,
  groupLibraryQuotesByTheme,
  quoteMatchesText,
  toLibraryQuotes,
  type LibraryThemeId,
  type LibraryQuote,
} from "@/lib/libraryAdapters";
import { LibraryPageHeader, SearchInput, FilterPills, EmptyState, sourceAccent, PrintButton } from "./_shared";

const SOURCES = ["All", "Hard Times", "Atonement", "Comparative", "Unknown"] as const;
type Src = (typeof SOURCES)[number];
const VIEWS = ["By quote", "By theme"] as const;
type View = (typeof VIEWS)[number];

const AO_COLOURS: Record<string, string> = {
  AO1: "bg-blue-50 border-blue-200 text-blue-700",
  AO2: "bg-green-50 border-green-200 text-green-700",
  AO3: "bg-amber-50 border-amber-200 text-amber-700",
};

function QuoteCard({ quote }: { quote: LibraryQuote }) {
  const hasEnriched =
    quote.plainEnglishMeaning ||
    quote.openingStems.length > 0 ||
    quote.comparativePrompts.length > 0 ||
    quote.linkedContext.length > 0;

  return (
    <article className={`border border-rule bg-paper rounded-sm shadow-card p-4 pl-5 ${sourceAccent(quote.sourceText)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="label-eyebrow">{quote.sourceText}</span>
          {quote.isCoreQuote && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 border border-amber-300 bg-amber-50 text-amber-700 rounded-sm">
              Core
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {quote.aoPriority.map((ao) => (
            <span
              key={ao}
              className={`text-[9px] font-mono px-1.5 py-0.5 border rounded-sm ${AO_COLOURS[ao] ?? "bg-paper-dim/60 border-rule text-ink-muted"}`}
            >
              {ao}
            </span>
          ))}
          <span className="meta-mono">{quote.level.replace("_", " ")}</span>
        </div>
      </div>

      <p className="font-serif italic text-base leading-snug mb-3">"{quote.quoteText}"</p>

      <dl className="text-xs leading-relaxed space-y-1.5 mb-3">
        {quote.method && (
          <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Method · </dt><dd className="inline text-ink-muted">{quote.method}</dd></div>
        )}
        {quote.effect && (
          <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Effect · </dt><dd className="inline text-ink-muted">{quote.effect}</dd></div>
        )}
        {quote.meaning && (
          <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Meaning · </dt><dd className="inline text-ink-muted">{quote.meaning}</dd></div>
        )}
        {quote.speakerOrNarrator && (
          <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Speaker · </dt><dd className="inline text-ink-muted">{quote.speakerOrNarrator}</dd></div>
        )}
        {quote.locationReference && (
          <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Location · </dt><dd className="inline text-ink-muted">{quote.locationReference}</dd></div>
        )}
      </dl>

      {hasEnriched && (
        <div className="space-y-1 mb-3 border-t border-rule pt-2">
          {quote.plainEnglishMeaning && (
            <details className="group/det">
              <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink">
                <span className="group-open/det:hidden">▸</span>
                <span className="hidden group-open/det:inline">▾</span>
                What this means
              </summary>
              <p className="mt-1.5 text-xs text-ink-muted leading-relaxed pl-3">{quote.plainEnglishMeaning}</p>
            </details>
          )}

          {quote.openingStems.length > 0 && (
            <details className="group/det">
              <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink">
                <span className="group-open/det:hidden">▸</span>
                <span className="hidden group-open/det:inline">▾</span>
                How to open with this quote
              </summary>
              <ul className="mt-1.5 pl-3 space-y-1">
                {quote.openingStems.map((s, i) => (
                  <li key={i} className="text-xs text-ink-muted leading-relaxed list-disc list-inside">{s}</li>
                ))}
              </ul>
            </details>
          )}

          {quote.comparativePrompts.length > 0 && (
            <details className="group/det">
              <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink">
                <span className="group-open/det:hidden">▸</span>
                <span className="hidden group-open/det:inline">▾</span>
                How to compare
              </summary>
              <ul className="mt-1.5 pl-3 space-y-1">
                {quote.comparativePrompts.map((p, i) => (
                  <li key={i} className="text-xs text-ink-muted leading-relaxed list-disc list-inside">{p}</li>
                ))}
              </ul>
            </details>
          )}

          {quote.linkedContext.length > 0 && (
            <details className="group/det">
              <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink">
                <span className="group-open/det:hidden">▸</span>
                <span className="hidden group-open/det:inline">▾</span>
                Context
              </summary>
              <ul className="mt-1.5 pl-3 space-y-1">
                {quote.linkedContext.map((c, i) => (
                  <li key={i} className="text-xs text-ink-muted leading-relaxed list-disc list-inside">{c}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1 empty:hidden">
        {quote.themes.map((t) => (
          <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{getLibraryThemeLabel(t)}</span>
        ))}
      </div>
    </article>
  );
}

export default function LibraryQuotes() {
  const { quote_methods } = useContent();
  const quotes = useMemo(() => toLibraryQuotes(quote_methods), [quote_methods]);
  const [view, setView] = useState<View>("By quote");
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<Src>("All");
  const [theme, setTheme] = useState<"All" | LibraryThemeId>("All");

  const themeOptions = useMemo<("All" | LibraryThemeId)[]>(() => {
    const set = new Set<LibraryThemeId>();
    quotes.forEach((quote) => quote.themes.forEach((t) => set.add(t)));
    return ["All", ...Array.from(set)];
  }, [quotes]);

  const ql = q.trim().toLowerCase();

  const matchesSource = (quote: LibraryQuote) => src === "All" || quote.sourceText === src;

  const filtered = useMemo(() => {
    return quotes.filter((quote) => {
      if (!matchesSource(quote)) return false;
      if (theme !== "All" && !quote.themes.includes(theme)) return false;
      return quoteMatchesText(quote, ql);
    });
  }, [quotes, ql, src, theme]);

  const grouped = useMemo(() => groupLibraryQuotesByTheme(filtered), [filtered]);
  const { groups, untagged } = grouped;

  const shownTotal = view === "By quote" ? filtered.length : grouped.uniqueCount;
  const visibleGroupCount = groups.length + (untagged.length > 0 ? 1 : 0);

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
          total={quotes.length}
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
            {t === "All" ? "All themes" : getLibraryThemeLabel(t)}
          </button>
        ))}
      </div>

      {view === "By quote" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((quote) => <QuoteCard key={quote.id} quote={quote} />)}
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
                  <h2 className="font-serif text-lg lg:text-xl truncate">{getLibraryThemeLabel(g.family)}</h2>
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
                {g.quotes.map((quote) => <QuoteCard key={`${g.family}-${quote.id}`} quote={quote} />)}
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
                {untagged.map((quote) => <QuoteCard key={`untagged-${quote.id}`} quote={quote} />)}
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
