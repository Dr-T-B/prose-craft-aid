import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useContent } from "@/lib/ContentProvider";
import {
  comparativePairingMatchesText,
  getLibraryThemeLabel,
  toLibraryComparativePairings,
  type LibraryComparativePairing,
  type LibraryThemeId,
} from "@/lib/libraryAdapters";
import { handoffFromComparison, queueBuilderHandoff } from "@/lib/builderHandoff";
import { LibraryPageHeader, SearchInput, PrintButton, EmptyState, UseInBuilderButton } from "./_shared";

function ComparativePairingCard({ pairing, onUse }: { pairing: LibraryComparativePairing; onUse: (pairing: LibraryComparativePairing) => void }) {
  return (
    <article className="border border-rule bg-paper rounded-sm shadow-card p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="label-eyebrow">Comparative axis</p>
        <UseInBuilderButton onClick={() => onUse(pairing)} />
      </div>
      <h2 className="font-serif text-xl mb-4">{pairing.title}</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="border-l-2 pl-3" style={{ borderColor: "hsl(var(--hard-times))" }}>
          <p className="font-mono uppercase tracking-wider text-[10px] text-ink mb-1">Hard Times</p>
          <p className="text-sm text-ink-muted leading-relaxed">{pairing.hardTimesIdea}</p>
        </div>
        <div className="border-l-2 pl-3" style={{ borderColor: "hsl(var(--atonement))" }}>
          <p className="font-mono uppercase tracking-wider text-[10px] text-ink mb-1">Atonement</p>
          <p className="text-sm text-ink-muted leading-relaxed">{pairing.atonementIdea}</p>
        </div>
      </div>
      <div className="border-t border-rule pt-3">
        <p className="font-mono uppercase tracking-wider text-[10px] text-ink mb-1">Comparative tension</p>
        <p className="text-sm text-ink-muted leading-relaxed mb-3">{pairing.comparativeTension}</p>
        <div className="flex flex-wrap gap-1 empty:hidden">
          {pairing.themes.map((theme) => (
            <span key={theme} className="text-[10px] font-mono px-1.5 py-0.5 border border-rule rounded-sm bg-paper-dim/60">
              {getLibraryThemeLabel(theme)}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function LibraryComparison() {
  const { comparative_matrix } = useContent();
  const navigate = useNavigate();
  const pairings = useMemo(() => toLibraryComparativePairings(comparative_matrix), [comparative_matrix]);
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<"All" | LibraryThemeId>("All");

  const familyOptions = useMemo<("All" | LibraryThemeId)[]>(() => {
    const set = new Set<LibraryThemeId>();
    pairings.forEach((pairing) => pairing.themes.forEach((theme) => set.add(theme)));
    return ["All", ...Array.from(set)];
  }, [pairings]);

  const ql = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    return pairings.filter((pairing) => {
      if (family !== "All" && !pairing.themes.includes(family)) return false;
      return comparativePairingMatchesText(pairing, ql);
    });
  }, [pairings, ql, family]);

  const useInBuilder = (pairing: LibraryComparativePairing) => {
    queueBuilderHandoff(handoffFromComparison(pairing));
    toast.success("Comparison sent to Builder");
    navigate("/builder");
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 lg:py-12 library-print">
      <div className="flex items-start justify-between gap-4">
        <LibraryPageHeader
          eyebrow="Across the texts"
          title="Comparison"
          description="The comparative matrix — Hard Times alongside Atonement, axis by axis, with the divergence that earns marks at AO4."
          total={pairings.length}
          shown={filtered.length}
        />
        <div className="shrink-0 pt-2">
          <PrintButton />
        </div>
      </div>

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
              {f === "All" ? "All themes" : getLibraryThemeLabel(f)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((pairing) => <ComparativePairingCard key={pairing.id} pairing={pairing} onUse={useInBuilder} />)}
        {filtered.length === 0 && <EmptyState>No comparative axes match your filters.</EmptyState>}
      </div>
    </div>
  );
}
