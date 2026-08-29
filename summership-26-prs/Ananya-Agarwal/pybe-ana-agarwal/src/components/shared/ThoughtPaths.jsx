import React, { useState } from "react";

/**
 * ThoughtPaths — reusable reasoning-choice system
 *
 * Props:
 *   scenario: string           — optional scenario text shown above options
 *   question: string           — the question framing shown above options
 *   options: Array<{
 *     letter: "A"|"B"|"C"|"D"
 *     text: string               — the option text
 *     feedbackType: "insight"|"warning"|"good"
 *     feedback: string           — feedback after selecting (≤40 words)
 *     conceptReveal?: string     — optional concept name revealed after feedback
 *   }>
 *   onSelect: (optionIndex, branchHint) => void
 *   disabled: boolean
 *   selected: number|null
 */
export default function ThoughtPaths({
  scenario,
  question,
  options = [],
  onSelect,
  disabled = false,
  selected = null,
}) {
  const [hovered, setHovered] = useState(null);
  const selectedOption = selected !== null ? options[selected] : null;

  const handleClick = (idx) => {
    if (disabled) return;
    onSelect?.(idx, options[idx]?.branchHint);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Scenario block */}
      {scenario && (
        <div className="scenario-card">
          <div className="scenario-label">The situation</div>
          <p className="scenario-text">{scenario}</p>
        </div>
      )}

      {/* Question heading */}
      {question && (
        <div className="question-heading">{question}</div>
      )}

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isOther = selected !== null && !isSelected;

          return (
            <button
              key={idx}
              className={`thought-option${isSelected ? " selected" : ""}`}
              onClick={() => handleClick(idx)}
              disabled={disabled && !isSelected}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              style={{
                opacity: isOther ? 0.4 : 1,
                transition: "all 0.22s cubic-bezier(0.25,0.46,0.45,0.94)",
              }}
              aria-pressed={isSelected}
            >
              <div className={`thought-letter${isSelected ? " selected" : ""}`}>
                {opt.letter || String.fromCharCode(65 + idx)}
              </div>
              <span style={{ flex: 1, textAlign: "left" }}>{opt.text}</span>
              {!disabled && !isSelected && (
                <span className="thought-arrow" aria-hidden="true">→</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback — revealed after selection */}
      {selectedOption && (
        <div
          className={`thought-feedback ${selectedOption.feedbackType || "insight"} anim-fade`}
          role="status"
        >
          <div className="thought-feedback-label">
            {selectedOption.feedbackType === "good"
              ? "✓ On the right track"
              : selectedOption.feedbackType === "warning"
              ? "Worth rethinking"
              : "💡 Insight"}
          </div>
          <div className="thought-feedback-body">{selectedOption.feedback}</div>

          {/* Concept reveal — only shown after feedback, if present */}
          {selectedOption.conceptReveal && (
            <div className="concept-reveal anim-pop">
              {selectedOption.conceptReveal}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
