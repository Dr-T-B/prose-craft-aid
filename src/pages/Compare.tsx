import { useContent } from "@/lib/ContentProvider";
import { QUESTION_FAMILY_LABELS } from "@/data/seed";
import type { QuestionFamily } from "@/data/seed";

export default function Compare() {
  const { comparative_matrix } = useContent();

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
      <header className="mb-12 max-w-3xl">
        <p className="label-eyebrow mb-3 text-primary">Comparative routes</p>
        <h1 className="font-serif text-4xl lg:text-5xl mb-4">Compare</h1>
        <p className="font-serif text-lg text-ink-muted leading-relaxed">
          Selected axes between Hard Times and Atonement. Each entry names the
          shared concern, how each writer handles it, and the divergence that
          separates them — the joint on which a comparative argument actually moves.
        </p>
      </header>

      {comparative_matrix.length === 0 && (
        <p className="text-sm text-ink-muted italic">No comparative data loaded yet.</p>
      )}

      <div className="space-y-12">
        {comparative_matrix.map((c) => (
          <article
            key={c.id}
            className="grid md:grid-cols-12 gap-8 pb-12 border-b border-rule last:border-0"
          >
            {/* Left: axis + theme pills */}
            <header className="md:col-span-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                Hard Times <span className="text-primary">↔</span> Atonement
              </p>
              <h2 className="font-serif text-2xl lg:text-3xl mt-2 leading-snug">{c.axis}</h2>
              {c.themes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-4">
                  {c.themes.map((t) => {
                    const label = QUESTION_FAMILY_LABELS[t as QuestionFamily] ?? t;
                    return (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </header>

            {/* Right: evidence + divergence */}
            <div className="md:col-span-8 space-y-6">
              {/* Hard Times */}
              <div className="border-l-2 border-rule pl-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1">
                  Hard Times
                </p>
                <p className="text-sm text-ink-muted leading-relaxed">{c.hard_times}</p>
              </div>

              {/* Atonement */}
              <div className="border-l-2 border-rule pl-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-1">
                  Atonement
                </p>
                <p className="text-sm text-ink-muted leading-relaxed">{c.atonement}</p>
              </div>

              {/* Divergence — the analytical joint */}
              <div className="bg-paper-dim/40 border border-rule rounded-sm p-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-primary mb-2">
                  Divergence
                </p>
                <p className="font-serif text-base leading-relaxed italic">{c.divergence}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
