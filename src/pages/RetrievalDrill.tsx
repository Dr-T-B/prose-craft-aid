import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type DrillMode = 'recognition' | 'pair_match' | 'free_recall'

interface QuoteRow {
  id: string
  source_text: string
  quote_text: string
  method: string
  best_themes: string[]
  effect_prompt: string
  plain_english_meaning: string | null
  grade_priority: string | null
  retrieval_priority: number | null
}

interface PairRow {
  id: string
  theme_label: string
  level_band: string | null
  hard_times_quote: string
  hard_times_method: string | null
  atonement_quote: string
  atonement_method: string | null
  how_they_compare: string | null
  ao4_comparison_type: string | null
  themes: string[]
}

interface DrillCard {
  type: 'quote' | 'pair'
  id: string
  promptLabel: string
  prompt: string
  answerLabel: string
  answer: string
  options?: string[]
  correctOption: string
  meta: {
    source?: string
    themes?: string[]
    method?: string
    howTheyCompare?: string | null
    aoType?: string | null
  }
}

interface SessionStats {
  correct: number
  total: number
  durationMs: number
  missedCards: DrillCard[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUALITY_MAP = { got_it: 5, almost: 3, missed: 1 } as const
const DECK_SIZE   = 15
const OPTIONS_COUNT = 4

function getDeviceId(): string {
  let id = localStorage.getItem('prose_device_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('prose_device_id', id) }
  return id
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// SM-2 spaced repetition calculation
function sm2(prevEase: number, prevInterval: number, prevReps: number, quality: number) {
  const ease = Math.max(1.3, prevEase + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  let interval: number, reps: number
  if (quality < 3) { interval = 1; reps = 0 }
  else {
    reps = prevReps + 1
    interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(prevInterval * ease)
  }
  return { ease, interval, reps }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RetrievalDrill() {
  const [phase, setPhase]   = useState<'select' | 'drilling' | 'summary'>('select')
  const [mode, setMode]     = useState<DrillMode>('recognition')
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [pairs, setPairs]   = useState<PairRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const [deck, setDeck]         = useState<DrillCard[]>([])
  const [cardIndex, setCardIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [chosen, setChosen]     = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
  const [missedCards, setMissedCards]   = useState<DrillCard[]>([])

  const startTime     = useRef(0)
  const cardStartTime = useRef(0)
  const correctCount  = useRef(0)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const [qRes, pRes] = await Promise.all([
        supabase
          .from('quote_methods')
          .select('id,source_text,quote_text,method,best_themes,effect_prompt,plain_english_meaning,grade_priority,retrieval_priority')
          .eq('is_core_quote', true)
          .order('retrieval_priority', { ascending: true, nullsFirst: false }),
        supabase
          .from('quote_pairs')
          .select('id,theme_label,level_band,hard_times_quote,hard_times_method,atonement_quote,atonement_method,how_they_compare,ao4_comparison_type,themes')
          .eq('is_active', true)
          .order('sort_order'),
      ])
      if (qRes.error) { setError(qRes.error.message); setLoading(false); return }
      if (pRes.error) { setError(pRes.error.message); setLoading(false); return }
      setQuotes(qRes.data ?? [])
      setPairs(pRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Build deck ────────────────────────────────────────────────────────────
  const buildDeck = useCallback((m: DrillMode): DrillCard[] => {
    if (m === 'recognition') {
      return shuffle(quotes).slice(0, DECK_SIZE).map(q => {
        const distractors = shuffle(quotes.filter(x => x.id !== q.id && x.source_text === q.source_text))
          .slice(0, OPTIONS_COUNT - 1).map(x => x.quote_text)
        return {
          type: 'quote', id: q.id,
          promptLabel: `${q.source_text} — what is the quote?`,
          prompt: q.effect_prompt || q.method,
          answerLabel: 'Quote',
          answer: `"${q.quote_text}"`,
          options: shuffle([q.quote_text, ...distractors]),
          correctOption: q.quote_text,
          meta: { source: q.source_text, themes: q.best_themes, method: q.method },
        }
      })
    }

    if (m === 'pair_match') {
      const atPool = pairs.map(p => p.atonement_quote)
      return shuffle(pairs).slice(0, Math.min(DECK_SIZE, pairs.length)).map(p => ({
        type: 'pair', id: p.id,
        promptLabel: 'Hard Times — find its Atonement pair',
        prompt: `"${p.hard_times_quote}"`,
        answerLabel: 'Atonement pair',
        answer: `"${p.atonement_quote}"`,
        options: shuffle([p.atonement_quote, ...shuffle(atPool.filter(q => q !== p.atonement_quote)).slice(0, OPTIONS_COUNT - 1)]),
        correctOption: p.atonement_quote,
        meta: { themes: p.themes, method: p.atonement_method ?? undefined, howTheyCompare: p.how_they_compare, aoType: p.ao4_comparison_type },
      }))
    }

    // free_recall
    return shuffle(quotes).slice(0, DECK_SIZE).map(q => ({
      type: 'quote', id: q.id,
      promptLabel: q.source_text,
      prompt: q.method,
      answerLabel: 'Quote',
      answer: `"${q.quote_text}"`,
      correctOption: q.quote_text,
      meta: { source: q.source_text, themes: q.best_themes, method: q.method },
    }))
  }, [quotes, pairs])

  // ── Start session ──────────────────────────────────────────────────────────
  const startSession = useCallback(async (m: DrillMode) => {
    const builtDeck = buildDeck(m)
    if (!builtDeck.length) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be signed in to start a drill.'); return }
    const sessionType = m === 'pair_match' ? 'pairing_drill' : 'quote_drill'
    const { data, error: err } = await supabase
      .from('retrieval_sessions')
      .insert({ user_id: user.id, device_id: getDeviceId(), session_type: sessionType, total_items: builtDeck.length, correct_items: 0, completed: false })
      .select('id').single()
    if (err) { setError(err.message); return }
    setSessionId(data.id)
    setDeck(builtDeck)
    setCardIndex(0); setRevealed(false); setChosen(null); setMissedCards([])
    correctCount.current = 0
    startTime.current = Date.now(); cardStartTime.current = Date.now()
    setMode(m); setPhase('drilling')
  }, [buildDeck])

  // ── Record response ────────────────────────────────────────────────────────
  const recordResponse = useCallback(async (card: DrillCard, recalled: boolean, quality: number) => {
    if (!sessionId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Your session has expired. Please sign in again.'); return }
    const responseTimeMs = Date.now() - cardStartTime.current
    const itemType = card.type === 'pair' ? 'pairing' : 'quote'

    const { data: existing } = await supabase
      .from('retrieval_items')
      .select('id,ease_factor,interval_days,repetitions,correct_reviews')
      .eq('item_id', card.id).eq('item_type', itemType)
      .maybeSingle()

    let retrievalItemId: string | null = null

    if (existing) {
      const { ease, interval, reps } = sm2(existing.ease_factor, existing.interval_days, existing.repetitions, quality)
      await supabase.from('retrieval_items').update({
        ease_factor: ease, interval_days: interval, repetitions: reps,
        next_review_at: new Date(Date.now() + interval * 86400000).toISOString(),
        last_reviewed_at: new Date().toISOString(),
        total_reviews: existing.repetitions + 1,
        correct_reviews: recalled ? existing.correct_reviews + 1 : existing.correct_reviews,
      }).eq('id', existing.id)
      retrievalItemId = existing.id
    } else {
      const { ease, interval, reps } = sm2(2.5, 1, 0, quality)
      const { data: ni } = await supabase.from('retrieval_items').insert({
        user_id: user.id, item_type: itemType, item_id: card.id,
        ease_factor: ease, interval_days: interval, repetitions: reps,
        next_review_at: new Date(Date.now() + interval * 86400000).toISOString(),
        last_reviewed_at: new Date().toISOString(),
        total_reviews: 1, correct_reviews: recalled ? 1 : 0,
      }).select('id').single()
      retrievalItemId = ni?.id ?? null
    }

    await supabase.from('retrieval_responses').insert({
      session_id: sessionId, user_id: user.id,
      retrieval_item_id: retrievalItemId, item_type: itemType, item_id: card.id,
      quality, recalled_correctly: recalled, response_time_ms: responseTimeMs,
    })
  }, [sessionId])

  // ── Advance ────────────────────────────────────────────────────────────────
  const advance = useCallback(async (correct: boolean, quality: number) => {
    const card = deck[cardIndex]
    await recordResponse(card, correct, quality)
    if (correct) correctCount.current++
    const newMissed = correct ? missedCards : [...missedCards, card]
    if (!correct) setMissedCards(newMissed)

    if (cardIndex >= deck.length - 1) {
      const durationMs = Date.now() - startTime.current
      await supabase.from('retrieval_sessions').update({
        correct_items: correctCount.current,
        duration_seconds: Math.round(durationMs / 1000),
        completed: true, ended_at: new Date().toISOString(),
      }).eq('id', sessionId)
      setSessionStats({ correct: correctCount.current, total: deck.length, durationMs, missedCards: newMissed })
      setPhase('summary')
    } else {
      setCardIndex(i => i + 1); setRevealed(false); setChosen(null)
      cardStartTime.current = Date.now()
    }
  }, [deck, cardIndex, recordResponse, sessionId, missedCards])

  const handleMcqChoice = useCallback(async (opt: string) => {
    if (chosen) return
    setChosen(opt); setRevealed(true)
    const correct = opt === deck[cardIndex].correctOption
    await advance(correct, correct ? QUALITY_MAP.got_it : QUALITY_MAP.missed)
  }, [chosen, deck, cardIndex, advance])

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />
  if (phase === 'select')  return <ModeSelector onStart={startSession} quoteCount={quotes.length} pairCount={pairs.length} />
  if (phase === 'summary') return <SummaryScreen stats={sessionStats!} onRestart={() => setPhase('select')} />

  const card = deck[cardIndex]

  return (
    <div className="min-h-screen bg-paper px-4 py-8 md:px-8">
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="label-eyebrow text-ink-faint capitalize">{mode.replace('_', ' ')}</span>
          <span className="label-eyebrow text-ink-faint">{cardIndex + 1} / {deck.length}</span>
        </div>
        <div className="h-1.5 bg-rule rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full transition-all duration-300"
            style={{ width: `${(cardIndex / deck.length) * 100}%` }} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {mode === 'free_recall' ? (
          <FreeRecallCard card={card} revealed={revealed}
            onReveal={() => setRevealed(true)}
            onScore={(c, q) => advance(c, q)} />
        ) : (
          <RecognitionCard card={card} chosen={chosen}
            onChoose={handleMcqChoice}
            isPairMode={mode === 'pair_match'} />
        )}
      </div>
    </div>
  )
}

// ─── Mode Selector ────────────────────────────────────────────────────────────
function ModeSelector({ onStart, quoteCount, pairCount }: {
  onStart: (m: DrillMode) => void; quoteCount: number; pairCount: number
}) {
  const modes = [
    { id: 'recognition' as DrillMode, label: 'Recognition', desc: 'Read the method/effect. Pick the correct quote from four options.', count: `${quoteCount} quotes`, border: 'border-amber-400/40 hover:border-amber-400' },
    { id: 'pair_match' as DrillMode, label: 'Pair Match', desc: 'See an HT quote. Identify its Atonement counterpart. Builds AO4 reflex.', count: `${pairCount} pairs`, border: 'border-sky-400/40 hover:border-sky-400' },
    { id: 'free_recall' as DrillMode, label: 'Free Recall', desc: 'Given method and themes only. Recall the quote from memory, then self-rate.', count: `${quoteCount} quotes`, border: 'border-violet-400/40 hover:border-violet-400' },
  ]
  return (
    <div className="min-h-screen bg-paper px-4 py-12 md:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-ink mb-1">Retrieval Drill</h1>
        <p className="text-ink-faint text-sm mb-8">Stage 2 — Active recall. Choose a mode to begin.</p>
        <div className="flex flex-col gap-3">
          {modes.map(m => (
            <button key={m.id} onClick={() => onStart(m.id)}
              className={`text-left p-5 bg-surface border rounded-xl transition-colors ${m.border}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink mb-1">{m.label}</p>
                  <p className="text-sm text-ink-faint leading-relaxed">{m.desc}</p>
                </div>
                <span className="label-eyebrow text-ink-faint whitespace-nowrap mt-0.5">{m.count}</span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-faint mt-6 text-center">
          Up to {DECK_SIZE} cards per session · Results feed spaced repetition
        </p>
      </div>
    </div>
  )
}

// ─── Recognition Card (MCQ) ───────────────────────────────────────────────────
function RecognitionCard({ card, chosen, onChoose, isPairMode }: {
  card: DrillCard; chosen: string | null
  onChoose: (o: string) => void; isPairMode: boolean
}) {
  return (
    <div>
      <div className="bg-surface border border-rule rounded-xl p-6 mb-5">
        <p className="label-eyebrow text-ink-faint mb-3">{card.promptLabel}</p>
        <p className={`text-ink leading-relaxed ${isPairMode ? 'font-serif italic text-lg' : 'text-sm'}`}>
          {card.prompt}
        </p>
        {(card.meta.themes ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {card.meta.themes!.map(t => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{t}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {(card.options ?? []).map((opt, i) => {
          const isChosen = chosen === opt, isCorrect = opt === card.correctOption
          let cls = 'text-left w-full p-4 rounded-xl border text-sm font-serif italic leading-relaxed transition-all '
          if (!chosen)       cls += 'bg-surface border-rule hover:border-ink/30 text-ink cursor-pointer'
          else if (isCorrect) cls += 'bg-emerald-500/10 border-emerald-400/60 text-emerald-300'
          else if (isChosen)  cls += 'bg-red-500/10 border-red-400/60 text-red-300'
          else                cls += 'bg-surface border-rule text-ink-faint opacity-40'
          return (
            <button key={i} className={cls} onClick={() => onChoose(opt)} disabled={!!chosen}>
              <span className="not-italic text-ink-faint text-xs mr-2">{String.fromCharCode(65 + i)}.</span>
              "{opt}"
              {chosen && isCorrect && <span className="not-italic ml-2">✓</span>}
              {chosen && isChosen && !isCorrect && <span className="not-italic ml-2">✗</span>}
            </button>
          )
        })}
      </div>

      {chosen && (card.meta.howTheyCompare || (card.meta.method && !isPairMode)) && (
        <div className="mt-5 p-4 bg-surface border border-rule rounded-xl space-y-2">
          {card.meta.howTheyCompare && (
            <div>
              <p className="label-eyebrow text-ink-faint mb-1">AO4 — how they compare</p>
              <p className="text-sm text-ink-faint leading-relaxed">{card.meta.howTheyCompare}</p>
            </div>
          )}
          {card.meta.method && !isPairMode && (
            <div>
              <p className="label-eyebrow text-ink-faint mb-1">Method</p>
              <p className="text-sm text-ink-faint">{card.meta.method}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Free Recall Card ─────────────────────────────────────────────────────────
function FreeRecallCard({ card, revealed, onReveal, onScore }: {
  card: DrillCard; revealed: boolean
  onReveal: () => void; onScore: (correct: boolean, quality: number) => void
}) {
  return (
    <div>
      <div className="bg-surface border border-rule rounded-xl p-6 mb-5">
        <p className="label-eyebrow text-ink-faint mb-1">{card.promptLabel}</p>
        <p className="text-sm text-ink-faint italic mb-3">{card.meta.method}</p>
        {(card.meta.themes ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.meta.themes!.map(t => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{t}</span>
            ))}
          </div>
        )}
      </div>

      {!revealed ? (
        <button onClick={onReveal}
          className="w-full p-6 rounded-xl border-2 border-dashed border-rule hover:border-amber-400/50 text-ink-faint hover:text-amber-400 transition-colors text-sm">
          Recall the quote — tap to reveal ↓
        </button>
      ) : (
        <div>
          <div className="p-5 bg-surface border border-rule rounded-xl mb-4">
            <p className="label-eyebrow text-ink-faint mb-2">{card.answerLabel}</p>
            <p className="font-serif italic text-lg text-ink leading-relaxed">{card.answer}</p>
          </div>
          <p className="text-center text-sm text-ink-faint mb-3">How well did you recall it?</p>
          <div className="grid grid-cols-3 gap-2.5">
            <button onClick={() => onScore(true, QUALITY_MAP.got_it)}
              className="py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
              ✓ Got it
            </button>
            <button onClick={() => onScore(true, QUALITY_MAP.almost)}
              className="py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors">
              ~ Almost
            </button>
            <button onClick={() => onScore(false, QUALITY_MAP.missed)}
              className="py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
              ✗ Missed
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Summary ──────────────────────────────────────────────────────────────────
function SummaryScreen({ stats, onRestart }: { stats: SessionStats; onRestart: () => void }) {
  const pct   = Math.round((stats.correct / stats.total) * 100)
  const mins  = Math.floor(stats.durationMs / 60000)
  const secs  = Math.round((stats.durationMs % 60000) / 1000)
  const grade = pct >= 85 ? 'Excellent' : pct >= 65 ? 'Good' : 'Keep practising'
  const clr   = pct >= 85 ? 'text-emerald-400' : pct >= 65 ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="min-h-screen bg-paper px-4 py-12 md:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-ink mb-1">Session complete</h1>
        <p className="text-ink-faint text-sm mb-8">{mins}m {secs}s</p>
        <div className="bg-surface border border-rule rounded-xl p-6 mb-6 text-center">
          <p className={`text-5xl font-bold mb-1 ${clr}`}>{pct}%</p>
          <p className={`text-sm font-medium ${clr}`}>{grade}</p>
          <p className="text-ink-faint text-sm mt-2">{stats.correct} correct · {stats.total - stats.correct} missed</p>
        </div>
        {stats.missedCards.length > 0 && (
          <div className="mb-6">
            <p className="label-eyebrow text-ink-faint mb-3">Missed — review these</p>
            <div className="flex flex-col gap-2">
              {stats.missedCards.map((c, i) => (
                <div key={i} className="p-4 bg-surface border border-red-500/20 rounded-xl">
                  <p className="text-xs text-red-400/70 mb-1">{c.meta.source ?? 'Pair'}</p>
                  <p className="font-serif italic text-ink text-sm">{c.answer}</p>
                  {c.meta.method && <p className="text-xs text-ink-faint mt-1">{c.meta.method}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={onRestart}
          className="w-full py-3.5 rounded-xl bg-amber-400 text-slate-900 font-semibold text-sm hover:bg-amber-300 transition-colors">
          Start another session
        </button>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <p className="text-ink-faint text-sm animate-pulse">Loading drill…</p>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="bg-surface border border-red-500/30 rounded-xl p-6 max-w-md text-center">
        <p className="text-red-400 font-medium mb-1">Something went wrong</p>
        <p className="text-ink-faint text-sm">{message}</p>
      </div>
    </div>
  )
}
