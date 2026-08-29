import React from "react";

const SPEEDS = [
  { label: "0.5×", ms: 1600 },
  { label: "1×",   ms: 800  },
  { label: "2×",   ms: 400  },
  { label: "4×",   ms: 160  },
];

/**
 * ExecutionControls
 * Props:
 *   stepIndex: number
 *   totalSteps: number
 *   playing: boolean
 *   speedIdx: number  (index into SPEEDS)
 *   onPlay, onPause, onNext, onPrev, onRestart, onSeek(pct), onSpeedChange(idx)
 *   currentStep: { event, desc }
 */
export { SPEEDS };

export default function ExecutionControls({
  stepIndex = 0,
  totalSteps = 0,
  playing = false,
  speedIdx = 1,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onRestart,
  onSeek,
  onSpeedChange,
  currentStep = null,
}) {
  const pct = totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 100 : 0;

  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek?.(p);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Step description */}
      {currentStep && (
        <div style={{
          padding: "8px 14px",
          background: "rgba(88,86,214,0.06)",
          borderRadius: "var(--r-sm)",
          border: "1px solid rgba(88,86,214,0.12)",
          fontSize: 12.5,
          color: "var(--text-2)",
          fontFamily: "var(--font)",
          minHeight: 32,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: playing ? "var(--emerald)" : "var(--indigo)",
            flexShrink: 0, boxShadow: playing ? "0 0 0 3px rgba(52,199,89,0.25)" : "none",
            transition: "all 0.3s",
          }} />
          <span><strong style={{ color: "var(--indigo)" }}>{currentStep.event}</strong>
            {currentStep.desc ? ` — ${currentStep.desc}` : ""}</span>
        </div>
      )}

      {/* Controls row */}
      <div className="exec-controls">
        {/* Restart */}
        <button className="btn btn-sm btn-icon" onClick={onRestart} title="Restart">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>

        {/* Prev */}
        <button className="btn btn-sm btn-icon" onClick={onPrev} disabled={stepIndex <= 0} title="Previous step">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" />
          </svg>
        </button>

        {/* Play / Pause */}
        {playing ? (
          <button className="btn btn-sm btn-primary" onClick={onPause} title="Pause">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
            Pause
          </button>
        ) : (
          <button className="btn btn-sm btn-primary" onClick={onPlay} disabled={stepIndex >= totalSteps - 1} title="Play">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Play
          </button>
        )}

        {/* Next */}
        <button className="btn btn-sm btn-icon" onClick={onNext} disabled={stepIndex >= totalSteps - 1} title="Next step">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>

        {/* Timeline */}
        <div className="exec-timeline" onClick={handleTimelineClick} style={{ flex: 1, minWidth: 80 }}>
          <div className="exec-timeline-fill" style={{ width: `${pct}%` }} />
        </div>

        {/* Step counter */}
        <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)", minWidth: 60 }}>
          {stepIndex + 1} / {totalSteps}
        </span>

        {/* Speed */}
        <div style={{ display: "flex", gap: 3 }}>
          {SPEEDS.map((s, i) => (
            <button
              key={i}
              className={`btn btn-sm${speedIdx === i ? " btn-primary" : ""}`}
              style={{ padding: "4px 8px", fontSize: 11, fontWeight: 600, minWidth: 34 }}
              onClick={() => onSpeedChange?.(i)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
