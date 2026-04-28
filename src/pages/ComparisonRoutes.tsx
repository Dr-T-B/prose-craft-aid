import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Route {
  id: string
  name: string
  level_tag: string
  core_question: string
  hard_times_emphasis: string
  atonement_emphasis: string
  comparative_insight: string
  best_use: string
}

interface MatrixRow {
  id: string
  axis: string
  hard_times: string
  atonement: string
  divergence: string
  themes: string[]
  level_band: string | null
}

type TabId = 'routes' | 'matrix'

// ─── Display config ───────────────────────────────────────────────────────────

const ROUTE_LEVEL: Record<string, { label: string; color: string; bg: string }> = {
  secure:     { label: 'Secure → A',  color: '#2dd4bf', bg: 'rgba(45,212,191,0.10)' },
  strong:     { label: 'Strong → A*', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  perceptive: { label: 'Perceptive',  color: '#a78bfa', bg: 'rgba(167,139,250,0.10)' },
}

const MATRIX_TIER: Record<string, { label: string; color: string; bg: string; border: string }> = {
  secure:   { label: 'Primary',  color: '#2dd4bf', bg: 'rgba(45,212,191,0.06)',  border: 'rgba(45,212,191,0.20)' },
  strong:   { label: 'Secondary', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.20)' },
  top_band: { label: 'Advanced', color: '#a78bfa', bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.20)' },
}

const TIER_ORDER = ['secure', 'strong', 'top_band']
const TIER_DESC: Record<string, string> = {
  secure:   'Must-know pairings — always available in any essay',
  strong:   'Add nuance and avoid block comparison',
  top_band: 'Abstract and conceptual — for top-band AO4 and AO1 sophistication',
}

const HT_CLR  = { color: '#2dd4bf', bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.20)' }
const AT_CLR  = { color: '#fb7185', bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.20)' }
const DIV_CLR = { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' }

// ─── Main component ───────────────────────────────────────────────────────────

export default function ComparisonRoutes() {
  const [tab, setTab]         = useState<TabId>('routes')
  const [routes, setRoutes]   = useState<Route[]>([])
  const [matrix, setMatrix]   = useState<MatrixRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set())
  const [expandedMatrix, setExpandedMatrix] = useState<Set<string>>(new Set())

  // Route filters
  const [routeLevel, setRouteLevel] = useState<'ALL' | 'secure' | 'strong' | 'perceptive'>('ALL')

  // Matrix filters
  const [matrixTier, setMatrixTier]   = useState<'ALL' | 'secure' | 'strong' | 'top_band'>('ALL')
  const [matrixTheme, setMatrixTheme] = useState('ALL')

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const [rRes, mRes] = await Promise.all([
        supabase.from('routes').select('*').order('id'),
        supabase.from('comparative_matrix').select('id,axis,hard_times,atonement,divergence,themes,level_band')
          .eq('is_active', true).order('sort_order'),
      ])
      if (rRes.error) { setError(rRes.error.message); setLoading(false); return }
      if (mRes.error) { setError(mRes.error.message); setLoading(false); return }
      setRoutes(rRes.data || [])
      setMatrix(mRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const toggleRoute = (id: string) => setExpandedRoutes(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleMatrix = (id: string) => setExpandedMatrix(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  // Derived
  const filteredRoutes = routes.filter(r =>
    routeLevel === 'ALL' || r.level_tag === routeLevel
  )

  const allThemes = [...new Set(matrix.flatMap(m => m.themes || []))].sort()

  const filteredMatrix = matrix.filter(m => {
    if (matrixTier !== 'ALL' && m.level_band !== matrixTier) return false
    if (matrixTheme !== 'ALL' && !(m.themes || []).includes(matrixTheme)) return false
    return true
  })

  // Group matrix by tier
  const matrixByTier = TIER_ORDER.reduce<Record<string, MatrixRow[]>>((acc, t) => {
    acc[t] = filteredMatrix.filter(m => m.level_band === t)
    return acc
  }, {})
  const untiered = filteredMatrix.filter(m => !m.level_band)

  // ─── Render ───────────────────────────────────────────────────────────────
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
        <span className="label-eyebrow text-ink-muted block mb-2">Stage 4</span>
        <h1 className="text-2xl font-bold text-ink">Comparison Routes</h1>
        <p className="text-sm text-ink-muted mt-1">
          Link texts by concept · diverge by method · move beyond surface similarity.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-rule px-4 md:px-8">
        {(['routes', 'matrix'] as TabId[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-3 px-4 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-amber-400 text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}>
            {t === 'routes' ? 'Essay Routes' : 'Comparative Matrix'}
          </button>
        ))}
      </div>

      <div className="px-4 py-6 md:px-8">

        {/* ══ ESSAY ROUTES ══════════════════════════════════════════════════ */}
        {tab === 'routes' && (
          <div>
            {/* Explain */}
            <div className="mb-5 p-4 rounded-xl border border-rule bg-paper">
              <p className="text-xs text-ink-muted leading-relaxed">
                Each route is a complete essay argument framework — not a topic list, but a conceptual line
                that works across any question on that theme. Use the{' '}
                <span className="text-amber-400 font-medium">comparative insight</span> as the spine of your
                introduction and the{' '}
                <span className="font-medium text-ink">HT · AT emphasis</span> as the paragraph-level evidence plan.
              </p>
            </div>

            {/* Level filter */}
            <div className="flex gap-1 mb-5 bg-paper border border-rule rounded-lg p-1 w-fit">
              {(['ALL', 'secure', 'strong', 'perceptive'] as const).map(v => {
                const meta = v !== 'ALL' ? ROUTE_LEVEL[v] : null
                return (
                  <button key={v} onClick={() => setRouteLevel(v)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      routeLevel === v ? 'bg-paper border border-rule text-ink' : 'text-ink-muted hover:text-ink'
                    }`}
                    style={routeLevel === v && meta ? { color: meta.color } : undefined}>
                    {v === 'ALL' ? 'All routes' : meta!.label}
                  </button>
                )
              })}
            </div>

            {/* Route cards */}
            <div className="space-y-3">
              {filteredRoutes.map(r => {
                const lm = ROUTE_LEVEL[r.level_tag]
                const isOpen = expandedRoutes.has(r.id)
                return (
                  <div key={r.id} className="border border-rule rounded-xl overflow-hidden bg-paper">
                    <button className="w-full text-left px-5 py-4" onClick={() => toggleRoute(r.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            {lm && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                                style={{ color: lm.color, background: lm.bg }}>
                                {lm.label}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-ink text-sm">{r.name}</p>
                          <p className="text-xs text-ink-muted mt-1 leading-relaxed italic">"{r.core_question}"</p>
                        </div>
                        <span className="text-ink-muted text-sm flex-shrink-0 mt-0.5">{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-rule">
                        {/* HT / AT emphasis */}
                        <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-rule">
                          <div className="p-5">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ color: HT_CLR.color, background: HT_CLR.bg }}>HT</span>
                              <span className="label-eyebrow text-ink-muted">Hard Times emphasis</span>
                            </div>
                            <p className="text-xs text-ink-muted leading-relaxed">{r.hard_times_emphasis}</p>
                          </div>
                          <div className="p-5">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ color: AT_CLR.color, background: AT_CLR.bg }}>AT</span>
                              <span className="label-eyebrow text-ink-muted">Atonement emphasis</span>
                            </div>
                            <p className="text-xs text-ink-muted leading-relaxed">{r.atonement_emphasis}</p>
                          </div>
                        </div>

                        {/* Comparative insight */}
                        <div className="p-5 border-t border-rule"
                          style={{ background: DIV_CLR.bg, borderTop: `1px solid ${DIV_CLR.border}` }}>
                          <p className="label-eyebrow mb-2" style={{ color: DIV_CLR.color }}>
                            Comparative insight — use as essay spine
                          </p>
                          <p className="text-sm text-ink leading-relaxed">{r.comparative_insight}</p>
                        </div>

                        {/* Best use */}
                        <div className="px-5 py-3 border-t border-rule">
                          <p className="label-eyebrow text-ink-muted mb-1">Best use</p>
                          <p className="text-xs text-ink-muted">{r.best_use}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ COMPARATIVE MATRIX ════════════════════════════════════════════ */}
        {tab === 'matrix' && (
          <div>
            {/* Explain */}
            <div className="mb-5 p-4 rounded-xl border border-rule bg-paper">
              <p className="text-xs text-ink-muted leading-relaxed">
                Every row is a comparative axis. The{' '}
                <span className="font-medium text-amber-400">divergence</span> is the AO4 move —
                how the texts approach the same concern differently. That divergence, not the similarity,
                is what earns marks at A and above.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-5">
              <div className="flex gap-1 bg-paper border border-rule rounded-lg p-1">
                {(['ALL', 'secure', 'strong', 'top_band'] as const).map(v => {
                  const meta = v !== 'ALL' ? MATRIX_TIER[v] : null
                  return (
                    <button key={v} onClick={() => setMatrixTier(v)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        matrixTier === v ? 'bg-paper border border-rule text-ink' : 'text-ink-muted hover:text-ink'
                      }`}
                      style={matrixTier === v && meta ? { color: meta.color } : undefined}>
                      {v === 'ALL' ? 'All tiers' : meta!.label}
                    </button>
                  )
                })}
              </div>
              <select className="bg-paper border border-rule rounded-lg px-3 py-1.5 text-xs text-ink-muted"
                value={matrixTheme} onChange={e => setMatrixTheme(e.target.value)}>
                <option value="ALL">All themes</option>
                {allThemes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-xs text-ink-muted self-center">{filteredMatrix.length} pairings</span>
            </div>

            {/* Tiered sections */}
            {TIER_ORDER.map(tier => {
              const rows = matrixByTier[tier]
              if (!rows || rows.length === 0) return null
              const tm = MATRIX_TIER[tier]
              return (
                <div key={tier} className="mb-8">
                  <div className="flex items-baseline gap-3 mb-3">
                    <h2 className="text-sm font-bold" style={{ color: tm.color }}>{tm.label} pairings</h2>
                    <p className="text-xs text-ink-muted">{TIER_DESC[tier]}</p>
                    <span className="text-xs text-ink-muted ml-auto">{rows.length}</span>
                  </div>
                  <div className="space-y-2">
                    {rows.map(m => (
                      <MatrixCard key={m.id} row={m} tier={tm}
                        isOpen={expandedMatrix.has(m.id)}
                        onToggle={() => toggleMatrix(m.id)} />
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Untiered / conceptual rows */}
            {untiered.length > 0 && (
              <div className="mb-8">
                <div className="flex items-baseline gap-3 mb-3">
                  <h2 className="text-sm font-bold text-ink-muted">Conceptual / thematic</h2>
                  <p className="text-xs text-ink-muted">Abstract links — use to frame paragraphs, not open them</p>
                </div>
                <div className="space-y-2">
                  {untiered.map(m => (
                    <MatrixCard key={m.id} row={m}
                      tier={{ label: '', color: '#64748b', bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.15)' }}
                      isOpen={expandedMatrix.has(m.id)}
                      onToggle={() => toggleMatrix(m.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Matrix Card ──────────────────────────────────────────────────────────────

function MatrixCard({ row, tier, isOpen, onToggle }: {
  row: MatrixRow
  tier: { label: string; color: string; bg: string; border: string }
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-rule rounded-xl overflow-hidden bg-paper">
      {/* Header */}
      <button className="w-full text-left px-5 py-3.5" onClick={onToggle}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {tier.label && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ color: tier.color, background: tier.bg }}>
                {tier.label}
              </span>
            )}
            {(row.themes || []).map(t => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
                {t}
              </span>
            ))}
            <p className="font-medium text-ink text-sm truncate">{row.axis}</p>
          </div>
          <span className="text-ink-muted text-sm flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-rule">
          {/* HT / AT split */}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-rule">
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ color: HT_CLR.color, background: HT_CLR.bg }}>HT</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">{row.hard_times}</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ color: AT_CLR.color, background: AT_CLR.bg }}>AT</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">{row.atonement}</p>
            </div>
          </div>

          {/* Divergence — AO4 move */}
          <div className="p-4 border-t"
            style={{ background: DIV_CLR.bg, borderColor: DIV_CLR.border }}>
            <p className="label-eyebrow mb-1.5" style={{ color: DIV_CLR.color }}>
              Divergence — the AO4 move
            </p>
            <p className="text-xs text-ink leading-relaxed">{row.divergence}</p>
          </div>
        </div>
      )}
    </div>
  )
}
