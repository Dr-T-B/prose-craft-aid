import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useContent } from "@/lib/ContentProvider";
import type { SourceText } from "@/data/seed";

const TEXTS: { id: SourceText; title: string; author: string; year: string; form: string; blurb: string }[] = [
  {
    id: "Hard Times",
    title: "Hard Times",
    author: "Charles Dickens",
    year: "1854",
    form: "Novel",
    blurb:
      "A satirical indictment of industrial utilitarianism: Gradgrind's Coketown is a machine that crushes imagination, childhood, and human feeling under the weight of Facts.",
  },
  {
    id: "Atonement",
    title: "Atonement",
    author: "Ian McEwan",
    year: "2001",
    form: "Novel",
    blurb:
      "A novel about storytelling, guilt, and the limits of fiction's power to repair: Briony Tallis rewrites history, and the cost of that revision haunts every page.",
  },
];

export default function Learn() {
  const { quote_methods, themes } = useContent();

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
      <header className="mb-12 max-w-3xl">
        <p className="label-eyebrow mb-3 text-primary">Discipline I</p>
        <h1 className="font-serif text-4xl lg:text-5xl mb-4">Learn</h1>
        <p className="font-serif text-lg text-ink-muted leading-relaxed">
          Read the texts in their own register. Each work opens onto its quotes,
          themes and contexts — sequenced for unhurried study.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {TEXTS.map((t) => {
          const qc = quote_methods.filter((q) => q.source_text === t.id).length;
          const tc = themes.filter((th) => th.family !== undefined).length;

          return (
            <Link
              key={t.id}
              to="/library"
              className="group block bg-paper border border-rule rounded-sm p-8 shadow-card hover:border-primary/60 hover:shadow-md transition-all"
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                {t.form} · {t.year}
              </p>
              <h2 className="font-serif text-3xl mt-2">{t.title}</h2>
              <p className="font-serif italic text-ink-muted">{t.author}</p>
              <p className="mt-5 text-sm text-ink-muted leading-relaxed">{t.blurb}</p>
              <div className="mt-6 flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-ink-muted">
                <span>{qc} quotes</span>
                <span>{tc} themes</span>
                <span className="ml-auto inline-flex items-center gap-1 text-primary">
                  Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <section className="mt-16 border-t border-rule pt-10">
        <h2 className="font-serif text-2xl mb-6">Where to go from here</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { to: "/library/quotes", label: "Quote bank", desc: "Search and inspect every quote with method and effect." },
            { to: "/library/context", label: "Characters & symbols", desc: "Contextual cards for characters, symbols and theme families." },
            { to: "/library/comparison", label: "Comparative axes", desc: "Side-by-side analysis of both texts on each thematic axis." },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="block border border-rule bg-paper rounded-sm p-4 hover:border-primary/60 transition-colors"
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-primary mb-1">{l.label}</p>
              <p className="text-ink-muted leading-relaxed">{l.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
