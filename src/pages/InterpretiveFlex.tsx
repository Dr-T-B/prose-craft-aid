import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AltReading {
  id: string
  focus: string
  dominant_reading: string
  alternative_reading: string
  safe_stem: string
  level_tag: string
  best_use: string[]
}

interface GlossaryTerm {
  id: string
  term: string
  category: string
  definition: string
  student_friendly_definition: string | null
  what_to_notice: string | null
  best_verbs: string[]
  sentence_stem: string | null
  theme_links: string[]
  level_band: string | null
}

type PrimaryTab = 'readings' | 'toolkit' | 'vocabulary'
type ToolkitSection = 'thesis' | 'stems' | 'transitions' | 'dtc'

// ─── Display config ───────────────────────────────────────────────────────────

const LEVEL_META: Record<string, { label: string; color: string; bg: string }> = {
  secure:     { label: 'Secure',   color: '#2dd4bf', bg: 'rgba(45,212,191,0.10)' },
  strong:     { label: 'Strong',   color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  top_band:   { label: 'Top band', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)' },
  perceptive: { label: 'Perceptive', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)' },
}

const DOM_CLR = { color: '#2dd4bf', bg: 'rgba(45,212,191,0.07)', border: 'rgba(45,212,191,0.20)' }
const ALT_CLR = { color: '#fb7185', bg: 'rgba(251,113,133,0.07)', border: 'rgba(251,113,133,0.20)' }
const STEM_CLR = { color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.25)' }

// Glossary ID prefix patterns → toolkit sections
const isThesis      = (id: string) => id.startsWith('wp4_thesis_')
const isStem        = (id: string) => id.startsWith('wp4_stem_')
const isTransition  = (id: string) => id.startsWith('wp4_trans_')
const isDTC         = (id: string) => id.startsWith('wp4_dtc_')
const isVerbUpgrade = (id: string) => id.startsWith('wp4_verb_') || (id.startsWith('cu_verb_'))
const isThemeReframe = (id: string) => id.startsWith('wp4_theme_') || id.startsWith('tr_')
const isLens        = (cat: string) => cat === 'ao5_lens'

// Lens display label
const LENS_LABEL = 'AO1 — Interpretive lens'

// ─── Main component ───────────────────────────────────────────────────────────

export default function InterpretiveFlex() {
  const [tab, setTab]         = useState<PrimaryTab>('readings')
  const [readings, setReadings] = useState<AltReading[]>([])
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [expandedR, setExpandedR] = useState<Set<string>>(new Set())
  const [expandedG, setExpandedG] = useState<Set<string>>(new Set())

  // Readings filters
  const [readLevel, setReadLevel] = useState<'ALL' | 'secure' | 'strong' | 'top_band'>('ALL')
  const [readTopic, setReadTopic] = useState('ALL')

  // Toolkit section
  const [toolkitSection, setToolkitSection] = useState<ToolkitSection>('thesis')

  // Vocabulary section
  const [vocabSection, setVocabSection] = useState<'verbs' | 'themes' | 'lenses'>('verbs')

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const [rRes, gRes] = await Promise.all([
        supabase.from('ao5_tensions').select('*').order('level_tag').order('focus'),
        supabase.from('glossary_terms').select('*').eq('is_active', true).order('id'),
      ])
      if (rRes.error) { setError(rRes.error.message); setLoading(false); return }
      if (gRes.error) { setError(gRes.error.message); setLoading(false); return }
      setReadings(rRes.data || [])
      setGlossary(gRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const toggleR = (id: string) => setExpandedR(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const toggleG = (id: string) => setExpandedG(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })

  // Derived — readings
  const allTopics = [...new Set(readings.flatMap(r => r.best_use || []).filter(t => !/^\d{4}/.test(t)))].sort()
  const filteredReadings = readings.filter(r => {
    if (readLevel !== 'ALL' && r.level_tag !== readLevel) return false
    if (readTopic !== 'ALL' && !(r.best_use || []).includes(readTopic)) return false
    return true
  })

  // Derived — glossary slices
  const thesisTerms     = glossary.filter(g => isThesis(g.id))
  const stemTerms       = glossary.filter(g => isStem(g.id))
  const transTerms      = glossary.filter(g => isTransition(g.id))
  const dtcTerms        = glossary.filter(g => isDTC(g.id))
  const verbTerms       = glossary.filter(g => isVerbUpgrade(g.id) && !isThesis(g.id) && !isStem(g.id) && !isTransition(g.id) && !isDTC(g.id))
  const themeTerms      = glossary.filter(g => isThemeReframe(g.id) && !isVerbUpgrade(g.id))
  const lensTerms       = glossary.filter(g => isLens(g.category))

  // ── Active toolkit list ───────────────────────────────────────────────────
  const toolkitMap: Record<ToolkitSection, { terms: GlossaryTerm[]; desc: string }> = {
    thesis:      { terms: thesisTerms,  desc: 'Five thesis patterns — pick by question type. Use the sentence stem verbatim, then build.' },
    stems:       { terms: stemTerms,    desc: 'Paragraph-level sentence starters. Sequence them: opening → developing → deepening → comparative → evaluation → judgement.' },
    transitions: { terms: transTerms,   desc: 'Four comparative transition types. Never default to "Both texts show…" — upgrade every pivot.' },
    dtc:         { terms: dtcTerms,     desc: 'Descriptive → Conceptual upgrades for key moments. The left side is the weak version; the stem is the A* replacement.' },
  }

  if (loading) return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <p className="text-ink-muted text-sm animate-pulse">Loading…</p>
    </div>
  )
  if (error) return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="border border-red-500/30 rounded-xl p-6 max-w-md text-center">
        <p className="text-red-400 font-medium mb-1">Failed to load</p>
        <p className="text-ink-muted text-sm">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-paper">

      {/* ── Header ── */}
      <div className="px-4 pt-10 pb-6 md:px-8 border-b border-rule">
        <span className="label-eyebrow text-ink-muted block mb-2">Stage 5</span>
        <h1 className="text-2xl font-bold text-ink">Interpretive Flexibility</h1>
        <p className="text-sm text-ink-muted mt-1">
          AO1 — Argue alternative readings inside paragraphs, not bolted on.
          Build conceptual vocabulary. Deploy thesis and stem templates.
        </p>
      </div>

      {/* ── Primary tabs ── */}
      <div className="flex border-b border-rule px-4 md:px-8">
        {([
          ['readings',   'Alternative Readings'],
          ['toolkit',    'Essay Toolkit'],
          ['vocabulary', 'Conceptual Vocabulary'],
        ] as [PrimaryTab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-amber-400 text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 py-6 md:px-8">

        {/* ══ ALTERNATIVE READINGS ══════════════════════════════════════════ */}
        {tab === 'readings' && (
          <div>
            <div className="mb-5 p-4 rounded-xl border border-rule">
              <p className="text-xs text-ink-muted leading-relaxed">
                These are <span className="text-ink font-medium">AO1 alternative readings</span> — not bolted-on critical theory,
                but argued positions that complicate your dominant reading.
                Use the <span className="text-amber-400 font-medium">safe stem</span> to introduce the alternative,
                then evaluate: does it have force, or does your dominant reading hold?
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-5">
              <div className="flex gap-1 bg-paper border border-rule rounded-lg p-1">
                {(['ALL', 'secure', 'strong', 'top_band'] as const).map(v => {
                  const m = v !== 'ALL' ? LEVEL_META[v] : null
                  return (
                    <button key={v} onClick={() => setReadLevel(v)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        readLevel === v ? 'bg-paper border border-rule text-ink' : 'text-ink-muted hover:text-ink'
                      }`}
                      style={readLevel === v && m ? { color: m.color } : undefined}>
                      {v === 'ALL' ? 'All levels' : m!.label}
                    </button>
                  )
                })}
              </div>
              <select className="bg-paper border border-rule rounded-lg px-3 py-1.5 text-xs text-ink-muted"
                value={readTopic} onChange={e => setReadTopic(e.target.value)}>
                <option value="ALL">All topics</option>
                {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-xs text-ink-muted self-center">{filteredReadings.length} tensions</span>
            </div>

            {/* Reading cards */}
            <div className="space-y-3">
              {filteredReadings.map(r => {
                const lm = LEVEL_META[r.level_tag]
                const isOpen = expandedR.has(r.id)
                const examTags = (r.best_use || []).filter(t => /^\d{4}/.test(t))
                const topicTags = (r.best_use || []).filter(t => !/^\d{4}/.test(t))
                return (
                  <div key={r.id} className="border border-rule rounded-xl overflow-hidden">
                    <button className="w-full text-left px-5 py-4" onClick={() => toggleR(r.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            {lm && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: lm.color, background: lm.bg }}>{lm.label}</span>}
                            {topicTags.map(t => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{t}</span>
                            ))}
                            {examTags.map(t => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400">{t}</span>
                            ))}
                          </div>
                          <p className="font-semibold text-ink text-sm capitalize">{r.focus}</p>
                        </div>
                        <span className="text-ink-muted text-sm flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-rule divide-y divide-rule">
                        {/* Dominant */}
                        <div className="p-4" style={{ background: DOM_CLR.bg }}>
                          <p className="label-eyebrow mb-1.5" style={{ color: DOM_CLR.color }}>Dominant reading</p>
                          <p className="text-sm text-ink leading-relaxed">{r.dominant_reading}</p>
                        </div>
                        {/* Alternative */}
                        <div className="p-4" style={{ background: ALT_CLR.bg }}>
                          <p className="label-eyebrow mb-1.5" style={{ color: ALT_CLR.color }}>Alternative reading</p>
                          <p className="text-sm text-ink leading-relaxed">{r.alternative_reading}</p>
                        </div>
                        {/* Safe stem */}
                        <div className="p-4" style={{ background: STEM_CLR.bg }}>
                          <p className="label-eyebrow mb-1.5" style={{ color: STEM_CLR.color }}>Safe stem — use this in your paragraph</p>
                          <p className="text-sm text-ink italic leading-relaxed">"{r.safe_stem}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ ESSAY TOOLKIT ════════════════════════════════════════════════ */}
        {tab === 'toolkit' && (
          <div>
            {/* Section selector */}
            <div className="flex gap-2 mb-2 flex-wrap">
              {([
                ['thesis',      'Thesis templates'],
                ['stems',       'Paragraph stems'],
                ['transitions', 'Comparative transitions'],
                ['dtc',         'Descriptive → Conceptual'],
              ] as [ToolkitSection, string][]).map(([s, label]) => (
                <button key={s} onClick={() => setToolkitSection(s)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    toolkitSection === s
                      ? 'border-amber-400/60 bg-amber-400/10 text-amber-400'
                      : 'border-rule text-ink-muted hover:text-ink'
                  }`}>
                  {label}
                  <span className="ml-1.5 opacity-50">
                    {toolkitMap[s].terms.length}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-xs text-ink-muted mb-5 leading-relaxed">
              {toolkitMap[toolkitSection].desc}
            </p>

            <div className="space-y-3">
              {toolkitMap[toolkitSection].terms.map(g => (
                <ToolkitCard key={g.id} term={g}
                  isOpen={expandedG.has(g.id)}
                  onToggle={() => toggleG(g.id)} />
              ))}
            </div>
          </div>
        )}

        {/* ══ CONCEPTUAL VOCABULARY ════════════════════════════════════════ */}
        {tab === 'vocabulary' && (
          <div>
            {/* Section selector */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {([
                ['verbs',  'Verb upgrades'],
                ['themes', 'Theme reframes'],
                ['lenses', 'Interpretive lenses (AO1)'],
              ] as ['verbs' | 'themes' | 'lenses', string][]).map(([s, label]) => (
                <button key={s} onClick={() => setVocabSection(s)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    vocabSection === s
                      ? 'border-amber-400/60 bg-amber-400/10 text-amber-400'
                      : 'border-rule text-ink-muted hover:text-ink'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Verb upgrades */}
            {vocabSection === 'verbs' && (
              <div>
                <p className="text-xs text-ink-muted mb-4">
                  Replace weak verbs immediately. The left side is what the examiner expects from Grade C.
                  The right side is what earns Grade A and above.
                </p>
                <div className="space-y-2">
                  {verbTerms.map(g => (
                    <div key={g.id} className="border border-rule rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-2">
                        <p className="font-mono text-sm text-ink flex-1">{g.term}</p>
                        {g.level_band && LEVEL_META[g.level_band] && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ color: LEVEL_META[g.level_band].color, background: LEVEL_META[g.level_band].bg }}>
                            {LEVEL_META[g.level_band].label}
                          </span>
                        )}
                      </div>
                      {g.student_friendly_definition && (
                        <p className="text-xs text-ink-muted mb-2">{g.student_friendly_definition}</p>
                      )}
                      {g.sentence_stem && (
                        <p className="text-xs font-mono italic text-amber-400 border-l-2 border-amber-400/30 pl-2">
                          e.g. {g.sentence_stem}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Theme reframes */}
            {vocabSection === 'themes' && (
              <div>
                <p className="text-xs text-ink-muted mb-4">
                  Replace a theme label with its A* conceptual reframe. The stem shows exactly how to open a sentence using the reframe.
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {themeTerms.map(g => {
                    const lm = g.level_band ? LEVEL_META[g.level_band] : null
                    return (
                      <div key={g.id} className="border border-rule rounded-xl p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-medium text-ink text-sm">{g.term}</p>
                          {lm && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                              style={{ color: lm.color, background: lm.bg }}>
                              {lm.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-muted mb-3 leading-relaxed">{g.student_friendly_definition || g.definition}</p>
                        {g.sentence_stem && (
                          <div className="rounded-lg px-3 py-2" style={{ background: STEM_CLR.bg, border: `1px solid ${STEM_CLR.border}` }}>
                            <p className="text-[10px] font-bold mb-1" style={{ color: STEM_CLR.color }}>Stem</p>
                            <p className="text-xs italic text-ink">{g.sentence_stem}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Interpretive lenses */}
            {vocabSection === 'lenses' && (
              <div>
                <div className="mb-4 p-4 rounded-xl border border-amber-400/20 bg-amber-400/05">
                  <p className="text-xs text-ink-muted leading-relaxed">
                    <span className="text-amber-400 font-medium">AO1 — Interpretive lenses, not AO5.</span>{' '}
                    AO5 is not assessed in Component 2: Prose. These lenses are tools for building
                    a more sophisticated AO1 personal response by introducing a named critical
                    perspective as an argued position — not as a label or bolted-on paragraph.
                  </p>
                </div>
                <div className="space-y-3">
                  {lensTerms.map(g => {
                    const lm = g.level_band ? LEVEL_META[g.level_band] : null
                    const isOpen = expandedG.has(g.id)
                    return (
                      <div key={g.id} className="border border-rule rounded-xl overflow-hidden">
                        <button className="w-full text-left px-5 py-4" onClick={() => toggleG(g.id)}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.10)' }}>
                                  {LENS_LABEL}
                                </span>
                                {lm && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                    style={{ color: lm.color, background: lm.bg }}>
                                    {lm.label}
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-ink text-sm">{g.term}</p>
                            </div>
                            <span className="text-ink-muted text-sm flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
                          </div>
                        </button>
                        {isOpen && (
                          <div className="border-t border-rule px-5 pb-5 pt-4 space-y-3">
                            <div>
                              <p className="label-eyebrow text-ink-muted mb-1">Definition</p>
                              <p className="text-xs text-ink-muted leading-relaxed">{g.definition}</p>
                            </div>
                            {g.what_to_notice && (
                              <div>
                                <p className="label-eyebrow text-ink-muted mb-1">What to notice</p>
                                <p className="text-xs text-ink-muted leading-relaxed">{g.what_to_notice}</p>
                              </div>
                            )}
                            {g.sentence_stem && (
                              <div className="rounded-lg px-3 py-2.5" style={{ background: STEM_CLR.bg, border: `1px solid ${STEM_CLR.border}` }}>
                                <p className="text-[10px] font-bold mb-1" style={{ color: STEM_CLR.color }}>Sentence stem</p>
                                <p className="text-xs italic text-ink">{g.sentence_stem}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Toolkit Card ─────────────────────────────────────────────────────────────

function ToolkitCard({ term, isOpen, onToggle }: {
  term: GlossaryTerm; isOpen: boolean; onToggle: () => void
}) {
  const lm = term.level_band ? LEVEL_META[term.level_band] : null

  // Strip prefix from term name for display
  const displayName = term.term
    .replace(/^Thesis:\s*/i, '')
    .replace(/^Paragraph stem:\s*/i, '')
    .replace(/^Comparative transition:\s*/i, '')
    .replace(/^Descriptive → Conceptual:\s*/i, '')

  // The weak → strong pattern for DTC terms
  const isDTCTerm = isDTC(term.id)

  return (
    <div className="border border-rule rounded-xl overflow-hidden">
      <button className="w-full text-left px-5 py-4" onClick={onToggle}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {lm && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ color: lm.color, background: lm.bg }}>
                  {lm.label}
                </span>
              )}
            </div>
            <p className="font-medium text-ink text-sm">{displayName}</p>
          </div>
          <span className="text-ink-muted text-sm flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-rule px-5 pb-5 pt-4 space-y-3">
          {/* Definition / what this does */}
          <div>
            <p className="label-eyebrow text-ink-muted mb-1">{isDTCTerm ? 'Upgrade' : 'What this does'}</p>
            <p className="text-xs text-ink-muted leading-relaxed">{term.definition}</p>
          </div>

          {/* What to notice */}
          {term.what_to_notice && (
            <div>
              <p className="label-eyebrow text-ink-muted mb-1">When to use</p>
              <p className="text-xs text-ink-muted leading-relaxed">{term.what_to_notice}</p>
            </div>
          )}

          {/* Sentence stem — most important, shown prominently */}
          {term.sentence_stem && (
            <div className="rounded-lg px-4 py-3" style={{ background: STEM_CLR.bg, border: `1px solid ${STEM_CLR.border}` }}>
              <p className="label-eyebrow mb-1.5" style={{ color: STEM_CLR.color }}>
                {isDTCTerm ? 'A* sentence stem' : 'Sentence stem'}
              </p>
              <p className="text-sm text-ink italic leading-relaxed">{term.sentence_stem}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
