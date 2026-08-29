import React, { useState, useEffect } from "react";
import TreeExplorer from "./TreeExplorer.jsx";
import { DFS_ORDER, BFS_ORDER, TREE } from "../../data/bfsDfsData.js";

/**
 * TraversalViz
 * Step-through traversal with synchronized stack/queue and tree highlighting.
 *
 * Props:
 *   mode: "dfs"|"bfs"
 *   onComplete: () => void
 */
export default function TraversalViz({ mode = "dfs", onComplete }) {
  const order = mode === "dfs" ? DFS_ORDER : BFS_ORDER;
  const [stepIdx, setStepIdx] = useState(-1); // -1 = not started
  const [playing, setPlaying] = useState(false);
  const timerRef = React.useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    setStepIdx(-1);
    setPlaying(false);
    clearInterval(timerRef.current);
  }, [mode]);

  const play = () => {
    setPlaying(true);
    timerRef.current = setInterval(() => {
      setStepIdx((i) => {
        if (i >= order.length - 1) { clearInterval(timerRef.current); setPlaying(false); return i; }
        return i + 1;
      });
    }, 900);
  };
  const pause = () => { clearInterval(timerRef.current); setPlaying(false); };
  const next = () => { pause(); setStepIdx((i) => Math.min(i + 1, order.length - 1)); };
  const prev = () => { pause(); setStepIdx((i) => Math.max(-1, i - 1)); };
  const restart = () => { pause(); setStepIdx(-1); };

  // Compute queue/stack state at current step
  const adjacency = {};
  TREE.nodes.forEach((n) => { adjacency[n.id] = []; });
  TREE.edges.forEach(([a, b]) => {
    adjacency[a].push(b);
    adjacency[b].push(a);
  });

  // Simulate stack/queue up to stepIdx
  let dsState = [];
  let visitedSoFar = new Set();
  if (mode === "dfs") {
    // Stack simulation: we replay DFS up to stepIdx
    let stack = ["start"];
    let step = 0;
    while (stack.length > 0 && step <= stepIdx) {
      const node = stack[stack.length - 1]; // peek
      stack.pop();
      if (!visitedSoFar.has(node)) {
        visitedSoFar.add(node);
        const neighbors = adjacency[node] || [];
        // Push in reverse to maintain left-to-right order
        for (let i = neighbors.length - 1; i >= 0; i--) {
          if (!visitedSoFar.has(neighbors[i])) stack.push(neighbors[i]);
        }
      }
      step++;
      if (step > stepIdx) dsState = [...stack];
    }
    if (step <= stepIdx) dsState = [];
  } else {
    // Queue simulation
    let queue = ["start"];
    let step = 0;
    while (queue.length > 0 && step <= stepIdx) {
      const node = queue[0];
      queue = queue.slice(1);
      if (!visitedSoFar.has(node)) {
        visitedSoFar.add(node);
        const neighbors = adjacency[node] || [];
        neighbors.forEach((n) => { if (!visitedSoFar.has(n)) queue.push(n); });
      }
      step++;
      if (step > stepIdx) dsState = [...queue];
    }
    if (step <= stepIdx) dsState = [];
  }

  const currentNode = stepIdx >= 0 ? order[stepIdx] : null;
  const nodeData = TREE.nodes.find((n) => n.id === currentNode);
  const foundApple = currentNode && nodeData?.hasApple && !Array.from(visitedSoFar).slice(0, stepIdx).includes(currentNode);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header info */}
      <div style={{
        padding: "12px 16px",
        borderRadius: "var(--r)",
        background: mode === "dfs" ? "var(--indigo-light)" : "var(--emerald-light)",
        border: `1px solid ${mode === "dfs" ? "rgba(88,86,214,0.2)" : "rgba(52,199,89,0.2)"}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 14,
      }}>
        <span style={{ fontSize: 20 }}>{mode === "dfs" ? "📚" : "🌊"}</span>
        <div>
          <strong>{mode === "dfs" ? "Depth-First Search" : "Breadth-First Search"}</strong>
          {" — "}
          {mode === "dfs"
            ? "Uses a stack (LIFO). Goes deep before backtracking."
            : "Uses a queue (FIFO). Explores level by level."}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Tree */}
        <div>
          <TreeExplorer
            mode="replay"
            autoOrder={stepIdx >= 0 ? order : []}
            currentAutoIdx={stepIdx}
          />
        </div>

        {/* Data structure */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* DS panel */}
          <div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8,
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)",
            }}>
              <span>{mode === "dfs" ? "STACK" : "QUEUE"}</span>
              <span style={{ fontSize: 10 }}>
                {mode === "dfs" ? "↑ TOP (next to visit)" : "FRONT → (next to visit) → BACK"}
              </span>
            </div>

            <div style={{
              minHeight: 56, padding: "12px 16px",
              background: "var(--surface)", border: "1.5px solid var(--border-2)", borderRadius: "var(--r)",
              display: "flex",
              flexDirection: mode === "dfs" ? "column-reverse" : "row",
              gap: 6,
              alignItems: mode === "dfs" ? "flex-start" : "center",
              flexWrap: "wrap",
            }}>
              {dsState.length === 0 && stepIdx >= 0 ? (
                <span style={{ fontSize: 12.5, color: "var(--muted)" }}>— empty —</span>
              ) : stepIdx < 0 ? (
                <span style={{ fontSize: 12.5, color: "var(--muted)" }}>— start traversal —</span>
              ) : (
                dsState.map((item, i) => {
                  const isTop = mode === "dfs" ? i === dsState.length - 1 : i === 0;
                  return (
                    <div
                      key={`${item}-${i}`}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--r-sm)",
                        background: isTop ? "var(--indigo)" : "var(--indigo-light)",
                        border: `1.5px solid ${isTop ? "var(--indigo)" : "rgba(88,86,214,0.3)"}`,
                        fontFamily: "var(--mono)",
                        fontSize: 13,
                        fontWeight: 700,
                        color: isTop ? "white" : "var(--indigo)",
                        transition: "all 0.25s ease",
                        animation: "pop 280ms var(--spring) both",
                      }}
                    >
                      {item}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Current node detail */}
          {currentNode && (
            <div className="anim-fade" style={{
              padding: "14px 16px",
              borderRadius: "var(--r)",
              border: `1.5px solid ${foundApple ? "rgba(52,199,89,0.4)" : "rgba(88,86,214,0.2)"}`,
              background: foundApple ? "var(--emerald-light)" : "var(--indigo-light)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>
                Currently visiting
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 800, color: foundApple ? "#1a6b29" : "var(--indigo)" }}>
                {currentNode === "start" ? "START" : currentNode}
                {nodeData?.hasApple && " 🍎"}
              </div>
              {foundApple && (
                <div style={{ fontSize: 13, color: "#1a6b29", marginTop: 6 }}>
                  ✓ Apple found at node {currentNode}!
                </div>
              )}
            </div>
          )}

          {/* Visit order so far */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>
              Visit order
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {order.slice(0, Math.max(0, stepIdx + 1)).map((node, i) => {
                const n = TREE.nodes.find((x) => x.id === node);
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 3,
                    padding: "4px 8px", borderRadius: 100,
                    background: i === stepIdx ? "var(--indigo)" : "var(--bg-2)",
                    border: `1px solid ${i === stepIdx ? "var(--indigo)" : "var(--border-2)"}`,
                    fontFamily: "var(--mono)",
                    fontSize: 12, fontWeight: 600,
                    color: i === stepIdx ? "white" : "var(--text-2)",
                    transition: "all 0.2s ease",
                  }}>
                    <span style={{ opacity: 0.6, fontSize: 10 }}>{i + 1}.</span>
                    {node === "start" ? "S" : node}
                    {n?.hasApple && " 🍎"}
                  </div>
                );
              })}
              {stepIdx < 0 && <span style={{ fontSize: 12, color: "var(--muted)" }}>— press play —</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="exec-controls">
        <button className="btn btn-sm btn-icon" onClick={restart}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
          </svg>
        </button>
        <button className="btn btn-sm btn-icon" onClick={prev} disabled={stepIdx < 0}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" />
          </svg>
        </button>
        {playing ? (
          <button className="btn btn-sm btn-primary" onClick={pause}>⏸ Pause</button>
        ) : (
          <button className="btn btn-sm btn-primary" onClick={play} disabled={stepIdx >= order.length - 1}>▶ Play</button>
        )}
        <button className="btn btn-sm btn-icon" onClick={next} disabled={stepIdx >= order.length - 1}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>
        <div style={{ flex: 1, textAlign: "right", fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>
          {stepIdx + 1} / {order.length} nodes
        </div>
      </div>

      {stepIdx >= order.length - 1 && onComplete && (
        <div className="anim-fade" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, padding: "12px 16px", borderRadius: "var(--r)", background: "var(--emerald-light)", border: "1px solid rgba(52,199,89,0.3)", fontSize: 14, color: "#1a6b29", fontWeight: 600 }}>
            ✓ All {order.length} nodes visited. Traversal complete.
          </div>
          <button className="btn btn-primary" onClick={onComplete}>Continue →</button>
        </div>
      )}
    </div>
  );
}
