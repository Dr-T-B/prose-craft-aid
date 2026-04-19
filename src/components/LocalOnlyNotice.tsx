import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const DISMISS_KEY = "c2p.localOnlyNotice.dismissed.v1";

/**
 * Calm, non-blocking notice shown to anonymous users near Save controls.
 * Clarifies that work is persisted to localStorage only and points to sign-in
 * for cross-device persistence. Dismissible per-browser.
 *
 * No backend or RLS changes — purely informational.
 */
export function LocalOnlyNotice({ className = "" }: { className?: string }) {
  const { user, loading } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  if (loading || user || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <div
      role="status"
      className={`flex flex-wrap items-start gap-3 border border-rule rounded-sm bg-paper-dim px-4 py-3 text-xs text-ink-muted ${className}`}
    >
      <div className="flex-1 min-w-[16rem] leading-relaxed">
        <p className="text-ink">Your work is currently saved locally on this device.</p>
        <p className="mt-0.5">Sign in to save and access your plans across devices.</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/auth"
          className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-sm hover:bg-primary/90 transition-colors"
        >
          Sign in
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="px-3 py-1.5 border border-rule-strong text-xs font-medium bg-paper rounded-sm hover:bg-paper-dim"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
