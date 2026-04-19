import { useMemo, useState } from "react";
import { useContent } from "@/lib/ContentProvider";
import { QUESTION_FAMILY_LABELS, type QuestionFamily } from "@/data/seed";
import { LibraryPageHeader, SearchInput, FilterPills, EmptyState } from "./_shared";

const LEVELS = ["All", "secure", "strong", "top_band"] as const;
type LevelFilter = (typeof LEVELS)[number];

export default function LibraryThesisParagraph() {
  const { theses, routes, paragraph_jobs } = useContent();
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<"All" | QuestionFamily>("All");
  const [level, setLevel] = useState<LevelFilter>("All");

  const familyOptions = useMemo<("All" | QuestionFamily)[]>(() => {
    const set = new Set<QuestionFamily>();
    theses.forEach((t) => set.add(t.theme_family));
    return ["All", ...Array.from(set)];
  }, [theses]);

  const routeName = (id: string) => routes.find((r) => r.id === id)?.name ?? id;
  const jobsForRouteFamily = (route_id: string, fam: QuestionFamily) =>
    paragraph_jobs.filter((j) => j.route_id === route_id && j.question_family === fam);

  const ql = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    return theses.filter((t) => {
      if (family !== "All" && t.theme_family !== family) return false;
      if (level !== "All" && t.level !== level) return false;
      if (!ql) return true;
      return t.thesis_text.toLowerCase().includes(ql) ||
        t.paragraph_job_1_label.toLowerCase().includes(ql) ||
        t.paragraph_job_2_label.toLowerCase().includes(ql) ||
        (t.paragraph_job_3_label ?? "").toLowerCase().includes(ql);
    });
  }, [theses, ql, family, level]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 lg:py-12">
      <LibraryPageHeader
        eyebrow="Argument structure"
        title="Thesis & Paragraph"
        description="Worked theses and the paragraph jobs that build them. Each thesis shows its route, theme and the body-paragraph spine; expand to read the underlying paragraph prompts."
        total={theses.length}
        shown={filtered.length}
      />

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center mb-5">
        <div className="flex-1"><SearchInput value={q} onChange={setQ} placeholder="Search thesis text or paragraph labels…" /></div>
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
            {f === "All" ? "All themes" : QUESTION_FAMILY_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((t) => {
          const jobs = jobsForRouteFamily(t.route_id, t.theme_family);
          const labels = [t.paragraph_job_1_label, t.paragraph_job_2_label, t.paragraph_job_3_label].filter(Boolean) as string[];
          return (
            <article key={t.id} className="border border-rule bg-paper rounded-sm shadow-card p-5">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <span className="label-eyebrow">{QUESTION_FAMILY_LABELS[t.theme_family]} · {routeName(t.route_id)}</span>
                <span className="meta-mono">{t.level.replace("_", " ")}</span>
              </div>
              <p className="font-serif text-base lg:text-lg leading-relaxed mb-4">{t.thesis_text}</p>

              <div className="border-t border-rule pt-3 mt-3">
                <p className="label-eyebrow mb-2">Paragraph spine</p>
                <ol className="text-sm text-ink-muted space-y-1 list-decimal list-inside">
                  {labels.map((l, i) => <li key={i}>{l}</li>)}
                </ol>
              </div>

              {jobs.length > 0 && (
                <details className="mt-4 group">
                  <summary className="cursor-pointer text-xs font-mono text-ink-muted hover:text-ink list-none">
                    <span className="group-open:hidden">▸ Show paragraph prompts ({jobs.length})</span>
                    <span className="hidden group-open:inline">▾ Hide paragraph prompts</span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    {jobs.map((j) => (
                      <div key={j.id} className="border-l-2 border-rule pl-3">
                        <p className="text-xs font-mono uppercase tracking-wider text-ink mb-1">{j.job_title}</p>
                        <dl className="text-xs leading-relaxed space-y-1 text-ink-muted">
                          <div><dt className="inline font-medium text-ink">Hard Times: </dt><dd className="inline">{j.text1_prompt}</dd></div>
                          <div><dt className="inline font-medium text-ink">Atonement: </dt><dd className="inline">{j.text2_prompt}</dd></div>
                          <div><dt className="inline font-medium text-ink">Divergence: </dt><dd className="inline">{j.divergence_prompt}</dd></div>
                          <div><dt className="inline font-medium text-ink">Judgement: </dt><dd className="inline">{j.judgement_prompt}</dd></div>
                        </dl>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </article>
          );
        })}
        {filtered.length === 0 && <EmptyState>No theses match your filters.</EmptyState>}
      </div>
    </div>
  );
}
