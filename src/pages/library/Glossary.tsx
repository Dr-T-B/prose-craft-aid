import { useMemo, useState } from "react";
import { useContent } from "@/lib/ContentProvider";
import type { GlossaryTerm } from "@/lib/contentRepo";
import { LibraryPageHeader, SearchInput, EmptyState, PrintButton } from "./_shared";

const CATEGORY_LABELS: Record<string, string> = {
  ao2_method: "AO2 Method",
  ao2_technique: "AO2 Technique",
  ao3_term: "AO3 Term",
  ao5_lens: "AO5 Lens",
  exam_term: "Exam Term",
  conceptual_upgrade: "Conceptual Upgrade",
  theme_reframe: "Theme Reframe",
};

const LEVEL_BAND_LABELS: Record<string, string> = { secure: "Secure", strong: "Strong", top_band: "Top Band" };

function levelBandClass(band: string | null | undefined) {
  if (band === "top_band") return "border-amber-300 bg-amber-50 text-amber-700";
  if (band === "strong") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-rule bg-paper-dim/60 text-ink-muted";
}

function GlossaryCard({ term }: { term: GlossaryTerm }) {
  return (
    <article className="border border-rule bg-paper rounded-sm shadow-card p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="label-eyebrow">{CATEGORY_LABELS[term.category] ?? term.category}</span>
          {term.level_band && (
            <span className={`text-[9px] font-mono px-1.5 py-0.5 border rounded-sm ${levelBandClass(term.level_band)}`}>
              {LEVEL_BAND_LABELS[term.level_band] ?? term.level_band}
            </span>
          )}
        </div>
      </div>

      <h3 className="font-serif text-lg mb-2">{term.term}</h3>

      {term.student_friendly_definition && (
        <p className="text-sm text-ink-muted leading-relaxed mb-3">{term.student_friendly_definition}</p>
      )}

      {!term.student_friendly_definition && term.definition && (
        <p className="text-sm text-ink-muted leading-relaxed mb-3">{term.definition}</p>
      )}

      {term.student_friendly_definition && term.definition && (
        <details className="mb-3">
          <summary className="cursor-pointer list-none text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink">
            Technical definition ▸
          </summary>
          <p className="mt-1.5 text-xs text-ink-muted leading-relaxed pl-3">{term.definition}</p>
        </details>
      )}

      {term.sentence_stem && (
        <div className="mb-2">
          <p className="font-mono uppercase tracking-wider text-[10px] text-ink mb-0.5">Sentence stem</p>
          <p className="text-xs text-ink-muted italic leading-relaxed">{term.sentence_stem}</p>
        </div>
      )}

      {term.best_verbs && term.best_verbs.length > 0 && (
        <div className="mb-2">
          <p className="font-mono uppercase tracking-wider text-[10px] text-ink mb-1">Upgrade verbs</p>
          <div className="flex flex-wrap gap-1">
            {term.best_verbs.map((v, i) => (
              <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{v}</span>
            ))}
          </div>
        </div>
      )}

      {term.common_misuse_warning && (
        <div className="mt-3 border-l-2 border-amber-300 pl-3 py-1 bg-amber-50/60">
          <p className="font-mono uppercase tracking-wider text-[9px] text-amber-700 mb-0.5">Common misuse</p>
          <p className="text-xs text-amber-800 leading-relaxed">{term.common_misuse_warning}</p>
        </div>
      )}
    </article>
  );
}

export default function LibraryGlossary() {
  const { glossary_terms } = useContent();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo<string[]>(() => {
    const set = new Set<string>();
    glossary_terms.forEach((t) => set.add(t.category));
    return ["All", ...Array.from(set).sort()];
  }, [glossary_terms]);

  const ql = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    return glossary_terms.filter((term) => {
      if (category !== "All" && term.category !== category) return false;
      if (!ql) return true;
      return (
        term.term.toLowerCase().includes(ql) ||
        (term.definition ?? "").toLowerCase().includes(ql) ||
        (term.student_friendly_definition ?? "").toLowerCase().includes(ql) ||
        (term.sentence_stem ?? "").toLowerCase().includes(ql) ||
        (term.common_misuse_warning ?? "").toLowerCase().includes(ql) ||
        (term.best_verbs ?? []).some((v) => v.toLowerCase().includes(ql))
      );
    });
  }, [glossary_terms, category, ql]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 lg:py-12 library-print">
      <div className="flex items-start justify-between gap-4">
        <LibraryPageHeader
          eyebrow="Vocabulary"
          title="Glossary"
          description="Exam-ready terminology — methods, techniques, conceptual upgrades and theme reframes — with student-friendly definitions and misuse warnings."
          total={glossary_terms.length}
          shown={filtered.length}
        />
        <div className="shrink-0 pt-2">
          <PrintButton />
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-5">
        <SearchInput value={q} onChange={setQ} placeholder="Search terms, definitions, sentence stems…" />
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-[10px] font-mono px-2 py-1 border rounded-sm transition-colors ${
                category === c ? "border-primary bg-primary/10 text-ink" : "border-rule bg-paper-dim/40 text-ink-muted hover:text-ink"
              }`}
            >
              {c === "All" ? "All categories" : (CATEGORY_LABELS[c] ?? c)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((term) => <GlossaryCard key={term.id} term={term} />)}
        {filtered.length === 0 && (
          glossary_terms.length === 0
            ? <EmptyState>Glossary terms are loading. If this persists, check your connection.</EmptyState>
            : <EmptyState>No glossary terms match your filters.</EmptyState>
        )}
      </div>
    </div>
  );
}
