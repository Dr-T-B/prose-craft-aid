import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  slug: string
  title: string
  position: number
  estimated_minutes: number
  body: string
  module_position: number
}

interface CharacterCard {
  id: string
  source_text: string
  name: string
  one_line: string
  core_function: string | null
  structural_role: string | null
  comparative_link: string | null
  level_band: string | null
  themes: string[]
  linked_methods: string[]
}

interface SymbolEntry {
  id: string
  source_text: string
  name: string
  one_line: string
  use_case: string | null
  level_band: string | null
  themes: string[]
}

type PrimaryTab = 'structure' | 'characters' | 'symbols'

// ─── HT structural panels ────────────────────────────────────────────────────

const HT_BOOKS = [
  { label: 'Sowing', subtitle: 'Book One', color: '#2dd4bf', bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.25)', desc: 'Ideology planted — Fact, repression, class hardness' },
  { label: 'Reaping', subtitle: 'Book Two', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', desc: 'Consequences emerge — Louisa collapses, Stephen suffers' },
  { label: 'Garnering', subtitle: 'Book Three', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)', desc: 'Reckoning — recognition arrives, but too late' },
]

const AT_PARTS = [
  { label: 'Part One', subtitle: '1935 estate', color: '#fb7185', bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.25)', desc: 'The misreading — perception, class, accusation' },
  { label: 'Part Two', subtitle: 'Dunkirk 1940', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', desc: 'Historical catastrophe — private injustice inside mass suffering' },
  { label: 'Part Three', subtitle: 'London 1940', color: '#2dd4bf', bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.25)', desc: 'Nursing — penance without repair' },
  { label: 'Coda', subtitle: 'London 1999', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)', desc: 'Revelation — Briony as author; repair as fiction' },
]

const LEVEL_META: Record<string, { label: string; color: string; bg: string }> = {
  secure:   { label: 'Secure',   color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)' },
  strong:   { label: 'Strong',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  top_band: { label: 'Top band', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
}

const TEXT_META = {
  'Hard Times': { short: 'HT', color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)' },
  'Atonement':  { short: 'AT', color: '#fb7185', bg: 'rgba(251,113,133,0.12)' },
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
        if (part.startsWith('*') && part.endsWith('*'))
          return <em key={i}>{part.slice(1, -1)}</em>
        return part
      })}
    </>
  )
}

function MarkdownTable({ raw }: { raw: string }) {
  const rows = raw.trim().split('\n').filter(r => r.trim().startsWith('|'))
  if (rows.length < 2) return null
  const parseCells = (row: string) =>
    row.split('|').slice(1, -1).map(c => c.trim())
  const headers = parseCells(rows[0])
  const body = rows.slice(2) // skip separator row

  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="text-left py-1.5 px-2 border-b border-rule text-ink font-semibold label-eyebrow">
                {inlineFormat(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-rule/50">
              {parseCells(row).map((cell, ci) => (
                <td key={ci} className="py-1.5 px-2 text-ink-muted align-top leading-relaxed">
                  {inlineFormat(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MarkdownBody({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/)
  return (
    <div className="space-y-1">
      {blocks.map((block, i) => {
        const t = block.trim()
        if (!t) return null

        if (t === '---') return <hr key={i} className="border-rule my-3" />

        if (t.startsWith('## '))
          return <h2 key={i} className="text-base font-bold text-ink mt-5 mb-1.5">{inlineFormat(t.slice(3))}</h2>

        if (t.startsWith('### '))
          return <h3 key={i} className="text-sm font-semibold text-ink mt-3 mb-1">{inlineFormat(t.slice(4))}</h3>

        if (t.startsWith('|'))
          return <MarkdownTable key={i} raw={t} />

        if (t.startsWith('> ')) {
          const lines = t.split('\n').map(l => l.replace(/^>\s?/, '')).join(' ')
          return (
            <blockquote key={i} className="border-l-2 border-amber-400/50 pl-3 italic text-sm text-ink-muted my-2">
              {inlineFormat(lines)}
            </blockquote>
          )
        }

        const lines = t.split('\n')
        if (lines.every(l => l.trim() === '' || l.trim().startsWith('-'))) {
          const items = lines.filter(l => l.trim().startsWith('-'))
          return (
            <ul key={i} className="space-y-1 my-2">
              {items.map((item, j) => (
                <li key={j} className="flex gap-2 text-sm text-ink-muted">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">—</span>
                  <span>{inlineFormat(item.slice(item.indexOf('-') + 1).trim())}</span>
                </li>
              ))}
            </ul>
          )
        }

        return (
          <p key={i} className="text-sm text-ink-muted leading-relaxed">
            {inlineFormat(t)}
          </p>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TextArchitecture() {
  const [tab, setTab]             = useState<PrimaryTab>('structure')
  const [textFocus, setTextFocus] = useState<'Hard Times' | 'Atonement'>('Hard Times')

  const [lessons, setLessons]       = useState<Lesson[]>([])
  const [characters, setCharacters] = useState<CharacterCard[]>([])
  const [symbols, setSymbols]       = useState<SymbolEntry[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const [expandedLessons, setExpandedLessons]   = useState<Set<string>>(new Set())
  const [expandedChars, setExpandedChars]       = useState<Set<string>>(new Set())
  const [expandedSymbols, setExpandedSymbols]   = useState<Set<string>>(new Set())

  // Character filters
  const [charText, setCharText]     = useState<'ALL' | 'Hard Times' | 'Atonement'>('ALL')
  const [charLevel, setCharLevel]   = useState<'ALL' | 'secure' | 'strong' | 'top_band'>('ALL')

  // Symbol filters
  const [symText, setSymText]       = useState<'ALL' | 'Hard Times' | 'Atonement'>('ALL')
  const [symTheme, setSymTheme]     = useState('ALL')

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)

      // Step 1: resolve module IDs for positions 6 and 7
      const { data: mods, error: modErr } = await supabase
        .from('modules')
        .select('id, position')
        .in('position', [6, 7])

      if (modErr) { setError(modErr.message); setLoading(false); return }

      const modIds  = (mods || []).map(m => m.id)
      const posMap  = Object.fromEntries((mods || []).map(m => [m.id, m.position]))

      // Step 2: fetch lessons + character cards + symbol entries in parallel
      const [lRes, cRes, sRes] = await Promise.all([
        supabase
          .from('lessons')
          .select('slug, title, position, estimated_minutes, body, module_id')
          .in('module_id', modIds)
          .order('position'),
        supabase.from('character_cards').select('*').order('source_text').order('name'),
        supabase.from('symbol_entries').select('*').order('source_text').order('name'),
      ])

      if (lRes.error) { setError(lRes.error.message); setLoading(false); return }
      if (cRes.error) { setError(cRes.error.message); setLoading(false); return }
      if (sRes.error) { setError(sRes.error.message); setLoading(false); return }

      setLessons((lRes.data || []).map((l: any) => ({ ...l, module_position: posMap[l.module_id] ?? 0 })))
      setCharacters(cRes.data || [])
      setSymbols(sRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const toggleLesson = (slug: string) => setExpandedLessons(prev => {
    const n = new Set(prev); if (n.has(slug)) n.delete(slug); else n.add(slug); return n
  })
  const toggleChar = (id: string) => setExpandedChars(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n
  })
  const toggleSym = (id: string) => setExpandedSymbols(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n
  })

  const htLessons = lessons.filter(l => l.module_position === 6).sort((a, b) => a.position - b.position)
  const atLessons = lessons.filter(l => l.module_position === 7).sort((a, b) => a.position - b.position)

  const filteredChars = characters.filter(c => {
    if (charText !== 'ALL' && c.source_text !== charText) return false
    if (charLevel !== 'ALL' && c.level_band !== charLevel) return false
    return true
  })

  const allSymThemes = [...new Set(symbols.flatMap(s => s.themes || []))].sort()
  const filteredSyms = symbols.filter(s => {
    if (symText !== 'ALL' && s.source_text !== symText) return false
    if (symTheme !== 'ALL' && !(s.themes || []).includes(symTheme)) return false
    return true
  })

  if (loading) return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <p className="text-ink-muted text-sm animate-pulse">Loading…</p>
    </div>
  )
  if (error) return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="bg-paper border border-red-500/30 rounded-xl p-6 max-w-md text-center">
        <p className="text-red-400 font-medium mb-1">Failed to load</p>
        <p className="text-ink-muted text-sm">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-paper">
      {/* ── Header ── */}
      <div className="px-4 pt-10 pb-6 md:px-8 border-b border-rule">
        <span className="label-eyebrow text-ink-muted block mb-2">Stage 3</span>
        <h1 className="text-2xl font-bold text-ink">Text Architecture</h1>
        <p className="text-sm text-ink-muted mt-1">
          Structure · Characters · Symbols — use these inside body paragraphs, not just introductions.
        </p>
      </div>

      {/* ── Primary tabs ── */}
      <div className="flex gap-0 border-b border-rule px-4 md:px-8">
        {(['structure', 'characters', 'symbols'] as PrimaryTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 px-4 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-amber-400 text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 py-6 md:px-8">

        {/* ══ STRUCTURE TAB ══════════════════════════════════════════════════ */}
        {tab === 'structure' && (
          <div>
            {/* Text toggle */}
            <div className="flex gap-2 mb-6">
              {(['Hard Times', 'Atonement'] as const).map(txt => (
                <button
                  key={txt}
                  onClick={() => setTextFocus(txt)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    textFocus === txt
                      ? txt === 'Hard Times'
                        ? 'bg-teal-500/10 border-teal-400/60 text-teal-400'
                        : 'bg-rose-500/10 border-rose-400/60 text-rose-400'
                      : 'border-rule text-ink-muted hover:text-ink'
                  }`}
                >
                  {txt === 'Hard Times' ? 'Hard Times' : 'Atonement'}
                </button>
              ))}
            </div>

            {/* HT structure ─────────────────────────────────────────────── */}
            {textFocus === 'Hard Times' && (
              <div>
                {/* Book banner */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {HT_BOOKS.map(b => (
                    <div key={b.label}
                      className="rounded-xl p-4 border"
                      style={{ background: b.bg, borderColor: b.border }}>
                      <p className="label-eyebrow mb-0.5" style={{ color: b.color }}>{b.label}</p>
                      <p className="text-xs font-medium text-ink mb-1">{b.subtitle}</p>
                      <p className="text-xs text-ink-muted leading-relaxed">{b.desc}</p>
                    </div>
                  ))}
                </div>
                {/* Lessons */}
                <div className="space-y-2">
                  {htLessons.map(l => (
                    <LessonAccordion
                      key={l.slug}
                      lesson={l}
                      isOpen={expandedLessons.has(l.slug)}
                      onToggle={() => toggleLesson(l.slug)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* AT structure ─────────────────────────────────────────────── */}
            {textFocus === 'Atonement' && (
              <div>
                {/* Part banner */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {AT_PARTS.map(p => (
                    <div key={p.label}
                      className="rounded-xl p-4 border"
                      style={{ background: p.bg, borderColor: p.border }}>
                      <p className="label-eyebrow mb-0.5" style={{ color: p.color }}>{p.label}</p>
                      <p className="text-xs font-medium text-ink mb-1">{p.subtitle}</p>
                      <p className="text-xs text-ink-muted leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>
                {/* Lessons */}
                <div className="space-y-2">
                  {atLessons.map(l => (
                    <LessonAccordion
                      key={l.slug}
                      lesson={l}
                      isOpen={expandedLessons.has(l.slug)}
                      onToggle={() => toggleLesson(l.slug)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ CHARACTERS TAB ═════════════════════════════════════════════════ */}
        {tab === 'characters' && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-5">
              <div className="flex gap-1 bg-paper border border-rule rounded-lg p-1">
                {(['ALL', 'Hard Times', 'Atonement'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setCharText(v)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      charText === v
                        ? 'bg-paper border border-rule text-ink'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {v === 'ALL' ? 'All' : TEXT_META[v].short}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-paper border border-rule rounded-lg p-1">
                {(['ALL', 'secure', 'strong', 'top_band'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setCharLevel(v)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      charLevel === v
                        ? 'bg-paper border border-rule text-ink'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                    style={charLevel === v && v !== 'ALL' ? { color: LEVEL_META[v]?.color } : undefined}
                  >
                    {v === 'ALL' ? 'All bands' : LEVEL_META[v]?.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-ink-muted self-center">{filteredChars.length} characters</span>
            </div>

            {/* Cards */}
            <div className="grid md:grid-cols-2 gap-3">
              {filteredChars.map(c => {
                const tm = TEXT_META[c.source_text as keyof typeof TEXT_META]
                const lm = c.level_band ? LEVEL_META[c.level_band] : null
                const isOpen = expandedChars.has(c.id)
                return (
                  <div key={c.id} className="bg-paper border border-rule rounded-xl overflow-hidden">
                    <button
                      className="w-full text-left p-4"
                      onClick={() => toggleChar(c.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            {tm && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ color: tm.color, background: tm.bg }}>
                                {tm.short}
                              </span>
                            )}
                            {lm && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                style={{ color: lm.color, background: lm.bg }}>
                                {lm.label}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-ink text-sm">{c.name}</p>
                          <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{c.one_line}</p>
                        </div>
                        <span className="text-ink-muted text-sm mt-0.5 flex-shrink-0">
                          {isOpen ? '▲' : '▼'}
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 space-y-3 border-t border-rule pt-3">
                        {c.structural_role && (
                          <div>
                            <p className="label-eyebrow text-ink-muted mb-1">Structural role</p>
                            <p className="text-xs text-ink-muted leading-relaxed">{c.structural_role}</p>
                          </div>
                        )}
                        {c.core_function && (
                          <div>
                            <p className="label-eyebrow text-ink-muted mb-1">Core function</p>
                            <p className="text-xs text-ink-muted leading-relaxed">{c.core_function}</p>
                          </div>
                        )}
                        {c.comparative_link && (
                          <div className="p-3 rounded-lg"
                            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <p className="label-eyebrow mb-1" style={{ color: '#f59e0b' }}>AO4 — Comparative link</p>
                            <p className="text-xs text-ink-muted leading-relaxed">{c.comparative_link}</p>
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

        {/* ══ SYMBOLS TAB ════════════════════════════════════════════════════ */}
        {tab === 'symbols' && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-5">
              <div className="flex gap-1 bg-paper border border-rule rounded-lg p-1">
                {(['ALL', 'Hard Times', 'Atonement'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setSymText(v)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      symText === v
                        ? 'bg-paper border border-rule text-ink'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {v === 'ALL' ? 'All' : TEXT_META[v].short}
                  </button>
                ))}
              </div>
              <select
                className="bg-paper border border-rule rounded-lg px-3 py-1.5 text-xs text-ink-muted"
                value={symTheme}
                onChange={e => setSymTheme(e.target.value)}
              >
                <option value="ALL">All themes</option>
                {allSymThemes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-xs text-ink-muted self-center">{filteredSyms.length} symbols</span>
            </div>

            {/* Cards */}
            <div className="grid md:grid-cols-2 gap-3">
              {filteredSyms.map(s => {
                const tm = TEXT_META[s.source_text as keyof typeof TEXT_META]
                const lm = s.level_band ? LEVEL_META[s.level_band] : null
                const isOpen = expandedSymbols.has(s.id)
                const hasAo4 = s.use_case?.toLowerCase().includes('ao4')

                return (
                  <div key={s.id} className="bg-paper border border-rule rounded-xl overflow-hidden">
                    <button
                      className="w-full text-left p-4"
                      onClick={() => toggleSym(s.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            {tm && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ color: tm.color, background: tm.bg }}>
                                {tm.short}
                              </span>
                            )}
                            {lm && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                style={{ color: lm.color, background: lm.bg }}>
                                {lm.label}
                              </span>
                            )}
                            {hasAo4 && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.10)' }}>
                                AO4
                              </span>
                            )}
                            {(s.themes || []).map(t => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {t}
                              </span>
                            ))}
                          </div>
                          <p className="font-semibold text-ink text-sm">{s.name}</p>
                          <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{s.one_line}</p>
                        </div>
                        <span className="text-ink-muted text-sm mt-0.5 flex-shrink-0">
                          {isOpen ? '▲' : '▼'}
                        </span>
                      </div>
                    </button>

                    {isOpen && s.use_case && (
                      <div className="px-4 pb-4 border-t border-rule pt-3">
                        <p className="label-eyebrow text-ink-muted mb-1">Exam use</p>
                        <p className="text-xs text-ink-muted leading-relaxed">{s.use_case}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Lesson Accordion ─────────────────────────────────────────────────────────

function LessonAccordion({ lesson, isOpen, onToggle }: {
  lesson: Lesson; isOpen: boolean; onToggle: () => void
}) {
  return (
    <div className="bg-paper border border-rule rounded-xl overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
        onClick={onToggle}
      >
        <div>
          <p className="font-medium text-ink text-sm">{lesson.title}</p>
          <p className="text-xs text-ink-muted mt-0.5">{lesson.estimated_minutes} min read</p>
        </div>
        <span className="text-ink-muted flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="px-5 pb-6 border-t border-rule pt-4">
          <MarkdownBody content={lesson.body} />
        </div>
      )}
    </div>
  )
}
