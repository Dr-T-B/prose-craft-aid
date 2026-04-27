import { Link } from "react-router-dom";
import { useContent } from "@/lib/ContentProvider";
import { Clock } from "lucide-react";

export default function Modules() {
  const { modules, lessons } = useContent();

  return (
    <div className="max-w-[900px] mx-auto px-6 lg:px-10 py-8 lg:py-12">
      <header className="mb-10 max-w-2xl">
        <p className="label-eyebrow mb-2 text-primary">Study modules</p>
        <h1 className="font-serif text-4xl lg:text-5xl mb-4">Modules</h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          Structured study sequences for Hard Times and Atonement. Work through each module in order,
          or jump directly to any lesson.
        </p>
      </header>

      {modules.length === 0 ? (
        <p className="text-sm text-ink-muted italic">No modules are published yet. Check back soon.</p>
      ) : (
        <div className="space-y-6">
          {modules.map((mod) => {
            const modLessons = lessons.filter((l) => l.module_id === mod.id);
            const totalMinutes = modLessons.reduce((sum, l) => sum + (l.estimated_minutes ?? 0), 0);
            return (
              <div key={mod.id} className="border border-rule bg-paper rounded-sm shadow-card">
                <div className="px-6 py-5 border-b border-rule">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="label-eyebrow mb-1">Module {mod.position}</p>
                      <h2 className="font-serif text-2xl mb-1">{mod.title}</h2>
                      {mod.summary && <p className="text-sm text-ink-muted leading-relaxed">{mod.summary}</p>}
                    </div>
                    {totalMinutes > 0 && (
                      <div className="shrink-0 flex items-center gap-1 text-xs font-mono text-ink-muted">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{totalMinutes} min</span>
                      </div>
                    )}
                  </div>
                </div>
                {modLessons.length > 0 && (
                  <ol className="divide-y divide-rule">
                    {modLessons.map((lesson, idx) => (
                      <li key={lesson.id}>
                        <Link
                          to={`/modules/${mod.slug}/${lesson.slug}`}
                          className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-paper-dim/40 transition-colors group"
                        >
                          <div className="flex items-baseline gap-3 min-w-0">
                            <span className="text-[10px] font-mono text-ink-muted shrink-0">{idx + 1}</span>
                            <span className="text-sm text-ink group-hover:text-primary transition-colors truncate">{lesson.title}</span>
                          </div>
                          {lesson.estimated_minutes && (
                            <span className="shrink-0 text-[10px] font-mono text-ink-muted">{lesson.estimated_minutes} min</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
