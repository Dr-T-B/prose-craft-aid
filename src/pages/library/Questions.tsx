import { useMemo, useState } from "react";
import { useContent } from "@/lib/ContentProvider";
import {
  getLibraryThemeLabel,
  questionMatchesText,
  toLibraryQuestions,
  type LibraryQuestion,
  type LibraryThemeId,
} from "@/lib/libraryAdapters";
import { LibraryPageHeader, SearchInput, FilterPills, EmptyState, PrintButton } from "./_shared";

const LEVELS = ["All", "secure", "strong", "top_band"] as const;
type LevelFilter = (typeof LEVELS)[number];

function RouteLine({ label, route }: { label: string; route?: LibraryQuestion["primaryRoute"] }) {
  if (!route) return null;

  return (
    <div>
      <dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">{label} · </dt>
      <dd className="inline text-ink-muted">
        <span className="text-ink">{route.name}</span>
        {route.coreQuestion && <span> — {route.coreQuestion}</span>}
      </dd>
    </div>
  );
}

function QuestionCard({ question }: { question: LibraryQuestion }) {
  return (
    <article className="border border-rule bg-paper rounded-sm shadow-card p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="label-eyebrow">{question.familyLabel}</span>
        <span className="meta-mono shrink-0">{question.level.replace("_", " ")}</span>
      </div>
      <p className="font-serif text-base leading-relaxed mb-4">{question.stem}</p>
      <dl className="text-xs leading-relaxed space-y-1.5">
        <RouteLine label="Primary route" route={question.primaryRoute} />
        <RouteLine label="Secondary route" route={question.secondaryRoute} />
        {question.likelyMethods.length > 0 && (
          <div>
            <dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Likely methods · </dt>
            <dd className="inline text-ink-muted">{question.likelyMethods.join(", ")}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}

export default function LibraryQuestions() {
  const { questions, routes } = useContent();
  const libraryQuestions = useMemo(() => toLibraryQuestions(questions, routes), [questions, routes]);
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<"All" | LibraryThemeId>("All");
  const [level, setLevel] = useState<LevelFilter>("All");

  const familyOptions = useMemo<("All" | LibraryThemeId)[]>(() => {
    const set = new Set<LibraryThemeId>();
    libraryQuestions.forEach((question) => set.add(question.family));
    return ["All", ...Array.from(set)];
  }, [libraryQuestions]);

  const ql = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    return libraryQuestions.filter((question) => {
      if (family !== "All" && question.family !== family) return false;
      if (level !== "All" && question.level !== level) return false;
      return questionMatchesText(question, ql);
    });
  }, [libraryQuestions, ql, family, level]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 lg:py-12 library-print">
      <div className="flex items-start justify-between gap-4">
        <LibraryPageHeader
          eyebrow="Question bank"
          title="Questions"
          description="Exam-style questions grouped by theme family and difficulty band. Each card shows the routes the question maps to and the methods that typically support it."
          total={libraryQuestions.length}
          shown={filtered.length}
        />
        <div className="shrink-0 pt-2">
          <PrintButton />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center mb-5">
        <div className="flex-1"><SearchInput value={q} onChange={setQ} placeholder="Search question stems…" /></div>
        <FilterPills options={LEVELS} value={level} onChange={(v) => setLevel(v)} labelize={(v) => v === "All" ? "All levels" : v.replace("_", " ")} />
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
            {f === "All" ? "All families" : getLibraryThemeLabel(f)}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((question) => <QuestionCard key={question.id} question={question} />)}
        {filtered.length === 0 && <EmptyState>No questions match your filters.</EmptyState>}
      </div>
    </div>
  );
}
