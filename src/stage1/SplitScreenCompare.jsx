import { useState, useEffect, useRef } from "react";

/* ─── Base styles ────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Roboto+Serif:ital,opsz,wght@0,8..144,300;0,8..144,400;0,8..144,600;0,8..144,700;1,8..144,300;1,8..144,400&family=Roboto+Flex:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden}
:root{
  --ht:#A03722; --ht-soot:#1A1715; --ht-smoke:#5C544D; --ht-tint:#FBF5F3; --ht-deep:#7A2910;
  --at:#3A6E8F; --at-green:#3D5A3A; --at-ochre:#B17A2D; --at-tint:#EEF5F9;
  --surface:#F7F4EE; --card:#FFFFFF; --border:#E8E3DB;
  --t1:#1A1715; --t2:#5C544D; --t3:#9A918A;
  --ok:#2D7A4F; --ok-tint:#EAF5EE; --warn:#8A5F18;
}
.fs::-webkit-scrollbar{display:none}
.fs{scrollbar-width:none}
@keyframes fadeUp  {from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)}}
@keyframes slideUp {from{transform:translateY(100%)} to{transform:translateY(0)}}
@keyframes pulse   {0%,100%{opacity:.5} 50%{opacity:1}}
@keyframes unlock  {
  0%  {box-shadow:0 0 0 0 rgba(45,122,79,.4)}
  70% {box-shadow:0 0 0 14px rgba(45,122,79,0)}
  100%{box-shadow:0 0 0 0   rgba(45,122,79,0)}
}
`;

/* ─── Extract pairs ─────────────────────────────────────────────────────── */
const PAIRS = [
  {
    id: "p1",
    axisSlug: "c3_setting_social_critique",
    axisTitle: "Places as moral systems",
    ao4Hint: "Compare how each writer makes setting do conceptual work.",
    ht: {
      label: "Hard Times · Bk 1 Ch 5",
      tag: "Settings",
      text: `It was a town of red brick, or of brick that would have been red if the smoke and ashes had allowed it; but as matters stood, it was a town of unnatural red and black like the painted face of a savage. It was a town of machinery and tall chimneys, out of which interminable serpents of smoke trailed themselves for ever and ever, and never got uncoiled. It had a black canal in it, and a river that ran purple with ill-smelling dye, and vast piles of building full of windows where there was a rattling and a trembling all day long, and where the piston of the steam-engine worked monotonously up and down, like the head of an elephant in a state of melancholy madness.`,
      note: "Public domain. Dickens, Hard Times (1854), Bk 1 Ch 5.",
    },
    at: {
      label: "Atonement · Pt 1 Ch 2",
      tag: "Settings",
      text: `Cecilia had been outdoors since eight o'clock... The heat was already building. The fountain made its own weather — a cool mist — and beyond it the formal garden was turning silver-white in the early sun. The house behind her was immense and still... The distance between herself and her family, and their world, had never seemed so comfortable. The island of the fountain was where she had always wanted to live.`,
      note: "Fair-dealing extract for educational analysis. McEwan, Atonement (2001), Pt 1.",
    },
  },
  {
    id: "p2",
    axisSlug: "c2_truth_narrative_authority",
    axisTitle: "Who controls truth?",
    ao4Hint: "Compare how each writer positions the narrator as moral authority.",
    ht: {
      label: "Hard Times · Bk 1 Ch 1",
      tag: "Narrative voice",
      text: `"Now, what I want is, Facts. Teach these boys and girls nothing but Facts. Facts alone are wanted in life. Plant nothing else, and root out everything else. You can only form the minds of reasoning animals upon Facts: nothing else will ever be of any service to them. This is the principle on which I bring up my own children, and this is the principle on which I bring up these children. Stick to Facts, sir!"`,
      note: "Public domain. Dickens, Hard Times (1854), Bk 1 Ch 1.",
    },
    at: {
      label: "Atonement · Pt 1 Ch 13",
      tag: "Narrative voice",
      text: `She knew what she had seen... There was certainty — there was absolute certainty — because she had watched from no more than thirty-five feet away... Later, when the detectives came, she told them precisely what she had seen. She was an eyewitness, and her account was not in doubt. She had seen him. She was absolutely sure. This was not a story she was telling. This was what had happened.`,
      note: "Fair-dealing extract for educational analysis. McEwan, Atonement (2001), Pt 1.",
    },
  },
  {
    id: "p3",
    axisSlug: "c5_guilt_responsibility",
    axisTitle: "Responsibility after harm has been done",
    ao4Hint: "Compare how structure embeds the moment of moral recognition differently in each novel.",
    ht: {
      label: "Hard Times · Bk 3 Ch 1",
      tag: "Endings / Guilt",
      text: `"Louisa, I have a misgiving that some change may have been slowly working about me for good, by this and by degrees. Your early training was what it was, and I am inclined to think that it has produced you what you are... I am an old man, and these things have been in me lately, and I think they are not unworthy of attention." He sighed. The ground on which I stand has ceased to be solid under my feet.`,
      note: "Public domain. Dickens, Hard Times (1854), Bk 3 Ch 1.",
    },
    at: {
      label: "Atonement · Pt 4",
      tag: "Endings / Guilt",
      text: `I like to think that it isn't weakness or evasion, but a final act of kindness, a stand against oblivion and despair, to let my lovers live and to unite them at the end... But what sense of hope or satisfaction could a reader draw from such an ending? Knowing what I know, which is what they do not... I gave them happiness, but I was not so self-serving as to let them forgive me.`,
      note: "Fair-dealing extract for educational analysis. McEwan, Atonement (2001), Pt 4.",
    },
  },
];

const CONNECTIVES = [
  "whereas","while","however","by contrast","in contrast","similarly",
  "both","equally","unlike","conversely","yet","although","on the other hand","in parallel",
];

function hasConnective(s) {
  const l = s.toLowerCase();
  return CONNECTIVES.some(c => l.includes(c));
}

function validate(s) {
  const l = s.toLowerCase();
  return {
    hasDickens: l.includes("dickens"),
    hasMcEwan:  l.includes("mcewan") || l.includes("mc ewan"),
    hasConn:    hasConnective(s),
    long:       s.trim().length > 25,
  };
}

function isValid(v) {
  return v.hasDickens && v.hasMcEwan && v.hasConn && v.long;
}

/* ─── Requirement pill ───────────────────────────────────────────────────── */
function Req({ ok, label }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:"4px",
      padding:"4px 9px", borderRadius:"100px",
      background: ok ? "var(--ok-tint)" : "rgba(247,244,238,.08)",
      border: `1px solid ${ok ? "rgba(45,122,79,.3)" : "rgba(247,244,238,.15)"}`,
      transition:"all .2s ease",
      flexShrink:0,
    }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        {ok
          ? <path d="M2 5l2.5 2.5L8 3" stroke="#2D7A4F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          : <circle cx="5" cy="5" r="3.5" stroke="rgba(247,244,238,.35)" strokeWidth="1"/>
        }
      </svg>
      <span style={{
        fontFamily:"'Roboto Flex',sans-serif", fontSize:".62rem", fontWeight:500,
        color: ok ? "#2D7A4F" : "rgba(247,244,238,.4)",
        transition:"color .2s ease",
      }}>{label}</span>
    </div>
  );
}

/* ─── Log drawer ─────────────────────────────────────────────────────────── */
function LogDrawer({ entries, onClose, onExport }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:500 }} onClick={onClose}>
      <div style={{ position:"absolute", inset:0, background:"rgba(26,23,21,.5)" }} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:"absolute", bottom:0, left:0, right:0,
          background:"var(--surface)", borderRadius:"16px 16px 0 0",
          boxShadow:"0 -4px 32px rgba(26,23,21,.18)",
          animation:"slideUp .22s ease",
          maxHeight:"72vh", display:"flex", flexDirection:"column",
        }}
      >
        <div style={{ padding:"0 20px" }}>
          <div style={{ width:"36px", height:"4px", borderRadius:"2px", background:"var(--border)", margin:"12px auto 16px" }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
            <div>
              <h2 style={{ fontFamily:"'Roboto Serif',serif", fontSize:"1.05rem", fontWeight:600 }}>Synthesis log</h2>
              <p style={{ fontSize:".7rem", color:"var(--t3)", marginTop:"2px" }}>
                {entries.length} {entries.length === 1 ? "sentence" : "sentences"} recorded
              </p>
            </div>
            <button onClick={onExport} style={{
              all:"unset", cursor:"pointer", padding:"8px 14px",
              borderRadius:"100px", border:"1.5px solid var(--border)",
              fontSize:".72rem", fontWeight:600, fontFamily:"'Roboto Flex',sans-serif",
              color:"var(--t2)", display:"flex", alignItems:"center", gap:"6px",
              WebkitTapHighlightColor:"transparent",
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7M3 5l3 3 3-3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export .md
            </button>
          </div>
        </div>
        <div className="fs" style={{ overflowY:"auto", padding:"0 20px 32px", display:"flex", flexDirection:"column", gap:"12px" }}>
          {entries.length === 0 && (
            <p style={{ fontFamily:"'Roboto Serif',serif", fontStyle:"italic", fontSize:".85rem", color:"var(--t3)", textAlign:"center", padding:"24px 0" }}>
              No syntheses yet — complete a pair to begin your log.
            </p>
          )}
          {entries.map((e, i) => (
            <div key={i} style={{ background:"var(--card)", borderRadius:"10px", padding:"14px 16px", boxShadow:"0 1px 3px rgba(26,23,21,.06)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"8px" }}>
                <span style={{ fontSize:".62rem", fontWeight:600, fontFamily:"'Roboto Flex',sans-serif", color:"var(--t3)", letterSpacing:".07em" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize:".62rem", color:"var(--t3)" }}>·</span>
                <span style={{ fontSize:".62rem", fontStyle:"italic", fontFamily:"'Roboto Serif',serif", color:"var(--t3)" }}>
                  {e.axisTitle}
                </span>
              </div>
              <p style={{ fontFamily:"'Roboto Serif',serif", fontSize:".85rem", fontWeight:300, lineHeight:1.65, color:"var(--t1)" }}>
                "{e.sentence}"
              </p>
              <p style={{ fontSize:".62rem", color:"var(--t3)", marginTop:"8px", fontFamily:"'Roboto Flex',sans-serif" }}>
                {new Date(e.createdAt).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Extract pane ───────────────────────────────────────────────────────── */
function ExtractPane({ data, palette, isHT, flex }) {
  const [highlight, setHighlight] = useState("");

  return (
    <div style={{
      flex,
      background: palette.tint,
      display:"flex", flexDirection:"column",
      overflow:"hidden",
      position:"relative",
    }}>
      {/* Novel label bar */}
      <div style={{
        padding:"10px 16px",
        background: isHT ? "rgba(160,55,34,.08)" : "rgba(58,110,143,.08)",
        borderBottom:`1px solid ${isHT ? "rgba(160,55,34,.12)" : "rgba(58,110,143,.12)"}`,
        display:"flex", alignItems:"center", gap:"8px", flexShrink:0,
      }}>
        <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:palette.accent, flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Roboto Flex',sans-serif", fontSize:".62rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:palette.accent }}>
            {data.label}
          </div>
        </div>
        <span style={{
          fontSize:".6rem", fontWeight:600, padding:"2px 7px", borderRadius:"100px",
          background:palette.accent, color:"#fff", whiteSpace:"nowrap", flexShrink:0,
        }}>
          {data.tag}
        </span>
      </div>

      {/* Extract text */}
      <div className="fs" style={{ overflowY:"auto", padding:"16px", flex:1 }}>
        <p style={{
          fontFamily:"'Roboto Serif',serif",
          fontSize:".88rem",
          fontWeight:300,
          lineHeight:1.85,
          color:"var(--t1)",
          letterSpacing:".01em",
        }}>
          {data.text}
        </p>
        <p style={{
          fontFamily:"'Roboto Flex',sans-serif",
          fontSize:".62rem",
          color:"var(--t3)",
          marginTop:"12px",
          fontStyle:"italic",
        }}>
          {data.note}
        </p>
      </div>
    </div>
  );
}

/* ─── Synthesis bar ──────────────────────────────────────────────────────── */
function SynthesisBar({ pair, v, draft, onChange, onSubmit, submitted, pairIndex, total }) {
  const valid = isValid(v);
  const inputRef = useRef(null);

  return (
    <div style={{
      background: valid ? "rgba(26,23,21,.96)" : "var(--ht-soot)",
      borderTop: `1px solid ${valid ? "rgba(45,122,79,.4)" : "rgba(247,244,238,.08)"}`,
      padding:"12px 16px 16px",
      flexShrink:0,
      transition:"border-color .3s ease",
      boxShadow: valid ? "0 -2px 16px rgba(45,122,79,.15)" : "0 -2px 8px rgba(0,0,0,.12)",
    }}>

      {/* AO4 prompt */}
      <div style={{
        fontFamily:"'Roboto Serif',serif",
        fontSize:".72rem",
        fontStyle:"italic",
        color:"rgba(247,244,238,.45)",
        marginBottom:"8px",
        lineHeight:1.4,
      }}>
        {pair.ao4Hint}
      </div>

      {/* Requirement pills */}
      <div className="fs" style={{
        display:"flex", gap:"6px", overflowX:"auto", marginBottom:"10px", paddingBottom:"2px",
      }}>
        <Req ok={v.hasDickens} label="Dickens" />
        <Req ok={v.hasMcEwan}  label="McEwan" />
        <Req ok={v.hasConn}    label="connective" />
        <Req ok={v.long}       label="complete sentence" />
      </div>

      {/* Input row */}
      <div style={{ display:"flex", gap:"8px", alignItems:"flex-end" }}>
        <div style={{ flex:1, position:"relative" }}>
          <textarea
            ref={inputRef}
            placeholder={submitted ? "Synthesis recorded. Advance to the next pair." : "Write one sentence comparing both texts…"}
            value={draft}
            onChange={e => onChange(e.target.value)}
            disabled={submitted}
            rows={2}
            style={{
              width:"100%", resize:"none",
              padding:"10px 13px",
              fontFamily:"'Roboto Serif',serif",
              fontSize:".82rem", fontWeight:300, lineHeight:1.6,
              color: submitted ? "rgba(247,244,238,.5)" : "#F7F4EE",
              background: submitted ? "rgba(247,244,238,.05)" : "rgba(247,244,238,.08)",
              border:`1.5px solid ${valid ? "rgba(45,122,79,.6)" : "rgba(247,244,238,.15)"}`,
              borderRadius:"8px", outline:"none",
              transition:"border-color .25s ease",
              caretColor:"#F7F4EE",
            }}
          />
          {valid && !submitted && (
            <div style={{
              position:"absolute", bottom:"10px", right:"10px",
              width:"6px", height:"6px", borderRadius:"50%",
              background:"#2D7A4F",
              animation:"pulse 1.4s ease infinite",
            }} />
          )}
        </div>

        {/* Submit / Next button */}
        <button
          onClick={onSubmit}
          disabled={submitted ? false : !valid}
          style={{
            all:"unset", cursor: (!valid && !submitted) ? "not-allowed" : "pointer",
            flexShrink:0,
            width:"44px", height:"44px",
            borderRadius:"10px",
            background: submitted
              ? "var(--at)"
              : valid
                ? "#2D7A4F"
                : "rgba(247,244,238,.1)",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"background .25s ease",
            animation: valid && !submitted ? "unlock 1.8s ease infinite" : "none",
            WebkitTapHighlightColor:"transparent",
          }}
        >
          {submitted ? (
            /* Next pair arrow */
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4l5 5-5 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            /* Lock / tick */
            valid ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect x="3" y="7" width="9" height="7" rx="1.5" stroke="rgba(247,244,238,.3)" strokeWidth="1.2"/>
                <path d="M5 7V5a2.5 2.5 0 015 0v2" stroke="rgba(247,244,238,.3)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            )
          )}
        </button>
      </div>

      {/* Progress */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"10px" }}>
        <div style={{ display:"flex", gap:"4px" }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              width: i === pairIndex ? "20px" : "6px",
              height:"3px", borderRadius:"2px",
              background: i < pairIndex
                ? "#2D7A4F"
                : i === pairIndex
                  ? submitted ? "#2D7A4F" : "rgba(247,244,238,.6)"
                  : "rgba(247,244,238,.15)",
              transition:"all .3s ease",
            }} />
          ))}
        </div>
        <span style={{ fontFamily:"'Roboto Flex',sans-serif", fontSize:".62rem", color:"rgba(247,244,238,.3)" }}>
          {pairIndex + 1} / {total}
        </span>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function SplitScreenCompare() {
  const [pairIdx, setPairIdx]   = useState(0);
  const [draft, setDraft]       = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [log, setLog]           = useState([]);
  const [logOpen, setLogOpen]   = useState(false);
  const [wide, setWide]         = useState(window.innerWidth >= 600);

  const pair = PAIRS[Math.min(pairIdx, PAIRS.length - 1)];
  const v    = validate(draft);
  const done = pairIdx >= PAIRS.length;

  useEffect(() => {
    const fn = () => setWide(window.innerWidth >= 600);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  function handleSubmit() {
    if (submitted) {
      // Advance to next pair
      if (pairIdx < PAIRS.length - 1) {
        setPairIdx(i => i + 1);
        setDraft("");
        setSubmitted(false);
      } else {
        setPairIdx(PAIRS.length); // done state
      }
      return;
    }
    if (!isValid(v)) return;
    setLog(prev => [...prev, {
      axisSlug: pair.axisSlug,
      axisTitle: pair.axisTitle,
      sentence: draft.trim(),
      createdAt: new Date().toISOString(),
    }]);
    setSubmitted(true);
  }

  function handleExport() {
    const md = log.map((e, i) =>
      `## Synthesis ${String(i+1).padStart(2,"0")} — ${e.axisTitle}\n\n> "${e.sentence}"\n\n*Logged: ${new Date(e.createdAt).toLocaleString("en-GB")}*\n`
    ).join("\n---\n\n");
    const blob = new Blob([`# Nexus — Synthesis Log\n\n${md}`], { type:"text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "synthesis-log.md";
    a.click();
  }

  const HT_PAL = { tint:"var(--ht-tint)", accent:"var(--ht)" };
  const AT_PAL = { tint:"var(--at-tint)", accent:"var(--at)" };

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        height:"100vh", display:"flex", flexDirection:"column",
        fontFamily:"'Roboto Flex',sans-serif", color:"var(--t1)",
        WebkitFontSmoothing:"antialiased", background:"var(--ht-soot)",
      }}>

        {/* ── Header ── */}
        <header style={{ background:"var(--ht-soot)", flexShrink:0, zIndex:100 }}>
          <div style={{ display:"flex", height:"2px" }}>
            <div style={{ flex:1, background:"var(--ht)" }} />
            <div style={{ flex:1, background:"var(--at)" }} />
          </div>
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 16px",
          }}>
            <div>
              <div style={{ fontSize:".6rem", fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(247,244,238,.35)", marginBottom:"2px" }}>
                Compare · AO4
              </div>
              {done ? (
                <h1 style={{ fontFamily:"'Roboto Serif',serif", fontSize:"1rem", fontWeight:600, color:"#F7F4EE" }}>
                  Session complete
                </h1>
              ) : (
                <h1 style={{ fontFamily:"'Roboto Serif',serif", fontSize:"1rem", fontWeight:600, color:"#F7F4EE", letterSpacing:"-.01em" }}>
                  {pair.axisTitle}
                </h1>
              )}
            </div>

            {/* Log button */}
            <button onClick={() => setLogOpen(true)} style={{
              all:"unset", cursor:"pointer",
              display:"flex", alignItems:"center", gap:"6px",
              padding:"7px 12px", borderRadius:"100px",
              border:"1px solid rgba(247,244,238,.15)",
              background:"rgba(247,244,238,.06)",
              WebkitTapHighlightColor:"transparent",
            }}>
              {log.length > 0 && (
                <span style={{
                  width:"16px", height:"16px", borderRadius:"50%",
                  background:"var(--at)", color:"#fff",
                  fontSize:".6rem", fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {log.length}
                </span>
              )}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3h10M2 7h10M2 11h6" stroke="rgba(247,244,238,.6)" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize:".72rem", color:"rgba(247,244,238,.6)", fontWeight:500 }}>
                Log
              </span>
            </button>
          </div>
        </header>

        {/* ── Done state ── */}
        {done ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"20px", padding:"24px", animation:"fadeUp .4s ease" }}>
            <div style={{ width:"56px", height:"56px", borderRadius:"50%", background:"rgba(45,122,79,.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l4 4L19 8" stroke="#2D7A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ textAlign:"center" }}>
              <h2 style={{ fontFamily:"'Roboto Serif',serif", fontSize:"1.2rem", fontWeight:600, color:"#F7F4EE", marginBottom:"8px" }}>
                {log.length} synthesis{log.length !== 1 ? "es" : ""} recorded
              </h2>
              <p style={{ fontFamily:"'Roboto Serif',serif", fontStyle:"italic", fontSize:".85rem", color:"rgba(247,244,238,.5)", lineHeight:1.6, maxWidth:"280px" }}>
                Every sentence is in your log — export to Markdown and build your essay plan.
              </p>
            </div>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", justifyContent:"center" }}>
              <button onClick={() => setLogOpen(true)} style={{
                all:"unset", cursor:"pointer", padding:"12px 20px", borderRadius:"100px",
                background:"var(--at)", color:"#fff",
                fontFamily:"'Roboto Flex',sans-serif", fontSize:".85rem", fontWeight:600,
                WebkitTapHighlightColor:"transparent",
              }}>
                View synthesis log
              </button>
              <button onClick={handleExport} style={{
                all:"unset", cursor:"pointer", padding:"12px 20px", borderRadius:"100px",
                border:"1.5px solid rgba(247,244,238,.2)", color:"rgba(247,244,238,.7)",
                fontFamily:"'Roboto Flex',sans-serif", fontSize:".85rem", fontWeight:500,
                WebkitTapHighlightColor:"transparent",
              }}>
                Export .md
              </button>
            </div>
            <button onClick={() => { setPairIdx(0); setDraft(""); setSubmitted(false); }} style={{
              all:"unset", cursor:"pointer",
              fontSize:".72rem", color:"rgba(247,244,238,.3)",
              fontFamily:"'Roboto Flex',sans-serif",
              WebkitTapHighlightColor:"transparent",
            }}>
              Restart session
            </button>
          </div>
        ) : (
          <>
            {/* ── Extract panes ── */}
            <div style={{
              flex:1, display:"flex",
              flexDirection: wide ? "row" : "column",
              overflow:"hidden", gap: wide ? "1px" : "0",
              background: wide ? "rgba(247,244,238,.08)" : "transparent",
              animation:"fadeUp .3s ease",
            }}>
              <ExtractPane
                data={pair.ht}
                palette={HT_PAL}
                isHT={true}
                flex={1}
              />

              {/* Divider */}
              {wide ? (
                <div style={{ width:"1px", background:"rgba(247,244,238,.12)", flexShrink:0 }} />
              ) : (
                <div style={{ height:"1px", background:"rgba(247,244,238,.12)", flexShrink:0 }} />
              )}

              <ExtractPane
                data={pair.at}
                palette={AT_PAL}
                isHT={false}
                flex={1}
              />
            </div>

            {/* ── Synthesis bar ── */}
            <SynthesisBar
              pair={pair}
              v={v}
              draft={draft}
              onChange={setDraft}
              onSubmit={handleSubmit}
              submitted={submitted}
              pairIndex={pairIdx}
              total={PAIRS.length}
            />
          </>
        )}

        {/* ── Log drawer ── */}
        {logOpen && (
          <LogDrawer
            entries={log}
            onClose={() => setLogOpen(false)}
            onExport={handleExport}
          />
        )}
      </div>
    </>
  );
}
