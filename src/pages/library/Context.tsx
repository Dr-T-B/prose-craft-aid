import { useMemo, useState } from "react";
import { useContent } from "@/lib/ContentProvider";
import { QUESTION_FAMILY_LABELS, type SourceText } from "@/data/seed";
import { LibraryPageHeader, SearchInput, FilterPills, EmptyState, sourceAccent } from "./_shared";

type Tab = "characters" | "symbols" | "themes" | "tensions";
const TABS: { id: Tab; label: string }[] = [
  { id: "characters", label: "Characters" },
  { id: "symbols", label: "Symbols" },
  { id: "themes", label: "Theme families" },
  { id: "tensions", label: "AO5 tensions" },
];
const SOURCES = ["All", "Hard Times", "Atonement"] as const;
type Src = (typeof SOURCES)[number];

export default function LibraryContext() {
  const { characters, symbols, themes, ao5_tensions } = useContent();
  const [tab, setTab] = useState<Tab>("characters");
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<Src>("All");

  const ql = q.trim().toLowerCase();

  const chars = useMemo(() => characters.filter((c) => {
    if (src !== "All" && c.source_text !== (src as SourceText)) return false;
    if (!ql) return true;
    return c.name.toLowerCase().includes(ql) || c.one_line.toLowerCase().includes(ql) ||
      (c.core_function ?? "").toLowerCase().includes(ql);
  }), [characters, ql, src]);

  const syms = useMemo(() => symbols.filter((s) => {
    if (src !== "All" && s.source_text !== (src as SourceText)) return false;
    if (!ql) return true;
    return s.name.toLowerCase().includes(ql) || s.one_line.toLowerCase().includes(ql);
  }), [symbols, ql, src]);

  const thms = useMemo(() => themes.filter((t) => {
    if (!ql) return true;
    return QUESTION_FAMILY_LABELS[t.family].toLowerCase().includes(ql) || t.one_line.toLowerCase().includes(ql);
  }), [themes, ql]);

  const tensions = useMemo(() => ao5_tensions.filter((a) => {
    if (!ql) return true;
    return a.focus.toLowerCase().includes(ql) || a.dominant_reading.toLowerCase().includes(ql) ||
      a.alternative_reading.toLowerCase().includes(ql) || a.safe_stem.toLowerCase().includes(ql);
  }), [ao5_tensions, ql]);

  const total = tab === "characters" ? characters.length : tab === "symbols" ? symbols.length : tab === "themes" ? themes.length : ao5_tensions.length;
  const shown = tab === "characters" ? chars.length : tab === "symbols" ? syms.length : tab === "themes" ? thms.length : tensions.length;

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 lg:py-12">
      <LibraryPageHeader
        eyebrow="AO3 anchors"
        title="Context"
        description="Characters, symbols, theme families and AO5 tensions — the contextual furniture you bring to bear on each text."
        total={total}
        shown={shown}
      />

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
        {(tab === "characters" || tab === "symbols") && (
          <FilterPills options={SOURCES} value={src} onChange={setSrc} />
        )}
      </div>

      {tab === "characters" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {chars.map((c) => (
            <article key={c.id} className={`border border-rule bg-paper rounded-sm shadow-card p-4 pl-5 ${sourceAccent(c.source_text)}`}>
              <p className="label-eyebrow mb-1">{c.source_text}</p>
              <h3 className="font-serif text-lg mb-1">{c.name}</h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-3">{c.one_line}</p>
              {(c.core_function || c.complication || c.structural_role || c.comparative_link || c.common_misreading) && (
                <dl className="text-xs leading-relaxed space-y-1.5 mb-3">
                  {c.core_function && <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Core function · </dt><dd className="inline text-ink-muted">{c.core_function}</dd></div>}
                  {c.complication && <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Complication · </dt><dd className="inline text-ink-muted">{c.complication}</dd></div>}
                  {c.structural_role && <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Structural role · </dt><dd className="inline text-ink-muted">{c.structural_role}</dd></div>}
                  {c.comparative_link && <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Comparative link · </dt><dd className="inline text-ink-muted">{c.comparative_link}</dd></div>}
                  {c.common_misreading && <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Common misreading · </dt><dd className="inline text-ink-muted">{c.common_misreading}</dd></div>}
                </dl>
              )}
              <div className="flex flex-wrap gap-1">
                {c.themes.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t]}</span>
                ))}
              </div>
            </article>
          ))}
          {chars.length === 0 && <EmptyState>No characters match.</EmptyState>}
        </div>
      )}

      {tab === "symbols" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {syms.map((s) => (
            <article key={s.id} className={`border border-rule bg-paper rounded-sm shadow-card p-4 pl-5 ${sourceAccent(s.source_text)}`}>
              <p className="label-eyebrow mb-1">{s.source_text}</p>
              <h3 className="font-serif text-lg mb-1">{s.name}</h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-3">{s.one_line}</p>
              <div className="flex flex-wrap gap-1">
                {s.themes.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t]}</span>
                ))}
              </div>
            </article>
          ))}
          {syms.length === 0 && <EmptyState>No symbols match.</EmptyState>}
        </div>
      )}

      {tab === "themes" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {thms.map((t) => (
            <article key={t.id} className="border border-rule bg-paper rounded-sm shadow-card p-4">
              <p className="label-eyebrow mb-1">Theme family</p>
              <h3 className="font-serif text-lg mb-1">{QUESTION_FAMILY_LABELS[t.family]}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{t.one_line}</p>
            </article>
          ))}
          {thms.length === 0 && <EmptyState>No theme families match.</EmptyState>}
        </div>
      )}

      {tab === "tensions" && (
        <div className="grid sm:grid-cols-2 gap-3">
          {tensions.map((a) => (
            <article key={a.id} className="border border-rule bg-paper rounded-sm shadow-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="label-eyebrow">AO5 tension</span>
                <span className="meta-mono">{a.level_tag.replace("_", " ")}</span>
              </div>
              <h3 className="font-serif text-lg mb-3">{a.focus}</h3>
              <dl className="text-xs leading-relaxed space-y-1.5 mb-3">
                <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Dominant reading · </dt><dd className="inline text-ink-muted">{a.dominant_reading}</dd></div>
                <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Alternative · </dt><dd className="inline text-ink-muted">{a.alternative_reading}</dd></div>
                <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Safe stem · </dt><dd className="inline text-ink-muted italic">"{a.safe_stem}"</dd></div>
              </dl>
              <div className="flex flex-wrap gap-1">
                {a.best_use.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t]}</span>
                ))}
              </div>
            </article>
          ))}
          {tensions.length === 0 && <EmptyState>No AO5 tensions match.</EmptyState>}
        </div>
      )}
    </div>
  );
}
