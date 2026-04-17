import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { TIMED_MODES, QUOTE_METHODS } from "@/data/seed";
import { useCurrentPlan, saveTimedSession } from "@/lib/planStore";
import {
  getQuestion, getRoute, findThesis, resolveParagraphJobs, renderPlanText,
} from "@/lib/planLogic";

const REFLECTION = [
  "Answered the wording of the question?",
  "Comparison integrated, not bolted on?",
  "Method analysed (not just identified)?",
  "Ended with a judgement clause?",
];

export default function TimedPractice() {
  const { plan } = useCurrentPlan();
  const q = getQuestion(plan.question_id);
  const r = getRoute(plan.route_id);
  const t = findThesis(plan.route_id, plan.family, plan.thesis_level);
  const jobs = resolveParagraphJobs(plan.family, plan.route_id, t);
  const quotes = QUOTE_METHODS.filter((qm) => plan.selected_quote_ids.includes(qm.id));

  const defaultMode = TIMED_MODES.find((m) => m.id === "tm_12")?.id ?? TIMED_MODES[0].id;
  const [modeId, setModeId] = useState(defaultMode);
  const mode = useMemo(() => TIMED_MODES.find((m) => m.id === modeId)!, [modeId]);

  const [secondsLeft, setSecondsLeft] = useState(mode.duration_minutes * 60);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState("");
  const [reflection, setReflection] = useState<Record<string, boolean>>({});
  const [firstFail, setFirstFail] = useState("");
  const [phase, setPhase] = useState<"setup" | "writing" | "reflect">("setup");
  const tickRef = useRef<number | null>(null);
  const responseRef = useRef(response);
  const reflectionRef = useRef(reflection);
  const firstFailRef = useRef(firstFail);
  useEffect(() => { responseRef.current = response; }, [response]);
  useEffect(() => { reflectionRef.current = reflection; }, [reflection]);
  useEffect(() => { firstFailRef.current = firstFail; }, [firstFail]);

  // Reset timer when mode changes (only in setup)
  useEffect(() => {
    if (phase === "setup") setSecondsLeft(mode.duration_minutes * 60);
  }, [mode, phase]);

  const persistSession = (resp: string, refl: Record<string, boolean>, fail: string) => {
    saveTimedSession({
      id: `sess_${Date.now()}`,
      plan_id: plan.id,
      mode_id: mode.id,
      created_at: Date.now(),
      response: resp,
      reflection: refl,
      first_failure: fail,
    });
  };

  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(tickRef.current!);
          setRunning(false);
          setPhase("reflect");
          // Auto-save in-progress session so nothing is lost on natural expiry
          persistSession(responseRef.current, reflectionRef.current, firstFailRef.current);
          toast.message("Time's up — your response was saved. Reflect below.");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const start = () => { setPhase("writing"); setRunning(true); };
  const pause = () => setRunning(false);
  const resume = () => setRunning(true);
  const finish = () => { setRunning(false); setPhase("reflect"); persistSession(response, reflection, firstFail); };
  const reset = () => {
    setRunning(false); setSecondsLeft(mode.duration_minutes * 60);
    setResponse(""); setReflection({}); setFirstFail(""); setPhase("setup");
  };

  const exportSession = async () => {
    const planText = renderPlanText(plan);
    const refLines = REFLECTION.map((r) => `${reflection[r] ? "[x]" : "[ ]"} ${r}`).join("\n");
    const out = [
      "TIMED PRACTICE SESSION",
      `Mode: ${mode.label}`,
      "",
      planText,
      "",
      "RESPONSE",
      response || "(empty)",
      "",
      "REFLECTION",
      refLines,
      `First failure point: ${firstFail || "(none noted)"}`,
    ].join("\n");
    persistSession(response, reflection, firstFail);
    try {
      await navigator.clipboard.writeText(out);
      toast.success("Session copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 lg:py-12">
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="label-eyebrow mb-1">Practice</p>
          <h1 className="font-serif text-3xl lg:text-4xl">Timed writing</h1>
        </div>
        <Link to="/builder" className="text-xs underline text-ink-muted hover:text-ink">← Back to builder</Link>
      </header>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        {/* Main column */}
        <section className="flex flex-col gap-6">
          {/* Mode + timer */}
          <div className="border border-rule bg-paper p-5 rounded-sm shadow-card">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-wrap gap-2">
                {TIMED_MODES.map((m) => (
                  <button
                    key={m.id}
                    disabled={phase !== "setup"}
                    onClick={() => setModeId(m.id)}
                    className={`px-3 py-1.5 text-xs font-mono border rounded-sm transition-colors ${
                      modeId === m.id ? "border-primary bg-highlight text-ink" : "border-rule bg-paper hover:border-rule-strong"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="font-mono text-4xl tabular-nums tracking-tight text-primary">{mm}:{ss}</div>
            </div>
            <p className="text-xs text-ink-muted mt-3 font-mono">{mode.expected_output} — {mode.focus}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {phase === "setup" && (
                <button onClick={start} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-sm shadow-card hover:bg-primary/90">Start</button>
              )}
              {phase === "writing" && running && (
                <button onClick={pause} className="px-4 py-2 border border-rule-strong text-sm font-medium bg-paper rounded-sm hover:bg-paper-dim">Pause</button>
              )}
              {phase === "writing" && !running && (
                <button onClick={resume} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-sm">Resume</button>
              )}
              {phase === "writing" && (
                <button onClick={finish} className="px-4 py-2 border border-rule-strong text-sm font-medium bg-paper rounded-sm hover:bg-paper-dim">Finish early</button>
              )}
              {phase !== "setup" && (
                <button onClick={reset} className="px-4 py-2 border border-rule text-sm font-medium bg-paper rounded-sm hover:bg-paper-dim">Reset</button>
              )}
            </div>
          </div>

          {/* Writing area */}
          {phase !== "setup" && (
            <div className="border border-rule bg-paper rounded-sm shadow-card">
              <div className="px-4 py-2 border-b border-rule bg-paper-dim/50 flex items-center justify-between">
                <span className="label-eyebrow">Response</span>
                <span className="meta-mono">{response.trim().split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                disabled={phase === "reflect"}
                placeholder="Write your response here…"
                className="w-full min-h-[420px] p-5 font-sans text-base leading-relaxed bg-paper outline-none resize-y disabled:bg-paper-dim/40"
              />
            </div>
          )}

          {/* Reflection */}
          {phase === "reflect" && (
            <div className="border border-rule bg-paper p-5 rounded-sm shadow-card">
              <p className="label-eyebrow mb-3">Reflection checklist</p>
              <ul className="flex flex-col gap-2">
                {REFLECTION.map((r) => (
                  <li key={r}>
                    <label className="flex items-start gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!reflection[r]}
                        onChange={(e) => setReflection({ ...reflection, [r]: e.target.checked })}
                        className="mt-0.5 size-4 accent-primary"
                      />
                      <span>{r}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <label className="block mt-4">
                <span className="label-eyebrow">First failure point</span>
                <input
                  value={firstFail}
                  onChange={(e) => setFirstFail(e.target.value)}
                  placeholder="e.g. lost comparison in §2"
                  className="mt-1 w-full border-b border-rule-strong bg-transparent py-1.5 text-sm outline-none focus:border-primary"
                />
              </label>
              <div className="mt-4 flex gap-2">
                <button onClick={exportSession} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-sm shadow-card hover:bg-primary/90">
                  Copy session
                </button>
                <button onClick={reset} className="px-4 py-2 border border-rule text-sm font-medium bg-paper rounded-sm hover:bg-paper-dim">New session</button>
              </div>
            </div>
          )}
        </section>

        {/* Plan rail */}
        <aside className="border border-rule bg-paper p-5 rounded-sm h-fit lg:sticky lg:top-24">
          <p className="label-eyebrow mb-3">Your plan</p>
          {!q ? (
            <div className="text-sm text-ink-muted">
              <p className="mb-3">No plan loaded yet. You can still write freely below, but you'll get more from a built plan.</p>
              <p className="meta-mono mb-1">Suggested fallback prompt</p>
              <p className="text-[13px] leading-relaxed text-ink">
                Take any class, guilt or truth question. Build one paragraph that names the
                Hard Times moment, mirrors it with an Atonement moment, marks the divergence,
                and ends with a one-sentence judgement.
              </p>
              <Link to="/builder" className="mt-3 inline-block underline text-primary">Build a plan →</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <p className="label-eyebrow mb-1">Question</p>
                <p className="font-serif text-[15px] leading-snug">{q.stem}</p>
              </div>
              {r && <div><p className="label-eyebrow mb-1">Route</p><p>{r.name}</p></div>}
              {t && <div><p className="label-eyebrow mb-1">Thesis</p><p className="text-ink-muted text-[13px] leading-relaxed">{t.thesis_text}</p></div>}
              {jobs.length > 0 && (
                <div>
                  <p className="label-eyebrow mb-1">Paragraphs</p>
                  <ol className="flex flex-col gap-1">
                    {jobs.map((j, i) => <li key={j.id} className="text-[13px]"><b>§{i + 1}</b> {j.job_title}</li>)}
                  </ol>
                </div>
              )}
              {quotes.length > 0 && (
                <div>
                  <p className="label-eyebrow mb-1">Quotes</p>
                  <ul className="flex flex-col gap-1">
                    {quotes.map((qm) => (
                      <li key={qm.id} className="text-[13px] font-serif italic">"{qm.quote_text}"</li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.ao5_enabled && plan.selected_ao5_ids.length > 0 && (
                <div>
                  <p className="label-eyebrow mb-1">AO5</p>
                  <p className="text-[13px] text-ink-muted">{plan.selected_ao5_ids.length} tension{plan.selected_ao5_ids.length === 1 ? "" : "s"} included</p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
