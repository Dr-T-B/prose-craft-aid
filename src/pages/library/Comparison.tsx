import { useMemo, useState } from "react";
import { useContent } from "@/lib/ContentProvider";
import { QUESTION_FAMILY_LABELS, type QuestionFamily } from "@/data/seed";
import { LibraryPageHeader, SearchInput } from "./_shared";

export default function LibraryComparison() {
  const { comparative_matrix } = useContent();
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<"All" | QuestionFamily>("All");

  const familyOptions = useMemo<("All" | QuestionFamily)[]>(() => {
    const set = new Set<QuestionFamily>();
    comparative_matrix.forEach((m) => m.themes.forEach((t) => set.add(t)));
    return ["All", ...Array.from(set)];
  }, [comparative_matrix]);

  const ql = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    return comparative_matrix.filter((m) => {
      if (family !== "All" && !m.themes.includes(family)) return false;
      if (!ql) return true;
      return (
        m.axis.toLowerCase().includes(ql) ||
        m.hard_times.toLowerCase().includes(ql) ||
        m.atonement.toLowerCase().includes(ql) ||
        m.divergence.toLowerCase().includes(ql)
      );
    });
  }, [comparative_matrix, ql, family]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 lg:py-12 library-print">
      <LibraryPageHeader
        eyebrow="Across the texts"
        title="Comparison"
        description="The comparative matrix — Hard Times alongside Atonement, axis by axis, with the divergence that earns marks at AO4."
        total={comparative_matrix.length}
        shown={filtered.length}
      />

      <div className="flex flex-col gap-3 mb-5">
        <SearchInput value={q} onChange={setQ} placeholder="Search axis, divergence or text-specific commentary…" />
        <div className="flex flex-wrap gap-1">
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
      </div>

      <div className="space-y-3">
        {filtered.map((m) => (
          <article key={m.id} className="border border-rule bg-paper rounded-sm shadow-card p-5">
            <p className="label-eyebrow mb-1">Comparative axis</p>
            <h2 className="font-serif text-xl mb-4">{m.axis}</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="border-l-2 pl-3" style={{ borderColor: "hsl(var(--hard-times))" }}>
                <p className="font-mono uppercase tracking-wider text-[10px] text-ink mb-1">Hard Times</p>
                <p className="text-sm text-ink-muted leading-relaxed">{m.hard_times}</p>
              </div>
              <div className="border-l-2 pl-3" style={{ borderColor: "hsl(var(--atonement))" }}>
                <p className="font-mono uppercase tracking-wider text-[10px] text-ink mb-1">Atonement</p>
                <p className="text-sm text-ink-muted leading-relaxed">{m.atonement}</p>
              </div>
            </div>
            <div className="border-t border-rule pt-3">
              <p className="font-mono uppercase tracking-wider text-[10px] text-ink mb-1">Divergence</p>
              <p className="text-sm text-ink-muted leading-relaxed mb-3">{m.divergence}</p>
              <div className="flex flex-wrap gap-1">
                {m.themes.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t]}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <p className="text-sm text-ink-muted italic py-8 text-center">No comparative axes match your filters.</p>}
      </div>
    </div>
  );
}
