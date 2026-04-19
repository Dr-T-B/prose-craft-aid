import { useMemo, useState } from "react";
import { useContent } from "@/lib/ContentProvider";
import { QUESTION_FAMILY_LABELS, type QuestionFamily, type SourceText } from "@/data/seed";
import { LibraryPageHeader, SearchInput, FilterPills, EmptyState, sourceAccent } from "./_shared";

const SOURCES = ["All", "Hard Times", "Atonement", "Comparative"] as const;
type Src = (typeof SOURCES)[number];

export default function LibraryQuotes() {
  const { quote_methods } = useContent();
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<Src>("All");
  const [theme, setTheme] = useState<"All" | QuestionFamily>("All");

  const themeOptions = useMemo<("All" | QuestionFamily)[]>(() => {
    const set = new Set<QuestionFamily>();
    quote_methods.forEach((qm) => qm.best_themes.forEach((t) => set.add(t)));
    return ["All", ...Array.from(set)];
  }, [quote_methods]);

  const ql = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    return quote_methods.filter((qm) => {
      if (src !== "All" && qm.source_text !== (src as SourceText)) return false;
      if (theme !== "All" && !qm.best_themes.includes(theme)) return false;
      if (!ql) return true;
      return (
        qm.quote_text.toLowerCase().includes(ql) ||
        qm.method.toLowerCase().includes(ql) ||
        qm.effect_prompt.toLowerCase().includes(ql) ||
        qm.meaning_prompt.toLowerCase().includes(ql)
      );
    });
  }, [quote_methods, ql, src, theme]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 lg:py-12">
      <LibraryPageHeader
        eyebrow="Quote bank"
        title="Quotes"
        description="Every quote with its method, effect, meaning and best-fit themes. Filter by source or theme; search across the quote text, method or commentary."
        total={quote_methods.length}
        shown={filtered.length}
      />

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center mb-5">
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((qm) => (
          <article key={qm.id} className={`border border-rule bg-paper rounded-sm shadow-card p-4 pl-5 ${sourceAccent(qm.source_text)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="label-eyebrow">{qm.source_text}</span>
              <span className="meta-mono">{qm.level_tag.replace("_", " ")}</span>
            </div>
            <p className="font-serif italic text-base leading-snug mb-3">"{qm.quote_text}"</p>
            <dl className="text-xs leading-relaxed space-y-1.5 mb-3">
              <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Method · </dt><dd className="inline text-ink-muted">{qm.method}</dd></div>
              <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Effect · </dt><dd className="inline text-ink-muted">{qm.effect_prompt}</dd></div>
              <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Meaning · </dt><dd className="inline text-ink-muted">{qm.meaning_prompt}</dd></div>
            </dl>
            <div className="flex flex-wrap gap-1">
              {qm.best_themes.map((t) => (
                <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t]}</span>
              ))}
            </div>
          </article>
        ))}
        {filtered.length === 0 && <EmptyState>No quotes match your filters.</EmptyState>}
      </div>
    </div>
  );
}
