import { Link } from "react-router-dom";
import { useContent } from "@/lib/ContentProvider";
import { BookOpen, HelpCircle, FileText, GitCompare, Landmark } from "lucide-react";

const CATEGORIES = [
  {
    to: "/library/quotes",
    label: "Quotes",
    eyebrow: "Evidence",
    blurb: "Search the quote bank by text, source, theme or method. Inspect each quote with its method and effect.",
    icon: BookOpen,
    countKey: "quote_methods" as const,
    unit: "quotes",
  },
  {
    to: "/library/questions",
    label: "Questions",
    eyebrow: "Question bank",
    blurb: "Browse exam-style questions by family and level. Read the stem and the methods most likely to support it.",
    icon: HelpCircle,
    countKey: "questions" as const,
    unit: "questions",
  },
  {
    to: "/library/thesis",
    label: "Thesis & Paragraph",
    eyebrow: "Argument structure",
    blurb: "Read worked theses and the paragraph jobs that build them. Filter by route, theme and level.",
    icon: FileText,
    countKey: "theses" as const,
    unit: "theses",
  },
  {
    to: "/library/comparison",
    label: "Comparison",
    eyebrow: "Across the texts",
    blurb: "Compare Hard Times and Atonement axis by axis — convergence, divergence and the comparative insight.",
    icon: GitCompare,
    countKey: "comparative_matrix" as const,
    unit: "axes",
  },
  {
    to: "/library/context",
    label: "Context",
    eyebrow: "AO3 anchors",
    blurb: "Characters, symbols, theme families and AO5 tensions — the contextual furniture of each text.",
    icon: Landmark,
    countKey: "characters" as const,
    unit: "characters",
  },
];

export default function Library() {
  const content = useContent();
  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 lg:py-12">
      <header className="mb-8 max-w-3xl">
        <p className="label-eyebrow mb-2">Explore mode</p>
        <h1 className="font-serif text-3xl lg:text-4xl mb-3">Library</h1>
        <p className="text-sm lg:text-base text-ink-muted leading-relaxed">
          Browse the academic resources directly. Explore mode is for reading, filtering and printing the
          evidence banks that support essay construction in Build mode.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = (content[cat.countKey] as unknown[])?.length ?? 0;
          return (
            <Link
              key={cat.to}
              to={cat.to}
              className="group border border-rule bg-paper rounded-sm shadow-card p-5 flex flex-col hover:border-primary/60 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                <span className="meta-mono">{count} {cat.unit}</span>
              </div>
              <p className="label-eyebrow mb-1">{cat.eyebrow}</p>
              <h2 className="font-serif text-xl mb-2 group-hover:text-primary transition-colors">{cat.label}</h2>
              <p className="text-sm text-ink-muted leading-relaxed">{cat.blurb}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
