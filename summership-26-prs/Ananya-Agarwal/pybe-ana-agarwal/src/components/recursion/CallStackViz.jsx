import React, { useRef, useEffect } from "react";
import { FrameBlock, OutputPanel } from "../shared/VisualBlock.jsx";

/**
 * CallStackViz
 * Renders the call stack from interpreter execution state.
 *
 * Props:
 *   step: { stack: [{name, line, vars}], output: [], event, desc }
 *   prevStep: same shape (to detect frame changes for animation)
 */
export default function CallStackViz({ step, prevStep }) {
  if (!step) return null;

  const { stack = [], output = [], event, desc } = step;
  const prevStack = prevStep?.stack || [];

  // Determine if a new frame was just pushed
  const newFrameName = stack.length > prevStack.length
    ? stack[stack.length - 1]?.name
    : null;

  // The active frame is the innermost (last in array)
  const activeIdx = stack.length - 1;

  // Detect returning
  const isReturning = event === "return";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.07em", color: "var(--muted)",
        }}>
          Call Stack
        </span>
        <span style={{
          fontSize: 11, color: "var(--text-3)",
          fontFamily: "var(--mono)",
        }}>
          {stack.length} frame{stack.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Stack frames — rendered bottom to top visually */}
      {stack.length === 0 ? (
        <div style={{
          padding: "20px",
          textAlign: "center",
          color: "var(--muted)",
          fontSize: 13,
          borderRadius: "var(--r)",
          border: "1px dashed var(--border-2)",
        }}>
          — no active function calls —
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Top label */}
          <div style={{
            fontSize: 10, color: "var(--muted)", textAlign: "center",
            letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2,
          }}>
            ↑ innermost (active)
          </div>

          {/* Render innermost first (top of stack visually = last in array) */}
          {[...stack].reverse().map((frame, idx) => {
            const originalIdx = stack.length - 1 - idx;
            const isActive = originalIdx === activeIdx;
            const isNew = newFrameName === frame.name && idx === 0;
            const isRet = isReturning && isActive;

            return (
              <div
                key={`${frame.name}-${originalIdx}`}
                className={`stack-frame${isActive ? " active" : ""}${isNew ? " new" : ""}${isRet ? " returning" : ""}`}
              >
                <div className="stack-frame-header">
                  <span>{frame.name}()</span>
                  {isActive && (
                    <span style={{
                      fontSize: 10, background: isRet ? "var(--emerald-light)" : "var(--indigo-light)",
                      color: isRet ? "#1a6b29" : "var(--indigo)",
                      padding: "2px 8px", borderRadius: 100, fontWeight: 500,
                    }}>
                      {isRet ? "returning ↑" : "executing"}
                    </span>
                  )}
                  <span style={{ color: "var(--muted)", fontSize: 10, fontWeight: 400 }}>
                    def at line {frame.line}
                  </span>
                </div>
                <div className="stack-frame-body">
                  {Object.entries(frame.vars || {}).filter(([k]) => k !== "self").length === 0 ? (
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>— no locals yet —</span>
                  ) : (
                    Object.entries(frame.vars || {})
                      .filter(([k]) => k !== "self")
                      .map(([k, v]) => {
                        const isN = k === "n";
                        const strVal = v
                          ? (v.type === "function" ? `<fn>` : String(v.value))
                          : "None";
                        const color = isN ? "var(--indigo)" : "var(--text)";
                        return (
                          <div key={k} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "3px 0",
                            borderBottom: "1px solid rgba(0,0,0,0.03)",
                          }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--text-3)", minWidth: 60 }}>{k}</span>
                            <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--bg-2)", padding: "1px 5px", borderRadius: 4 }}>
                              {v?.type || "?"}
                            </span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color }}>{strVal}</span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            );
          })}

          {/* Bottom label */}
          <div style={{
            fontSize: 10, color: "var(--muted)", textAlign: "center",
            letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2,
          }}>
            ↓ bottom (global)
          </div>
        </div>
      )}

      {/* Return value highlight */}
      {isReturning && (
        <div
          className="anim-pop"
          style={{
            padding: "10px 14px",
            borderRadius: "var(--r-sm)",
            background: "var(--emerald-light)",
            border: "1.5px solid rgba(52,199,89,0.35)",
            fontSize: 13,
            fontFamily: "var(--mono)",
            fontWeight: 600,
            color: "#1a6b29",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>↑</span>
          <span>{desc}</span>
        </div>
      )}

      {/* Output */}
      {output.length > 0 && (
        <OutputPanel output={output} />
      )}
    </div>
  );
}
