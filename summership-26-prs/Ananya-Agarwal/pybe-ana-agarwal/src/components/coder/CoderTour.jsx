import React, { useState, useEffect } from "react";
import { TOUR_STEPS } from "../../data/toolBlocks.js";

const TOUR_KEY = "pybe_coder_tour_done";

export default function CoderTour({ onDone, targetRefs }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Focus management — prevent interaction with background
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(TOUR_KEY, "1");
      onDone();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(TOUR_KEY, "1");
    onDone();
  };

  // Get position of target element
  const getTooltipStyle = () => {
    const ref = targetRefs[current.target]?.current;
    if (!ref) return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };

    const rect = ref.getBoundingClientRect();
    if (current.position === "right") {
      return { top: rect.top + rect.height / 2, left: rect.right + 16 };
    }
    return { top: rect.top + rect.height / 2, right: window.innerWidth - rect.left + 16, left: "auto" };
  };

  const getSpotlight = () => {
    const ref = targetRefs[current.target]?.current;
    if (!ref) return null;
    const rect = ref.getBoundingClientRect();
    return { top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 };
  };

  const spot = getSpotlight();
  const tooltipStyle = getTooltipStyle();

  return (
    <div className="tour-overlay">
      {/* Dark backdrop with spotlight cutout */}
      <svg className="tour-backdrop" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spot && (
              <rect
                x={spot.left} y={spot.top}
                width={spot.width} height={spot.height}
                rx={12} fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="rgba(0,0,0,0.72)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Spotlight border */}
      {spot && (
        <div className="tour-spotlight" style={{
          top: spot.top, left: spot.left,
          width: spot.width, height: spot.height,
        }} />
      )}

      {/* Tooltip */}
      <div className="tour-tooltip anim-pop" style={{
        position: "fixed",
        top: tooltipStyle.top,
        left: tooltipStyle.left,
        right: tooltipStyle.right,
        transform: tooltipStyle.transform || "translateY(-50%)",
        maxWidth: 260,
        zIndex: 10002,
      }}>
        {/* Step dots */}
        <div className="tour-dots">
          {TOUR_STEPS.map((_, i) => (
            <div key={i} className={`tour-dot ${i === step ? "active" : i < step ? "done" : ""}`} />
          ))}
        </div>

        <div className="tour-tooltip-title">{current.title}</div>
        <div className="tour-tooltip-body">{current.body}</div>

        <div className="tour-tooltip-actions">
          <button className="tour-skip-btn" onClick={handleSkip}>Skip tour</button>
          <button className="tour-next-btn" onClick={handleNext}>
            {isLast ? "Let's build! →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { TOUR_KEY };
