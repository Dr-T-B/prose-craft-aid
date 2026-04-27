import { useState, useRef } from "react";

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Roboto+Serif:ital,opsz,wght@0,8..144,300;0,8..144,400;0,8..144,600;0,8..144,700;1,8..144,300;1,8..144,400&family=Roboto+Flex:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden}
:root{
  --ht:#A03722; --soot:#1A1715; --smoke:#5C544D;
  --at:#3A6E8F;  --ochre:#B17A2D;
  --ok:#2D7A4F;  --ok-tint:#EAF5EE;
  --surface:#F7F4EE; --card:#FFFFFF; --border:#E8E3DB;
  --t1:#1A1715;  --t2:#5C544D;  --t3:#9A918A;
}
.fs::-webkit-scrollbar{display:none}
.fs{scrollbar-width:none}
@keyframes fadeUp {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pop    {0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
`;

/* ─── Axis data pool ─────────────────────────────────────────────────────── */
const AXES = {
  c3_class_social_hierarchy: {
    title: "Class as an organising system of power",
    themeFamily: "Class and Social Hierarchy",
    verbs: ["exposes class as epistemological", "makes class visible through", "treats credibility as class-determined", "diagnoses class as"],
    connectives: [
      "whereas Dickens locates the fault in public structure, McEwan locates it in domestic assumption",
      "both novelists expose class as a structure of credibility, but differ in method",
      "where Dickens attacks through satire, McEwan reveals through focalisation",
      "in structurally parallel but ideologically opposed critiques",
    ],
    counters: [
      "Robbie may be read as purely victimised — or as threatening precisely because his class position is ambiguous",
      "Bounderby's myth could be individual fraud or a revelation of how ideology sustains itself through self-narration",
    ],
  },
  c5_guilt_responsibility: {
    title: "Responsibility after harm has been done",
    themeFamily: "Guilt and Responsibility",
    verbs: ["imagines responsibility as reformative", "stages guilt as irreversible", "treats moral consequence as", "refuses the consolation of"],
    connectives: [
      "Dickens allows the possibility of reform; McEwan denies it",
      "both texts stage moral consequence but disagree about whether narrative can settle it",
      "where Gradgrind's recognition closes an account, Briony's epilogue opens one it cannot close",
    ],
    counters: [
      "Briony's atonement may be sincere or another act of authorial control — the novel refuses to decide",
      "Gradgrind's recognition could be genuine change or sentimentalism that the novel's political critique qualifies",
    ],
  },
  c2_truth_narrative_authority: {
    title: "Who controls truth?",
    themeFamily: "Truth and Narrative Authority",
    verbs: ["positions narration as moral vehicle", "converts narration into ethical problem", "delivers judgement through", "destabilises truth via"],
    connectives: [
      "Dickens delivers judgement to the reader; McEwan delivers judgement on the reader",
      "both use narrative authority as their central instrument, to opposed evaluative ends",
      "where Dickens' narrator names what is true, McEwan's narrator withholds that right",
    ],
    counters: [
      "Briony may be confessing or controlling — the epilogue sustains both readings equally",
      "Dickens' confident moral narrator could be ideological certainty or a performance of it",
    ],
  },
  c1_innocence_misinterpretation: {
    title: "Innocence as damaged perception",
    themeFamily: "Innocence and Misinterpretation",
    verbs: ["externalises innocence's corruption through", "internalises it through narrative consciousness", "exposes innocence as constructed", "positions childhood perception as"],
    connectives: [
      "whereas Dickens locates the failure in ideology, McEwan locates it in individual consciousness",
      "both texts expose innocence as unreliable but differ in where they place that unreliability",
      "in contrast to Dickens' systemic critique, McEwan's indictment is narratological",
    ],
    counters: [
      "Briony may be morally guilty or shaped by class conventions — the text sustains both readings",
      "Louisa's passivity can be read as victimhood or as moral underdevelopment the novel holds her partly accountable for",
    ],
  },
};

/* Global fallback verbs — always available regardless of axis */
const GLOBAL_VERBS = [
  "destabilises", "ironises", "interrogates", "subverts",
  "complicates", "inverts", "refuses", "diagnoses",
  "constructs", "exposes", "positions", "reimagines",
];

/* Simulated context drop from Screen 2 "Use in argument" */
const CONTEXT_DROP = {
  text: "The Preston Lock-out (1853–54) — Dickens' direct source for Coketown's industrial conflict",
  from: "Hard Times · AO3 context",
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function AoBadge({ labels, color }) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {labels.map(l => (
        <span key={l} style={{
          fontSize: ".58rem", fontWeight: 700, padding: "2px 6px",
          borderRadius: "100px", border: `1px solid ${color}44`,
          color, fontFamily: "'Roboto Flex',sans-serif",
          letterSpacing: ".06em",
        }}>{l}</span>
      ))}
    </div>
  );
}

/* ─── Chip ───────────────────────────────────────────────────────────────── */
function Chip({ label, active, pinned, accent, onClick, size = "md" }) {
  const sm = size === "sm";
  return (
    <button onClick={onClick} style={{
      all: "unset", cursor: "pointer", flexShrink: 0,
      padding: sm ? "5px 11px" : "7px 14px",
      borderRadius: "100px",
      fontSize: sm ? ".7rem" : ".76rem",
      fontFamily: "'Roboto Flex',sans-serif",
      fontWeight: active ? 600 : 400,
      background: active ? accent : pinned ? `${accent}14` : "transparent",
      color: active ? "#fff" : pinned ? accent : "var(--t2)",
      border: `1.5px solid ${active ? accent : pinned ? `${accent}44` : "var(--border)"}`,
      transition: "all .14s ease",
      animation: active ? "pop .2s ease" : "none",
      WebkitTapHighlightColor: "transparent",
      whiteSpace: "nowrap",
    }}>
      {pinned && !active && <span style={{ marginRight: "4px", opacity: .6 }}>📌</span>}
      {label}
    </button>
  );
}

/* ─── Pinned verbs display ───────────────────────────────────────────────── */
function PinnedVerbs({ verbs, onRemove }) {
  if (!verbs.length) return null;
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: "5px",
      padding: "8px 12px", borderRadius: "8px",
      background: `${AXES.c3_class_social_hierarchy ? "#FBF0E8" : "#F0F6F9"}`,
      border: "1px dashed var(--border)",
      marginBottom: "8px",
      animation: "fadeUp .2s ease",
    }}>
      <span style={{ fontSize: ".62rem", color: "var(--t3)", fontFamily: "'Roboto Flex',sans-serif", alignSelf: "center", flexShrink: 0 }}>
        Pinned:
      </span>
      {verbs.map(v => (
        <button key={v} onClick={() => onRemove(v)} style={{
          all: "unset", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: "4px",
          padding: "3px 8px", borderRadius: "100px",
          background: "var(--card)", border: "1px solid var(--border)",
          fontSize: ".68rem", color: "var(--ht)", fontFamily: "'Roboto Flex',sans-serif",
          fontStyle: "italic",
        }}>
          {v} <span style={{ opacity: .4, fontSize: ".65rem" }}>×</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Saved drafts drawer ────────────────────────────────────────────────── */
function DraftsDrawer({ drafts, onClose, onCopy }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(26,23,21,.5)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "var(--surface)", borderRadius: "16px 16px 0 0",
        boxShadow: "0 -4px 32px rgba(26,23,21,.18)",
        animation: "slideUp .22s ease",
        maxHeight: "70vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "0 20px", flexShrink: 0 }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "var(--border)", margin: "12px auto 16px" }} />
          <h2 style={{ fontFamily: "'Roboto Serif',serif", fontSize: "1.05rem", fontWeight: 600, marginBottom: "4px" }}>Essay plan</h2>
          <p style={{ fontSize: ".7rem", color: "var(--t3)", marginBottom: "16px" }}>
            {drafts.length} saved {drafts.length === 1 ? "thesis" : "theses"}
          </p>
        </div>
        <div className="fs" style={{ overflowY: "auto", padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {drafts.length === 0 && (
            <p style={{ fontFamily: "'Roboto Serif',serif", fontStyle: "italic", fontSize: ".85rem", color: "var(--t3)", textAlign: "center", padding: "24px 0" }}>
              No saved theses yet.
            </p>
          )}
          {[...drafts].reverse().map((d, i) => (
            <div key={i} style={{
              background: "var(--card)", borderRadius: "10px",
              padding: "14px 16px", boxShadow: "0 1px 3px rgba(26,23,21,.06)",
              display: "flex", flexDirection: "column", gap: "8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: ".62rem", fontStyle: "italic", fontFamily: "'Roboto Serif',serif", color: "var(--t3)" }}>
                  {d.axisTitle}
                </span>
                <button onClick={() => onCopy(d.assembled)} style={{
                  all: "unset", cursor: "pointer", padding: "4px 10px",
                  borderRadius: "100px", border: "1px solid var(--border)",
                  fontSize: ".65rem", fontFamily: "'Roboto Flex',sans-serif",
                  color: "var(--t2)", fontWeight: 500,
                  WebkitTapHighlightColor: "transparent",
                }}>
                  Copy
                </button>
              </div>
              <p style={{ fontFamily: "'Roboto Serif',serif", fontSize: ".82rem", fontWeight: 300, lineHeight: 1.65, color: "var(--t1)" }}>
                {d.assembled}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function ThesisBuilder() {
  const [activeAxis, setActiveAxis] = useState("c3_class_social_hierarchy");
  const [claim, setClaim]     = useState("");
  const [hinge, setHinge]     = useState("");
  const [counter, setCounter] = useState("");
  const [pinnedVerbs, setPinnedVerbs] = useState([]);
  const [customHinge, setCustomHinge] = useState(false);
  const [contextUsed, setContextUsed] = useState(false);
  const [saved, setSaved]     = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const counterRef = useRef(null);

  const ax = AXES[activeAxis];

  const assembled = [
    claim.trim(),
    hinge.trim() ? `${hinge.trim()}${hinge.trim().endsWith(".") ? "" : ","}` : "",
    counter.trim(),
  ].filter(Boolean).join(" ");

  const isComplete = claim.trim().length > 15 && hinge.trim() && counter.trim().length > 15;

  function switchAxis(slug) {
    if (slug === activeAxis) return;
    setActiveAxis(slug);
    setPinnedVerbs([]);
    setHinge("");
    setCustomHinge(false);
  }

  function handlePinVerb(v) {
    setPinnedVerbs(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  function handleHinge(c) {
    setHinge(h => h === c ? "" : c);
    setCustomHinge(false);
  }

  function handleCopy() {
    try { navigator.clipboard.writeText(assembled); } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleSave() {
    if (!isComplete) return;
    setSaved(prev => [...prev, {
      axisTitle: ax.title,
      assembled,
      createdAt: new Date().toISOString(),
    }]);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }

  function handleUseContext() {
    const append = `\n[Context: ${CONTEXT_DROP.text}]`;
    setCounter(c => c + append);
    setContextUsed(true);
    if (counterRef.current) counterRef.current.focus();
  }

  const SLOT_DEFS = [
    { num: "01", label: "Claim", sub: "Your comparative argument — what both texts do", accent: "var(--ht)", ao: ["AO1"] },
    { num: "02", label: "Hinge", sub: "The connective that holds the comparison in tension", accent: "var(--at)", ao: ["AO4"] },
    { num: "03", label: "Counter-position", sub: "The complication that earns Level 5", accent: "var(--ochre)", ao: ["AO1", "AO3"] },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        fontFamily: "'Roboto Flex',sans-serif", color: "var(--t1)",
        WebkitFontSmoothing: "antialiased", background: "var(--surface)",
      }}>

        {/* ── Header ── */}
        <header style={{ background: "var(--soot)", flexShrink: 0 }}>
          <div style={{ display: "flex", height: "2px" }}>
            <div style={{ flex: 1, background: "var(--ht)" }} />
            <div style={{ flex: 1, background: "var(--at)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" }}>
            <div>
              <div style={{ fontSize: ".6rem", fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(247,244,238,.35)", marginBottom: "2px" }}>
                Thesis Builder · AO1
              </div>
              <h1 style={{ fontFamily: "'Roboto Serif',serif", fontSize: "1rem", fontWeight: 600, color: "#F7F4EE" }}>
                Comparative argument
              </h1>
            </div>
            <button onClick={() => setDrawerOpen(true)} style={{
              all: "unset", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 12px", borderRadius: "100px",
              border: "1px solid rgba(247,244,238,.15)",
              background: savedFlash ? "rgba(45,122,79,.2)" : "rgba(247,244,238,.06)",
              transition: "background .3s ease",
              WebkitTapHighlightColor: "transparent",
            }}>
              {saved.length > 0 && (
                <span style={{
                  width: "16px", height: "16px", borderRadius: "50%",
                  background: "var(--at)", color: "#fff",
                  fontSize: ".6rem", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{saved.length}</span>
              )}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2h10v9l-5-2-5 2V2z" stroke="rgba(247,244,238,.6)" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: ".72rem", color: "rgba(247,244,238,.6)", fontWeight: 500 }}>Plan</span>
            </button>
          </div>
        </header>

        {/* ── Axis switcher ── */}
        <div style={{
          background: "rgba(247,244,238,.95)", backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          <div className="fs" style={{ overflowX: "auto", display: "flex", gap: "6px", padding: "9px 16px" }}>
            <span style={{ fontSize: ".62rem", color: "var(--t3)", fontWeight: 500, whiteSpace: "nowrap", alignSelf: "center", flexShrink: 0, letterSpacing: ".05em", textTransform: "uppercase" }}>
              Axis:
            </span>
            {Object.entries(AXES).map(([slug, data]) => {
              const active = slug === activeAxis;
              return (
                <button key={slug} onClick={() => switchAxis(slug)} style={{
                  all: "unset", cursor: "pointer", padding: "5px 12px",
                  borderRadius: "100px", fontSize: ".72rem",
                  fontFamily: "'Roboto Flex',sans-serif", fontWeight: active ? 600 : 400,
                  whiteSpace: "nowrap", flexShrink: 0,
                  background: active ? "var(--soot)" : "transparent",
                  color: active ? "#F7F4EE" : "var(--t2)",
                  border: active ? "1.5px solid var(--soot)" : "1.5px solid var(--border)",
                  transition: "all .15s ease",
                  WebkitTapHighlightColor: "transparent",
                }}>
                  {data.themeFamily}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="fs" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>

          {/* ── Slot 01 — Claim ── */}
          <div style={{ background: "var(--card)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(26,23,21,.06)", marginBottom: "12px" }}>
            <div style={{ display: "flex", height: "3px", background: "var(--ht)" }} />
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontFamily: "'Roboto Serif',serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--ht)", opacity: .2, lineHeight: 1 }}>01</span>
                  <div>
                    <div style={{ fontFamily: "'Roboto Flex',sans-serif", fontSize: ".78rem", fontWeight: 600, color: "var(--t1)" }}>{SLOT_DEFS[0].label}</div>
                    <div style={{ fontFamily: "'Roboto Flex',sans-serif", fontSize: ".66rem", color: "var(--t3)" }}>{SLOT_DEFS[0].sub}</div>
                  </div>
                </div>
                <AoBadge labels={SLOT_DEFS[0].ao} color="var(--ht)" />
              </div>

              <PinnedVerbs verbs={pinnedVerbs} onRemove={v => handlePinVerb(v)} />

              <textarea
                placeholder="Both Dickens and McEwan… Write your comparative claim here."
                value={claim}
                onChange={e => setClaim(e.target.value)}
                rows={3}
                style={{
                  width: "100%", resize: "none",
                  padding: "10px 13px",
                  fontFamily: "'Roboto Serif',serif",
                  fontSize: ".85rem", fontWeight: 300, lineHeight: 1.7,
                  color: "var(--t1)",
                  border: "1.5px solid var(--border)", borderRadius: "8px",
                  outline: "none", background: "var(--surface)",
                  transition: "border-color .15s ease",
                }}
                onFocus={e => e.target.style.borderColor = "var(--ht)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />

              {/* Verb chips */}
              <div style={{ marginTop: "10px" }}>
                <div style={{ fontSize: ".6rem", fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: "7px" }}>
                  Verb suggestions — tap to pin as reminder
                </div>
                <div className="fs" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {ax.verbs.map(v => (
                    <Chip key={v} label={v} pinned={pinnedVerbs.includes(v)} accent="var(--ht)" size="sm"
                      onClick={() => handlePinVerb(v)} />
                  ))}
                  <div style={{ width: "100%", height: "1px", background: "var(--border)", margin: "4px 0" }} />
                  <span style={{ fontSize: ".6rem", color: "var(--t3)", fontFamily: "'Roboto Flex',sans-serif", alignSelf: "center" }}>Global:</span>
                  {GLOBAL_VERBS.map(v => (
                    <Chip key={v} label={v} pinned={pinnedVerbs.includes(v)} accent="var(--ht)" size="sm"
                      onClick={() => handlePinVerb(v)} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Slot 02 — Hinge ── */}
          <div style={{ background: "var(--card)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(26,23,21,.06)", marginBottom: "12px" }}>
            <div style={{ display: "flex", height: "3px", background: "var(--at)" }} />
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontFamily: "'Roboto Serif',serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--at)", opacity: .2, lineHeight: 1 }}>02</span>
                  <div>
                    <div style={{ fontFamily: "'Roboto Flex',sans-serif", fontSize: ".78rem", fontWeight: 600, color: "var(--t1)" }}>{SLOT_DEFS[1].label}</div>
                    <div style={{ fontFamily: "'Roboto Flex',sans-serif", fontSize: ".66rem", color: "var(--t3)" }}>{SLOT_DEFS[1].sub}</div>
                  </div>
                </div>
                <AoBadge labels={SLOT_DEFS[1].ao} color="var(--at)" />
              </div>

              {/* Connective chips — radio-select */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                {ax.connectives.map(c => (
                  <button key={c} onClick={() => { handleHinge(c); setCustomHinge(false); }} style={{
                    all: "unset", cursor: "pointer", textAlign: "left",
                    padding: "9px 13px", borderRadius: "8px",
                    border: `1.5px solid ${hinge === c ? "var(--at)" : "var(--border)"}`,
                    background: hinge === c ? "#EEF5F9" : "var(--surface)",
                    transition: "all .14s ease",
                    WebkitTapHighlightColor: "transparent",
                    display: "flex", alignItems: "flex-start", gap: "10px",
                  }}>
                    <div style={{
                      width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0, marginTop: "2px",
                      border: `2px solid ${hinge === c ? "var(--at)" : "var(--border)"}`,
                      background: hinge === c ? "var(--at)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .14s ease",
                    }}>
                      {hinge === c && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <span style={{ fontFamily: "'Roboto Serif',serif", fontSize: ".82rem", fontWeight: 300, lineHeight: 1.55, color: hinge === c ? "var(--t1)" : "var(--t2)", fontStyle: "italic" }}>
                      {c}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom hinge */}
              <button onClick={() => { setCustomHinge(true); setHinge(""); }} style={{
                all: "unset", cursor: "pointer",
                fontSize: ".7rem", fontFamily: "'Roboto Flex',sans-serif",
                color: "var(--t3)", display: "flex", alignItems: "center", gap: "5px",
                padding: "4px 2px", WebkitTapHighlightColor: "transparent",
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Write your own connective
              </button>
              {customHinge && (
                <input
                  autoFocus
                  placeholder="e.g. whereas, however, in a complementary move…"
                  value={hinge}
                  onChange={e => setHinge(e.target.value)}
                  style={{
                    width: "100%", marginTop: "8px",
                    padding: "9px 13px",
                    fontFamily: "'Roboto Serif',serif", fontSize: ".82rem", fontWeight: 300, fontStyle: "italic",
                    border: "1.5px solid var(--at)", borderRadius: "8px",
                    outline: "none", background: "#EEF5F9", color: "var(--t1)",
                  }}
                />
              )}
            </div>
          </div>

          {/* ── Slot 03 — Counter ── */}
          <div style={{ background: "var(--card)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(26,23,21,.06)", marginBottom: "12px" }}>
            <div style={{ display: "flex", height: "3px", background: "var(--ochre)" }} />
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontFamily: "'Roboto Serif',serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--ochre)", opacity: .2, lineHeight: 1 }}>03</span>
                  <div>
                    <div style={{ fontFamily: "'Roboto Flex',sans-serif", fontSize: ".78rem", fontWeight: 600, color: "var(--t1)" }}>{SLOT_DEFS[2].label}</div>
                    <div style={{ fontFamily: "'Roboto Flex',sans-serif", fontSize: ".66rem", color: "var(--t3)" }}>{SLOT_DEFS[2].sub}</div>
                  </div>
                </div>
                <AoBadge labels={SLOT_DEFS[2].ao} color="var(--ochre)" />
              </div>

              {/* Context drop notification */}
              {!contextUsed && (
                <div style={{
                  background: "#FDF6E8", border: "1px solid rgba(177,122,45,.25)",
                  borderRadius: "8px", padding: "9px 12px",
                  display: "flex", alignItems: "flex-start", gap: "10px",
                  marginBottom: "10px", animation: "fadeUp .3s ease",
                }}>
                  <span style={{ fontSize: ".75rem", flexShrink: 0, marginTop: "1px" }}>📩</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".62rem", fontWeight: 600, color: "var(--ochre)", marginBottom: "2px", letterSpacing: ".05em", fontFamily: "'Roboto Flex',sans-serif" }}>
                      From Contexts tab · {CONTEXT_DROP.from}
                    </div>
                    <p style={{ fontFamily: "'Roboto Serif',serif", fontSize: ".78rem", fontWeight: 300, color: "var(--t2)", lineHeight: 1.5 }}>
                      {CONTEXT_DROP.text}
                    </p>
                  </div>
                  <button onClick={handleUseContext} style={{
                    all: "unset", cursor: "pointer", flexShrink: 0,
                    padding: "5px 10px", borderRadius: "100px",
                    background: "var(--ochre)", color: "#fff",
                    fontSize: ".65rem", fontWeight: 600, fontFamily: "'Roboto Flex',sans-serif",
                    WebkitTapHighlightColor: "transparent",
                  }}>
                    Use
                  </button>
                </div>
              )}

              {/* Counter chips */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                {ax.counters.map(c => (
                  <button key={c} onClick={() => setCounter(prev => prev ? prev + " " + c : c)} style={{
                    all: "unset", cursor: "pointer", textAlign: "left",
                    padding: "8px 12px", borderRadius: "8px",
                    border: "1px solid var(--border)", background: "var(--surface)",
                    transition: "background .12s ease",
                    WebkitTapHighlightColor: "transparent",
                    display: "flex", alignItems: "flex-start", gap: "8px",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FDF6E8"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}
                  >
                    <span style={{ color: "var(--ochre)", fontSize: ".8rem", flexShrink: 0, lineHeight: 1.6 }}>↓</span>
                    <span style={{ fontFamily: "'Roboto Serif',serif", fontSize: ".78rem", fontWeight: 300, lineHeight: 1.55, color: "var(--t2)", fontStyle: "italic" }}>
                      {c}
                    </span>
                  </button>
                ))}
              </div>

              <textarea
                ref={counterRef}
                placeholder="However, a more critical reading would argue that…"
                value={counter}
                onChange={e => setCounter(e.target.value)}
                rows={3}
                style={{
                  width: "100%", resize: "none",
                  padding: "10px 13px",
                  fontFamily: "'Roboto Serif',serif",
                  fontSize: ".85rem", fontWeight: 300, lineHeight: 1.7,
                  color: "var(--t1)",
                  border: "1.5px solid var(--border)", borderRadius: "8px",
                  outline: "none", background: "var(--surface)",
                  transition: "border-color .15s ease",
                }}
                onFocus={e => e.target.style.borderColor = "var(--ochre)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
          </div>

          {/* ── Assembled preview ── */}
          <div style={{
            background: "var(--soot)", borderRadius: "12px", overflow: "hidden",
            marginBottom: "12px", position: "relative",
          }}>
            <div style={{ display: "flex", height: "2px" }}>
              <div style={{ flex: 1, background: "var(--ht)" }} />
              <div style={{ flex: 1, background: "var(--at)" }} />
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: ".62rem", fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(247,244,238,.35)", fontFamily: "'Roboto Flex',sans-serif" }}>
                    Draft thesis
                  </span>
                  <span style={{ marginLeft: "8px", fontSize: ".6rem", color: "rgba(247,244,238,.25)", fontFamily: "'Roboto Flex',sans-serif" }}>
                    — revise before use
                  </span>
                </div>
                {assembled.length > 0 && (
                  <span style={{ fontSize: ".6rem", color: "rgba(247,244,238,.25)", fontFamily: "'Roboto Flex',sans-serif" }}>
                    {assembled.length} chars
                  </span>
                )}
              </div>

              {assembled ? (
                <p style={{
                  fontFamily: "'Roboto Serif',serif", fontSize: ".9rem",
                  fontWeight: 300, lineHeight: 1.75, color: "#F7F4EE",
                  fontStyle: "italic",
                }}>
                  {assembled}
                </p>
              ) : (
                <p style={{
                  fontFamily: "'Roboto Serif',serif", fontSize: ".85rem",
                  fontWeight: 300, lineHeight: 1.7, color: "rgba(247,244,238,.25)",
                  fontStyle: "italic",
                }}>
                  Your thesis will appear here as you fill the slots above…
                </p>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                <button
                  onClick={handleCopy}
                  disabled={!assembled}
                  style={{
                    all: "unset", cursor: assembled ? "pointer" : "not-allowed",
                    flex: 1, padding: "11px", borderRadius: "8px", textAlign: "center",
                    background: copied ? "rgba(45,122,79,.2)" : "rgba(247,244,238,.08)",
                    border: `1.5px solid ${copied ? "rgba(45,122,79,.4)" : "rgba(247,244,238,.15)"}`,
                    color: copied ? "#6DBA8E" : "rgba(247,244,238,.6)",
                    fontSize: ".78rem", fontFamily: "'Roboto Flex',sans-serif", fontWeight: 500,
                    transition: "all .2s ease",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {copied ? "✓ Copied" : "Copy draft"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isComplete}
                  style={{
                    all: "unset",
                    cursor: isComplete ? "pointer" : "not-allowed",
                    flex: 1, padding: "11px", borderRadius: "8px", textAlign: "center",
                    background: isComplete
                      ? savedFlash ? "rgba(45,122,79,.3)" : "rgba(58,110,143,.25)"
                      : "rgba(247,244,238,.05)",
                    border: `1.5px solid ${isComplete ? "rgba(58,110,143,.4)" : "rgba(247,244,238,.08)"}`,
                    color: isComplete ? "rgba(247,244,238,.9)" : "rgba(247,244,238,.2)",
                    fontSize: ".78rem", fontFamily: "'Roboto Flex',sans-serif", fontWeight: 600,
                    transition: "all .2s ease",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {savedFlash ? "✓ Saved to plan" : "Save to plan"}
                </button>
              </div>

              {!isComplete && assembled && (
                <p style={{ fontSize: ".65rem", color: "rgba(247,244,238,.25)", fontFamily: "'Roboto Flex',sans-serif", marginTop: "8px", textAlign: "center" }}>
                  Complete all three slots to save
                </p>
              )}
            </div>
          </div>

          <div style={{ height: "32px" }} />
        </div>

        {/* ── Drafts drawer ── */}
        {drawerOpen && (
          <DraftsDrawer
            drafts={saved}
            onClose={() => setDrawerOpen(false)}
            onCopy={text => { try { navigator.clipboard.writeText(text); } catch (e) {} }}
          />
        )}
      </div>
    </>
  );
}
