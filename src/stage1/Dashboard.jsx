import { useState } from "react";

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Roboto+Serif:ital,opsz,wght@0,8..144,300;0,8..144,400;0,8..144,600;0,8..144,700;1,8..144,300;1,8..144,400&family=Roboto+Flex:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden}
:root{
  --ht:#A03722; --soot:#1A1715; --smoke:#5C544D;
  --at:#3A6E8F; --green:#3D5A3A; --ochre:#B17A2D;
  --ok:#2D7A4F;
  --surface:#F7F4EE; --card:#FFFFFF; --border:#E8E3DB;
  --t1:#1A1715; --t2:#5C544D; --t3:#9A918A;
}
.fs::-webkit-scrollbar{display:none}
.fs{scrollbar-width:none}
@keyframes fadeUp {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop    {0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes pulse  {0%,100%{opacity:.5}50%{opacity:1}}
@keyframes shimmer{
  0%  {background-position:-200% 0}
  100%{background-position: 200% 0}
}
.cold-cell{
  border: 1.5px dashed var(--border) !important;
  animation: pulse 2.4s ease infinite;
}
`;

/* ─── Axis data ──────────────────────────────────────────────────────────── */
const ALL_AXES = [
  { slug:"c1_innocence_misinterpretation",   label:"Innocence",          cluster:"C1", mastery:0.20 },
  { slug:"c1_education_formation",           label:"Education",          cluster:"C1", mastery:0.85 },
  { slug:"c1_family_emotional_formation",    label:"Family",             cluster:"C1", mastery:0.30 },
  { slug:"c2_truth_narrative_authority",     label:"Narrative truth",    cluster:"C2", mastery:0.10 },
  { slug:"c2_power_voice",                   label:"Power & voice",      cluster:"C2", mastery:0.50 },
  { slug:"c3_class_social_hierarchy",        label:"Class",              cluster:"C3", mastery:0.60 },
  { slug:"c3_social_performance_identity",   label:"Identity",           cluster:"C3", mastery:0.20 },
  { slug:"c3_setting_social_critique",       label:"Settings",           cluster:"C3", mastery:0.70 },
  { slug:"c4_women_agency",                  label:"Women & agency",     cluster:"C4", mastery:0.90 },
  { slug:"c4_desire_sexuality_misreading",   label:"Desire",             cluster:"C4", mastery:0.45 },
  { slug:"c5_guilt_responsibility",          label:"Guilt",              cluster:"C5", mastery:0.40 },
  { slug:"c5_law_justice_injustice",         label:"Justice",            cluster:"C5", mastery:0.00 },
  { slug:"c5_religion_morality_secular",     label:"Morality",           cluster:"C5", mastery:0.00 },
  { slug:"c5_endings_resolution",            label:"Endings",            cluster:"C5", mastery:0.55 },
  { slug:"c6_industrialism_war",             label:"War",                cluster:"C6", mastery:0.00 },
  { slug:"c6_work_duty_human_cost",          label:"Work & duty",        cluster:"C6", mastery:0.00 },
  { slug:"c7_imagination_rationality",       label:"Imagination",        cluster:"C7", mastery:0.00 },
  { slug:"c7_moral_imagination",             label:"Moral imagination",  cluster:"C7", mastery:0.00 },
  { slug:"c8_structure_consequence",         label:"Structure",          cluster:"C8", mastery:0.15 },
  { slug:"c8_memory_retrospection",          label:"Memory",             cluster:"C8", mastery:0.35 },
];

const AXIS_DETAIL = {
  c1_innocence_misinterpretation:  { title:"Innocence as damaged perception",             band:"L4–L5 bridge" },
  c1_education_formation:          { title:"Education as moral formation or deformation",  band:"Core L4" },
  c1_family_emotional_formation:   { title:"The family as a site of damage",              band:"Core L4" },
  c2_truth_narrative_authority:    { title:"Who controls truth?",                          band:"L5 stretch" },
  c2_power_voice:                  { title:"Silencing and credibility",                   band:"L4–L5 bridge" },
  c3_class_social_hierarchy:       { title:"Class as an organising system of power",      band:"L4–L5 bridge" },
  c3_social_performance_identity:  { title:"Constructed selves and false roles",          band:"Core L4" },
  c3_setting_social_critique:      { title:"Places as moral systems",                     band:"Core L4" },
  c4_women_agency:                 { title:"Female agency under constraint",              band:"Core L4" },
  c4_desire_sexuality_misreading:  { title:"Sexual knowledge and social panic",           band:"L4–L5 bridge" },
  c5_guilt_responsibility:         { title:"Responsibility after harm has been done",     band:"L4–L5 bridge" },
  c5_law_justice_injustice:        { title:"Institutions and failed justice",             band:"L4–L5 bridge" },
  c5_religion_morality_secular:    { title:"Moral frameworks after failure",              band:"L4–L5 bridge" },
  c5_endings_resolution:           { title:"Closure and its discontents",                band:"L5 stretch" },
  c6_industrialism_war:            { title:"Mechanised human suffering",                  band:"L4–L5 bridge" },
  c6_work_duty_human_cost:         { title:"Labour as moral and physical burden",         band:"Core L4" },
  c7_imagination_rationality:      { title:"Fact and fiction as competing moral systems", band:"L5 stretch" },
  c7_moral_imagination:            { title:"Sympathy as a condition of judgement",        band:"L5 stretch" },
  c8_structure_consequence:        { title:"How structure turns error into consequence",  band:"L5 stretch" },
  c8_memory_retrospection:         { title:"Looking back as judgement",                  band:"L4–L5 bridge" },
};

const BAND_COLOR = {
  "Core L4":      "#9A918A",
  "L4–L5 bridge": "#A03722",
  "L5 stretch":   "#8A5F18",
};

/* ─── Mastery → visual ───────────────────────────────────────────────────── */
function masteryStyle(v) {
  if (v === 0)   return { bg:"#EDE8E1",                         fg:"#9A918A", cold:true };
  if (v < 0.25)  return { bg:`rgba(160,55,34,${.08+v*.3})`,     fg:"#A03722", cold:false };
  if (v < 0.55)  return { bg:`rgba(177,122,45,${.1+v*.2})`,     fg:"#8A5F18", cold:false };
  if (v < 0.80)  return { bg:`rgba(58,110,143,${.12+v*.18})`,   fg:"#3A6E8F", cold:false };
  return           { bg:`rgba(45,122,79,${.15+(v-.8)*.5})`,     fg:"#2D7A4F", cold:false };
}

function MasteryLabel({ v }) {
  if (v === 0)   return <span style={{color:"#9A918A"}}>Not started</span>;
  if (v < 0.25)  return <span style={{color:"#A03722"}}>Just begun</span>;
  if (v < 0.55)  return <span style={{color:"#8A5F18"}}>Building</span>;
  if (v < 0.80)  return <span style={{color:"#3A6E8F"}}>Confident</span>;
  return           <span style={{color:"#2D7A4F"}}>Mastered</span>;
}

/* ─── Cluster badge ──────────────────────────────────────────────────────── */
function ClusterBadge({ c }) {
  const cols = { C1:"#A03722",C2:"#3A6E8F",C3:"#5C544D",C4:"#3D5A3A",C5:"#8A5F18",C6:"#1A1715",C7:"#B17A2D",C8:"#3A6E8F" };
  return (
    <span style={{
      fontSize:".55rem", fontWeight:700, padding:"1px 5px",
      borderRadius:"3px", background:`${cols[c]}18`, color:cols[c],
      fontFamily:"'Roboto Flex',sans-serif", letterSpacing:".06em",
    }}>{c}</span>
  );
}

/* ─── Heatmap cell ───────────────────────────────────────────────────────── */
function HeatCell({ ax, selected, onClick }) {
  const ms = masteryStyle(ax.mastery);
  const pct = Math.round(ax.mastery * 100);
  return (
    <button
      onClick={onClick}
      className={ms.cold ? "cold-cell" : ""}
      style={{
        all:"unset", cursor:"pointer",
        display:"flex", flexDirection:"column",
        background: ms.cold ? "var(--surface)" : ms.bg,
        borderRadius:"8px",
        border: selected
          ? "2px solid var(--soot)"
          : ms.cold
            ? undefined  /* handled by CSS class */
            : `1.5px solid ${ms.bg}`,
        padding:"8px 8px 6px",
        aspectRatio: "1 / 1",
        boxShadow: selected ? "0 2px 12px rgba(26,23,21,.14)" : "none",
        transform: selected ? "scale(1.05)" : "none",
        transition:"transform .14s ease, box-shadow .14s ease",
        animation: selected ? "pop .18s ease" : "none",
        position:"relative", overflow:"hidden",
        WebkitTapHighlightColor:"transparent",
      }}
    >
      {/* Cluster badge */}
      <div style={{ marginBottom:"auto" }}>
        <ClusterBadge c={ax.cluster} />
      </div>

      {/* Label */}
      <span style={{
        fontFamily:"'Roboto Flex',sans-serif",
        fontSize:".6rem", fontWeight:600,
        color: ms.cold ? "var(--t3)" : ms.fg,
        lineHeight:1.3,
        display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden",
        marginTop:"6px",
      }}>
        {ax.label}
      </span>

      {/* Mastery bar */}
      <div style={{
        height:"2px", borderRadius:"1px",
        background: ms.cold ? "var(--border)" : `${ms.fg}22`,
        marginTop:"6px", overflow:"hidden",
      }}>
        <div style={{
          height:"100%", borderRadius:"1px",
          width:`${pct}%`,
          background: ms.cold ? "var(--border)" : ms.fg,
          transition:"width .4s ease",
        }} />
      </div>
    </button>
  );
}

/* ─── Selected cell popover ──────────────────────────────────────────────── */
function HeatPopover({ ax, onClose, onNavigate }) {
  if (!ax) return null;
  const detail = AXIS_DETAIL[ax.slug] ?? { title: ax.label, band:"Core L4" };
  const ms = masteryStyle(ax.mastery);
  const pct = Math.round(ax.mastery * 100);
  return (
    <div style={{
      position:"absolute", bottom:"calc(100% + 8px)", left:"50%",
      transform:"translateX(-50%)",
      width:"220px", background:"var(--card)",
      borderRadius:"10px", padding:"12px",
      boxShadow:"0 4px 20px rgba(26,23,21,.16), 0 0 0 1px rgba(26,23,21,.06)",
      zIndex:200, animation:"fadeUp .16s ease",
    }}>
      <div style={{ fontSize:".6rem", fontWeight:500, color:BAND_COLOR[detail.band] ?? "var(--t3)", marginBottom:"4px", fontFamily:"'Roboto Flex',sans-serif", letterSpacing:".05em" }}>
        {detail.band}
      </div>
      <p style={{ fontFamily:"'Roboto Serif',serif", fontSize:".8rem", fontWeight:600, lineHeight:1.35, color:"var(--t1)", marginBottom:"8px" }}>
        {detail.title}
      </p>
      <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"10px" }}>
        <div style={{ flex:1, height:"3px", borderRadius:"2px", background:"var(--border)", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background: ms.cold ? "var(--border)" : ms.fg, borderRadius:"2px" }} />
        </div>
        <span style={{ fontSize:".66rem", fontWeight:600, color: ms.cold ? "var(--t3)" : ms.fg, fontFamily:"'Roboto Flex',sans-serif", flexShrink:0 }}>
          {pct}%
        </span>
      </div>
      <div style={{ fontSize:".66rem", fontFamily:"'Roboto Flex',sans-serif", marginBottom:"10px" }}>
        <MasteryLabel v={ax.mastery} />
      </div>
      <button onClick={() => onNavigate(ax.slug)} style={{
        all:"unset", cursor:"pointer", width:"100%",
        padding:"9px", borderRadius:"7px", textAlign:"center",
        background:"var(--soot)", color:"#F7F4EE",
        fontSize:".75rem", fontWeight:600, fontFamily:"'Roboto Flex',sans-serif",
        WebkitTapHighlightColor:"transparent",
      }}>
        {ax.mastery === 0 ? "Start this axis →" : "Continue →"}
      </button>
      {/* Arrow */}
      <div style={{
        position:"absolute", bottom:"-6px", left:"50%", transform:"translateX(-50%)",
        width:"12px", height:"6px",
        background:"var(--card)", clipPath:"polygon(0 0, 100% 0, 50% 100%)",
        filter:"drop-shadow(0 2px 2px rgba(26,23,21,.08))",
      }} />
    </div>
  );
}

/* ─── Progress ring (dashboard summary) ─────────────────────────────────── */
function ProgressRing({ started, total }) {
  const pct = started / total;
  const r = 18, stroke = 3, circ = 2 * Math.PI * r;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx="22" cy="22" r={r} fill="none"
        stroke={pct > 0.7 ? "var(--ok)" : pct > 0.4 ? "var(--ochre)" : "var(--ht)"}
        strokeWidth={stroke}
        strokeDasharray={`${circ * pct} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transition:"stroke-dasharray .6s ease" }}
      />
      <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="700"
        fontFamily="'Roboto Flex',sans-serif" fill="var(--t1)">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

/* ─── Quick action button ────────────────────────────────────────────────── */
function QuickAction({ icon, label, sub, accent, onClick }) {
  return (
    <button onClick={onClick} style={{
      all:"unset", cursor:"pointer", flex:1,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      gap:"5px", padding:"12px 6px",
      background:"var(--card)", borderRadius:"12px",
      boxShadow:"0 1px 3px rgba(26,23,21,.06)",
      border:"1.5px solid transparent",
      transition:"all .14s ease",
      WebkitTapHighlightColor:"transparent",
    }}
    onMouseEnter={e => { e.currentTarget.style.border=`1.5px solid ${accent}44`; e.currentTarget.style.background=`${accent}08`; }}
    onMouseLeave={e => { e.currentTarget.style.border="1.5px solid transparent"; e.currentTarget.style.background="var(--card)"; }}
    >
      <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:`${accent}14`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {icon}
      </div>
      <span style={{ fontFamily:"'Roboto Flex',sans-serif", fontSize:".7rem", fontWeight:600, color:"var(--t1)", textAlign:"center" }}>{label}</span>
      <span style={{ fontFamily:"'Roboto Flex',sans-serif", fontSize:".6rem", color:"var(--t3)", textAlign:"center", lineHeight:1.3 }}>{sub}</span>
    </button>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [selectedRef, setSelectedRef] = useState(null);

  const cold = ALL_AXES.filter(a => a.mastery === 0);
  const started = ALL_AXES.filter(a => a.mastery > 0).length;
  const avgMastery = Math.round(ALL_AXES.reduce((s, a) => s + a.mastery, 0) / ALL_AXES.length * 100);
  const selectedAxis = selectedSlug ? ALL_AXES.find(a => a.slug === selectedSlug) : null;

  function handleCellClick(slug) {
    setSelectedSlug(prev => prev === slug ? null : slug);
  }

  const CONTINUE = {
    slug: "c5_guilt_responsibility",
    title: "Responsibility after harm has been done",
    lastTab: "Write tab",
    ago: "23 min ago",
    mastery: 0.40,
    band: "L4–L5 bridge",
  };

  const ms = masteryStyle(CONTINUE.mastery);

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        height:"100vh", display:"flex", flexDirection:"column",
        fontFamily:"'Roboto Flex',sans-serif", color:"var(--t1)",
        WebkitFontSmoothing:"antialiased", background:"var(--surface)",
      }}>

        {/* ── Header ── */}
        <header style={{ background:"var(--soot)", flexShrink:0 }}>
          <div style={{ display:"flex", height:"2px" }}>
            <div style={{ flex:1, background:"var(--ht)" }} />
            <div style={{ flex:1, background:"var(--at)" }} />
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px" }}>
            <div>
              <h1 style={{ fontFamily:"'Roboto Serif',serif", fontSize:"1.15rem", fontWeight:700, color:"#F7F4EE", letterSpacing:"-.01em" }}>
                Nexus
              </h1>
              <p style={{ fontSize:".62rem", color:"rgba(247,244,238,.35)", marginTop:"1px", fontFamily:"'Roboto Flex',sans-serif" }}>
                Hard Times × Atonement · Childhood
              </p>
            </div>

            {/* Exam countdown */}
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'Roboto Flex',sans-serif", fontSize:"1.4rem", fontWeight:300, color:"#F7F4EE", lineHeight:1 }}>47</div>
              <div style={{ fontSize:".6rem", color:"rgba(247,244,238,.35)", letterSpacing:".05em", fontFamily:"'Roboto Flex',sans-serif" }}>days to exam</div>
            </div>
          </div>
        </header>

        {/* ── Scrollable body ── */}
        <div className="fs" style={{ flex:1, overflowY:"auto" }}>

          {/* ── Coverage summary strip ── */}
          <div style={{
            display:"flex", alignItems:"center", gap:"16px",
            padding:"14px 16px", background:"var(--card)",
            borderBottom:"1px solid var(--border)",
            animation:"fadeUp .3s ease",
          }}>
            <ProgressRing started={started} total={ALL_AXES.length} />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Roboto Flex',sans-serif", fontSize:".78rem", fontWeight:600, color:"var(--t1)", marginBottom:"2px" }}>
                {started} of 20 axes started
              </div>
              <div style={{ fontFamily:"'Roboto Serif',serif", fontSize:".72rem", fontStyle:"italic", color:"var(--t3)", lineHeight:1.4 }}>
                {cold.length} cold{cold.length !== 1 ? "s" : ""} remaining · {avgMastery}% average mastery
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:".62rem", color:"var(--t3)", fontFamily:"'Roboto Flex',sans-serif", marginBottom:"3px" }}>Target grade</div>
              <div style={{ fontFamily:"'Roboto Serif',serif", fontSize:"1.1rem", fontWeight:700, color:"var(--at)" }}>A*</div>
            </div>
          </div>

          <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:"16px" }}>

            {/* ── Mastery heatmap ── */}
            <section style={{ animation:"fadeUp .35s ease" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                <div>
                  <h2 style={{ fontFamily:"'Roboto Flex',sans-serif", fontSize:".78rem", fontWeight:700, color:"var(--t1)" }}>
                    Mastery map
                  </h2>
                  <p style={{ fontFamily:"'Roboto Flex',sans-serif", fontSize:".64rem", color:"var(--t3)", marginTop:"1px" }}>
                    Tap any cell · dashed = not started
                  </p>
                </div>
                {/* Legend */}
                <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                  {[
                    { color:"#EDE8E1", label:"Cold" },
                    { color:"rgba(160,55,34,.35)", label:"" },
                    { color:"rgba(177,122,45,.45)", label:"" },
                    { color:"rgba(58,110,143,.45)", label:"" },
                    { color:"rgba(45,122,79,.5)", label:"Warm" },
                  ].map((l, i) => (
                    <div key={i} style={{ width:"10px", height:"10px", borderRadius:"2px", background:l.color, border:i===0?"1.5px dashed #C8BFA8":"none" }} />
                  ))}
                </div>
              </div>

              {/* 4-col grid */}
              <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(4, 1fr)",
                gap:"7px",
              }}>
                {ALL_AXES.map(ax => (
                  <div key={ax.slug} style={{ position:"relative" }}>
                    <HeatCell
                      ax={ax}
                      selected={selectedSlug === ax.slug}
                      onClick={() => handleCellClick(ax.slug)}
                    />
                    {selectedSlug === ax.slug && (
                      <HeatPopover
                        ax={ax}
                        onClose={() => setSelectedSlug(null)}
                        onNavigate={slug => {
                          setSelectedSlug(null);
                          alert(`→ /themes/${slug}`);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Continue card ── */}
            <section style={{ animation:"fadeUp .4s ease" }}>
              <h2 style={{ fontFamily:"'Roboto Flex',sans-serif", fontSize:".78rem", fontWeight:700, color:"var(--t1)", marginBottom:"8px" }}>
                Continue where you left off
              </h2>
              <div style={{
                background:"var(--card)", borderRadius:"12px", overflow:"hidden",
                boxShadow:"0 1px 3px rgba(26,23,21,.06), 0 4px 16px rgba(26,23,21,.04)",
              }}>
                <div style={{ display:"flex", height:"3px" }}>
                  <div style={{ flex:1, background:"var(--ht)" }} />
                  <div style={{ flex:1, background:"var(--at)" }} />
                </div>
                <div style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:"12px" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
                        <span style={{ fontSize:".6rem", fontWeight:600, fontFamily:"'Roboto Flex',sans-serif", color:BAND_COLOR[CONTINUE.band], letterSpacing:".05em" }}>
                          {CONTINUE.band}
                        </span>
                        <span style={{ fontSize:".6rem", color:"var(--t3)", fontFamily:"'Roboto Flex',sans-serif" }}>· {CONTINUE.ago}</span>
                      </div>
                      <h3 style={{ fontFamily:"'Roboto Serif',serif", fontSize:".92rem", fontWeight:600, color:"var(--t1)", lineHeight:1.35 }}>
                        {CONTINUE.title}
                      </h3>
                      <div style={{ display:"flex", alignItems:"center", gap:"6px", marginTop:"8px" }}>
                        <div style={{ flex:1, height:"3px", borderRadius:"2px", background:"var(--border)", overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${CONTINUE.mastery*100}%`, background:ms.fg, borderRadius:"2px" }} />
                        </div>
                        <span style={{ fontSize:".66rem", fontWeight:600, color:ms.fg, fontFamily:"'Roboto Flex',sans-serif", flexShrink:0 }}>
                          {Math.round(CONTINUE.mastery * 100)}%
                        </span>
                      </div>
                      <div style={{ fontSize:".66rem", color:"var(--t3)", fontFamily:"'Roboto Flex',sans-serif", marginTop:"4px" }}>
                        Last: {CONTINUE.lastTab}
                      </div>
                    </div>

                    <button onClick={() => alert(`→ /themes/${CONTINUE.slug}?tab=write`)} style={{
                      all:"unset", cursor:"pointer", flexShrink:0,
                      padding:"10px 14px", borderRadius:"8px",
                      background:"var(--soot)", color:"#F7F4EE",
                      fontSize:".75rem", fontWeight:600,
                      fontFamily:"'Roboto Flex',sans-serif",
                      display:"flex", alignItems:"center", gap:"6px",
                      WebkitTapHighlightColor:"transparent",
                    }}>
                      Resume
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M4 2.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Cold spots ── */}
            {cold.length > 0 && (
              <section style={{ animation:"fadeUp .45s ease" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                  <h2 style={{ fontFamily:"'Roboto Flex',sans-serif", fontSize:".78rem", fontWeight:700, color:"var(--t1)" }}>
                    Not yet started
                  </h2>
                  <span style={{ fontSize:".66rem", color:"var(--t3)", fontFamily:"'Roboto Flex',sans-serif" }}>
                    {cold.length} axes cold
                  </span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                  {cold.slice(0, 3).map(ax => {
                    const detail = AXIS_DETAIL[ax.slug] ?? { title:ax.label, band:"Core L4" };
                    return (
                      <button key={ax.slug}
                        onClick={() => alert(`→ /themes/${ax.slug}`)}
                        style={{
                          all:"unset", cursor:"pointer",
                          display:"flex", alignItems:"center", gap:"12px",
                          background:"var(--card)", borderRadius:"10px",
                          padding:"11px 14px",
                          border:"1.5px dashed var(--border)",
                          transition:"border-color .15s ease, background .15s ease",
                          WebkitTapHighlightColor:"transparent",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor="var(--soot)"; e.currentTarget.style.borderStyle="solid"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.borderStyle="dashed"; }}
                      >
                        <div style={{
                          width:"28px", height:"28px", borderRadius:"6px",
                          background:"var(--surface)", border:"1.5px dashed var(--border)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          flexShrink:0,
                        }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 2v8M2 6h8" stroke="var(--t3)" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:".62rem", color:"var(--t3)", fontFamily:"'Roboto Flex',sans-serif", marginBottom:"2px" }}>
                            <ClusterBadge c={ax.cluster} /> &nbsp;{detail.band}
                          </div>
                          <div style={{ fontFamily:"'Roboto Serif',serif", fontSize:".82rem", fontWeight:400, color:"var(--t2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {detail.title}
                          </div>
                        </div>
                        <span style={{ fontSize:".72rem", color:"var(--t3)", flexShrink:0 }}>→</span>
                      </button>
                    );
                  })}
                  {cold.length > 3 && (
                    <button onClick={() => alert("→ /themes?filter=cold")} style={{
                      all:"unset", cursor:"pointer", textAlign:"center",
                      padding:"8px", fontSize:".7rem", color:"var(--t3)",
                      fontFamily:"'Roboto Flex',sans-serif",
                      WebkitTapHighlightColor:"transparent",
                    }}>
                      + {cold.length - 3} more cold axes
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* ── Quick actions ── */}
            <section style={{ animation:"fadeUp .5s ease" }}>
              <h2 style={{ fontFamily:"'Roboto Flex',sans-serif", fontSize:".78rem", fontWeight:700, color:"var(--t1)", marginBottom:"8px" }}>
                Jump in
              </h2>
              <div style={{ display:"flex", gap:"8px" }}>
                <QuickAction
                  accent="var(--ht)"
                  label="Axes"
                  sub="Browse 20"
                  onClick={() => alert("→ /themes")}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="2" width="5" height="5" rx="1" stroke="var(--ht)" strokeWidth="1.3"/>
                      <rect x="9" y="2" width="5" height="5" rx="1" stroke="var(--ht)" strokeWidth="1.3"/>
                      <rect x="2" y="9" width="5" height="5" rx="1" stroke="var(--ht)" strokeWidth="1.3"/>
                      <rect x="9" y="9" width="5" height="5" rx="1" stroke="var(--ht)" strokeWidth="1.3"/>
                    </svg>
                  }
                />
                <QuickAction
                  accent="var(--at)"
                  label="Compare"
                  sub="Split-screen"
                  onClick={() => alert("→ /compare")}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1.5" y="3" width="5.5" height="10" rx="1" stroke="var(--at)" strokeWidth="1.3"/>
                      <rect x="9" y="3" width="5.5" height="10" rx="1" stroke="var(--at)" strokeWidth="1.3"/>
                      <line x1="8" y1="2" x2="8" y2="14" stroke="var(--at)" strokeWidth="1" strokeDasharray="2 1.5"/>
                    </svg>
                  }
                />
                <QuickAction
                  accent="var(--ochre)"
                  label="Thesis"
                  sub="Build argument"
                  onClick={() => alert("→ /thesis")}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 4h10M3 7h7M3 10h5" stroke="var(--ochre)" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  }
                />
                <QuickAction
                  accent="var(--green)"
                  label="Recall"
                  sub="5-card queue"
                  onClick={() => alert("→ /recall")}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3a5 5 0 100 10A5 5 0 008 3z" stroke="var(--green)" strokeWidth="1.3"/>
                      <path d="M8 6v3l2 1" stroke="var(--green)" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  }
                />
              </div>
            </section>

            {/* ── Today's activity ── */}
            <section style={{ animation:"fadeUp .55s ease" }}>
              <div style={{
                display:"flex", alignItems:"center", gap:"10px",
                padding:"12px 14px", background:"var(--card)",
                borderRadius:"10px", boxShadow:"0 1px 3px rgba(26,23,21,.04)",
                border:"1px solid var(--border)",
              }}>
                <div style={{ flex:1, display:"flex", gap:"20px" }}>
                  {[
                    { label:"Syntheses today", value:"3" },
                    { label:"Theses saved",    value:"1" },
                    { label:"Axes reviewed",   value:"4" },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontFamily:"'Roboto Flex',sans-serif", fontSize:"1rem", fontWeight:600, color:"var(--t1)", lineHeight:1 }}>
                        {item.value}
                      </div>
                      <div style={{ fontFamily:"'Roboto Flex',sans-serif", fontSize:".6rem", color:"var(--t3)", marginTop:"2px" }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily:"'Roboto Serif',serif", fontSize:".7rem", fontStyle:"italic", color:"var(--t3)" }}>
                  Today
                </div>
              </div>
            </section>

            <div style={{ height:"20px" }} />
          </div>
        </div>
      </div>
    </>
  );
}
