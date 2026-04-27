import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  QUESTION_FAMILY_LABELS,
  type SourceText,
} from "@/data/seed";
import { queueQuoteForBuilder, queueFamilyForBuilder } from "@/lib/planStore";
import { useContent } from "@/lib/ContentProvider";
import type { QuestionFamily } from "@/data/seed";

/** Detect if the search query points at a known question family.
 *  Used to bias retrieval ordering toward exam-relevant items first. */
function detectFamily(ql: string): QuestionFamily | undefined {
  if (!ql) return undefined;
  const entries = Object.entries(QUESTION_FAMILY_LABELS) as [QuestionFamily, string][];
  // Exact-ish label or family-id substring match.
  const hit = entries.find(([id, label]) =>
    label.toLowerCase().includes(ql) || id.toLowerCase().includes(ql)
  );
  return hit?.[0];
}

/** Mirror of QUOTE_PRIORITY in planLogic — kept lightweight so retrieval ranks
 *  the same strongest evidence under pressure without coupling files. */
const QUOTE_PRIORITY: Partial<Record<QuestionFamily, string[]>> = {
  class: ["qm_hands", "qm_cleaner", "qm_girl20", "qm_cmp_voice", "qm_cmp_repair"],
  power: ["qm_hands", "qm_cleaner", "qm_cmp_voice", "qm_cmp_authority", "qm_atonement"],
  guilt: ["qm_atonement", "qm_truth_real", "qm_ghostly", "qm_cmp_repair", "qm_cleaner", "qm_cmp_authority"],
  endings: ["qm_atonement", "qm_cmp_repair", "qm_ghostly", "qm_cleaner", "qm_cmp_authority"],
  truth: ["qm_ghostly", "qm_facts", "qm_atonement", "qm_cmp_authority", "qm_truth_real", "qm_cmp_imag"],
  narrative_authority: ["qm_atonement", "qm_ghostly", "qm_cmp_authority", "qm_cmp_imag", "qm_facts"],
  imagination: ["qm_fire", "qm_cmp_imag", "qm_alive", "qm_truth_real", "qm_facts"],
  childhood: ["qm_girl20", "qm_fire", "qm_cmp_imag", "qm_alive", "qm_facts"],
  gender: ["qm_atonement", "qm_cmp_repair", "qm_cmp_voice", "qm_girl20", "qm_cleaner"],
  suffering: ["qm_cleaner", "qm_atonement", "qm_ghostly", "qm_cmp_repair", "qm_hands"],
  love: ["qm_atonement", "qm_cmp_repair", "qm_ghostly", "qm_cleaner"],
};

/** Score lower = surfaces sooner. Combines family-priority + top_band lift. */
function rankScore(id: string, levelTag: string | undefined, family?: QuestionFamily) {
  const priority = family ? (QUOTE_PRIORITY[family] ?? []) : [];
  const pi = priority.indexOf(id);
  const base = pi === -1 ? 100 : pi;
  const tier = levelTag === "top_band" ? 0 : levelTag === "strong" ? 0.3 : 0.6;
  return base + tier;
}

type Tab = "quotes" | "characters" | "themes" | "symbols" | "matrix";
const SOURCES: (SourceText | "All")[] = ["All", "Hard Times", "Atonement", "Comparative"];

export default function RetrievalToolkit() {
  const [tab, setTab] = useState<Tab>("quotes");
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<SourceText | "All">("All");
  const navigate = useNavigate();
  const content = useContent();
  const QUOTE_METHODS = content.quote_methods;
  const CHARACTERS = content.characters;
  const THEMES = content.themes;
  const SYMBOLS = content.symbols;
  const COMPARATIVE_MATRIX = content.comparative_matrix;

  const ql = q.trim().toLowerCase();
  // Scan-first cap — bulk imports stay browsable without overwhelming the grid.
  const RESULT_CAP = 60;
  // Family hint drives ranking so the strongest evidence rises under pressure.
  const familyHint = useMemo(() => detectFamily(ql), [ql]);

  const quotesAll = useMemo(() => {
    const filtered = QUOTE_METHODS.filter((qm) =>
      (src === "All" || qm.source_text === src) &&
      (ql === "" ||
        qm.quote_text.toLowerCase().includes(ql) ||
        qm.method.toLowerCase().includes(ql) ||
        qm.best_themes.some((t) => (QUESTION_FAMILY_LABELS[t] ?? t).toLowerCase().includes(ql)))
    );
    // Rank: family-priority first, then top_band tier.
    return [...filtered].sort((a, b) =>
      rankScore(a.id, a.curation_status, familyHint) - rankScore(b.id, b.curation_status, familyHint)
    );
  }, [ql, src, QUOTE_METHODS, familyHint]);
  const quotes = quotesAll.slice(0, RESULT_CAP);

  const charsAll = useMemo(() => {
    const filtered = CHARACTERS.filter((c) =>
      (src === "All" || c.source_text === src) &&
      (ql === "" || c.name.toLowerCase().includes(ql) || c.one_line.toLowerCase().includes(ql) ||
        (c.core_function ?? "").toLowerCase().includes(ql))
    );
    // When the user is scanning by family, surface characters tagged with that family first.
    if (!familyHint) return filtered;
    return [...filtered].sort((a, b) => {
      const am = a.themes.includes(familyHint) ? 0 : 1;
      const bm = b.themes.includes(familyHint) ? 0 : 1;
      return am - bm;
    });
  }, [ql, src, CHARACTERS, familyHint]);
  const chars = charsAll.slice(0, RESULT_CAP);

  const themesAll = useMemo(() => {
    const filtered = THEMES.filter((t) =>
      ql === "" ||
      (QUESTION_FAMILY_LABELS[t.family] ?? t.family).toLowerCase().includes(ql) ||
      t.one_line.toLowerCase().includes(ql)
    );
    if (!familyHint) return filtered;
    return [...filtered].sort((a, b) =>
      (a.family === familyHint ? 0 : 1) - (b.family === familyHint ? 0 : 1)
    );
  }, [ql, THEMES, familyHint]);
  const themes = themesAll.slice(0, RESULT_CAP);

  const symbolsAll = useMemo(() => {
    const filtered = SYMBOLS.filter((s) =>
      (src === "All" || s.source_text === src) &&
      (ql === "" || s.name.toLowerCase().includes(ql) || s.one_line.toLowerCase().includes(ql))
    );
    if (!familyHint) return filtered;
    return [...filtered].sort((a, b) =>
      (a.themes.includes(familyHint) ? 0 : 1) - (b.themes.includes(familyHint) ? 0 : 1)
    );
  }, [ql, src, SYMBOLS, familyHint]);
  const symbols = symbolsAll.slice(0, RESULT_CAP);

  const matrixAll = useMemo(() => {
    const filtered = COMPARATIVE_MATRIX.filter((m) =>
      ql === "" ||
      m.axis.toLowerCase().includes(ql) ||
      m.hard_times.toLowerCase().includes(ql) ||
      m.atonement.toLowerCase().includes(ql) ||
      m.divergence.toLowerCase().includes(ql)
    );
    // Comparative matrix should help compare quickly — surface family-tagged axes first.
    if (!familyHint) return filtered;
    return [...filtered].sort((a, b) =>
      (a.themes.includes(familyHint) ? 0 : 1) - (b.themes.includes(familyHint) ? 0 : 1)
    );
  }, [ql, COMPARATIVE_MATRIX, familyHint]);
  const matrix = matrixAll.slice(0, RESULT_CAP);

  const capNote = (shown: number, total: number) =>
    total > shown ? `Showing first ${shown} of ${total} — refine search to narrow results.` : null;

  const sendToBuilder = (id: string) => {
    queueQuoteForBuilder(id);
    toast.success("Quote queued — opening builder");
    navigate("/builder");
  };

  const planWithTheme = (family: QuestionFamily) => {
    queueFamilyForBuilder(family);
    toast.success("Theme queued — opening builder");
    navigate("/builder");
  };

  const sourceFilterVisible = tab === "quotes" || tab === "characters" || tab === "symbols";

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 lg:py-12">
      <header className="mb-6">
        <p className="label-eyebrow mb-1">Reference</p>
        <h1 className="font-serif text-3xl lg:text-4xl">Retrieval toolkit</h1>
      </header>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-5">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search quotes, methods, characters, themes, symbols…"
          className="flex-1 border border-rule-strong bg-paper rounded-sm px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-card"
        />
        {sourceFilterVisible && (
          <div className="inline-flex border border-rule rounded-sm overflow-hidden">
            {SOURCES.map((s) => (
              <button
                key={s}
                onClick={() => setSrc(s)}
                className={`px-3 py-2 text-xs font-mono border-r border-rule last:border-r-0 transition-colors ${
                  src === s ? "bg-primary text-primary-foreground" : "bg-paper hover:bg-paper-dim"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-rule mb-5 flex-wrap">
        {(["quotes", "characters", "themes", "symbols", "matrix"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-mono border-b-2 -mb-px transition-colors ${
              tab === t ? "border-primary text-ink" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t === "matrix" ? "Comparative" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Body */}
      {tab === "quotes" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quotes.map((qm) => {
            const accent = qm.source_text === "Hard Times" ? "accent-bar-hard-times" : qm.source_text === "Atonement" ? "accent-bar-atonement" : "";
            return (
            <article key={qm.id} className={`border border-rule bg-paper rounded-sm shadow-card p-4 pl-5 flex flex-col ${accent}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="label-eyebrow">{qm.source_text}</span>
                <span className="meta-mono">{qm.curation_status.replace("_", " ")}</span>
              </div>
              <p className="font-serif italic text-base leading-snug mb-2">"{qm.quote_text}"</p>
              <p className="text-xs text-ink-muted mb-2"><b className="text-ink font-mono uppercase tracking-wider text-[10px]">Method</b> · {qm.method}</p>
              <p className="text-xs text-ink-muted leading-relaxed mb-3">{qm.effect_prompt}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {qm.best_themes.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t] ?? t}</span>
                ))}
              </div>
              <button
                onClick={() => sendToBuilder(qm.id)}
                className="mt-auto self-stretch text-xs font-medium px-3 py-2 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
              >
                Send to essay builder →
              </button>
            </article>
          );})}
          {quotes.length === 0 && <p className="text-sm text-ink-muted italic col-span-full">No quotes match.</p>}
          {capNote(quotes.length, quotesAll.length) && <p className="meta-mono text-ink-muted col-span-full mt-1">{capNote(quotes.length, quotesAll.length)}</p>}
        </div>
      )}

      {tab === "characters" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {chars.map((c) => {
            const accent = c.source_text === "Hard Times" ? "accent-bar-hard-times" : c.source_text === "Atonement" ? "accent-bar-atonement" : "";
            return (
            <article key={c.id} className={`border border-rule bg-paper rounded-sm shadow-card p-4 pl-5 ${accent}`}>
              <p className="label-eyebrow mb-1">{c.source_text}</p>
              <h3 className="font-serif text-lg mb-1">{c.name}</h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-3">{c.one_line}</p>

              {(c.core_function || c.complication || c.structural_role || c.comparative_link || c.common_misreading) && (
                <dl className="text-xs leading-relaxed space-y-1.5 mb-3">
                  {c.core_function && (
                    <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Core function · </dt><dd className="inline text-ink-muted">{c.core_function}</dd></div>
                  )}
                  {c.complication && (
                    <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Complication · </dt><dd className="inline text-ink-muted">{c.complication}</dd></div>
                  )}
                  {c.structural_role && (
                    <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Structural role · </dt><dd className="inline text-ink-muted">{c.structural_role}</dd></div>
                  )}
                  {c.comparative_link && (
                    <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Comparative link · </dt><dd className="inline text-ink-muted">{c.comparative_link}</dd></div>
                  )}
                  {c.common_misreading && (
                    <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Common misreading · </dt><dd className="inline text-ink-muted">{c.common_misreading}</dd></div>
                  )}
                </dl>
              )}

              <div className="flex flex-wrap gap-1">
                {c.themes.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t] ?? t}</span>
                ))}
              </div>
            </article>
          );})}
          {chars.length === 0 && <p className="text-sm text-ink-muted italic col-span-full">No characters match.</p>}
          {capNote(chars.length, charsAll.length) && <p className="meta-mono text-ink-muted col-span-full mt-1">{capNote(chars.length, charsAll.length)}</p>}
        </div>
      )}

      {tab === "themes" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {themes.map((t) => (
            <article key={t.id} className="border border-rule bg-paper rounded-sm shadow-card p-4 flex flex-col">
              <p className="label-eyebrow mb-1">Theme family</p>
              <h3 className="font-serif text-lg mb-1">{QUESTION_FAMILY_LABELS[t.family] ?? t.family}</h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-3">{t.one_line}</p>
              <p className="meta-mono text-ink-muted mb-3">Use this to anchor a route &amp; question in the builder.</p>
              <button
                onClick={() => planWithTheme(t.family)}
                className="mt-auto self-stretch text-xs font-medium px-3 py-2 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
              >
                Plan with this theme →
              </button>
            </article>
          ))}
          {capNote(themes.length, themesAll.length) && <p className="meta-mono text-ink-muted col-span-full mt-1">{capNote(themes.length, themesAll.length)}</p>}
        </div>
      )}

      {tab === "symbols" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {symbols.map((s) => {
            const accent = s.source_text === "Hard Times" ? "accent-bar-hard-times" : "accent-bar-atonement";
            return (
              <article key={s.id} className={`border border-rule bg-paper rounded-sm shadow-card p-4 pl-5 ${accent}`}>
                <p className="label-eyebrow mb-1">{s.source_text}</p>
                <h3 className="font-serif text-lg mb-1">{s.name}</h3>
                <p className="text-sm text-ink-muted leading-relaxed mb-3">{s.one_line}</p>
                <div className="flex flex-wrap gap-1">
                  {s.themes.map((t) => (
                    <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t] ?? t}</span>
                  ))}
                </div>
              </article>
            );
          })}
          {symbols.length === 0 && <p className="text-sm text-ink-muted italic col-span-full">No symbols match.</p>}
          {capNote(symbols.length, symbolsAll.length) && <p className="meta-mono text-ink-muted col-span-full mt-1">{capNote(symbols.length, symbolsAll.length)}</p>}
        </div>
      )}

      {tab === "matrix" && (
        <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-3">
          {matrix.map((m) => (
            <article key={m.id} className="border border-rule bg-paper rounded-sm shadow-card p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="label-eyebrow">Comparative axis</p>
                {m.level_band && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 border rounded-sm ${
                    m.level_band === "top_band" ? "border-amber-300 bg-amber-50 text-amber-700"
                    : m.level_band === "strong" ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-rule bg-paper-dim/60 text-ink-muted"
                  }`}>
                    {m.level_band === "top_band" ? "Top Band" : m.level_band === "strong" ? "Strong" : "Secure"}
                  </span>
                )}
              </div>
              <h3 className="font-serif text-lg mb-3">{m.axis}</h3>
              <dl className="text-xs leading-relaxed space-y-1.5 mb-3">
                <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Hard Times · </dt><dd className="inline text-ink-muted">{m.hard_times}</dd></div>
                <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Atonement · </dt><dd className="inline text-ink-muted">{m.atonement}</dd></div>
                <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Divergence · </dt><dd className="inline text-ink-muted">{m.divergence}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-1">
                {m.themes.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t] ?? t}</span>
                ))}
              </div>
            </article>
          ))}
          {matrix.length === 0 && <p className="text-sm text-ink-muted italic col-span-full">No comparative entries match.</p>}
          {capNote(matrix.length, matrixAll.length) && <p className="meta-mono text-ink-muted col-span-full mt-1">{capNote(matrix.length, matrixAll.length)}</p>}
        </div>
      )}
    </div>
  );
}
