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

  const quotes = useMemo(() => {
    return QUOTE_METHODS.filter((qm) =>
      (src === "All" || qm.source_text === src) &&
      (ql === "" ||
        qm.quote_text.toLowerCase().includes(ql) ||
        qm.method.toLowerCase().includes(ql) ||
        qm.best_themes.some((t) => QUESTION_FAMILY_LABELS[t].toLowerCase().includes(ql)))
    );
  }, [ql, src, QUOTE_METHODS]);

  const chars = useMemo(() => {
    return CHARACTERS.filter((c) =>
      (src === "All" || c.source_text === src) &&
      (ql === "" || c.name.toLowerCase().includes(ql) || c.one_line.toLowerCase().includes(ql) ||
        (c.core_function ?? "").toLowerCase().includes(ql))
    );
  }, [ql, src, CHARACTERS]);

  const themes = useMemo(() => {
    return THEMES.filter((t) =>
      ql === "" ||
      QUESTION_FAMILY_LABELS[t.family].toLowerCase().includes(ql) ||
      t.one_line.toLowerCase().includes(ql)
    );
  }, [ql, THEMES]);

  const symbols = useMemo(() => {
    return SYMBOLS.filter((s) =>
      (src === "All" || s.source_text === src) &&
      (ql === "" || s.name.toLowerCase().includes(ql) || s.one_line.toLowerCase().includes(ql))
    );
  }, [ql, src, SYMBOLS]);

  const matrix = useMemo(() => {
    return COMPARATIVE_MATRIX.filter((m) =>
      ql === "" ||
      m.axis.toLowerCase().includes(ql) ||
      m.hard_times.toLowerCase().includes(ql) ||
      m.atonement.toLowerCase().includes(ql) ||
      m.divergence.toLowerCase().includes(ql)
    );
  }, [ql, COMPARATIVE_MATRIX]);

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
                <span className="meta-mono">{qm.level_tag.replace("_", " ")}</span>
              </div>
              <p className="font-serif italic text-base leading-snug mb-2">"{qm.quote_text}"</p>
              <p className="text-xs text-ink-muted mb-2"><b className="text-ink font-mono uppercase tracking-wider text-[10px]">Method</b> · {qm.method}</p>
              <p className="text-xs text-ink-muted leading-relaxed mb-3">{qm.effect_prompt}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {qm.best_themes.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t]}</span>
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
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t]}</span>
                ))}
              </div>
            </article>
          );})}
          {chars.length === 0 && <p className="text-sm text-ink-muted italic col-span-full">No characters match.</p>}
        </div>
      )}

      {tab === "themes" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {themes.map((t) => (
            <article key={t.id} className="border border-rule bg-paper rounded-sm shadow-card p-4 flex flex-col">
              <p className="label-eyebrow mb-1">Theme family</p>
              <h3 className="font-serif text-lg mb-1">{QUESTION_FAMILY_LABELS[t.family]}</h3>
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
                    <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t]}</span>
                  ))}
                </div>
              </article>
            );
          })}
          {symbols.length === 0 && <p className="text-sm text-ink-muted italic col-span-full">No symbols match.</p>}
        </div>
      )}

      {tab === "matrix" && (
        <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-3">
          {matrix.map((m) => (
            <article key={m.id} className="border border-rule bg-paper rounded-sm shadow-card p-4">
              <p className="label-eyebrow mb-1">Comparative axis</p>
              <h3 className="font-serif text-lg mb-3">{m.axis}</h3>
              <dl className="text-xs leading-relaxed space-y-1.5 mb-3">
                <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Hard Times · </dt><dd className="inline text-ink-muted">{m.hard_times}</dd></div>
                <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Atonement · </dt><dd className="inline text-ink-muted">{m.atonement}</dd></div>
                <div><dt className="font-mono uppercase tracking-wider text-[10px] text-ink inline">Divergence · </dt><dd className="inline text-ink-muted">{m.divergence}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-1">
                {m.themes.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">{QUESTION_FAMILY_LABELS[t]}</span>
                ))}
              </div>
            </article>
          ))}
          {matrix.length === 0 && <p className="text-sm text-ink-muted italic col-span-full">No comparative entries match.</p>}
        </div>
      )}
    </div>
  );
}
