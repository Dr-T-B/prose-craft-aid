import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  QUOTE_METHODS, CHARACTERS, THEMES, QUESTION_FAMILY_LABELS,
  type SourceText,
} from "@/data/seed";
import { queueQuoteForBuilder } from "@/lib/planStore";

type Tab = "quotes" | "characters" | "themes";
const SOURCES: (SourceText | "All")[] = ["All", "Hard Times", "Atonement", "Comparative"];

export default function RetrievalToolkit() {
  const [tab, setTab] = useState<Tab>("quotes");
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<SourceText | "All">("All");
  const navigate = useNavigate();

  const ql = q.trim().toLowerCase();

  const quotes = useMemo(() => {
    return QUOTE_METHODS.filter((qm) =>
      (src === "All" || qm.source_text === src) &&
      (ql === "" ||
        qm.quote_text.toLowerCase().includes(ql) ||
        qm.method.toLowerCase().includes(ql) ||
        qm.best_themes.some((t) => QUESTION_FAMILY_LABELS[t].toLowerCase().includes(ql)))
    );
  }, [ql, src]);

  const chars = useMemo(() => {
    return CHARACTERS.filter((c) =>
      (src === "All" || c.source_text === src) &&
      (ql === "" || c.name.toLowerCase().includes(ql) || c.one_line.toLowerCase().includes(ql))
    );
  }, [ql, src]);

  const themes = useMemo(() => {
    return THEMES.filter((t) =>
      ql === "" ||
      QUESTION_FAMILY_LABELS[t.family].toLowerCase().includes(ql) ||
      t.one_line.toLowerCase().includes(ql)
    );
  }, [ql]);

  const sendToBuilder = (id: string) => {
    queueQuoteForBuilder(id);
    toast.success("Quote queued — opening builder");
    navigate("/builder");
  };

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
          placeholder="Search quotes, methods, characters, themes…"
          className="flex-1 border border-ink bg-white px-3 py-2 text-sm outline-none focus:shadow-press"
        />
        {tab !== "themes" && (
          <div className="inline-flex border border-rule">
            {SOURCES.map((s) => (
              <button
                key={s}
                onClick={() => setSrc(s)}
                className={`px-3 py-2 text-xs font-medium border-r border-rule last:border-r-0 ${
                  src === s ? "bg-ink text-paper" : "bg-white hover:bg-paper-dim"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-rule mb-5">
        {(["quotes", "characters", "themes"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Body */}
      {tab === "quotes" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quotes.map((qm) => (
            <article key={qm.id} className="border border-rule bg-white p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="label-eyebrow">{qm.source_text}</span>
                <span className="text-[10px] uppercase tracking-wider text-ink-muted">{qm.level_tag.replace("_", " ")}</span>
              </div>
              <p className="font-serif italic text-base leading-snug mb-2">"{qm.quote_text}"</p>
              <p className="text-xs text-ink-muted mb-2"><b className="text-ink">Method:</b> {qm.method}</p>
              <p className="text-xs text-ink-muted leading-relaxed mb-3">{qm.effect_prompt}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {qm.best_themes.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 border border-rule bg-paper">{QUESTION_FAMILY_LABELS[t]}</span>
                ))}
              </div>
              <button
                onClick={() => sendToBuilder(qm.id)}
                className="mt-auto self-start text-xs font-medium px-3 py-1.5 border border-ink bg-white hover:bg-paper-dim"
              >
                Send to builder →
              </button>
            </article>
          ))}
          {quotes.length === 0 && <p className="text-sm text-ink-muted italic col-span-full">No quotes match.</p>}
        </div>
      )}

      {tab === "characters" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {chars.map((c) => (
            <article key={c.id} className="border border-rule bg-white p-4">
              <p className="label-eyebrow mb-1">{c.source_text}</p>
              <h3 className="font-serif text-lg mb-1">{c.name}</h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-3">{c.one_line}</p>
              <div className="flex flex-wrap gap-1">
                {c.themes.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 border border-rule bg-paper">{QUESTION_FAMILY_LABELS[t]}</span>
                ))}
              </div>
            </article>
          ))}
          {chars.length === 0 && <p className="text-sm text-ink-muted italic col-span-full">No characters match.</p>}
        </div>
      )}

      {tab === "themes" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {themes.map((t) => (
            <article key={t.id} className="border border-rule bg-white p-4">
              <h3 className="font-serif text-lg mb-1">{QUESTION_FAMILY_LABELS[t.family]}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{t.one_line}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
