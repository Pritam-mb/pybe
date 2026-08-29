import React, { useState } from "react";

/**
 * LineIdentify — tap-to-identify code interaction
 *
 * Props:
 *   code: string              — the code to display
 *   targets: Array<{
 *     lineNum: number,        — 1-indexed line number
 *     role: "base-case" | "recursive",
 *     promptText: string,     — prompt shown before this target
 *     correctHint: string,    — shown when correct line tapped
 *   }>
 *   onComplete: () => void    — called when all targets identified
 */

const ROLE_COLORS = {
  "base-case": { bg: "rgba(52,199,89,0.12)", border: "#34c759", label: "Base case", icon: "✓" },
  recursive:   { bg: "rgba(88,86,214,0.12)", border: "#5856d6", label: "Recursive case", icon: "↩" },
};

const WRONG_COLOR = { bg: "rgba(255,59,48,0.08)", border: "#ff3b30" };

export default function LineIdentify({ code, targets = [], onComplete }) {
  const [targetIdx, setTargetIdx] = useState(0);           // which target we're asking about
  const [tappedLine, setTappedLine] = useState(null);      // line number just tapped
  const [tappedState, setTappedState] = useState(null);    // "correct" | "incorrect"
  const [identified, setIdentified] = useState({});        // { lineNum: role }
  const [complete, setComplete] = useState(false);

  const currentTarget = targets[targetIdx];
  const lines = code.split("\n");

  const handleLineTap = (lineNum) => {
    if (complete) return;
    if (identified[lineNum]) return; // already confirmed

    setTappedLine(lineNum);

    if (lineNum === currentTarget.lineNum) {
      setTappedState("correct");
      setTimeout(() => {
        const newIdentified = { ...identified, [lineNum]: currentTarget.role };
        setIdentified(newIdentified);
        setTappedLine(null);
        setTappedState(null);

        if (targetIdx + 1 >= targets.length) {
          setComplete(true);
        } else {
          setTargetIdx(targetIdx + 1);
        }
      }, 1100);
    } else {
      setTappedState("incorrect");
      setTimeout(() => {
        setTappedLine(null);
        setTappedState(null);
      }, 900);
    }
  };

  const getLineStyle = (lineNum1Idx) => {
    const lineNum = lineNum1Idx + 1;
    const role = identified[lineNum];
    const isTapped = tappedLine === lineNum;

    if (role) {
      const c = ROLE_COLORS[role];
      return { background: c.bg, borderLeft: `3px solid ${c.border}` };
    }
    if (isTapped && tappedState === "correct") {
      return { background: "rgba(52,199,89,0.18)", borderLeft: "3px solid #34c759" };
    }
    if (isTapped && tappedState === "incorrect") {
      return { background: WRONG_COLOR.bg, borderLeft: `3px solid ${WRONG_COLOR.border}` };
    }
    return { borderLeft: "3px solid transparent" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Prompt */}
      {!complete && currentTarget && (
        <div className="identify-prompt anim-fade" key={targetIdx}>
          <span className="identify-prompt-icon">🎯</span>
          <span>{currentTarget.promptText}</span>
        </div>
      )}

      {/* Tap feedback */}
      {tappedState && tappedLine && (
        <div
          className={`identify-feedback anim-pop ${tappedState}`}
          key={`${tappedLine}-${tappedState}`}
        >
          {tappedState === "correct"
            ? `✓ ${currentTarget.correctHint}`
            : "Not quite — look for the line that matches the prompt above."}
        </div>
      )}

      {/* Code display */}
      <div className="code-panel" style={{ overflow: "hidden" }}>
        {lines.map((line, i) => {
          const lineNum = i + 1;
          const role = identified[lineNum];
          const style = getLineStyle(i);
          const isClickable = !complete && !role;

          return (
            <div
              key={i}
              className="code-line"
              style={{
                ...style,
                cursor: isClickable ? "pointer" : "default",
                transition: "all 0.18s ease",
                userSelect: "none",
              }}
              onClick={isClickable ? () => handleLineTap(lineNum) : undefined}
              title={isClickable ? "Click to identify" : undefined}
            >
              <span className="code-line-num">{lineNum}</span>
              <span className="code-line-content">{line}</span>
              {role && (
                <span
                  className="anim-fade"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color: ROLE_COLORS[role].border,
                    padding: "0 12px",
                    whiteSpace: "nowrap",
                    alignSelf: "center",
                  }}
                >
                  {ROLE_COLORS[role].icon} {ROLE_COLORS[role].label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Identified legend */}
      {Object.keys(identified).length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.entries(identified).map(([ln, role]) => {
            const c = ROLE_COLORS[role];
            return (
              <div
                key={ln}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 100,
                  background: c.bg, border: `1.5px solid ${c.border}`,
                  fontSize: 12, fontWeight: 700, color: c.border,
                }}
              >
                {c.icon} Line {ln}: {c.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Complete state */}
      {complete && (
        <div className="concept-reveal anim-pop">
          🎉 You found both! Code reads just like the plain-English pattern — base case first, then the recursive call.
        </div>
      )}

      {complete && onComplete && (
        <button className="btn btn-primary anim-fade" style={{ alignSelf: "flex-start" }} onClick={onComplete}>
          Continue →
        </button>
      )}
    </div>
  );
}
