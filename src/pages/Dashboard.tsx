import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { listSavedPlans, type EssayPlan } from "@/lib/planStore";
import { getQuestion, getRoute, findThesis, getThesisById } from "@/lib/planLogic";

const Dashboard = () => {
  const [recent, setRecent] = useState<EssayPlan[]>([]);
  useEffect(() => { setRecent(listSavedPlans().slice(0, 3)); }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
      <header className="mb-10">
        <p className="label-eyebrow mb-2">Pearson Edexcel · A-Level English Literature</p>
        <h1 className="font-serif text-4xl lg:text-5xl tracking-tight">Today's focus</h1>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's focus card */}
        <section className="lg:col-span-2 border border-rule bg-paper p-6 lg:p-8 rounded-sm shadow-card">
          <p className="label-eyebrow mb-3">Plan of the day</p>
          <h2 className="font-serif text-2xl lg:text-3xl mb-4 leading-snug text-balance">
            Build one paragraph that proves class operates as a mechanism, not a backdrop.
          </h2>
          <p className="text-ink-muted text-sm leading-relaxed mb-6 max-w-prose">
            Pick the class question, take the <em>Class as mechanism</em> route, write the
            12-minute paragraph using Stephen Blackpool against Robbie. End with a judgement
            clause about which novel is more damning.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/builder" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:bg-primary/90 shadow-card transition-colors">
              Build essay →
            </Link>
            <Link to="/timed" className="inline-flex items-center gap-2 px-4 py-2 border border-rule-strong text-sm font-medium bg-paper rounded-sm hover:bg-paper-dim">
              Start 12-minute paragraph
            </Link>
            <Link to="/toolkit" className="inline-flex items-center gap-2 px-4 py-2 border border-rule text-sm font-medium bg-paper rounded-sm hover:bg-paper-dim">
              Open retrieval toolkit
            </Link>
          </div>
        </section>

        {/* Quick actions */}
        <aside className="border border-rule bg-paper p-6 rounded-sm flex flex-col gap-4">
          <p className="label-eyebrow">Quick actions</p>
          <Link to="/builder" className="border border-rule rounded-sm p-4 hover:bg-paper-dim hover:border-rule-strong transition-colors">
            <p className="font-medium text-sm">New essay plan</p>
            <p className="text-xs text-ink-muted mt-1">Question → route → thesis → paragraphs.</p>
          </Link>
          <Link to="/timed" className="border border-rule rounded-sm p-4 hover:bg-paper-dim hover:border-rule-strong transition-colors">
            <p className="font-medium text-sm">Timed practice</p>
            <p className="text-xs text-ink-muted mt-1">12 / 25 / 35 / 75 min modes.</p>
          </Link>
          <Link to="/toolkit" className="border border-rule rounded-sm p-4 hover:bg-paper-dim hover:border-rule-strong transition-colors">
            <p className="font-medium text-sm">Retrieval toolkit</p>
            <p className="text-xs text-ink-muted mt-1">Quotes, characters, themes.</p>
          </Link>
        </aside>
      </div>

      {/* Continue / recent */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between border-b border-rule pb-2 mb-5">
          <h2 className="font-serif text-xl">Recent plans</h2>
          <Link to="/builder" className="label-eyebrow hover:text-ink">Continue building →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-muted italic">No saved plans yet. Save your first one from the Essay Builder.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((p) => {
              const q = getQuestion(p.question_id);
              const r = getRoute(p.route_id);
              const t = getThesisById(p.thesis_id) || findThesis(p.route_id, p.family, p.thesis_level);
              return (
                <li key={p.id} className="border border-rule bg-white p-4">
                  <p className="label-eyebrow mb-1">{new Date(p.updated_at).toLocaleDateString()}</p>
                  <p className="text-sm font-medium line-clamp-2">{q?.stem ?? "Untitled plan"}</p>
                  <p className="text-xs text-ink-muted mt-2 line-clamp-2">{r?.name}{t ? ` · ${p.thesis_level}` : ""}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
