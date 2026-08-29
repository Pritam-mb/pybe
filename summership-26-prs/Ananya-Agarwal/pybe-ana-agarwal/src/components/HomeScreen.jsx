import React from "react";

const EXPERIENCES = [
  {
    id: "recursion",
    emoji: "🔁",
    title: "Recursion",
    subtitle: "Functions · Parameters · Call Stack · Base Case",
    description:
      "Start with a seating arrangement puzzle. Discover self-similarity, build the block structure, then watch the call stack grow and unwind as Python executes factorial.",
    color: "#5856d6",
    bg: "linear-gradient(135deg, rgba(88,86,214,0.08) 0%, rgba(88,86,214,0.03) 100%)",
    border: "rgba(88,86,214,0.2)",
    tag: "Functions & recursion",
    stages: 7,
    prereqs: ["variables", "lists", "loops"],
  },
  {
    id: "classes",
    emoji: "🏛️",
    title: "Classes & Objects",
    subtitle: "Class · Object · self · Inheritance · Polymorphism",
    description:
      "Build a game character system. Discover why a blueprint beats 20 separate variables. Animate self, step through __init__, and build a parent–child class hierarchy.",
    color: "#007aff",
    bg: "linear-gradient(135deg, rgba(0,122,255,0.08) 0%, rgba(0,122,255,0.03) 100%)",
    border: "rgba(0,122,255,0.2)",
    tag: "Object-oriented design",
    stages: 8,
    prereqs: ["functions", "variables"],
  },
  {
    id: "bfsdfs",
    emoji: "🌲",
    title: "BFS vs DFS",
    subtitle: "Graph Traversal · Stack · Queue · Search Strategies",
    description:
      "Catch apples in an interactive tree. Discover your own search strategy, formalise it as DFS or BFS, then run both on the same tree side-by-side.",
    color: "#34c759",
    bg: "linear-gradient(135deg, rgba(52,199,89,0.08) 0%, rgba(52,199,89,0.03) 100%)",
    border: "rgba(52,199,89,0.2)",
    tag: "Algorithms & data structures",
    stages: 9,
    prereqs: ["lists", "loops"],
  },
];

export default function HomeScreen({ onSelect }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Hero */}
      <div style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "var(--blur)",
        WebkitBackdropFilter: "var(--blur)",
        borderBottom: "1px solid var(--border)",
        padding: "64px 32px 52px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 18px",
          borderRadius: 100,
          background: "rgba(88,86,214,0.09)",
          border: "1px solid rgba(88,86,214,0.2)",
          marginBottom: 24,
          fontSize: 13,
          fontWeight: 600,
          color: "var(--indigo)",
          letterSpacing: "0.04em",
        }}>
          <span>🐍</span> PYBE — Simulation-First Python Learning
        </div>

        <h1 style={{
          fontSize: "clamp(32px, 5vw, 56px)",
          fontWeight: 800,
          color: "var(--text)",
          letterSpacing: "-1.5px",
          lineHeight: 1.1,
          margin: "0 0 16px",
        }}>
          Discover first.<br />
          <span style={{
            background: "linear-gradient(135deg, #5856d6 0%, #007aff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>Then code.</span>
        </h1>

        <p style={{
          fontSize: "clamp(15px, 2vw, 18px)",
          color: "var(--text-3)",
          lineHeight: 1.7,
          maxWidth: 560,
          margin: "0 auto 32px",
        }}>
          PyBe teaches programming through problem-solving, reasoning, and synchronized code execution.
          Every concept begins with a real situation — not a definition.
        </p>

        {/* Philosophy pills */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
          {["Scenario first", "No wrong answers", "Predict before reveal", "Concept after reasoning", "Code last"].map((p) => (
            <div key={p} style={{
              padding: "5px 14px",
              borderRadius: 100,
              background: "var(--surface)",
              border: "1px solid var(--border-2)",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-2)",
              boxShadow: "var(--shadow-sm)",
            }}>
              {p}
            </div>
          ))}
        </div>

        {/* Coder Mode CTA */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button 
            className="coder-btn-highlight pulse-glow"
            onClick={() => onSelect("coder")}
            style={{
              fontSize: 16,
              fontWeight: 600,
              padding: "14px 32px",
              borderRadius: 100,
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              border: "1.5px solid rgba(88,86,214,0.35)",
              background: "rgba(88,86,214,0.06)",
              color: "var(--indigo)",
              transition: "transform 0.2s ease",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <span style={{ fontSize: 22 }}>⌨️</span> Try Coder Mode
          </button>
        </div>
      </div>

      {/* Experiences */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 32px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 8 }}>
            Three starter experiences
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px", margin: 0 }}>
            Choose where to begin
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {EXPERIENCES.map((exp, idx) => (
            <ExperienceCard key={exp.id} exp={exp} index={idx} onSelect={() => onSelect(exp.id)} />
          ))}
        </div>

        {/* Learning philosophy */}
        <div style={{
          marginTop: 56,
          padding: "28px 32px",
          borderRadius: "var(--r-xl)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-3)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            The PyBe learning loop
          </div>
          <div style={{ display: "flex", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
            {[
              { step: "Scenario", icon: "📖", desc: "A real situation" },
              { step: "Question", icon: "❓", desc: "What would you do?" },
              { step: "Reasoning", icon: "🔀", desc: "All paths explored" },
              { step: "Concept", icon: "💡", desc: "Named after discovery" },
              { step: "Predict", icon: "🎯", desc: "Tap before reveal" },
              { step: "Code", icon: "💻", desc: "Micro, annotated" },
              { step: "Execute", icon: "▶️", desc: "Live simulation" },
              { step: "Reflect", icon: "🌱", desc: "Transfer check" },
            ].map((item, i, arr) => (
              <div key={item.step} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ textAlign: "center", minWidth: 80 }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>{item.step}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{item.desc}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ margin: "0 4px", color: "var(--border-strong)", fontSize: 18, paddingBottom: 16 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExperienceCard({ exp, index, onSelect }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        gap: 28,
        padding: "28px 32px",
        borderRadius: "var(--r-xl)",
        border: `1.5px solid ${hovered ? exp.color + "50" : exp.border}`,
        background: hovered ? exp.bg : "var(--surface)",
        cursor: "pointer",
        transition: "all 0.28s cubic-bezier(0.25,0.46,0.45,0.94)",
        boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-sm)",
        transform: hovered ? "translateY(-2px)" : "none",
        alignItems: "center",
        animation: `fadeIn 420ms ${index * 80}ms both`,
      }}
    >
      {/* Icon */}
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 20,
        background: exp.bg,
        border: `1.5px solid ${exp.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 32,
        flexShrink: 0,
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hovered ? "scale(1.08) rotate(-3deg)" : "none",
      }}>
        {exp.emoji}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.3px" }}>
            {exp.title}
          </h3>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100,
            background: exp.bg, border: `1px solid ${exp.border}`, color: exp.color,
            letterSpacing: "0.03em",
          }}>
            {exp.tag}
          </span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 8, fontFamily: "var(--mono)" }}>
          {exp.subtitle}
        </div>
        <p style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>
          {exp.description}
        </p>
      </div>

      {/* Stages & prereqs */}
      <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: exp.color,
          background: exp.bg, border: `1px solid ${exp.border}`,
          padding: "4px 12px", borderRadius: 100,
        }}>
          {exp.stages} stages
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>assumes:</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {exp.prereqs.map((p) => (
              <span key={p} style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 100,
                background: "var(--bg-2)", color: "var(--text-3)", border: "1px solid var(--border-2)",
              }}>{p}</span>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div style={{
          width: 36, height: 36,
          borderRadius: "50%",
          background: exp.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: 16,
          transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          transform: hovered ? "scale(1.12) translateX(3px)" : "none",
          boxShadow: `0 4px 14px ${exp.color}40`,
        }}>
          →
        </div>
      </div>
    </div>
  );
}
