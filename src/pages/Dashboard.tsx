import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getCurrentPlan, listSavedPlans, getLastSession, hasMeaningfulPlan,
  type EssayPlan, type TimedSession,
} from "@/lib/planStore";
import { getQuestion, getRoute, findThesis } from "@/lib/planLogic";

type FocusState = "empty" | "plan_no_session" | "session_exists";

const Dashboard = () => {
  const [current, setCurrent] = useState<EssayPlan | null>(null);
  const [recent, setRecent] = useState<EssayPlan[]>([]);
  const [session, setSession] = useState<TimedSession | null>(null);

  useEffect(() => {
    const cur = getCurrentPlan();
    setCurrent(hasMeaningfulPlan(cur) ? cur : null);
    setRecent(listSavedPlans().slice(0, 3));
    setSession(getLastSession());
  }, []);

  const focusState: FocusState =
    session ? "session_exists"
    : (current || recent.length > 0) ? "plan_no_session"
    : "empty";

  const focus = {
    empty: {
      eyebrow: "Start here",
      title: "Build your first essay plan.",
      body: "Pick a question family, take a route, and let the builder shape your thesis and paragraph jobs.",
      cta: { to: "/builder", label: "Build essay plan →" },
    },
    plan_no_session: {
      eyebrow: "Next step",
      title: "Turn your latest plan into timed writing.",
      body: "You have a plan ready. Take it into a 12-minute paragraph and prove the argument under pressure.",
      cta: { to: "/timed", label: "Start 12-minute paragraph →" },
    },
    session_exists: {
      eyebrow: "Continue",
      title: "Review and improve your last response.",
      body: "Open your last timed writing, check the reflection, then rebuild a tighter paragraph from the same plan.",
      cta: { to: "/timed", label: "Open timed practice →" },
    },
  }[focusState];

  const continueQ = current ? getQuestion(current.question_id) : undefined;
  const continueR = current ? getRoute(current.route_id) : undefined;

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
      <header className="mb-10">
        <p className="label-eyebrow mb-2">Pearson Edexcel · A-Level English Literature</p>
        <h1 className="font-serif text-4xl lg:text-5xl tracking-tight">Today's focus</h1>
      </header>

      {/* TODAY'S FOCUS — single hero card */}
      <section className="border border-rule bg-paper p-6 lg:p-8 rounded-sm shadow-card mb-6">
        <p className="label-eyebrow mb-3">{focus.eyebrow}</p>
        <h2 className="font-serif text-2xl lg:text-[28px] mb-3 leading-snug text-balance max-w-[36ch]">
          {focus.title}
        </h2>
        <p className="text-ink-muted text-sm leading-relaxed mb-6 max-w-prose">
          {focus.body}
        </p>
        <Link
          to={focus.cta.to}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:bg-primary/90 shadow-card transition-colors"
        >
          {focus.cta.label}
        </Link>
      </section>

      {/* 3 primary actions */}
      <section className="grid sm:grid-cols-3 gap-3 mb-6">
        <ActionTile to="/builder" num="01" title="Build essay" sub="Question → route → thesis → paragraphs." />
        <ActionTile to="/timed" num="02" title="Start 12-minute paragraph" sub="Tightest, fastest practice mode." />
        <ActionTile to="/toolkit" num="03" title="Open retrieval toolkit" sub="Quotes, characters, themes." />
      </section>

      {/* Continue last plan — only if state exists */}
      {current && continueQ && (
        <section className="border border-rule bg-paper-dim/40 p-5 rounded-sm mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <p className="label-eyebrow mb-1">Continue last plan</p>
              <p className="font-serif text-lg leading-snug truncate">{continueQ.stem}</p>
              <p className="meta-mono mt-1">
                {continueR?.name ?? "no route yet"} · {current.thesis_level}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link to="/builder" className="px-3 py-1.5 text-xs font-mono border border-rule-strong rounded-sm bg-paper hover:bg-paper-dim">
                Resume in builder
              </Link>
              <Link to="/timed" className="px-3 py-1.5 text-xs font-mono border border-primary text-primary rounded-sm bg-paper hover:bg-highlight">
                Take to timed →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Recent saved plans — only if any */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between border-b border-rule pb-2 mb-4">
            <h2 className="font-serif text-xl">Saved plans</h2>
            <span className="meta-mono">{recent.length} most recent</span>
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recent.map((p) => {
              const q = getQuestion(p.question_id);
              const r = getRoute(p.route_id);
              const t = findThesis(p.route_id, p.family, p.thesis_level);
              return (
                <li key={p.id} className="border border-rule rounded-sm bg-paper p-4 hover:border-rule-strong transition-colors">
                  <p className="meta-mono mb-1">{new Date(p.updated_at).toLocaleDateString()}</p>
                  <p className="text-sm font-medium line-clamp-2">{q?.stem ?? "Untitled plan"}</p>
                  <p className="text-xs text-ink-muted mt-2 line-clamp-2">
                    {r?.name}{t ? ` · ${p.thesis_level}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
};

function ActionTile({ to, num, title, sub }: { to: string; num: string; title: string; sub: string }) {
  return (
    <Link
      to={to}
      className="group border border-rule rounded-sm bg-paper p-5 hover:border-primary hover:shadow-card transition-all"
    >
      <p className="meta-mono mb-2">{num}</p>
      <p className="font-serif text-lg leading-snug mb-1 group-hover:text-primary transition-colors">{title}</p>
      <p className="text-xs text-ink-muted leading-relaxed">{sub}</p>
    </Link>
  );
}

export default Dashboard;
