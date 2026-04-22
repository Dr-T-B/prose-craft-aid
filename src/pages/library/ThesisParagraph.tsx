import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useContent } from "@/lib/ContentProvider";
import {
  getLibraryThemeLabel,
  thesisMatchesText,
  toLibraryTheses,
  type LibraryParagraphFrame,
  type LibraryThemeId,
  type LibraryThesis,
} from "@/lib/libraryAdapters";
import { handoffFromParagraphFrame, handoffFromThesis, queueBuilderHandoff } from "@/lib/builderHandoff";
import { useGradeBMode } from "@/contexts/GradeBModeContext";
import { getParagraphFrameStarter } from "@/lib/gradeBSupport";
import { LibraryPageHeader, SearchInput, FilterPills, EmptyState, PrintButton, UseInBuilderButton } from "./_shared";

const LEVELS = ["All", "secure", "strong", "top_band"] as const;
type LevelFilter = (typeof LEVELS)[number];

function ParagraphFramePrompts({
  frame,
  onUse,
  gradeBMode,
}: {
  frame: LibraryParagraphFrame;
  onUse: (frame: LibraryParagraphFrame) => void;
  gradeBMode: boolean;
}) {
  const starter = gradeBMode ? getParagraphFrameStarter(frame) : [];

  return (
    <div className="border-l-2 border-rule pl-3">
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="text-xs font-mono uppercase tracking-wider text-ink">{frame.title}</p>
        <UseInBuilderButton onClick={() => onUse(frame)} />
      </div>
      {starter.length > 0 && (
        <div className="mb-2 border border-rule bg-highlight/30 rounded-sm p-2">
          <p className="label-eyebrow mb-1">Start here</p>
          <div className="space-y-1">
            {starter.map((block) => (
              <p key={block.label} className="text-xs text-ink-muted leading-relaxed">
                <span className="font-medium text-ink">{block.label}: </span>{block.items.join(" ")}
              </p>
            ))}
          </div>
        </div>
      )}
      <dl className="text-xs leading-relaxed space-y-1 text-ink-muted">
        <div><dt className="inline font-medium text-ink">Hard Times: </dt><dd className="inline">{frame.hardTimesPrompt}</dd></div>
        <div><dt className="inline font-medium text-ink">Atonement: </dt><dd className="inline">{frame.atonementPrompt}</dd></div>
        <div><dt className="inline font-medium text-ink">Divergence: </dt><dd className="inline">{frame.divergencePrompt}</dd></div>
        <div><dt className="inline font-medium text-ink">Judgement: </dt><dd className="inline">{frame.judgementPrompt}</dd></div>
      </dl>
    </div>
  );
}

function ThesisCard({
  thesis,
  onUseThesis,
  onUseFrame,
  gradeBMode,
}: {
  thesis: LibraryThesis;
  onUseThesis: (thesis: LibraryThesis) => void;
  onUseFrame: (frame: LibraryParagraphFrame) => void;
  gradeBMode: boolean;
}) {
  return (
    <article className="border border-rule bg-paper rounded-sm shadow-card p-5">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <span className="label-eyebrow">{thesis.familyLabel} · {thesis.route?.name ?? "Route unavailable"}</span>
        <div className="flex items-center gap-2">
          <span className="meta-mono">{thesis.level.replace("_", " ")}</span>
          <UseInBuilderButton onClick={() => onUseThesis(thesis)} />
        </div>
      </div>
      <p className="font-serif text-base lg:text-lg leading-relaxed mb-4">{thesis.thesisText}</p>

      <div className="border-t border-rule pt-3 mt-3">
        <p className="label-eyebrow mb-2">Paragraph spine</p>
        {thesis.paragraphLabels.length > 0 ? (
          <ol className="text-sm text-ink-muted space-y-1 list-decimal list-inside">
            {thesis.paragraphLabels.map((label, index) => <li key={index}>{label}</li>)}
          </ol>
        ) : (
          <p className="text-sm text-ink-muted italic">No paragraph spine has been attached yet.</p>
        )}
      </div>

      {thesis.paragraphFrames.length > 0 && (
        <details className="mt-4 group" open={gradeBMode || undefined}>
          <summary className="cursor-pointer text-xs font-mono text-ink-muted hover:text-ink list-none">
            <span className="group-open:hidden">▸ Show paragraph prompts ({thesis.paragraphFrames.length})</span>
            <span className="hidden group-open:inline">▾ {gradeBMode ? "Paragraph starter frames" : "Hide paragraph prompts"}</span>
          </summary>
          <div className="mt-3 space-y-3">
            {thesis.paragraphFrames.map((frame) => (
              <ParagraphFramePrompts key={frame.id} frame={frame} onUse={onUseFrame} gradeBMode={gradeBMode} />
            ))}
          </div>
        </details>
      )}
    </article>
  );
}

export default function LibraryThesisParagraph() {
  const { theses, routes, paragraph_jobs } = useContent();
  const { gradeBMode } = useGradeBMode();
  const navigate = useNavigate();
  const libraryTheses = useMemo(
    () => toLibraryTheses(theses, routes, paragraph_jobs),
    [theses, routes, paragraph_jobs],
  );
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<"All" | LibraryThemeId>("All");
  const [level, setLevel] = useState<LevelFilter>("All");

  const familyOptions = useMemo<("All" | LibraryThemeId)[]>(() => {
    const set = new Set<LibraryThemeId>();
    libraryTheses.forEach((thesis) => set.add(thesis.family));
    return ["All", ...Array.from(set)];
  }, [libraryTheses]);

  const ql = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    return libraryTheses.filter((thesis) => {
      if (family !== "All" && thesis.family !== family) return false;
      if (level !== "All" && thesis.level !== level) return false;
      return thesisMatchesText(thesis, ql);
    });
  }, [libraryTheses, ql, family, level]);

  const useThesisInBuilder = (thesis: LibraryThesis) => {
    queueBuilderHandoff(handoffFromThesis(thesis));
    toast.success("Thesis sent to Builder");
    navigate("/builder");
  };

  const useFrameInBuilder = (frame: LibraryParagraphFrame) => {
    queueBuilderHandoff(handoffFromParagraphFrame(frame));
    toast.success("Paragraph frame sent to Builder");
    navigate("/builder");
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 lg:py-12 library-print">
      <div className="flex items-start justify-between gap-4">
        <LibraryPageHeader
          eyebrow="Argument structure"
          title="Thesis & Paragraph"
          description="Worked theses and the paragraph jobs that build them. Each thesis shows its route, theme and the body-paragraph spine; expand to read the underlying paragraph prompts."
          total={libraryTheses.length}
          shown={filtered.length}
        />
        <div className="shrink-0 pt-2">
          <PrintButton />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center mb-5">
        <div className="flex-1"><SearchInput value={q} onChange={setQ} placeholder="Search thesis text or paragraph labels…" /></div>
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
            {f === "All" ? "All themes" : getLibraryThemeLabel(f)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((thesis) => (
          <ThesisCard
            key={thesis.id}
            thesis={thesis}
            onUseThesis={useThesisInBuilder}
            onUseFrame={useFrameInBuilder}
            gradeBMode={gradeBMode}
          />
        ))}
        {filtered.length === 0 && <EmptyState>No theses match your filters.</EmptyState>}
      </div>
    </div>
  );
}
