import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import type { QuoteMethod } from "@/data/seed";
import { fetchQuotesForQuestion, fetchQuotesForRoute } from "@/lib/planFetches";

export interface QuotePickerProps {
  questionId: string;
  routeThemes: string[];
  sourceText: "Hard Times" | "Atonement";
  selectedQuoteId: string | null;
  onSelect: (quote: QuoteMethod) => void;
  excludeQuoteIds?: string[];
}

export default function QuotePicker({
  questionId,
  routeThemes,
  sourceText,
  selectedQuoteId,
  onSelect,
  excludeQuoteIds = [],
}: QuotePickerProps) {
  const [quotes, setQuotes] = useState<QuoteMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const themesKey = routeThemes.join(",");
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    setLoading(true);
    setQuotes([]);

    (async () => {
      const primary = await fetchQuotesForQuestion(questionId, sourceText);
      let results = primary;

      if (results.length < 5) {
        const primaryIds = results.map((q) => q.id);
        const fallback = await fetchQuotesForRoute(routeThemes, sourceText, primaryIds);
        const seen = new Set(primaryIds);
        for (const q of fallback) {
          if (!seen.has(q.id)) { seen.add(q.id); results = [...results, q]; }
        }
      }

      if (!cancelRef.current) {
        setQuotes(results);
        setLoading(false);
      }
    })();

    return () => { cancelRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, sourceText, themesKey]);

  const selectedQuote = useMemo(
    () => quotes.find((q) => q.id === selectedQuoteId) ?? null,
    [quotes, selectedQuoteId],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return quotes.filter(
      (quote) =>
        !excludeQuoteIds.includes(quote.id) &&
        (!q ||
          quote.quote_text.toLowerCase().includes(q) ||
          quote.method.toLowerCase().includes(q) ||
          (quote.effect_prompt ?? "").toLowerCase().includes(q)),
    );
  }, [quotes, search, excludeQuoteIds]);

  const copyText = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
  };

  if (loading) {
    return <p className="text-xs text-ink-muted animate-pulse py-2">Loading {sourceText} quotes…</p>;
  }

  if (quotes.length === 0) {
    return (
      <p className="text-xs text-ink-muted italic py-2">
        No quotes found for this question.{" "}
        <a href="/library/quotes" className="underline hover:text-ink">Browse the quote bank →</a>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Selected quote — compact card */}
      {selectedQuote && (
        <div className="border border-primary bg-highlight/30 rounded-sm p-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-serif italic text-sm leading-snug line-clamp-2">
              &ldquo;{selectedQuote.quote_text}&rdquo;
            </p>
            <p className="text-xs text-ink-muted mt-0.5">{selectedQuote.method}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedQuote.opening_stems?.[0] && (
              <button
                onClick={() => copyText(selectedQuote.opening_stems![0])}
                title="Copy opening stem"
                className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink border border-rule rounded-sm px-1.5 py-0.5"
              >
                <Copy className="h-3 w-3" />
                Stem
              </button>
            )}
            <button
              onClick={() => onSelect(selectedQuote)}
              className="text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search ${sourceText === "Hard Times" ? "HT" : "AT"} quotes or methods…`}
        className="border border-rule rounded-sm px-3 py-1.5 text-xs bg-paper focus:outline-none focus:border-primary w-full"
      />

      {/* Quote list */}
      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <p className="text-xs text-ink-muted italic py-2">No quotes match your search.</p>
        )}

        {filtered.map((quote) => {
          const isSelected = quote.id === selectedQuoteId;
          const isExpanded = expandedId === quote.id;

          return (
            <div
              key={quote.id}
              className={`border rounded-sm text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-highlight/20"
                  : "border-rule bg-paper hover:border-rule-strong"
              }`}
            >
              <div className="p-3">
                {/* Quote text + badges */}
                <div className="flex items-start gap-2 mb-1.5">
                  <p className={`font-serif italic leading-snug flex-1 min-w-0 ${isExpanded ? "" : "line-clamp-2"}`}>
                    &ldquo;{quote.quote_text}&rdquo;
                  </p>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {quote.is_core_quote && (
                      <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-sm">
                        Core
                      </span>
                    )}
                    {quote.grade_priority === "A*" && (
                      <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/30 rounded-sm">
                        A*
                      </span>
                    )}
                  </div>
                </div>

                {/* Method + controls */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs text-ink-muted">{quote.method}</span>
                    {quote.location_reference && (
                      <span className="text-xs text-ink-muted ml-2">· {quote.location_reference}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                      className="text-[10px] font-mono text-ink-muted hover:text-ink inline-flex items-center gap-0.5"
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {isExpanded ? "Less" : "More"}
                    </button>
                    <button
                      onClick={() => onSelect(quote)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border transition-colors ${
                        isSelected
                          ? "border-primary text-primary bg-highlight/30"
                          : "border-rule text-ink-muted hover:border-rule-strong hover:text-ink"
                      }`}
                    >
                      {isSelected ? "Selected ✓" : "Select"}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-rule flex flex-col gap-1.5">
                    {quote.effect_prompt && (
                      <p className="text-xs text-ink-muted leading-relaxed">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-ink">Effect · </span>
                        {quote.effect_prompt}
                      </p>
                    )}
                    {quote.opening_stems?.[0] && (
                      <div className="flex items-start gap-2">
                        <p className="text-xs leading-relaxed flex-1">
                          <span className="font-mono text-[10px] uppercase tracking-wider">Stem · </span>
                          {quote.opening_stems[0]}
                        </p>
                        <button
                          onClick={() => copyText(quote.opening_stems![0])}
                          className="shrink-0 text-ink-muted hover:text-ink mt-0.5"
                          title="Copy stem"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {quote.comparative_prompts?.[0] && (
                      <p className="text-xs text-ink-muted leading-relaxed">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-ink">AO4 · </span>
                        {quote.comparative_prompts[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
