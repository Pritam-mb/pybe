import React, { useState, useCallback } from "react";
import { TREE, TREE_LAYOUT } from "../../data/bfsDfsData.js";

/**
 * TreeExplorer
 * Interactive clickable tree for free exploration.
 * Tracks: visited nodes, current node, discovered apples, path taken.
 *
 * Props:
 *   onDone: (stats) => void  — called when learner decides they're done
 *   highlight: string[]       — if set, highlight these nodes (for replay)
 *   mode: "free"|"dfs"|"bfs" — controls interactivity
 *   autoOrder: string[]       — for dfs/bfs mode: nodes visited in order
 */
export default function TreeExplorer({ onDone, highlight, mode = "free", autoOrder, currentAutoIdx = -1 }) {
  const [visited, setVisited] = useState(new Set(["start"]));
  const [current, setCurrent] = useState("start");
  const [applesFound, setApplesFound] = useState(new Set());
  const [path, setPath] = useState(["start"]);

  const nodeMap = Object.fromEntries(TREE.nodes.map((n) => [n.id, n]));

  // Check if a node is reachable from current
  const neighbors = (id) => TREE.edges
    .filter(([a, b]) => a === id || b === id)
    .map(([a, b]) => a === id ? b : a);

  const canVisit = (id) => mode === "free" && (neighbors(current).includes(id) || visited.has(id));

  const handleNodeClick = useCallback((nodeId) => {
    if (mode !== "free") return;
    if (nodeId === current) return;
    if (!canVisit(nodeId)) return;

    setCurrent(nodeId);
    setVisited((v) => new Set([...v, nodeId]));
    setPath((p) => [...p, nodeId]);

    const node = nodeMap[nodeId];
    if (node?.hasApple && !applesFound.has(nodeId)) {
      setApplesFound((a) => new Set([...a, nodeId]));
    }
  }, [current, visited, mode, applesFound]);

  const reset = () => {
    setVisited(new Set(["start"]));
    setCurrent("start");
    setApplesFound(new Set());
    setPath(["start"]);
  };

  // Determine display state per node
  const getNodeState = (node) => {
    if (autoOrder) {
      // Replay mode
      const idx = autoOrder.indexOf(node.id);
      if (idx === currentAutoIdx) return "current";
      if (idx < currentAutoIdx && idx !== -1) return "visited";
      return "default";
    }
    if (highlight?.includes(node.id)) return "highlighted";
    if (node.id === current) return "current";
    if (applesFound.has(node.id)) return "found-apple";
    if (visited.has(node.id)) return "visited";
    return "default";
  };

  const W = 100; // SVG viewBox width in percent units
  const nodeR = 5; // radius in viewBox units

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Stats bar */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ padding: "8px 14px", borderRadius: "var(--r-sm)", background: "var(--surface)", border: "1px solid var(--border)", fontSize: 13 }}>
          <span style={{ color: "var(--muted)" }}>Visited: </span>
          <strong style={{ color: "var(--indigo)" }}>{autoOrder ? currentAutoIdx + 1 : visited.size}</strong> / {TREE.nodes.length}
        </div>
        <div style={{ padding: "8px 14px", borderRadius: "var(--r-sm)", background: "var(--surface)", border: "1px solid var(--border)", fontSize: 13 }}>
          <span style={{ color: "var(--muted)" }}>Apples found: </span>
          <strong style={{ color: "var(--emerald)" }}>
            {autoOrder
              ? TREE.nodes.filter((n) => n.hasApple && autoOrder.indexOf(n.id) <= currentAutoIdx).length
              : applesFound.size
            } / {TREE.appleNodes.length}
          </strong>
        </div>
        {mode === "free" && (
          <div style={{ padding: "8px 14px", borderRadius: "var(--r-sm)", background: "var(--surface)", border: "1px solid var(--border)", fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>Current: </span>
            <strong style={{ fontFamily: "var(--mono)" }}>{current}</strong>
          </div>
        )}
      </div>

      {/* SVG Tree */}
      <div style={{
        background: "rgba(255,255,255,0.9)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border)",
        padding: "16px",
        boxShadow: "var(--shadow-sm)",
        position: "relative",
      }}>
        <svg
          viewBox="0 0 100 90"
          style={{ width: "100%", height: "auto", overflow: "visible" }}
        >
          {/* Edges */}
          {TREE.edges.map(([a, b]) => {
            const la = TREE_LAYOUT[a], lb = TREE_LAYOUT[b];
            if (!la || !lb) return null;

            const aIdx = autoOrder?.indexOf(a) ?? -2;
            const bIdx = autoOrder?.indexOf(b) ?? -2;
            const bothVisited = autoOrder
              ? aIdx <= currentAutoIdx && bIdx <= currentAutoIdx
              : visited.has(a) && visited.has(b);

            return (
              <line
                key={`${a}-${b}`}
                x1={la.x} y1={la.y}
                x2={lb.x} y2={lb.y}
                stroke={bothVisited ? "var(--indigo)" : "var(--border-strong)"}
                strokeWidth={bothVisited ? "0.8" : "0.5"}
                strokeOpacity={bothVisited ? 1 : 0.5}
                style={{ transition: "all 0.3s ease" }}
              />
            );
          })}

          {/* Nodes */}
          {TREE.nodes.map((node) => {
            const pos = TREE_LAYOUT[node.id];
            if (!pos) return null;
            const state = getNodeState(node);
            const isClickable = mode === "free" && canVisit(node.id) && node.id !== current;

            const fillColor = state === "current" ? "var(--indigo)"
              : state === "found-apple" ? "#34c759"
              : state === "visited" ? "rgba(88,86,214,0.15)"
              : state === "highlighted" ? "#ff9500"
              : "white";

            const strokeColor = state === "current" ? "var(--indigo)"
              : state === "found-apple" ? "#34c759"
              : state === "visited" ? "var(--indigo)"
              : state === "highlighted" ? "#ff9500"
              : "var(--border-strong)";

            return (
              <g
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                style={{ cursor: isClickable ? "pointer" : "default" }}
              >
                {/* Hover ring for clickable nodes */}
                {isClickable && (
                  <circle cx={pos.x} cy={pos.y} r={nodeR + 2} fill="rgba(88,86,214,0.08)" />
                )}

                <circle
                  cx={pos.x} cy={pos.y} r={nodeR}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={state === "current" ? 1 : 0.7}
                  style={{ transition: "all 0.25s ease" }}
                />

                {/* Label */}
                <text
                  x={pos.x} y={pos.y + 1.5}
                  textAnchor="middle"
                  fontSize="3.5"
                  fontFamily="var(--mono)"
                  fontWeight="700"
                  fill={state === "current" || state === "found-apple" ? "white" : state === "visited" ? "var(--indigo)" : "var(--text-2)"}
                >
                  {node.id === "start" ? "S" : node.id}
                </text>

                {/* Apple indicator */}
                {node.hasApple && (
                  <text x={pos.x + 4} y={pos.y - 3} fontSize="3.5">🍎</text>
                )}

                {/* Level labels for first column */}
                {node.id === "start" && (
                  <text x={2} y={pos.y + 1} fontSize="2.2" fill="var(--muted)">L0</text>
                )}
              </g>
            );
          })}

          {/* Level lines (subtle) */}
          {[0, 1, 2, 3].map((level) => {
            const y = level === 0 ? 8 : level === 1 ? 28 : level === 2 ? 52 : 76;
            return (
              <line key={level} x1={0} y1={y} x2={100} y2={y}
                stroke="var(--border)" strokeWidth="0.3" strokeDasharray="2 2" opacity="0.4" />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12 }}>
        {[
          { color: "var(--indigo)", label: "Current" },
          { color: "rgba(88,86,214,0.3)", label: "Visited" },
          { color: "#34c759", label: "Apple found" },
          { color: "var(--border-strong)", label: "Unvisited" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, border: `1.5px solid ${color}` }} />
            <span style={{ color: "var(--muted)" }}>{label}</span>
          </div>
        ))}
        <span style={{ color: "var(--muted)" }}>🍎 = Apple</span>
      </div>

      {/* Free mode actions */}
      {mode === "free" && (
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-sm" onClick={reset}>Reset</button>
          {onDone && (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => onDone({ visited: [...visited], path, applesFound: [...applesFound] })}
              disabled={applesFound.size < TREE.appleNodes.length}
            >
              {applesFound.size >= TREE.appleNodes.length
                ? "All apples found! Continue →"
                : `Find all apples (${applesFound.size}/${TREE.appleNodes.length})`
              }
            </button>
          )}
        </div>
      )}

      {/* Path taken */}
      {mode === "free" && path.length > 1 && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", padding: "8px 12px", borderRadius: "var(--r-sm)", background: "var(--bg-2)", fontSize: 12, fontFamily: "var(--mono)" }}>
          <span style={{ color: "var(--muted)" }}>Path:</span>
          {path.map((node, i) => (
            <React.Fragment key={i}>
              <span style={{ fontWeight: 600, color: "var(--text-2)" }}>{node}</span>
              {i < path.length - 1 && <span style={{ color: "var(--muted)" }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
