import React, { useState } from "react";

/**
 * InheritanceViz
 * Visual parent/child class hierarchy with method flow and override indicator
 */
export default function InheritanceViz({ onSelect }) {
  const [selected, setSelected] = useState(null);

  const nodes = {
    Character: {
      label: "Character",
      color: "var(--purple)",
      bg: "var(--purple-light)",
      border: "rgba(175,82,222,0.3)",
      methods: ["__init__()", "take_damage()", "status()", "move()"],
      desc: "Base class — defines what every character has and can do. All methods here are available to every subclass.",
      x: 50, y: 8,
    },
    Player: {
      label: "Player",
      color: "var(--sky)",
      bg: "var(--sky-light)",
      border: "rgba(0,122,255,0.3)",
      methods: ["heal()", "(inherits: __init__, take_damage, status, move)"],
      ownMethods: ["heal()"],
      desc: "Child of Character. Inherits all Character methods automatically. Adds heal() which is only available to Player objects.",
      parent: "Character",
      x: 25, y: 52,
    },
    Enemy: {
      label: "Enemy",
      color: "var(--rose)",
      bg: "var(--rose-light)",
      border: "rgba(255,59,48,0.3)",
      methods: ["__init__(name, health, strength)", "attack()", "(inherits: take_damage, status, move)"],
      ownMethods: ["__init__()", "attack()"],
      overrides: ["__init__"],
      desc: "Child of Character. Overrides __init__ to add 'strength'. Adds attack(). Both children share take_damage and status from Character.",
      parent: "Character",
      x: 75, y: 52,
    },
  };

  const W = 100, H = 80; // SVG viewBox units
  const nodeW = 28, nodeH = 12;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "3/1.4" }}>
        <svg viewBox="0 0 100 46" style={{ width: "100%", height: "100%", overflow: "visible" }}>
          {/* Edges */}
          {[["Character", "Player"], ["Character", "Enemy"]].map(([from, to]) => {
            const f = nodes[from], t = nodes[to];
            return (
              <line
                key={`${from}-${to}`}
                x1={f.x} y1={f.y + 7}
                x2={t.x} y2={t.y - 1}
                stroke="var(--border-strong)" strokeWidth="0.5"
                strokeDasharray="2 1"
              />
            );
          })}

          {/* Nodes */}
          {Object.entries(nodes).map(([key, n]) => (
            <g
              key={key}
              onClick={() => setSelected(selected === key ? null : key)}
              style={{ cursor: "pointer" }}
              transform={`translate(${n.x - nodeW / 2}, ${n.y})`}
            >
              <rect
                width={nodeW} height={nodeH}
                rx="2" ry="2"
                fill={selected === key ? n.bg : "rgba(255,255,255,0.9)"}
                stroke={selected === key ? n.color : "var(--border-2)"}
                strokeWidth={selected === key ? "0.6" : "0.4"}
              />
              <text
                x={nodeW / 2} y={nodeH / 2 + 1.5}
                textAnchor="middle"
                fontSize="3.5"
                fontFamily="var(--mono)"
                fontWeight="700"
                fill={n.color}
              >
                {n.label}
              </text>
              {n.parent && (
                <text x={nodeW / 2} y={nodeH / 2 + 5.5} textAnchor="middle" fontSize="2.2" fill="var(--muted)" fontFamily="var(--mono)">
                  : {n.parent}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Detail panel */}
      {selected ? (
        <div className="anim-fade" style={{
          padding: "18px 22px",
          borderRadius: "var(--r-lg)",
          border: `1.5px solid ${nodes[selected].border}`,
          background: nodes[selected].bg,
        }}>
          <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 15, color: nodes[selected].color, marginBottom: 8 }}>
            {selected}
            {nodes[selected].parent && (
              <span style={{ fontSize: 12, fontWeight: 400, color: "var(--muted)", marginLeft: 8 }}>({nodes[selected].parent} subclass)</span>
            )}
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-2)", marginBottom: 14 }}>
            {nodes[selected].desc}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {nodes[selected].methods.map((m) => {
              const isOwn = nodes[selected].ownMethods?.some((o) => m.startsWith(o.replace("()", "")));
              const isOverride = nodes[selected].overrides?.some((o) => m.startsWith(o));
              const isInherited = m.startsWith("(inherits:");
              return (
                <span key={m} style={{
                  padding: "4px 10px", borderRadius: 100, fontSize: 12, fontFamily: "var(--mono)",
                  fontWeight: 600,
                  background: isInherited ? "rgba(0,0,0,0.05)"
                    : isOverride ? "var(--amber-light)"
                    : isOwn ? nodes[selected].bg
                    : "var(--bg-2)",
                  border: `1px solid ${isInherited ? "var(--border-2)"
                    : isOverride ? "rgba(255,149,0,0.3)"
                    : isOwn ? nodes[selected].border
                    : "var(--border-2)"}`,
                  color: isInherited ? "var(--muted)"
                    : isOverride ? "#7a3d00"
                    : isOwn ? nodes[selected].color
                    : "var(--text-3)",
                  fontStyle: isInherited ? "italic" : "normal",
                }}>
                  {m}
                  {isOverride && " ✏️"}
                  {isOwn && !isOverride && " ✦"}
                </span>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 11, color: "var(--muted)" }}>
            <span>✦ Own method</span>
            <span>✏️ Overrides parent</span>
            <span style={{ fontStyle: "italic" }}>Italic = inherited</span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "10px" }}>
          Click a class node to explore its methods
        </div>
      )}
    </div>
  );
}
