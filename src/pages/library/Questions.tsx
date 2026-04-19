import { useMemo, useState } from "react";
import { useContent } from "@/lib/ContentProvider";
import { QUESTION_FAMILY_LABELS, type QuestionFamily } from "@/data/seed";
import { LibraryPageHeader, SearchInput, FilterPills, EmptyState } from "./_shared";

const LEVELS = ["All", "secure", "strong", "top_band"] as const;
type LevelFilter = (typeof LEVELS)[number];

export default function LibraryQuestions() {
  const { questions, routes } = useContent();
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<"All" | QuestionFamily>("All");
  const [level, setLevel] = useState<LevelFilter>("All");

  const familyOptions = useMemo<("All" | QuestionFamily)[]>(() => {
    const set = new Set<QuestionFamily>();
    questions.forEach((qq) => set.add(qq.family));
    return ["All", ...Array.from(set)];
  }, [questions]);

  const routeName = (id: string) => routes.find((r) => r.id === id)?.name ?? id;

  const ql = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    return questions.filter((qq) => {
      if (family !== "All" && qq.family !== family) return false;
      if (level !== "All" && qq.level_tag !== level) return false;
      if (!ql) return true;
      return qq.stem.toLowerCase().includes(ql) || QUESTION_FAMILY_LABELS[qq.family].toLowerCase().includes(ql);
    });
  }, [questions, ql, family, level]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 lg:py-12">
      <LibraryPageHeader
        eyebrow="Question bank"
        title="Questions"
        description="Exam-style questions grouped by theme family and difficulty band. Each card shows the routes the question maps to and the methods that typically support it."
        total={questions.length}
        shown={filtered.length}
      />

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center mb-5">
        <div className="flex-1"><SearchInput value={q} onChange={setQ} placeholder="Search question stems…" /></div>
        <FilterPills options={LEVELS} value={level} onChange={setLevel} labelize={(v) => v === "All" ? "All levels" : v.replace("_", " ")} />
      </div>

      <div className="flex flex-wrap gap-1 mb-6">
        {familyOptions.map((f) => (
          <button
            key={f}
            onClick={() => setFamily(f)}
            className={`text-[10px] font-mono px-2 py-1 border rounded-sm transition-colors ${
              family === f ? "border-primary bg-primary/10 text-ink" : "border-rule bg-paper-dim/40 text-ink-muted hover:text-ink"
            }`}
          >
            {f === "All" ? "All families" : QUESTION_FAMILY_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((qq) => (
          <article key={qq.id} className="border border-rule bg-paper rounded-sm shadow-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="label-eyebrow">{QUESTION_FAMILY_LABELS[qq.family]}</span>
              <span className="meta-mono">{qq.level_tag.replace("_", " ")}</span>
            </div>
            <p className="font-serif text-base leading-relaxed mb-4">{qq.stem}</p>
            <dl className="text-xs leading-relaxed space-y-1.5">
              <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Primary route · </dt><dd className="inline text-ink-muted">{routeName(qq.primary_route_id)}</dd></div>
              <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Secondary route · </dt><dd className="inline text-ink-muted">{routeName(qq.secondary_route_id)}</dd></div>
              {qq.likely_core_methods.length > 0 && (
                <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Likely methods · </dt><dd className="inline text-ink-muted">{qq.likely_core_methods.join(", ")}</dd></div>
              )}
            </dl>
          </article>
        ))}
        {filtered.length === 0 && <EmptyState>No questions match your filters.</EmptyState>}
      </div>
    </div>
  );
}
