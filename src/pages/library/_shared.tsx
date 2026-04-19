import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function LibraryPageHeader({
  eyebrow,
  title,
  description,
  total,
  shown,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  total?: number;
  shown?: number;
}) {
  return (
    <header className="mb-6">
      <Link to="/library" className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-3 font-mono">
        <ChevronLeft className="h-3 w-3" />
        Library
      </Link>
      <p className="label-eyebrow mb-1">{eyebrow}</p>
      <h1 className="font-serif text-3xl lg:text-4xl mb-2">{title}</h1>
      {description && <p className="text-sm text-ink-muted max-w-3xl leading-relaxed">{description}</p>}
      {typeof total === "number" && (
        <p className="meta-mono mt-3">
          {typeof shown === "number" && shown !== total ? `${shown} of ${total}` : `${total}`} entries
        </p>
      )}
    </header>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-rule-strong bg-paper rounded-sm px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-card"
    />
  );
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  labelize,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelize?: (v: T) => string;
}) {
  return (
    <div className="inline-flex flex-wrap border border-rule rounded-sm overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-2 text-xs font-mono border-r border-rule last:border-r-0 transition-colors ${
            value === opt ? "bg-primary text-primary-foreground" : "bg-paper hover:bg-paper-dim"
          }`}
        >
          {labelize ? labelize(opt) : opt}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-ink-muted italic col-span-full py-8 text-center">{children}</p>;
}

export function sourceAccent(source: string) {
  if (source === "Hard Times") return "accent-bar-hard-times";
  if (source === "Atonement") return "accent-bar-atonement";
  return "";
}
