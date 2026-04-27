import { useState, useEffect } from "react";

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const tokens = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto+Serif:ital,opsz,wght@0,8..144,300;0,8..144,400;0,8..144,600;0,8..144,700;1,8..144,300;1,8..144,400&family=Roboto+Flex:wght@300;400;500;600&display=swap');

  :root {
    --ht-brick:    #A03722;
    --ht-soot:     #1A1715;
    --ht-smoke:    #5C544D;
    --at-green:    #3D5A3A;
    --at-fountain: #3A6E8F;
    --at-ochre:    #B17A2D;
    --surface:     #F7F4EE;
    --surface-card:#FFFFFF;
    --border:      #E8E3DB;
    --text-primary:#1A1715;
    --text-secondary:#5C544D;
    --text-tertiary:#9A918A;
    --chip-active-bg:#1A1715;
    --chip-active-text:#F7F4EE;
    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   16px;
    --shadow-card: 0 1px 3px rgba(26,23,21,0.06), 0 4px 16px rgba(26,23,21,0.04);
    --shadow-hover: 0 4px 12px rgba(26,23,21,0.10), 0 12px 32px rgba(26,23,21,0.06);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--surface);
    font-family: 'Roboto Flex', sans-serif;
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
  }

  /* Grain overlay on background */
  .grain-bg::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
    opacity: 0.4;
  }
`;

/* ─── Filter categories ──────────────────────────────────────────────────── */
const FILTERS = [
  "All",
  "Settings",
  "Female characters",
  "Marriage",
  "Independence",
  "Education",
  "Narrative voice",
  "Class",
  "Guilt",
  "Memory",
  "Imagination",
  "Endings",
];

/* ─── Mock data — all 20 axes from comparative_mix / seed SQL ────────────── */
const AXES = [
  {
    slug: "c1_innocence_misinterpretation",
    axisTitle: "Innocence as damaged perception",
    themeFamily: "Innocence and Misinterpretation",
    ao4ComparisonType: "Systemic miseducation versus individual misreading",
    difficultyBand: "L4–L5 bridge",
    categories: ["Education", "Imagination"],
    mastery: 0.2,
  },
  {
    slug: "c3_class_social_hierarchy",
    axisTitle: "Class as an organising system of power",
    themeFamily: "Class and Social Hierarchy",
    ao4ComparisonType: "Public industrial exploitation versus private domestic hierarchy",
    difficultyBand: "L4–L5 bridge",
    categories: ["Class", "Independence"],
    mastery: 0.6,
  },
  {
    slug: "c1_education_formation",
    axisTitle: "Education as moral formation or deformation",
    themeFamily: "Education and Formation",
    ao4ComparisonType: "Formal rational schooling versus imaginative literary self-education",
    difficultyBand: "Core L4",
    categories: ["Education", "Imagination"],
    mastery: 0.8,
  },
  {
    slug: "c7_imagination_rationality",
    axisTitle: "Fact and fiction as competing moral systems",
    themeFamily: "Imagination versus Rationality",
    ao4ComparisonType: "Anti-utilitarian defence of fancy versus postmodern critique of fiction",
    difficultyBand: "L5 stretch",
    categories: ["Imagination", "Narrative voice"],
    mastery: 0.0,
  },
  {
    slug: "c5_guilt_responsibility",
    axisTitle: "Responsibility after harm has been done",
    themeFamily: "Guilt and Responsibility",
    ao4ComparisonType: "Potentially reformative social responsibility versus belated personal guilt",
    difficultyBand: "L4–L5 bridge",
    categories: ["Guilt", "Endings", "Memory"],
    mastery: 0.4,
  },
  {
    slug: "c2_truth_narrative_authority",
    axisTitle: "Who controls truth?",
    themeFamily: "Truth and Narrative Authority",
    ao4ComparisonType: "Moral exposure through confident narration versus epistemological uncertainty",
    difficultyBand: "L5 stretch",
    categories: ["Narrative voice"],
    mastery: 0.1,
  },
  {
    slug: "c4_women_agency",
    axisTitle: "Female agency under constraint",
    themeFamily: "Women and Agency",
    ao4ComparisonType: "Victorian emotional repression versus modern narrative agency",
    difficultyBand: "Core L4",
    categories: ["Female characters", "Marriage", "Independence"],
    mastery: 0.9,
  },
  {
    slug: "c1_family_emotional_formation",
    axisTitle: "The family as a site of damage or moral possibility",
    themeFamily: "Family and Emotional Formation",
    ao4ComparisonType: "Domestic moral education versus domestic complicity",
    difficultyBand: "Core L4",
    categories: ["Female characters"],
    mastery: 0.3,
  },
  {
    slug: "c6_industrialism_war",
    axisTitle: "Mechanised human suffering",
    themeFamily: "Industrialism and War",
    ao4ComparisonType: "Industrial mechanisation versus military mechanisation",
    difficultyBand: "L4–L5 bridge",
    categories: ["Settings", "Class"],
    mastery: 0.0,
  },
  {
    slug: "c2_power_voice",
    axisTitle: "Silencing and credibility",
    themeFamily: "Power and Voice",
    ao4ComparisonType: "Economic institutional silencing versus narrative-legal silencing",
    difficultyBand: "L4–L5 bridge",
    categories: ["Class", "Independence", "Narrative voice"],
    mastery: 0.5,
  },
  {
    slug: "c3_social_performance_identity",
    axisTitle: "Constructed selves and false roles",
    themeFamily: "Social Performance and Identity",
    ao4ComparisonType: "Public hypocrisy as fraud versus narrative self-fashioning as instability",
    difficultyBand: "Core L4",
    categories: ["Class"],
    mastery: 0.2,
  },
  {
    slug: "c7_moral_imagination",
    axisTitle: "Sympathy as a condition of judgement",
    themeFamily: "Moral Imagination",
    ao4ComparisonType: "Sympathy as moral cure versus imagination as ethical risk",
    difficultyBand: "L5 stretch",
    categories: ["Imagination", "Narrative voice", "Guilt"],
    mastery: 0.0,
  },
  {
    slug: "c8_structure_consequence",
    axisTitle: "How structure turns error into consequence",
    themeFamily: "Structure and Consequence",
    ao4ComparisonType: "Moral causality as harvest versus retrospective reconstruction as trauma",
    difficultyBand: "L5 stretch",
    categories: ["Narrative voice", "Memory", "Endings", "Settings"],
    mastery: 0.15,
  },
  {
    slug: "c3_setting_social_critique",
    axisTitle: "Places as moral systems",
    themeFamily: "Setting and Social Critique",
    ao4ComparisonType: "Industrial symbolic setting versus class-coded domestic and wartime setting",
    difficultyBand: "Core L4",
    categories: ["Settings", "Class"],
    mastery: 0.7,
  },
  {
    slug: "c5_law_justice_injustice",
    axisTitle: "Institutions and failed justice",
    themeFamily: "Law, Justice and Injustice",
    ao4ComparisonType: "Social-economic injustice versus legal-narrative injustice",
    difficultyBand: "L4–L5 bridge",
    categories: ["Guilt", "Class"],
    mastery: 0.0,
  },
  {
    slug: "c8_memory_retrospection",
    axisTitle: "Looking back as judgement",
    themeFamily: "Memory and Retrospection",
    ao4ComparisonType: "Clarifying retrospection versus unstable retrospection",
    difficultyBand: "L4–L5 bridge",
    categories: ["Memory", "Narrative voice", "Settings"],
    mastery: 0.35,
  },
  {
    slug: "c5_religion_morality_secular",
    axisTitle: "Moral frameworks after failure",
    themeFamily: "Religion, Morality and Secular Ethics",
    ao4ComparisonType: "Reformist moral order versus secular unresolved atonement",
    difficultyBand: "L4–L5 bridge",
    categories: ["Guilt"],
    mastery: 0.0,
  },
  {
    slug: "c6_work_duty_human_cost",
    axisTitle: "Labour as moral and physical burden",
    themeFamily: "Work, Duty and Human Cost",
    ao4ComparisonType: "Industrial exploitation versus wartime and narrative duty",
    difficultyBand: "Core L4",
    categories: ["Class", "Guilt"],
    mastery: 0.0,
  },
  {
    slug: "c4_desire_sexuality_misreading",
    axisTitle: "Sexual knowledge and social panic",
    themeFamily: "Desire, Sexuality and Misreading",
    ao4ComparisonType: "Marital repression versus catastrophic sexual misinterpretation",
    difficultyBand: "L4–L5 bridge",
    categories: ["Marriage", "Female characters"],
    mastery: 0.45,
  },
  {
    slug: "c5_endings_resolution",
    axisTitle: "Closure and its discontents",
    themeFamily: "Endings and Resolution",
    ao4ComparisonType: "Moral closure as judgement versus exposed fictional consolation",
    difficultyBand: "L5 stretch",
    categories: ["Endings", "Guilt", "Memory"],
    mastery: 0.55,
  },
];

const BAND_CONFIG = {
  "Core L4":     { bg: "#EDE8E1", text: "#5C544D", dot: "#9A918A" },
  "L4–L5 bridge":{ bg: "#FBF0E8", text: "#A03722", dot: "#A03722" },
  "L5 stretch":  { bg: "#FDF6E8", text: "#8A5F18", dot: "#B17A2D" },
};

/* ─── Mastery ring ───────────────────────────────────────────────────────── */
function MasteryRing({ value }) {
  const r = 7, c = 9, stroke = 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * value;
  const warm = value > 0.7 ? "#3D5A3A" : value > 0.4 ? "#B17A2D" : value > 0 ? "#A03722" : "#E8E3DB";
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#E8E3DB" strokeWidth={stroke} />
      {value > 0 && (
        <circle cx={c} cy={c} r={r} fill="none" stroke={warm} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
      )}
    </svg>
  );
}

/* ─── Axis card ──────────────────────────────────────────────────────────── */
function AxisCard({ axis, index, isSelected, onClick }) {
  const band = BAND_CONFIG[axis.difficultyBand] ?? BAND_CONFIG["Core L4"];
  const masteryPct = Math.round(axis.mastery * 100);

  return (
    <button
      onClick={onClick}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-card)",
        borderRadius: "var(--radius-md)",
        boxShadow: isSelected ? "var(--shadow-hover)" : "var(--shadow-card)",
        border: isSelected ? "1.5px solid var(--ht-brick)" : "1.5px solid transparent",
        overflow: "hidden",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease",
        transform: isSelected ? "translateY(-2px)" : "none",
        animation: `fadeUp 0.4s ease both`,
        animationDelay: `${index * 35}ms`,
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = "var(--shadow-hover)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = "var(--shadow-card)";
          e.currentTarget.style.transform = "none";
        }
      }}
    >
      {/* ── Dual-palette split bar ── */}
      <div style={{ display: "flex", height: "3px", flexShrink: 0 }}>
        <div style={{ flex: 1, background: "var(--ht-brick)" }} />
        <div style={{ flex: 1, background: "var(--at-fountain)" }} />
      </div>

      {/* ── Card body ── */}
      <div style={{ padding: "16px 18px 14px", flexGrow: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        {/* theme family */}
        <span style={{
          fontFamily: "'Roboto Flex', sans-serif",
          fontSize: "0.7rem",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          lineHeight: 1,
        }}>
          {axis.themeFamily}
        </span>

        {/* axis title */}
        <h3 style={{
          fontFamily: "'Roboto Serif', serif",
          fontSize: "1rem",
          fontWeight: 600,
          lineHeight: 1.3,
          color: "var(--text-primary)",
          marginTop: "2px",
        }}>
          {axis.axisTitle}
        </h3>

        {/* comparative divergence */}
        <p style={{
          fontFamily: "'Roboto Serif', serif",
          fontSize: "0.8rem",
          fontStyle: "italic",
          fontWeight: 300,
          color: "var(--text-secondary)",
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          marginTop: "2px",
        }}>
          {axis.ao4ComparisonType}
        </p>

        {/* ── Footer row ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
          paddingTop: "12px",
        }}>
          {/* mastery */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <MasteryRing value={axis.mastery} />
            <span style={{
              fontFamily: "'Roboto Flex', sans-serif",
              fontSize: "0.7rem",
              color: "var(--text-tertiary)",
              fontWeight: 400,
            }}>
              {masteryPct > 0 ? `${masteryPct}% mastered` : "Not started"}
            </span>
          </div>

          {/* difficulty band pill */}
          <span style={{
            fontFamily: "'Roboto Flex', sans-serif",
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            padding: "3px 8px",
            borderRadius: "100px",
            background: band.bg,
            color: band.text,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            whiteSpace: "nowrap",
          }}>
            <span style={{
              width: "5px", height: "5px",
              borderRadius: "50%",
              background: band.dot,
              display: "inline-block",
              flexShrink: 0,
            }} />
            {axis.difficultyBand}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ─── Filter chip ────────────────────────────────────────────────────────── */
function FilterChip({ label, isActive, onClick, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "6px 14px",
        borderRadius: "100px",
        fontSize: "0.8rem",
        fontFamily: "'Roboto Flex', sans-serif",
        fontWeight: isActive ? 600 : 400,
        letterSpacing: isActive ? "0.01em" : "0",
        background: isActive ? "var(--chip-active-bg)" : "transparent",
        color: isActive ? "var(--chip-active-text)" : "var(--text-secondary)",
        border: isActive ? "1.5px solid var(--chip-active-bg)" : "1.5px solid var(--border)",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {label}
      {count !== undefined && label !== "All" && (
        <span style={{
          fontSize: "0.65rem",
          opacity: isActive ? 0.65 : 0.5,
          fontWeight: 400,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function AxisLibrary() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedSlug, setSelectedSlug] = useState(null);

  const filtered = activeFilter === "All"
    ? AXES
    : AXES.filter(a => a.categories.includes(activeFilter));

  const filterCount = (f) => AXES.filter(a => a.categories.includes(f)).length;

  return (
    <>
      <style>{tokens}</style>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .filter-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .filter-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="grain-bg" style={{ minHeight: "100vh", background: "var(--surface)", position: "relative" }}>

        {/* ── Top header ── */}
        <header style={{
          background: "var(--ht-soot)",
          padding: "0 20px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}>
          {/* Dual-palette accent strip */}
          <div style={{ display: "flex", height: "2px" }}>
            <div style={{ flex: 1, background: "var(--ht-brick)", opacity: 0.8 }} />
            <div style={{ flex: 1, background: "var(--at-fountain)", opacity: 0.8 }} />
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 0",
            animation: "slideDown 0.3s ease",
          }}>
            <div>
              <div style={{
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "0.65rem",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(247,244,238,0.45)",
                marginBottom: "2px",
              }}>
                Edexcel 9ET0/02 · Component 2: Prose
              </div>
              <h1 style={{
                fontFamily: "'Roboto Serif', serif",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#F7F4EE",
                letterSpacing: "-0.01em",
              }}>
                Childhood
              </h1>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
              <span style={{
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "1.5rem",
                fontWeight: 300,
                color: "rgba(247,244,238,0.9)",
                lineHeight: 1,
              }}>
                {filtered.length}
              </span>
              <span style={{
                fontFamily: "'Roboto Flex', sans-serif",
                fontSize: "0.65rem",
                fontWeight: 400,
                color: "rgba(247,244,238,0.4)",
                letterSpacing: "0.05em",
              }}>
                {filtered.length === 1 ? "axis" : "axes"}
              </span>
            </div>
          </div>
        </header>

        {/* ── Filter chips ── */}
        <div style={{
          position: "sticky",
          top: "69px",
          zIndex: 90,
          background: "rgba(247,244,238,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}>
          <div
            className="filter-scroll"
            style={{
              overflowX: "auto",
              display: "flex",
              gap: "6px",
              padding: "10px 20px",
              alignItems: "center",
            }}
          >
            {FILTERS.map(f => (
              <FilterChip
                key={f}
                label={f}
                isActive={activeFilter === f}
                count={filterCount(f)}
                onClick={() => {
                  setActiveFilter(f);
                  setSelectedSlug(null);
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Active filter label ── */}
        {activeFilter !== "All" && (
          <div style={{
            padding: "16px 20px 4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "fadeUp 0.2s ease",
          }}>
            <div style={{ width: "20px", height: "1.5px", background: "var(--border)" }} />
            <span style={{
              fontFamily: "'Roboto Flex', sans-serif",
              fontSize: "0.72rem",
              fontWeight: 400,
              color: "var(--text-tertiary)",
              letterSpacing: "0.04em",
            }}>
              Showing axes relevant to{" "}
              <strong style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                {activeFilter.toLowerCase()}
              </strong>{" "}
              questions
            </span>
          </div>
        )}

        {/* ── Card grid ── */}
        <main style={{ padding: "16px 20px 40px" }}>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "var(--text-tertiary)",
              fontFamily: "'Roboto Serif', serif",
              fontStyle: "italic",
            }}>
              No axes match this filter.
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
              gap: "12px",
            }}>
              {filtered.map((axis, i) => (
                <AxisCard
                  key={axis.slug}
                  axis={axis}
                  index={i}
                  isSelected={selectedSlug === axis.slug}
                  onClick={() => setSelectedSlug(
                    selectedSlug === axis.slug ? null : axis.slug
                  )}
                />
              ))}
            </div>
          )}
        </main>

        {/* ── Selected axis tray ── */}
        {selectedSlug && (() => {
          const ax = AXES.find(a => a.slug === selectedSlug);
          if (!ax) return null;
          const band = BAND_CONFIG[ax.difficultyBand] ?? BAND_CONFIG["Core L4"];
          return (
            <div style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "var(--surface-card)",
              borderTop: "1.5px solid var(--border)",
              boxShadow: "0 -4px 24px rgba(26,23,21,0.12)",
              zIndex: 200,
              animation: "slideUp 0.25s ease",
              borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
            }}>
              <style>{`
                @keyframes slideUp {
                  from { transform: translateY(100%); }
                  to   { transform: translateY(0); }
                }
              `}</style>
              <div style={{ padding: "0 20px 32px" }}>
                {/* drag pill */}
                <div style={{
                  width: "36px", height: "4px",
                  borderRadius: "2px",
                  background: "var(--border)",
                  margin: "12px auto 16px",
                }} />

                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "'Roboto Flex', sans-serif",
                      fontSize: "0.65rem",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--text-tertiary)",
                      marginBottom: "4px",
                    }}>
                      {ax.themeFamily}
                    </div>
                    <h2 style={{
                      fontFamily: "'Roboto Serif', serif",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      lineHeight: 1.3,
                    }}>
                      {ax.axisTitle}
                    </h2>
                  </div>
                  <span style={{
                    fontSize: "0.65rem",
                    fontFamily: "'Roboto Flex', sans-serif",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "100px",
                    background: band.bg,
                    color: band.text,
                    whiteSpace: "nowrap",
                    marginTop: "2px",
                    flexShrink: 0,
                  }}>
                    {ax.difficultyBand}
                  </span>
                </div>

                {/* Comparative divergence */}
                <p style={{
                  fontFamily: "'Roboto Serif', serif",
                  fontSize: "0.85rem",
                  fontStyle: "italic",
                  fontWeight: 300,
                  color: "var(--text-secondary)",
                  lineHeight: 1.55,
                  paddingTop: "8px",
                  borderTop: "1px solid var(--border)",
                  marginBottom: "16px",
                }}>
                  {ax.ao4ComparisonType}
                </p>

                {/* CTA */}
                <button
                  onClick={() => alert(`Navigate to /themes/${ax.slug}`)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "13px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--ht-soot)",
                    color: "#F7F4EE",
                    fontFamily: "'Roboto Flex', sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    transition: "opacity 0.15s ease",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  Open axis detail
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
