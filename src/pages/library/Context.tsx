import { useEffect, useMemo, useState } from "react";
import { useContent } from "@/lib/ContentProvider";
import {
  contextMatchesText,
  getLibraryThemeLabel,
  libraryContextKindSupportsSourceFilter,
  toLibraryContextFromAO5,
  toLibraryContextFromCharacters,
  toLibraryContextFromSymbols,
  toLibraryContextFromThemes,
  type LibraryContextItem,
  type LibraryThemeId,
} from "@/lib/libraryAdapters";
import { LibraryPageHeader, SearchInput, FilterPills, EmptyState, sourceAccent, PrintButton } from "./_shared";

type Tab = "characters" | "symbols" | "themes" | "tensions";
const TABS: { id: Tab; label: string }[] = [
  { id: "characters", label: "Characters" },
  { id: "symbols", label: "Symbols" },
  { id: "themes", label: "Theme families" },
  { id: "tensions", label: "AO5 tensions" },
];
const SOURCES = ["All", "Hard Times", "Atonement"] as const;
type Src = (typeof SOURCES)[number];

function contextLabel(kind: LibraryContextItem["kind"]) {
  if (kind === "ao5") return "AO5 tension";
  return kind === "theme" ? "Theme family" : kind[0].toUpperCase() + kind.slice(1);
}

function ContextCard({ item }: { item: LibraryContextItem }) {
  return (
    <article className={`border border-rule bg-paper rounded-sm shadow-card p-4 pl-5 ${sourceAccent(item.sourceText)}`}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="label-eyebrow">{item.sourceText === "Comparative" ? contextLabel(item.kind) : item.sourceText}</p>
        {item.level && <span className="meta-mono shrink-0">{item.level.replace("_", " ")}</span>}
      </div>
      <h3 className="font-serif text-lg mb-1">{item.title}</h3>
      <p className="text-sm text-ink-muted leading-relaxed mb-3">{item.summary}</p>
      {item.details.length > 0 && (
        <dl className="text-xs leading-relaxed space-y-1.5 mb-3">
          {item.details.map((entry) => (
            <div key={entry.label}>
              <dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">{entry.label} · </dt>
              <dd className="inline text-ink-muted">{entry.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="flex flex-wrap gap-1 empty:hidden">
        {item.themes.map((theme) => (
          <span key={theme} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">
            {getLibraryThemeLabel(theme)}
          </span>
        ))}
      </div>
    </article>
  );
}

export default function LibraryContext() {
  const { characters, symbols, themes, ao5_tensions } = useContent();
  const [tab, setTab] = useState<Tab>("characters");
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<Src>("All");
  const [theme, setTheme] = useState<"All" | LibraryThemeId>("All");

  const itemsByTab = useMemo<Record<Tab, LibraryContextItem[]>>(() => ({
    characters: toLibraryContextFromCharacters(characters),
    symbols: toLibraryContextFromSymbols(symbols),
    themes: toLibraryContextFromThemes(themes),
    tensions: toLibraryContextFromAO5(ao5_tensions),
  }), [characters, symbols, themes, ao5_tensions]);

  const themeOptions = useMemo<("All" | LibraryThemeId)[]>(() => {
    const set = new Set<LibraryThemeId>();
    Object.values(itemsByTab).flat().forEach((item) => item.themes.forEach((t) => set.add(t)));
    return ["All", ...Array.from(set)];
  }, [itemsByTab]);

  const ql = q.trim().toLowerCase();
  const activeItems = itemsByTab[tab];
  const sourceFilterApplies = activeItems.some((item) => libraryContextKindSupportsSourceFilter(item.kind));

  useEffect(() => {
    if (!sourceFilterApplies && src !== "All") setSrc("All");
  }, [sourceFilterApplies, src]);

  const filtered = useMemo(() => {
    return activeItems.filter((item) => {
      if (sourceFilterApplies && src !== "All" && item.sourceText !== src) return false;
      if (theme !== "All" && !item.themes.includes(theme)) return false;
      return contextMatchesText(item, ql);
    });
  }, [activeItems, ql, sourceFilterApplies, src, theme]);

  const total = activeItems.length;
  const shown = filtered.length;

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 lg:py-12 library-print">
      <div className="flex items-start justify-between gap-4">
        <LibraryPageHeader
          eyebrow="AO3 anchors"
          title="Context"
          description="Characters, symbols, theme families and AO5 tensions — the contextual furniture you bring to bear on each text."
          total={total}
          shown={shown}
        />
        <div className="shrink-0 pt-2">
          <PrintButton />
        </div>
      </div>

      <div className="flex gap-1 border-b border-rule mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-mono border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-primary text-ink" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center mb-6">
        <div className="flex-1"><SearchInput value={q} onChange={setQ} placeholder={`Search ${tab}…`} /></div>
        {sourceFilterApplies ? (
          <FilterPills options={SOURCES} value={src} onChange={(v) => setSrc(v)} />
        ) : (
          <p className="meta-mono text-ink-muted px-1 py-2">Text source filter not used in this view</p>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-6">
        {themeOptions.map((option) => (
          <button
            key={option}
            onClick={() => setTheme(option)}
            className={`text-[10px] font-mono px-2 py-1 border rounded-sm transition-colors ${
              theme === option ? "border-primary bg-primary/10 text-ink" : "border-rule bg-paper-dim/40 text-ink-muted hover:text-ink"
            }`}
          >
            {option === "All" ? "All topics" : getLibraryThemeLabel(option)}
          </button>
        ))}
      </div>

      <div className={`grid gap-3 ${tab === "tensions" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {filtered.map((item) => <ContextCard key={`${item.kind}-${item.id}`} item={item} />)}
        {filtered.length === 0 && <EmptyState>No context entries match your filters.</EmptyState>}
      </div>
    </div>
  );
}
