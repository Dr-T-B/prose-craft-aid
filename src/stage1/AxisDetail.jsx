import { useState, useRef, useEffect } from "react";

/* ─── Tokens & base styles ───────────────────────────────────────────────── */
const BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Roboto+Serif:ital,opsz,wght@0,8..144,300;0,8..144,400;0,8..144,600;0,8..144,700;1,8..144,300;1,8..144,400&family=Roboto+Flex:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden}
:root{
  --ht-brick:#A03722; --ht-soot:#1A1715; --ht-smoke:#5C544D; --ht-tint:#FBF5F3;
  --at-green:#3D5A3A; --at-fountain:#3A6E8F; --at-ochre:#B17A2D; --at-tint:#F0F6F9;
  --surface:#F7F4EE; --card:#FFFFFF; --border:#E8E3DB;
  --t1:#1A1715; --t2:#5C544D; --t3:#9A918A;
  --r6:6px; --r10:10px; --r14:14px; --r100:100px;
  --sh-card:0 1px 3px rgba(26,23,21,.06),0 4px 16px rgba(26,23,21,.04);
  --sh-sheet:0 -4px 24px rgba(26,23,21,.14);
}
.fs::-webkit-scrollbar{display:none}
.fs{scrollbar-width:none;-ms-overflow-style:none}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
`;

/* ─── Demo axis: c3_class_social_hierarchy ───────────────────────────────── */
const AXIS = {
  slug: "c3_class_social_hierarchy",
  axisTitle: "Class as an organising system of power",
  themeFamily: "Class and Social Hierarchy",
  ao4ComparisonType: "Public industrial exploitation versus private domestic hierarchy",
  difficultyBand: "L4–L5 bridge",
  text1Concept: "Dickens presents class through industrial capitalism, Coketown, Bounderby's self-mythology and the exploitation of workers such as Stephen Blackpool. The Coketown 'Hands' are defined by their economic function, stripped of individual identity by the very label the system assigns them.",
  text2Concept: "McEwan presents class through the Tallis household, Robbie's precarious social mobility, Cecilia's rebellion and Briony's class-inflected misreading of events. Class in Atonement operates invisibly — never stated, always assumed — which is precisely how it does its damage.",
  comparativeDivergence: "Dickens attacks industrial class inequality as a public social structure whereas McEwan exposes class as a subtler but equally destructive system of cultural assumption and social coding.",
  ao1Argument: "Both novels show class as a structure that determines whose voice is trusted, whose suffering is visible, and whose truth is believed.",
  ao2Text1Methods: [
    "industrial imagery",
    "satire",
    "symbolic setting",
    "contrast",
    "character construction",
  ],
  ao2Text2Methods: [
    "country-house setting",
    "focalisation",
    "social detail",
    "dialogue",
    "retrospective irony",
  ],
  ao3Text1Context: [
    "Industrial capitalism and Victorian class hierarchy",
    "Factory labour and laissez-faire economics",
    "The Preston Lock-out (1853–54) — Dickens' direct source",
    "Carlyle's Past and Present — the novel's intellectual context",
  ],
  ao3Text2Context: [
    "1930s upper-middle-class privilege and interwar codes",
    "The Cambridge-educated servant-class boundary",
    "The country-house tradition as class cultural form",
    "Post-war class settlement that transformed, but did not abolish, hierarchy",
  ],
  criticalPerspectives: [
    "Robbie may be read as a victim of class prejudice — or as someone whose Cambridge education makes him socially liminal and therefore threatening to the Tallis order.",
    "Bounderby's self-made-man myth can be read as individual fraud, or as revealing how class ideology sustains itself through narrative — making his exposure an indictment of the system, not just the man.",
    "Williams (The Country and the City): both novels can be read as mapping the invisible geography of class across rural and industrial space.",
  ],
  text1Locations: [
    "Bk 1 Ch 5 — Coketown: The Key-note",
    "Bk 1 Ch 11 — Stephen at Bounderby's",
    "Bk 3 Ch 5 — Bounderby's exposure",
  ],
  text2Locations: [
    "Pt 1 Ch 2 — Cecilia and Robbie at the fountain",
    "Pt 1 Ch 13 — the accusation: class as credibility",
    "Pt 4 — the Marshalls' survival",
  ],
  level4Version: "Both texts show class inequality but Dickens focuses on workers and factories while McEwan focuses on the assumptions inside a wealthy family that determine who is believed.",
  level5Version: "Dickens and McEwan both expose class as epistemological power: class determines not only status but credibility, interpretation and narrative authority — whose account a society will accept as truth.",
  sentenceComponents: {
    verbs: [
      "exposes class as epistemological",
      "makes class visible through",
      "treats credibility as class-determined",
      "diagnoses class as",
    ],
    connectives: [
      "Dickens makes class visible through industry; McEwan makes it visible through domestic assumption",
      "both novelists expose class as a structure of credibility, but differ in method",
      "where Dickens attacks through satire, McEwan exposes through focalisation",
      "in structurally parallel but ideologically opposed critiques",
    ],
    counterPositions: [
      "Robbie may be read as purely victimised — or as threatening precisely because his class position is ambiguous",
      "Bounderby's myth could be individual fraud or a revelation of how ideology reproduces itself through self-narration",
    ],
  },
};

/* ─── Method explanations ────────────────────────────────────────────────── */
const METHOD_INFO = {
  "industrial imagery": { novel:"Hard Times", text:"Dickens saturates Coketown with machine metaphors — 'elephants in a state of melancholy madness', serpents of smoke — making capitalism physically legible. The imagery strips the factory of human agency, presenting class exploitation as a mechanical, inevitable force.", ao:"AO2" },
  "satire": { novel:"Hard Times", text:"Bounderby's fraudulent self-made-man speeches are made grotesque rather than frightening, which is itself the satirical argument: the class ideology is so obviously a myth that only its social power keeps it intact. Satire is Dickens' epistemological weapon.", ao:"AO2" },
  "symbolic setting": { novel:"Hard Times", text:"Coketown operates diagrammatically — its uniform brick, blackened rivers and monotonous repetition argue that industrial capitalism produces human uniformity. Unlike McEwan's settings, Coketown means one thing stably throughout.", ao:"AO2" },
  "contrast": { novel:"Hard Times", text:"Dickens maps class morally through spatial contrast: Coketown vs the circus, Stone Lodge vs Pegasus's Arms. Each pairing argues that the humane alternative exists but is structurally excluded by the same logic that produces Coketown.", ao:"AO2" },
  "character construction": { novel:"Hard Times", text:"Bounderby and Bitzer are class types rather than psychological individuals, which allows Dickens to anatomise ideological positions rather than personal failings. Caricature is not a weakness but a technique for making class structural rather than incidental.", ao:"AO2" },
  "country-house setting": { novel:"Atonement", text:"The Tallis estate encodes class as inherited aesthetic habit — cool stone, formal gardens, the implied history of ownership. McEwan never explains the class dynamics; he renders them in texture and silence, making class felt before it is understood.", ao:"AO2" },
  "focalisation": { novel:"Atonement", text:"Briony's view of Robbie as 'maniac' is internally coherent and catastrophically wrong. McEwan uses focalisation to reveal how class-inflected perception operates as epistemology: what one sees depends on where one stands, and the Tallis household has always stood at a particular angle.", ao:"AO2" },
  "social detail": { novel:"Atonement", text:"The novel accumulates class markers — accents, forms of address, who serves at dinner — without commentary. This restraint performs the naturalism of the class world it depicts: the Tallises take their own codes as given, and the novel briefly inhabits that naturalism before exposing it.", ao:"AO2" },
  "dialogue": { novel:"Atonement", text:"McEwan's dialogue tracks class registers with precision: Robbie's speech is educated but his name and position mark him; Tallis family exchanges proceed on assumptions his presence cannot share. What goes unsaid — the class assumption — does the evaluative work.", ao:"AO2" },
  "retrospective irony": { novel:"Atonement", text:"The retrospective structure exposes the irony that the class verdict passed on Robbie in 1935 remains unrevoked in 1999. Retrospection does not deliver justice; it reveals the durability of class as the condition that makes fiction necessary and repair impossible.", ao:"AO2" },
};

/* ─── Utility ────────────────────────────────────────────────────────────── */
const BAND = {
  "Core L4":      { bg:"#EDE8E1", text:"#5C544D", dot:"#9A918A" },
  "L4–L5 bridge": { bg:"#FBF0E8", text:"#A03722", dot:"#A03722" },
  "L5 stretch":   { bg:"#FDF6E8", text:"#8A5F18", dot:"#B17A2D" },
};

function Toast({ msg, visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position:"fixed", bottom:"88px", left:"50%", transform:"translateX(-50%)",
      background:"var(--ht-soot)", color:"#F7F4EE", padding:"10px 18px",
      borderRadius:"var(--r100)", fontSize:".78rem", fontFamily:"'Roboto Flex',sans-serif",
      fontWeight:500, whiteSpace:"nowrap", zIndex:500,
      boxShadow:"0 4px 16px rgba(26,23,21,.24)",
      animation:"fadeUp .2s ease",
    }}>
      ✓ Sent to Thesis Builder
    </div>
  );
}

function Sheet({ item, onClose }) {
  if (!item) return null;
  const info = METHOD_INFO[item] ?? { text:"No detail available.", novel:"", ao:"AO2" };
  const isHT = info.novel === "Hard Times";
  return (
    <div style={{ position:"fixed", inset:0, zIndex:400 }} onClick={onClose}>
      <div style={{ position:"absolute", inset:0, background:"rgba(26,23,21,.35)" }} />
      <div
        style={{
          position:"absolute", bottom:0, left:0, right:0,
          background:"var(--card)", borderRadius:"var(--r14) var(--r14) 0 0",
          boxShadow:"var(--sh-sheet)", animation:"slideUp .22s ease",
          padding:"0 20px 36px",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width:"36px", height:"4px", borderRadius:"2px", background:"var(--border)", margin:"12px auto 16px" }} />
        <div style={{ display:"flex", gap:"8px", marginBottom:"12px", alignItems:"center" }}>
          <span style={{
            fontSize:".64rem", fontWeight:600, padding:"3px 9px", borderRadius:"var(--r100)",
            background: isHT ? "#FBF0E8" : "#EBF3F8",
            color: isHT ? "var(--ht-brick)" : "var(--at-fountain)",
          }}>
            {info.novel || item}
          </span>
          <span style={{ fontSize:".64rem", color:"var(--t3)", fontWeight:500, letterSpacing:".06em" }}>
            {info.ao}
          </span>
        </div>
        <h3 style={{ fontFamily:"'Roboto Serif',serif", fontSize:"1rem", fontWeight:600, marginBottom:"10px" }}>
          {item}
        </h3>
        <p style={{ fontFamily:"'Roboto Serif',serif", fontSize:".85rem", fontWeight:300, lineHeight:1.65, color:"var(--t2)" }}>
          {info.text}
        </p>
      </div>
    </div>
  );
}

/* ─── Overview tab ───────────────────────────────────────────────────────── */
function OverviewTab({ axis }) {
  return (
    <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:"20px", animation:"fadeUp .3s ease" }}>

      {/* AO1 pull-quote */}
      <div style={{
        background:"var(--ht-soot)", borderRadius:"var(--r10)",
        padding:"18px 20px", position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, display:"flex", height:"2px" }}>
          <div style={{ flex:1, background:"var(--ht-brick)" }} />
          <div style={{ flex:1, background:"var(--at-fountain)" }} />
        </div>
        <div style={{ fontSize:".62rem", fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(247,244,238,.4)", marginBottom:"8px" }}>
          AO1 — Conceptual argument
        </div>
        <p style={{ fontFamily:"'Roboto Serif',serif", fontSize:".95rem", fontWeight:400, lineHeight:1.6, color:"#F7F4EE", fontStyle:"italic" }}>
          "{axis.ao1Argument}"
        </p>
      </div>

      {/* Text concepts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
        {/* Hard Times */}
        <div style={{ background:"var(--ht-tint)", borderRadius:"var(--r10)", padding:"14px 15px", borderLeft:"3px solid var(--ht-brick)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"10px" }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"var(--ht-brick)", flexShrink:0 }} />
            <span style={{ fontSize:".64rem", fontWeight:600, letterSpacing:".07em", textTransform:"uppercase", color:"var(--ht-brick)" }}>
              Hard Times
            </span>
          </div>
          <p style={{ fontFamily:"'Roboto Serif',serif", fontSize:".8rem", fontWeight:300, lineHeight:1.6, color:"var(--t1)" }}>
            {axis.text1Concept}
          </p>
        </div>

        {/* Atonement */}
        <div style={{ background:"var(--at-tint)", borderRadius:"var(--r10)", padding:"14px 15px", borderLeft:"3px solid var(--at-fountain)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"10px" }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"var(--at-fountain)", flexShrink:0 }} />
            <span style={{ fontSize:".64rem", fontWeight:600, letterSpacing:".07em", textTransform:"uppercase", color:"var(--at-fountain)" }}>
              Atonement
            </span>
          </div>
          <p style={{ fontFamily:"'Roboto Serif',serif", fontSize:".8rem", fontWeight:300, lineHeight:1.6, color:"var(--t1)" }}>
            {axis.text2Concept}
          </p>
        </div>
      </div>

      {/* Comparative divergence */}
      <div style={{ background:"var(--card)", borderRadius:"var(--r10)", padding:"16px 18px", boxShadow:"var(--sh-card)" }}>
        <div style={{ fontSize:".62rem", fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:"var(--t3)", marginBottom:"8px" }}>
          AO4 — Comparative divergence
        </div>
        <p style={{ fontFamily:"'Roboto Serif',serif", fontSize:".88rem", fontStyle:"italic", fontWeight:300, lineHeight:1.65, color:"var(--t2)" }}>
          {axis.comparativeDivergence}
        </p>
      </div>

      {/* Exam stems */}
      <div>
        <div style={{ fontSize:".62rem", fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:"var(--t3)", marginBottom:"10px" }}>
          Likely exam questions
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
          {["Compare the ways writers present social class",
            "Compare social inequality and power",
            "Compare the treatment of working-class characters",
            "Compare how writers present injustice"].map((stem, i) => (
            <div key={i} style={{
              display:"flex", alignItems:"flex-start", gap:"10px",
              background:"var(--card)", borderRadius:"var(--r6)", padding:"10px 12px",
              boxShadow:"var(--sh-card)",
            }}>
              <span style={{ fontSize:".7rem", color:"var(--at-fountain)", fontWeight:700, flexShrink:0, lineHeight:1.6 }}>Q</span>
              <span style={{ fontFamily:"'Roboto Serif',serif", fontSize:".82rem", fontWeight:300, color:"var(--t1)", lineHeight:1.55 }}>
                {stem}.
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Methods tab ────────────────────────────────────────────────────────── */
function MethodsTab({ axis, onMethodTap }) {
  return (
    <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:"24px", animation:"fadeUp .3s ease" }}>
      {[
        { label:"Hard Times", methods:axis.ao2Text1Methods, color:"var(--ht-brick)", tint:"#FBF0E8", locations:axis.text1Locations },
        { label:"Atonement", methods:axis.ao2Text2Methods, color:"var(--at-fountain)", tint:"#EBF3F8", locations:axis.text2Locations },
      ].map(({ label, methods, color, tint, locations }) => (
        <div key={label}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
            <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:color, flexShrink:0 }} />
            <span style={{ fontSize:".72rem", fontWeight:600, letterSpacing:".07em", textTransform:"uppercase", color }}>
              {label}
            </span>
          </div>

          {/* Method chips */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"14px" }}>
            {methods.map(m => (
              <button key={m} onClick={() => onMethodTap(m)} style={{
                all:"unset", cursor:"pointer", padding:"7px 14px",
                borderRadius:"var(--r100)", fontSize:".78rem",
                fontFamily:"'Roboto Flex',sans-serif", fontWeight:400,
                background:tint, color, border:`1.5px solid ${color}22`,
                transition:"all .15s ease", WebkitTapHighlightColor:"transparent",
              }}
              onMouseEnter={e => { e.currentTarget.style.background=color; e.currentTarget.style.color="#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background=tint; e.currentTarget.style.color=color; }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Open-book locations */}
          <div style={{ background:"var(--card)", borderRadius:"var(--r10)", padding:"12px 14px", boxShadow:"var(--sh-card)" }}>
            <div style={{ fontSize:".62rem", fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:"var(--t3)", marginBottom:"8px" }}>
              Open-book locations
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
              {locations.map((loc, i) => (
                <button key={i}
                  onClick={() => {
                    try { navigator.clipboard.writeText(loc.split(" — ")[0]); } catch(e) {}
                  }}
                  title="Tap to copy reference"
                  style={{
                    all:"unset", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:"5px",
                    padding:"5px 11px", borderRadius:"var(--r100)", fontSize:".72rem",
                    fontFamily:"'Roboto Serif',serif", fontStyle:"italic", fontWeight:300,
                    background:"var(--surface)", color:"var(--t2)",
                    border:"1px solid var(--border)", transition:"background .12s ease",
                    WebkitTapHighlightColor:"transparent",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background="#E8E3DB"}
                  onMouseLeave={e => e.currentTarget.style.background="var(--surface)"}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <rect x="1" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1"/>
                    <path d="M3 3V2a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H7" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Contexts tab ───────────────────────────────────────────────────────── */
function ContextsTab({ axis, onUseInArgument }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:"24px", animation:"fadeUp .3s ease" }}>

      {/* AO3 contexts */}
      {[
        { label:"Hard Times — AO3 context", items:axis.ao3Text1Context, color:"var(--ht-brick)", ao:"AO3 · Hard Times" },
        { label:"Atonement — AO3 context", items:axis.ao3Text2Context, color:"var(--at-fountain)", ao:"AO3 · Atonement" },
      ].map(({ label, items, color, ao }) => (
        <div key={label}>
          <div style={{ fontSize:".62rem", fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color, marginBottom:"10px" }}>
            {label}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
            {items.map((item, i) => (
              <div key={i} style={{
                background:"var(--card)", borderRadius:"var(--r10)", overflow:"hidden",
                boxShadow:"var(--sh-card)", border:"1px solid var(--border)",
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", gap:"10px" }}>
                  <span style={{ fontFamily:"'Roboto Serif',serif", fontSize:".82rem", fontWeight:400, lineHeight:1.4, color:"var(--t1)", flex:1 }}>
                    {item}
                  </span>
                  <button onClick={() => onUseInArgument(item)} style={{
                    all:"unset", cursor:"pointer", flexShrink:0,
                    fontSize:".66rem", fontWeight:600, padding:"5px 10px",
                    borderRadius:"var(--r100)", background:"var(--surface)",
                    color:"var(--t2)", border:"1px solid var(--border)",
                    fontFamily:"'Roboto Flex',sans-serif", letterSpacing:".03em",
                    transition:"background .12s, color .12s", whiteSpace:"nowrap",
                    WebkitTapHighlightColor:"transparent",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background="var(--ht-soot)"; e.currentTarget.style.color="#F7F4EE"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="var(--surface)"; e.currentTarget.style.color="var(--t2)"; }}
                  >
                    Use in argument →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Critical perspectives / Alternative readings */}
      <div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
          <div style={{ fontSize:".62rem", fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:"var(--t3)" }}>
            Alternative readings
          </div>
          <span style={{ fontSize:".6rem", background:"#EDE8E1", color:"var(--t2)", padding:"2px 8px", borderRadius:"var(--r100)", fontWeight:500 }}>
            A* enrichment
          </span>
        </div>
        <p style={{ fontSize:".7rem", color:"var(--t3)", fontFamily:"'Roboto Flex',sans-serif", marginBottom:"10px", lineHeight:1.5 }}>
          These are interpretive moves for AO1 "informed responses" — they are <em>not</em> AO5, which is not assessed in this paper.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {axis.criticalPerspectives.map((cp, i) => (
            <button key={i} onClick={() => setExpanded(expanded === i ? null : i)} style={{
              all:"unset", cursor:"pointer", textAlign:"left",
              background: expanded === i ? "#F4F1E8" : "var(--card)",
              borderRadius:"var(--r10)", padding:"12px 14px",
              border: expanded === i ? "1.5px solid #C8BFA8" : "1px solid var(--border)",
              boxShadow:"var(--sh-card)", transition:"all .18s ease",
              WebkitTapHighlightColor:"transparent",
            }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:"10px" }}>
                <span style={{ fontSize:".8rem", color:"var(--at-ochre)", fontWeight:700, lineHeight:1.6, flexShrink:0 }}>◆</span>
                <p style={{ fontFamily:"'Roboto Serif',serif", fontSize:".82rem", fontWeight:300, lineHeight:1.6, color:"var(--t1)" }}>
                  {cp}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Write tab ──────────────────────────────────────────────────────────── */
function WriteTab({ axis }) {
  const [selVerb, setSelVerb] = useState(null);
  const [selConn, setSelConn] = useState(null);
  const [selCp, setSelCp] = useState(null);
  const [level, setLevel] = useState("L4");
  const [draft, setDraft] = useState("");

  const sc = axis.sentenceComponents;
  const hasSel = selVerb || selConn || selCp;

  function ChipRow({ items, selected, onSelect, accent }) {
    return (
      <div className="fs" style={{ display:"flex", gap:"7px", overflowX:"auto", paddingBottom:"2px" }}>
        {items.map(item => {
          const active = selected === item;
          return (
            <button key={item} onClick={() => onSelect(active ? null : item)} style={{
              all:"unset", cursor:"pointer", padding:"8px 14px",
              borderRadius:"var(--r100)", fontSize:".78rem",
              fontFamily:"'Roboto Flex',sans-serif", fontWeight: active ? 600 : 400,
              whiteSpace:"nowrap", flexShrink:0,
              background: active ? accent : "var(--surface)",
              color: active ? "#fff" : "var(--t2)",
              border: active ? `1.5px solid ${accent}` : "1.5px solid var(--border)",
              boxShadow: active ? `0 2px 8px ${accent}33` : "none",
              transition:"all .15s ease", WebkitTapHighlightColor:"transparent",
            }}>
              {item}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:"20px", animation:"fadeUp .3s ease" }}>

      {/* Composition preview */}
      <div style={{
        background:"var(--card)", borderRadius:"var(--r10)", padding:"14px 16px",
        boxShadow:"var(--sh-card)", border:"1px solid var(--border)",
        minHeight:"72px",
      }}>
        <div style={{ fontSize:".62rem", fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:"var(--t3)", marginBottom:"8px" }}>
          Your selection so far
        </div>
        {hasSel ? (
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", alignItems:"center" }}>
            {selVerb && <span style={{ fontFamily:"'Roboto Serif',serif", fontSize:".82rem", fontStyle:"italic", color:"var(--ht-brick)" }}>"{selVerb}"</span>}
            {selVerb && selConn && <span style={{ color:"var(--t3)", fontSize:".75rem" }}>+</span>}
            {selConn && <span style={{ fontFamily:"'Roboto Serif',serif", fontSize:".82rem", fontStyle:"italic", color:"var(--at-fountain)" }}>"{selConn}"</span>}
            {(selVerb || selConn) && selCp && <span style={{ color:"var(--t3)", fontSize:".75rem" }}>·</span>}
            {selCp && <span style={{ fontFamily:"'Roboto Serif',serif", fontSize:".78rem", fontStyle:"italic", color:"var(--at-ochre)" }}>counter: "{selCp}"</span>}
          </div>
        ) : (
          <p style={{ fontFamily:"'Roboto Serif',serif", fontSize:".8rem", fontStyle:"italic", color:"var(--t3)", lineHeight:1.5 }}>
            Select chips below to build your comparative scaffold.
          </p>
        )}
      </div>

      {/* Chip rails */}
      <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
        {[
          { label:"Verbs", items:sc.verbs, sel:selVerb, onSel:setSelVerb, accent:"var(--ht-brick)" },
          { label:"Connectives", items:sc.connectives, sel:selConn, onSel:setSelConn, accent:"var(--at-fountain)" },
          { label:"Counter-positions", items:sc.counterPositions, sel:selCp, onSel:setSelCp, accent:"var(--at-ochre)" },
        ].map(({ label, items, sel, onSel, accent }) => (
          <div key={label}>
            <div style={{ fontSize:".62rem", fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:"var(--t3)", marginBottom:"8px" }}>
              {label}
            </div>
            <ChipRow items={items} selected={sel} onSelect={onSel} accent={accent} />
          </div>
        ))}
      </div>

      {/* Draft area */}
      <div>
        <div style={{ fontSize:".62rem", fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:"var(--t3)", marginBottom:"8px" }}>
          Write your sentence
        </div>
        <textarea
          placeholder="Using the chips above as raw material, write your comparative thesis sentence here…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={4}
          style={{
            width:"100%", padding:"12px 14px",
            fontFamily:"'Roboto Serif',serif", fontSize:".85rem", fontWeight:300, lineHeight:1.65,
            color:"var(--t1)", background:"var(--card)",
            border:"1.5px solid var(--border)", borderRadius:"var(--r10)",
            resize:"vertical", outline:"none",
            transition:"border-color .15s ease",
          }}
          onFocus={e => e.target.style.borderColor="var(--ht-soot)"}
          onBlur={e => e.target.style.borderColor="var(--border)"}
        />
      </div>

      {/* L4 / L5 benchmarks */}
      <div style={{ background:"var(--card)", borderRadius:"var(--r10)", boxShadow:"var(--sh-card)", overflow:"hidden" }}>
        {/* Warning header */}
        <div style={{
          background:"#F4F1E8", padding:"10px 16px",
          borderBottom:"1px solid var(--border)",
          display:"flex", alignItems:"center", gap:"8px",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 12H1L7 1z" stroke="#8A5F18" strokeWidth="1.2" strokeLinejoin="round"/>
            <line x1="7" y1="5" x2="7" y2="8" stroke="#8A5F18" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="7" cy="10.5" r=".6" fill="#8A5F18"/>
          </svg>
          <span style={{ fontSize:".7rem", fontWeight:500, color:"#8A5F18", fontFamily:"'Roboto Flex',sans-serif" }}>
            Benchmark framings — use as a standard, not a template to copy
          </span>
        </div>

        {/* Toggle */}
        <div style={{ display:"flex", borderBottom:"1px solid var(--border)" }}>
          {["L4","L5"].map(l => (
            <button key={l} onClick={() => setLevel(l)} style={{
              all:"unset", cursor:"pointer", flex:1, textAlign:"center",
              padding:"10px", fontSize:".8rem",
              fontFamily:"'Roboto Flex',sans-serif", fontWeight: level===l ? 600 : 400,
              color: level===l ? "var(--ht-soot)" : "var(--t3)",
              borderBottom: level===l ? "2px solid var(--ht-soot)" : "2px solid transparent",
              transition:"all .15s ease", WebkitTapHighlightColor:"transparent",
              marginBottom:"-1px",
            }}>
              {l === "L4" ? "Level 4 — discriminating, controlled" : "Level 5 — critical, evaluative"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding:"16px" }}>
          <p style={{ fontFamily:"'Roboto Serif',serif", fontSize:".85rem", fontWeight:300, lineHeight:1.7, color:"var(--t2)", fontStyle:"italic" }}>
            "{level === "L4" ? axis.level4Version : axis.level5Version}"
          </p>
        </div>
      </div>

    </div>
  );
}

/* ─── Main: Axis Detail ──────────────────────────────────────────────────── */
export default function AxisDetail() {
  const [tab, setTab] = useState("Overview");
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(false);
  const scrollRef = useRef(null);

  const tabs = ["Overview", "Methods", "Contexts", "Write"];
  const axis = AXIS;
  const band = BAND[axis.difficultyBand] ?? BAND["Core L4"];

  function handleUseInArgument() {
    setToast(true);
    setTimeout(() => setToast(false), 2200);
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [tab]);

  return (
    <>
      <style>{BASE_CSS}</style>
      <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"var(--surface)", fontFamily:"'Roboto Flex',sans-serif", color:"var(--t1)", WebkitFontSmoothing:"antialiased" }}>

        {/* ── Sticky header ── */}
        <header style={{ background:"var(--ht-soot)", flexShrink:0, zIndex:100 }}>
          <div style={{ display:"flex", height:"2px" }}>
            <div style={{ flex:1, background:"var(--ht-brick)" }} />
            <div style={{ flex:1, background:"var(--at-fountain)" }} />
          </div>
          <div style={{ padding:"12px 16px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:"10px" }}>
              {/* Back */}
              <button onClick={() => alert("← back to /themes")} style={{
                all:"unset", cursor:"pointer", color:"rgba(247,244,238,.6)",
                padding:"4px 2px", marginTop:"1px", flexShrink:0,
                WebkitTapHighlightColor:"transparent",
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:".62rem", fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(247,244,238,.38)", marginBottom:"3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {axis.themeFamily}
                </div>
                <h1 style={{ fontFamily:"'Roboto Serif',serif", fontSize:"1rem", fontWeight:600, lineHeight:1.3, color:"#F7F4EE", overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                  {axis.axisTitle}
                </h1>
              </div>

              <span style={{
                flexShrink:0, fontSize:".6rem", fontWeight:600,
                padding:"4px 9px", borderRadius:"var(--r100)",
                background:band.bg, color:band.text, marginTop:"18px",
                display:"inline-flex", alignItems:"center", gap:"4px",
              }}>
                <span style={{ width:"4px", height:"4px", borderRadius:"50%", background:band.dot }} />
                {axis.difficultyBand}
              </span>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display:"flex", borderTop:"1px solid rgba(247,244,238,.08)" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                all:"unset", cursor:"pointer", flex:1, textAlign:"center",
                padding:"11px 4px", fontSize:".75rem",
                fontFamily:"'Roboto Flex',sans-serif", fontWeight: tab===t ? 600 : 400,
                color: tab===t ? "#F7F4EE" : "rgba(247,244,238,.44)",
                borderBottom: tab===t ? "2px solid var(--ht-brick)" : "2px solid transparent",
                transition:"all .15s ease", WebkitTapHighlightColor:"transparent",
                position:"relative",
              }}>
                {t}
                {t === "Write" && (
                  <span style={{
                    position:"absolute", top:"8px", right:"8px",
                    width:"5px", height:"5px", borderRadius:"50%",
                    background:"var(--at-ochre)", opacity:.8,
                  }} />
                )}
              </button>
            ))}
          </div>
        </header>

        {/* ── Scrollable content ── */}
        <div ref={scrollRef} style={{ flex:1, overflowY:"auto" }} className="fs">
          {tab === "Overview"  && <OverviewTab axis={axis} />}
          {tab === "Methods"   && <MethodsTab axis={axis} onMethodTap={m => setSheet(m)} />}
          {tab === "Contexts"  && <ContextsTab axis={axis} onUseInArgument={handleUseInArgument} />}
          {tab === "Write"     && <WriteTab axis={axis} />}

          <div style={{ height:"32px" }} />
        </div>

        {/* ── Method sheet ── */}
        <Sheet item={sheet} onClose={() => setSheet(null)} />

        {/* ── Toast ── */}
        <Toast msg="Sent to Thesis Builder" visible={toast} />
      </div>
    </>
  );
}
