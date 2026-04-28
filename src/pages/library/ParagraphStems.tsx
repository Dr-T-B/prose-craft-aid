import { useMemo, useState } from "react";
import { useContent } from "@/lib/ContentProvider";
import type { ParagraphStem } from "@/lib/contentRepo";
import { LibraryPageHeader, SearchInput, FilterPills, PrintButton } from "./_shared";
import { Copy, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

// ── constants ──────────────────────────────────────────────────────────────

const AO_OPTIONS   = ["All", "AO1", "AO2", "AO3", "AO4"] as const;
const BOOK_OPTIONS = ["All", "Hard Times", "Atonement", "Comparative", "Generic"] as const;
const LEVEL_OPTIONS = ["All", "foundation", "secure", "strong", "top_band"] as const;

const FUNCTION_LABELS: Record<string, string> = {
  opening:         "Opening / Topic sentence",
  method_analysis: "Method analysis",
  context:         "Context integration",
  comparison:      "Comparison",
  judgement:       "Judgement",
  conclusion:      "Conclusion",
};

const FUNCTION_ORDER = ["opening","method_analysis","context","comparison","judgement","conclusion"];

const LEVEL_LABELS: Record<string, string> = {
  foundation: "Foundation",
  secure:     "Secure",
  strong:     "Strong",
  top_band:   "Top Band",
};

const LEVEL_CLASS: Record<string, string> = {
  top_band:   "border-amber-300 text-amber-700",
  strong:     "border-blue-200 text-blue-700",
  secure:     "border-rule text-ink-muted",
  foundation: "border-green-200 text-green-700",
};

const AO_CLASS: Record<string, string> = {
  AO1: "bg-rose-50 border-rose-200 text-rose-700",
  AO2: "bg-blue-50 border-blue-200 text-blue-700",
  AO3: "bg-emerald-50 border-emerald-200 text-emerald-700",
  AO4: "bg-purple-50 border-purple-200 text-purple-700",
};

// ── StemCard ──────────────────────────────────────────────────────────────

function StemCard({ stem }: { stem: ParagraphStem }) {
  const [open, setOpen] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(stem.stem_text);
    toast.success("Stem copied to clipboard");
  };

  const bookLabel =
    stem.text_focus === "Hard Times"    ? "HT"
    : stem.text_focus === "Atonement"   ? "AT"
    : stem.text_focus === "Comparative" ? "Both texts"
    : "Any text";

  return (
    <article className="border border-rule bg-paper rounded-sm shadow-card p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* AO pills */}
          {stem.ao.map((a) => (
            <span
              key={a}
              className={`text-[9px] font-mono px-1.5 py-0.5 border rounded-sm ${AO_CLASS[a] ?? "border-rule text-ink-muted"}`}
            >
              {a}
            </span>
          ))}
          {/* Function */}
          <span className="label-eyebrow">{FUNCTION_LABELS[stem.function] ?? stem.function}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[9px] font-mono px-1.5 py-0.5 border rounded-sm ${LEVEL_CLASS[stem.level_band] ?? "border-rule text-ink-muted"}`}>
            {LEVEL_LABELS[stem.level_band] ?? stem.level_band}
          </span>
          <span className="meta-mono text-ink-muted">{bookLabel}</span>
        </div>
      </div>

      {/* Stem text */}
      <p className="font-serif text-base leading-relaxed mb-3 text-ink">
        {stem.stem_text}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 text-[10px] font-mono text-ink-muted hover:text-ink transition-colors"
        >
          {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          {open ? "Hide example" : "Show example"}
        </button>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 text-[10px] font-mono text-ink-muted hover:text-primary border border-rule rounded-sm px-2 py-1 transition-colors print:hidden"
        >
          <Copy className="size-3" />
          Copy stem
        </button>
      </div>

      {/* Worked example */}
      {open && stem.example_use && (
        <div className="mt-3 border-l-2 border-primary/40 pl-3 py-1">
          <p className="font-mono uppercase tracking-wider text-[9px] text-ink-muted mb-1">Worked example</p>
          <p className="text-xs text-ink leading-relaxed font-serif italic">{stem.example_use}</p>
        </div>
      )}

      {/* Themes */}
      {stem.best_themes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {stem.best_themes.map((t) => (
            <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60 text-ink-muted">
              {t.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

type AOFilter   = typeof AO_OPTIONS[number];
type BookFilter = typeof BOOK_OPTIONS[number];
type LevelFilter = typeof LEVEL_OPTIONS[number];

export default function LibraryParagraphStems() {
  const { paragraph_stems } = useContent();

  const [ao,    setAo]    = useState<AOFilter>("All");
  const [book,  setBook]  = useState<BookFilter>("All");
  const [level, setLevel] = useState<LevelFilter>("All");
  const [q,     setQ]     = useState("");

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return paragraph_stems.filter((s) => {
      if (ao !== "All" && !s.ao.includes(ao)) return false;
      if (book !== "All") {
        if (book === "Generic" && s.text_focus !== null) return false;
        if (book !== "Generic" && s.text_focus !== book) return false;
      }
      if (level !== "All" && s.level_band !== level) return false;
      if (ql && !s.stem_text.toLowerCase().includes(ql) &&
               !(s.example_use?.toLowerCase().includes(ql))) return false;
      return true;
    });
  }, [paragraph_stems, ao, book, level, q]);

  // Group by paragraph function in canonical order
  const grouped = useMemo(() => {
    const map: Record<string, ParagraphStem[]> = {};
    FUNCTION_ORDER.forEach((fn) => { map[fn] = []; });
    filtered.forEach((s) => {
      if (!map[s.function]) map[s.function] = [];
      map[s.function].push(s);
    });
    return map;
  }, [filtered]);

  const hasResults = filtered.length > 0;

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 lg:py-12 library-print">
      <div className="flex items-start justify-between gap-4">
        <LibraryPageHeader
          eyebrow="Writing scaffolds"
          title="Paragraph Stems"
          description="Sentence-level scaffolds for every analytical move in a comparative prose essay. Filter by AO, text, or level — then adapt the stem for your own argument. Use the worked example to see the stem filled in."
          total={paragraph_stems.length}
          shown={filtered.length}
        />
        <div className="shrink-0 pt-2"><PrintButton /></div>
      </div>

      {/* Filter bar */}
      <div className="space-y-3 mb-8 p-4 border border-rule rounded-sm bg-paper-dim/30">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <SearchInput value={q} onChange={setQ} placeholder="Search stems and examples…" />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="meta-mono text-ink-muted">AO</span>
            <FilterPills
              options={AO_OPTIONS}
              value={ao}
              onChange={(v) => setAo(v as AOFilter)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="meta-mono text-ink-muted">Text</span>
            <FilterPills
              options={BOOK_OPTIONS}
              value={book}
              onChange={(v) => setBook(v as BookFilter)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="meta-mono text-ink-muted">Level</span>
            <FilterPills
              options={LEVEL_OPTIONS.map(l => l === "top_band" ? "top_band" : l)}
              value={level}
              onChange={(v) => setLevel(v as LevelFilter)}
            />
          </div>
        </div>
        <p className="text-[10px] font-mono text-ink-muted">
          Stems use {"{placeholders}"} — fill them in with your own argument. They are starting points, not templates to copy.
        </p>
      </div>

      {/* Results grouped by function */}
      {!hasResults && (
        <p className="text-sm text-ink-muted italic">No stems match the current filters.</p>
      )}

      {hasResults && (
        <div className="space-y-10">
          {FUNCTION_ORDER.map((fn) => {
            const items = grouped[fn];
            if (!items || items.length === 0) return null;
            return (
              <section key={fn}>
                <h2 className="font-serif text-xl mb-4 pb-2 border-b border-rule">
                  {FUNCTION_LABELS[fn] ?? fn}
                  <span className="ml-2 meta-mono text-ink-muted font-sans text-sm">{items.length}</span>
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {items.map((s) => <StemCard key={s.id} stem={s} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
