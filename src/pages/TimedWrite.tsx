import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string
  question_id: string
  exam_year: number
  exam_session: string
  question_stem: string
  theme: string
  micro_axis_topic: string
  difficulty_band: string
  is_real_paper: boolean
  suggested_paragraph_angles: string[]
  ao_emphasis: string
}

type Phase = 'select' | 'plan' | 'write' | 'assess' | 'complete'

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_SECONDS  = 5 * 60   // 5 min
const WRITE_SECONDS = 45 * 60  // 45 min

function getDeviceId(): string {
  let id = localStorage.getItem('prose_device_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('prose_device_id', id) }
  return id
}

// 12 examiner warnings (from mark-scheme-decoded lesson, warning 10 corrected)
const WARNINGS = [
  { id: 'w1',  text: 'Misreading the command word — decoding before selecting' },
  { id: 'w2',  text: 'Plot retelling disguised as argument — replaced with a claim about method or significance' },
  { id: 'w3',  text: 'Feature spotting — every method named has its effect explained' },
  { id: 'w4',  text: 'Generic theme discussion — the text-specific version is defined' },
  { id: 'w5',  text: 'Detached context (AO3 bolt-on) — context sharpens a claim already being made' },
  { id: 'w6',  text: 'Block comparison — each paragraph compares continuously, not text A then text B' },
  { id: 'w7',  text: 'Forced comparison — every link sharpens the concept' },
  { id: 'w8',  text: 'Quoting too much — short phrases analysed hard' },
  { id: 'w9',  text: 'Unbalanced paragraphs — one governing comparative idea per paragraph' },
  { id: 'w10', text: 'Vague alternative reading — the interpretation is stated clearly and judged' },
  { id: 'w11', text: 'No judgement / flat voice — ranking and phrases of evaluation present throughout' },
  { id: 'w12', text: 'Ignoring structural AO2 — structure evidence embedded inside body paragraphs' },
]

// 5 fast paragraph audit questions
const AUDIT = [
  { id: 'a1', text: 'Does each paragraph directly answer the set wording?' },
  { id: 'a2', text: 'Is there one clear comparative idea running through each paragraph?' },
  { id: 'a3', text: 'Have I explained what each method does, not just named it?' },
  { id: 'a4', text: 'Have I actually connected the texts, not just placed them side by side?' },
  { id: 'a5', text: 'Have I shown which reading or idea is more central?' },
]

// ─── Display config ───────────────────────────────────────────────────────────

const DIFF_META: Record<string, { color: string; bg: string }> = {
  'L4 core':       { color: '#2dd4bf', bg: 'rgba(45,212,191,0.10)' },
  'L4-L5 bridge':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  'L5 stretch':    { color: '#a78bfa', bg: 'rgba(167,139,250,0.10)' },
}

function fmt(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TimedWrite() {
  const [phase, setPhase]       = useState<Phase>('select')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const [question, setQuestion] = useState<Question | null>(null)
  const [planNotes, setPlanNotes] = useState('')
  const [essayText, setEssayText] = useState('')

  const [timer, setTimer]           = useState(PLAN_SECONDS)
  const [timerRunning, setTimerRunning] = useState(false)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [sessionEnd, setSessionEnd]     = useState<Date | null>(null)

  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [audit, setAudit]         = useState<Record<string, boolean>>({})
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  // Question filter
  const [showReal, setShowReal]     = useState<'all' | 'real' | 'synthetic'>('all')
  const [showDiff, setShowDiff]     = useState('ALL')

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Fetch questions ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('past_paper_questions')
        .select('*')
        .order('exam_year', { ascending: false })
        .order('question_number')
      if (error) { setError(error.message); setLoading(false); return }
      setQuestions(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current!)
            setTimerRunning(false)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerRunning])

  // ── Derived ───────────────────────────────────────────────────────────────
  const allDiffs = [...new Set(questions.map(q => q.difficulty_band))].sort()
  const filteredQs = questions.filter(q => {
    if (showReal === 'real' && !q.is_real_paper) return false
    if (showReal === 'synthetic' && q.is_real_paper) return false
    if (showDiff !== 'ALL' && q.difficulty_band !== showDiff) return false
    return true
  })

  const realQs      = filteredQs.filter(q => q.is_real_paper)
  const syntheticQs = filteredQs.filter(q => !q.is_real_paper)

  const wordCount = countWords(essayText)
  const timerPct  = phase === 'plan'
    ? (timer / PLAN_SECONDS) * 100
    : (timer / WRITE_SECONDS) * 100
  const timerColor = timer < 120 ? '#ef4444' : timer < 300 ? '#f59e0b' : '#2dd4bf'

  // ── Actions ───────────────────────────────────────────────────────────────
  const startPlan = useCallback((q: Question) => {
    setQuestion(q)
    setTimer(PLAN_SECONDS)
    setTimerRunning(true)
    setSessionStart(new Date())
    setPhase('plan')
  }, [])

  const startWrite = useCallback(() => {
    setTimer(WRITE_SECONDS)
    setTimerRunning(true)
    setPhase('write')
  }, [])

  const finishWrite = useCallback(() => {
    setTimerRunning(false)
    setSessionEnd(new Date())
    setPhase('assess')
  }, [])

  const toggleCheck = (id: string) =>
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleAudit = (id: string) =>
    setAudit(prev => ({ ...prev, [id]: !prev[id] }))

  const saveSession = useCallback(async () => {
    if (!question) return
    setSaving(true)
    const durationMins = sessionStart
      ? Math.round((Date.now() - sessionStart.getTime()) / 60000)
      : 50
    await supabase.from('timed_sessions').insert({
      device_id: getDeviceId(),
      mode_id: question.question_id,
      duration_minutes: durationMins,
      response_text: essayText,
      word_count: wordCount,
      completed: true,
      started_at: sessionStart?.toISOString() ?? new Date().toISOString(),
      ended_at: new Date().toISOString(),
    })
    setSaving(false)
    setSaved(true)
    setPhase('complete')
  }, [question, essayText, wordCount, sessionStart])

  const reset = () => {
    setPhase('select')
    setQuestion(null)
    setPlanNotes('')
    setEssayText('')
    setChecklist({})
    setAudit({})
    setSaved(false)
    setTimerRunning(false)
    setTimer(PLAN_SECONDS)
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) return <StateScreen text="Loading questions…" />
  if (error)   return <ErrorScreen message={error} />

  return (
    <div className="min-h-screen bg-paper">
      {/* ── Header ── */}
      <div className="px-4 pt-10 pb-6 md:px-8 border-b border-rule">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="label-eyebrow text-ink-muted block mb-2">Stage 6</span>
            <h1 className="text-2xl font-bold text-ink">Timed Writing</h1>
            <p className="text-sm text-ink-muted mt-1">
              50 minutes · 5 min plan · 45 min write · self-assess against 12 examiner warnings.
            </p>
          </div>
          {phase !== 'select' && (
            <button onClick={reset}
              className="text-xs text-ink-muted border border-rule rounded-lg px-3 py-2 hover:text-ink transition-colors flex-shrink-0">
              ← New session
            </button>
          )}
        </div>
      </div>

      {/* ══ QUESTION SELECT ══════════════════════════════════════════════════ */}
      {phase === 'select' && (
        <div className="px-4 py-6 md:px-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="flex gap-1 bg-paper border border-rule rounded-lg p-1">
              {(['all', 'real', 'synthetic'] as const).map(v => (
                <button key={v} onClick={() => setShowReal(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                    showReal === v ? 'bg-paper border border-rule text-ink' : 'text-ink-muted hover:text-ink'
                  }`}>{v === 'all' ? 'All questions' : v === 'real' ? 'Past papers' : 'Synthetic'}</button>
              ))}
            </div>
            <select className="bg-paper border border-rule rounded-lg px-3 py-1.5 text-xs text-ink-muted"
              value={showDiff} onChange={e => setShowDiff(e.target.value)}>
              <option value="ALL">All difficulties</option>
              {allDiffs.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Real papers */}
          {realQs.length > 0 && (
            <section className="mb-8">
              <p className="label-eyebrow text-ink-muted mb-3">Past papers</p>
              <div className="space-y-2">
                {realQs.map(q => <QuestionCard key={q.id} q={q} onSelect={startPlan} />)}
              </div>
            </section>
          )}

          {/* Synthetic */}
          {syntheticQs.length > 0 && (
            <section>
              <p className="label-eyebrow text-ink-muted mb-3">Synthetic practice questions</p>
              <div className="space-y-2">
                {syntheticQs.map(q => <QuestionCard key={q.id} q={q} onSelect={startPlan} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ══ PLANNING PHASE ═══════════════════════════════════════════════════ */}
      {phase === 'plan' && question && (
        <div className="px-4 py-6 md:px-8">
          <TimerBar pct={timerPct} color={timerColor} label={`Plan — ${fmt(timer)}`} />

          <div className="grid md:grid-cols-2 gap-5 mt-5">
            {/* Left: question + angles */}
            <div className="space-y-4">
              <div className="p-5 border border-rule rounded-xl">
                <p className="label-eyebrow text-ink-muted mb-2">{question.is_real_paper ? `Edexcel ${question.exam_year}` : 'Synthetic'} · {question.ao_emphasis}</p>
                <p className="text-ink font-serif italic leading-relaxed">"{question.question_stem}"</p>
              </div>

              <div className="p-5 border border-rule rounded-xl">
                <p className="label-eyebrow text-ink-muted mb-3">Suggested paragraph angles</p>
                <ol className="space-y-2">
                  {question.suggested_paragraph_angles.map((a, i) => (
                    <li key={i} className="flex gap-2 text-xs text-ink-muted">
                      <span className="text-amber-400 font-bold flex-shrink-0">{i + 1}.</span>
                      <span className="leading-relaxed">{a}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="p-4 border border-rule rounded-xl text-xs text-ink-muted space-y-1.5">
                <p className="label-eyebrow text-ink-muted mb-2">5-minute planning grid</p>
                {[
                  'What is the command word demanding?',
                  'What precise version of the theme is at stake?',
                  'What is shared and what differs? (one comparative sentence)',
                  'What are your 3 paragraph functions?',
                  'Best method-rich evidence for each paragraph',
                ].map((step, i) => (
                  <p key={i} className="flex gap-2">
                    <span className="text-amber-400 font-bold flex-shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* Right: planning notes */}
            <div className="flex flex-col gap-3">
              <textarea
                className="flex-1 min-h-64 bg-paper border border-rule rounded-xl p-4 text-sm text-ink resize-none focus:outline-none focus:border-amber-400/50 leading-relaxed"
                placeholder="Thesis · Para 1 job · Para 2 job · Para 3 job · Best evidence per paragraph…"
                value={planNotes}
                onChange={e => setPlanNotes(e.target.value)}
              />
              <button onClick={startWrite}
                className="w-full py-3.5 rounded-xl bg-amber-400 text-slate-900 font-semibold text-sm hover:bg-amber-300 transition-colors">
                Start writing →
              </button>
              {timer === 0 && (
                <p className="text-center text-xs text-amber-400">Planning time up — move to writing.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ WRITING PHASE ════════════════════════════════════════════════════ */}
      {phase === 'write' && question && (
        <div className="px-4 py-4 md:px-8 flex flex-col" style={{ minHeight: 'calc(100vh - 160px)' }}>
          <TimerBar pct={timerPct} color={timerColor}
            label={`Writing — ${fmt(timer)} · ${wordCount} words`} />

          {/* Question reminder */}
          <div className="mt-4 mb-3 px-4 py-3 border border-rule rounded-xl">
            <p className="text-xs text-ink-muted font-serif italic">"{question.question_stem}"</p>
          </div>

          <textarea
            className="flex-1 min-h-96 bg-paper border border-rule rounded-xl p-5 text-sm text-ink resize-none focus:outline-none focus:border-amber-400/30 leading-relaxed font-serif"
            placeholder="Write your comparative essay here…"
            value={essayText}
            onChange={e => setEssayText(e.target.value)}
            autoFocus
          />

          <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
            <p className="text-xs text-ink-muted">
              {wordCount} words · Target: 600–750 for 3 paragraphs
            </p>
            <button onClick={finishWrite}
              className="px-6 py-2.5 rounded-xl bg-amber-400 text-slate-900 font-semibold text-sm hover:bg-amber-300 transition-colors">
              Finish & self-assess →
            </button>
          </div>
          {timer === 0 && (
            <p className="text-center text-xs text-red-400 mt-2">Time up — please finish your sentence and move to self-assessment.</p>
          )}
        </div>
      )}

      {/* ══ SELF-ASSESSMENT ══════════════════════════════════════════════════ */}
      {phase === 'assess' && (
        <div className="px-4 py-6 md:px-8 max-w-2xl">
          <p className="text-sm text-ink-muted mb-6 leading-relaxed">
            Read your essay back. For each item below, tick if you avoided the trap.
            Be honest — this is the most useful part of the session.
          </p>

          {/* 12 warnings */}
          <div className="mb-6">
            <p className="label-eyebrow text-ink-muted mb-3">12 examiner warnings — did you avoid these?</p>
            <div className="space-y-2">
              {WARNINGS.map(w => {
                const checked = !!checklist[w.id]
                return (
                  <button key={w.id} onClick={() => toggleCheck(w.id)}
                    className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                      checked
                        ? 'border-emerald-400/40 bg-emerald-400/05'
                        : 'border-rule hover:border-ink/20'
                    }`}>
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-xs mt-0.5 ${
                      checked ? 'bg-emerald-400 border-emerald-400 text-slate-900' : 'border-rule text-ink-muted'
                    }`}>
                      {checked ? '✓' : ''}
                    </span>
                    <span className="text-xs text-ink-muted leading-relaxed">{w.text}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 5 paragraph audit */}
          <div className="mb-6">
            <p className="label-eyebrow text-ink-muted mb-3">Fast paragraph audit — 5 questions</p>
            <div className="space-y-2">
              {AUDIT.map(a => {
                const checked = !!audit[a.id]
                return (
                  <button key={a.id} onClick={() => toggleAudit(a.id)}
                    className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                      checked
                        ? 'border-amber-400/40 bg-amber-400/05'
                        : 'border-rule hover:border-ink/20'
                    }`}>
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-xs mt-0.5 ${
                      checked ? 'bg-amber-400 border-amber-400 text-slate-900' : 'border-rule text-ink-muted'
                    }`}>
                      {checked ? '✓' : ''}
                    </span>
                    <span className="text-xs text-ink-muted leading-relaxed">{a.text}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Score summary */}
          <div className="p-4 border border-rule rounded-xl mb-5 flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{Object.values(checklist).filter(Boolean).length}<span className="text-sm text-ink-muted font-normal"> /12</span></p>
              <p className="text-xs text-ink-muted mt-0.5">Warnings avoided</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{Object.values(audit).filter(Boolean).length}<span className="text-sm text-ink-muted font-normal"> /5</span></p>
              <p className="text-xs text-ink-muted mt-0.5">Audit passes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-ink">{wordCount}</p>
              <p className="text-xs text-ink-muted mt-0.5">Words</p>
            </div>
          </div>

          <button onClick={saveSession} disabled={saving}
            className="w-full py-3.5 rounded-xl bg-amber-400 text-slate-900 font-semibold text-sm hover:bg-amber-300 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save session & finish'}
          </button>
        </div>
      )}

      {/* ══ COMPLETE ═════════════════════════════════════════════════════════ */}
      {phase === 'complete' && question && (
        <div className="px-4 py-12 md:px-8 max-w-lg">
          <div className="mb-8">
            <p className="text-emerald-400 font-semibold mb-1">Session saved ✓</p>
            <h2 className="text-xl font-bold text-ink">Done.</h2>
          </div>

          <div className="bg-paper border border-rule rounded-xl p-5 mb-5 space-y-3">
            <Stat label="Question" value={question.is_real_paper ? `Edexcel ${question.exam_year}` : 'Synthetic'} />
            <Stat label="Words written" value={wordCount.toString()} />
            <Stat label="Warnings avoided" value={`${Object.values(checklist).filter(Boolean).length} / 12`} />
            <Stat label="Audit passes" value={`${Object.values(audit).filter(Boolean).length} / 5`} />
          </div>

          {/* Next steps */}
          <div className="p-4 border border-rule rounded-xl mb-5">
            <p className="label-eyebrow text-ink-muted mb-2">What to do next</p>
            {[
              Object.values(checklist).filter(Boolean).length < 10
                ? 'Review the warnings you missed and target them in your next timed session.'
                : null,
              Object.values(audit).filter(Boolean).length < 4
                ? 'Re-read a body paragraph against the 5 audit questions before writing it next time.'
                : null,
              wordCount < 550
                ? 'Aim for 600–750 words. Each comparative paragraph should be around 150–180 words.'
                : null,
              'Drill the quotes and routes most relevant to this question in the Quote Bank and Comparison Routes screens.',
            ].filter(Boolean).map((tip, i) => (
              <p key={i} className="text-xs text-ink-muted leading-relaxed mb-1.5 flex gap-2">
                <span className="text-amber-400 flex-shrink-0">→</span>
                <span>{tip}</span>
              </p>
            ))}
          </div>

          <button onClick={reset}
            className="w-full py-3.5 rounded-xl bg-paper border border-rule text-ink text-sm font-medium hover:border-amber-400/50 transition-colors">
            Start another session
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuestionCard({ q, onSelect }: { q: Question; onSelect: (q: Question) => void }) {
  const dm = DIFF_META[q.difficulty_band] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' }
  return (
    <button onClick={() => onSelect(q)}
      className="w-full text-left p-5 border border-rule rounded-xl hover:border-amber-400/40 transition-colors group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {q.is_real_paper
            ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-400/10 text-teal-400">Edexcel {q.exam_year}</span>
            : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-400/10 text-slate-400">Synthetic</span>
          }
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ color: dm.color, background: dm.bg }}>
            {q.difficulty_band}
          </span>
          <span className="text-[10px] text-ink-muted">{q.ao_emphasis}</span>
        </div>
        <span className="text-ink-muted group-hover:text-amber-400 text-sm flex-shrink-0 transition-colors">→</span>
      </div>
      <p className="text-sm text-ink font-serif italic leading-relaxed">"{q.question_stem}"</p>
    </button>
  )
}

function TimerBar({ pct, color, label }: { pct: number; color: string; label: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="label-eyebrow text-ink-muted">{label}</span>
      </div>
      <div className="h-2 bg-rule rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${Math.max(0, pct)}%`, background: color }} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  )
}

function StateScreen({ text }: { text: string }) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <p className="text-ink-muted text-sm animate-pulse">{text}</p>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="border border-red-500/30 rounded-xl p-6 max-w-md text-center">
        <p className="text-red-400 font-medium mb-1">Failed to load</p>
        <p className="text-ink-muted text-sm">{message}</p>
      </div>
    </div>
  )
}
