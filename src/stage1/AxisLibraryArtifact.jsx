import { useState } from "react";

const tokens = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto+Serif:ital,opsz,wght@0,8..144,300;0,8..144,400;0,8..144,600;0,8..144,700;1,8..144,300;1,8..144,400&family=Roboto+Flex:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
`;

const FILTERS = ["All","Settings","Female characters","Marriage","Independence","Education","Narrative voice","Class","Guilt","Memory","Imagination","Endings"];

const AXES = [
  { slug:"c1_innocence_misinterpretation", axisTitle:"Innocence as damaged perception", themeFamily:"Innocence and Misinterpretation", ao4ComparisonType:"Systemic miseducation versus individual misreading", difficultyBand:"L4–L5 bridge", categories:["Education","Imagination"], mastery:0.2 },
  { slug:"c3_class_social_hierarchy", axisTitle:"Class as an organising system of power", themeFamily:"Class and Social Hierarchy", ao4ComparisonType:"Public industrial exploitation versus private domestic hierarchy", difficultyBand:"L4–L5 bridge", categories:["Class","Independence"], mastery:0.6 },
  { slug:"c1_education_formation", axisTitle:"Education as moral formation or deformation", themeFamily:"Education and Formation", ao4ComparisonType:"Formal rational schooling versus imaginative literary self-education", difficultyBand:"Core L4", categories:["Education","Imagination"], mastery:0.8 },
  { slug:"c7_imagination_rationality", axisTitle:"Fact and fiction as competing moral systems", themeFamily:"Imagination versus Rationality", ao4ComparisonType:"Anti-utilitarian defence of fancy versus postmodern critique of fiction", difficultyBand:"L5 stretch", categories:["Imagination","Narrative voice"], mastery:0.0 },
  { slug:"c5_guilt_responsibility", axisTitle:"Responsibility after harm has been done", themeFamily:"Guilt and Responsibility", ao4ComparisonType:"Potentially reformative social responsibility versus belated personal guilt", difficultyBand:"L4–L5 bridge", categories:["Guilt","Endings","Memory"], mastery:0.4 },
  { slug:"c2_truth_narrative_authority", axisTitle:"Who controls truth?", themeFamily:"Truth and Narrative Authority", ao4ComparisonType:"Moral exposure through confident narration versus epistemological uncertainty", difficultyBand:"L5 stretch", categories:["Narrative voice"], mastery:0.1 },
  { slug:"c4_women_agency", axisTitle:"Female agency under constraint", themeFamily:"Women and Agency", ao4ComparisonType:"Victorian emotional repression versus modern narrative agency", difficultyBand:"Core L4", categories:["Female characters","Marriage","Independence"], mastery:0.9 },
  { slug:"c1_family_emotional_formation", axisTitle:"The family as a site of damage or moral possibility", themeFamily:"Family and Emotional Formation", ao4ComparisonType:"Domestic moral education versus domestic complicity", difficultyBand:"Core L4", categories:["Female characters"], mastery:0.3 },
  { slug:"c6_industrialism_war", axisTitle:"Mechanised human suffering", themeFamily:"Industrialism and War", ao4ComparisonType:"Industrial mechanisation versus military mechanisation", difficultyBand:"L4–L5 bridge", categories:["Settings","Class"], mastery:0.0 },
  { slug:"c2_power_voice", axisTitle:"Silencing and credibility", themeFamily:"Power and Voice", ao4ComparisonType:"Economic institutional silencing versus narrative-legal silencing", difficultyBand:"L4–L5 bridge", categories:["Class","Independence","Narrative voice"], mastery:0.5 },
  { slug:"c3_social_performance_identity", axisTitle:"Constructed selves and false roles", themeFamily:"Social Performance and Identity", ao4ComparisonType:"Public hypocrisy as fraud versus narrative self-fashioning as instability", difficultyBand:"Core L4", categories:["Class"], mastery:0.2 },
  { slug:"c7_moral_imagination", axisTitle:"Sympathy as a condition of judgement", themeFamily:"Moral Imagination", ao4ComparisonType:"Sympathy as moral cure versus imagination as ethical risk", difficultyBand:"L5 stretch", categories:["Imagination","Narrative voice","Guilt"], mastery:0.0 },
  { slug:"c8_structure_consequence", axisTitle:"How structure turns error into consequence", themeFamily:"Structure and Consequence", ao4ComparisonType:"Moral causality as harvest versus retrospective reconstruction as trauma", difficultyBand:"L5 stretch", categories:["Narrative voice","Memory","Endings","Settings"], mastery:0.15 },
  { slug:"c3_setting_social_critique", axisTitle:"Places as moral systems", themeFamily:"Setting and Social Critique", ao4ComparisonType:"Industrial symbolic setting versus class-coded domestic and wartime setting", difficultyBand:"Core L4", categories:["Settings","Class"], mastery:0.7 },
  { slug:"c5_law_justice_injustice", axisTitle:"Institutions and failed justice", themeFamily:"Law, Justice and Injustice", ao4ComparisonType:"Social-economic injustice versus legal-narrative injustice", difficultyBand:"L4–L5 bridge", categories:["Guilt","Class"], mastery:0.0 },
  { slug:"c8_memory_retrospection", axisTitle:"Looking back as judgement", themeFamily:"Memory and Retrospection", ao4ComparisonType:"Clarifying retrospection versus unstable retrospection", difficultyBand:"L4–L5 bridge", categories:["Memory","Narrative voice","Settings"], mastery:0.35 },
  { slug:"c5_religion_morality_secular", axisTitle:"Moral frameworks after failure", themeFamily:"Religion, Morality and Secular Ethics", ao4ComparisonType:"Reformist moral order versus secular unresolved atonement", difficultyBand:"L4–L5 bridge", categories:["Guilt"], mastery:0.0 },
  { slug:"c6_work_duty_human_cost", axisTitle:"Labour as moral and physical burden", themeFamily:"Work, Duty and Human Cost", ao4ComparisonType:"Industrial exploitation versus wartime and narrative duty", difficultyBand:"Core L4", categories:["Class","Guilt"], mastery:0.0 },
  { slug:"c4_desire_sexuality_misreading", axisTitle:"Sexual knowledge and social panic", themeFamily:"Desire, Sexuality and Misreading", ao4ComparisonType:"Marital repression versus catastrophic sexual misinterpretation", difficultyBand:"L4–L5 bridge", categories:["Marriage","Female characters"], mastery:0.45 },
  { slug:"c5_endings_resolution", axisTitle:"Closure and its discontents", themeFamily:"Endings and Resolution", ao4ComparisonType:"Moral closure as judgement versus exposed fictional consolation", difficultyBand:"L5 stretch", categories:["Endings","Guilt","Memory"], mastery:0.55 },
];

const BAND = {
  "Core L4":      { bg:"#EDE8E1", text:"#5C544D",  dot:"#9A918A" },
  "L4–L5 bridge": { bg:"#FBF0E8", text:"#A03722",  dot:"#A03722" },
  "L5 stretch":   { bg:"#FDF6E8", text:"#8A5F18",  dot:"#B17A2D" },
};

function Ring({ v }) {
  const r=7,c=9,circ=2*Math.PI*r,dash=circ*v;
  const col = v>0.7?"#3D5A3A":v>0.4?"#B17A2D":v>0?"#A03722":"#E8E3DB";
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <circle cx={c} cy={c} r={r} fill="none" stroke="#E8E3DB" strokeWidth="2"/>
      {v>0&&<circle cx={c} cy={c} r={r} fill="none" stroke={col} strokeWidth="2"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ*0.25}
        strokeLinecap="round"/>}
    </svg>
  );
}

export default function App() {
  const [active, setActive] = useState("All");
  const [sel, setSel] = useState(null);

  const list = active==="All" ? AXES : AXES.filter(a=>a.categories.includes(active));
  const count = f => AXES.filter(a=>a.categories.includes(f)).length;

  return (
    <>
      <style>{tokens}</style>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp{ from{transform:translateY(100%)} to{transform:translateY(0)} }
        .fs::-webkit-scrollbar{display:none}
        .card:hover{box-shadow:0 4px 12px rgba(26,23,21,.10),0 12px 32px rgba(26,23,21,.06)!important;transform:translateY(-2px)!important}
      `}</style>

      <div style={{minHeight:"100vh",background:"#F7F4EE",fontFamily:"'Roboto Flex',sans-serif",color:"#1A1715",WebkitFontSmoothing:"antialiased"}}>

        {/* Header */}
        <header style={{background:"#1A1715",position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",height:"2px"}}>
            <div style={{flex:1,background:"#A03722"}}/>
            <div style={{flex:1,background:"#3A6E8F"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px"}}>
            <div>
              <div style={{fontSize:".62rem",fontWeight:500,letterSpacing:".12em",textTransform:"uppercase",color:"rgba(247,244,238,.4)",marginBottom:"3px"}}>
                Edexcel 9ET0/02 · Component 2: Prose
              </div>
              <h1 style={{fontFamily:"'Roboto Serif',serif",fontSize:"1.3rem",fontWeight:700,color:"#F7F4EE",letterSpacing:"-.01em"}}>
                Childhood
              </h1>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'Roboto Flex',sans-serif",fontSize:"1.6rem",fontWeight:300,color:"rgba(247,244,238,.9)",lineHeight:1}}>{list.length}</div>
              <div style={{fontSize:".62rem",color:"rgba(247,244,238,.35)",letterSpacing:".05em"}}>{list.length===1?"axis":"axes"}</div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div style={{position:"sticky",top:"70px",zIndex:90,background:"rgba(247,244,238,.93)",backdropFilter:"blur(12px)",borderBottom:"1px solid #E8E3DB"}}>
          <div className="fs" style={{overflowX:"auto",display:"flex",gap:"6px",padding:"10px 20px"}}>
            {FILTERS.map(f=>(
              <button key={f} onClick={()=>{setActive(f);setSel(null);}} style={{
                all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"5px",
                padding:"6px 13px",borderRadius:"100px",fontSize:".78rem",fontFamily:"'Roboto Flex',sans-serif",
                fontWeight:active===f?600:400,whiteSpace:"nowrap",
                background:active===f?"#1A1715":"transparent",
                color:active===f?"#F7F4EE":"#5C544D",
                border:active===f?"1.5px solid #1A1715":"1.5px solid #E8E3DB",
                transition:"all .15s ease",
              }}>
                {f}
                {f!=="All"&&<span style={{fontSize:".62rem",opacity:.5,fontWeight:400}}>{count(f)}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Active label */}
        {active!=="All"&&(
          <div style={{padding:"14px 20px 2px",display:"flex",alignItems:"center",gap:"8px",animation:"fadeUp .2s ease"}}>
            <div style={{width:"18px",height:"1.5px",background:"#E8E3DB"}}/>
            <span style={{fontSize:".7rem",color:"#9A918A"}}>
              Axes relevant to <strong style={{color:"#5C544D"}}>{active.toLowerCase()}</strong> questions
            </span>
          </div>
        )}

        {/* Grid */}
        <main style={{padding:"14px 20px 120px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,310px),1fr))",gap:"11px"}}>
            {list.map((ax,i)=>{
              const b=BAND[ax.difficultyBand]??BAND["Core L4"];
              const isSel=sel===ax.slug;
              return (
                <button key={ax.slug} className="card" onClick={()=>setSel(isSel?null:ax.slug)} style={{
                  all:"unset",cursor:"pointer",display:"flex",flexDirection:"column",
                  background:"#fff",borderRadius:"10px",overflow:"hidden",textAlign:"left",
                  boxShadow:isSel?"0 4px 12px rgba(26,23,21,.10),0 12px 32px rgba(26,23,21,.06)":"0 1px 3px rgba(26,23,21,.06),0 4px 16px rgba(26,23,21,.04)",
                  border:isSel?"1.5px solid #A03722":"1.5px solid transparent",
                  transition:"box-shadow .2s ease,border-color .2s ease,transform .15s ease",
                  transform:isSel?"translateY(-2px)":"none",
                  animation:`fadeUp .38s ease both`,
                  animationDelay:`${i*30}ms`,
                  WebkitTapHighlightColor:"transparent",
                }}>
                  {/* Split bar */}
                  <div style={{display:"flex",height:"3px"}}>
                    <div style={{flex:1,background:"#A03722"}}/>
                    <div style={{flex:1,background:"#3A6E8F"}}/>
                  </div>
                  <div style={{padding:"15px 17px 13px",flexGrow:1,display:"flex",flexDirection:"column",gap:"5px"}}>
                    <span style={{fontFamily:"'Roboto Flex',sans-serif",fontSize:".66rem",fontWeight:500,letterSpacing:".08em",textTransform:"uppercase",color:"#9A918A",lineHeight:1}}>
                      {ax.themeFamily}
                    </span>
                    <h3 style={{fontFamily:"'Roboto Serif',serif",fontSize:".97rem",fontWeight:600,lineHeight:1.3,color:"#1A1715",marginTop:"2px"}}>
                      {ax.axisTitle}
                    </h3>
                    <p style={{fontFamily:"'Roboto Serif',serif",fontSize:".78rem",fontStyle:"italic",fontWeight:300,color:"#5C544D",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",marginTop:"1px"}}>
                      {ax.ao4ComparisonType}
                    </p>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"auto",paddingTop:"11px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
                        <Ring v={ax.mastery}/>
                        <span style={{fontSize:".67rem",color:"#9A918A",fontWeight:400}}>
                          {ax.mastery>0?`${Math.round(ax.mastery*100)}% mastered`:"Not started"}
                        </span>
                      </div>
                      <span style={{fontSize:".62rem",fontWeight:600,padding:"3px 8px",borderRadius:"100px",background:b.bg,color:b.text,display:"inline-flex",alignItems:"center",gap:"4px",whiteSpace:"nowrap"}}>
                        <span style={{width:"5px",height:"5px",borderRadius:"50%",background:b.dot,display:"inline-block"}}/>
                        {ax.difficultyBand}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </main>

        {/* Detail tray */}
        {sel&&(()=>{
          const ax=AXES.find(a=>a.slug===sel);
          if(!ax) return null;
          const b=BAND[ax.difficultyBand]??BAND["Core L4"];
          return (
            <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1.5px solid #E8E3DB",boxShadow:"0 -4px 24px rgba(26,23,21,.12)",zIndex:200,borderRadius:"14px 14px 0 0",animation:"slideUp .22s ease"}}>
              <div style={{padding:"0 20px 32px"}}>
                <div style={{width:"36px",height:"4px",borderRadius:"2px",background:"#E8E3DB",margin:"12px auto 16px"}}/>
                <div style={{display:"flex",gap:"8px",alignItems:"flex-start",marginBottom:"10px"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:".62rem",fontWeight:500,letterSpacing:".1em",textTransform:"uppercase",color:"#9A918A",marginBottom:"3px"}}>{ax.themeFamily}</div>
                    <h2 style={{fontFamily:"'Roboto Serif',serif",fontSize:"1.05rem",fontWeight:600,color:"#1A1715",lineHeight:1.3}}>{ax.axisTitle}</h2>
                  </div>
                  <span style={{fontSize:".62rem",fontWeight:600,padding:"4px 9px",borderRadius:"100px",background:b.bg,color:b.text,whiteSpace:"nowrap",marginTop:"2px",flexShrink:0}}>{ax.difficultyBand}</span>
                </div>
                <p style={{fontFamily:"'Roboto Serif',serif",fontSize:".83rem",fontStyle:"italic",fontWeight:300,color:"#5C544D",lineHeight:1.55,paddingTop:"10px",borderTop:"1px solid #E8E3DB",marginBottom:"16px"}}>{ax.ao4ComparisonType}</p>
                <button onClick={()=>alert(`→ /themes/${ax.slug}`)} style={{all:"unset",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",width:"100%",padding:"13px",borderRadius:"6px",background:"#1A1715",color:"#F7F4EE",fontFamily:"'Roboto Flex',sans-serif",fontSize:".875rem",fontWeight:600,letterSpacing:".02em"}}>
                  Open axis detail
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
