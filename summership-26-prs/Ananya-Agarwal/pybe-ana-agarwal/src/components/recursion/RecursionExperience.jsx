import React, { useState, useEffect, useRef, useCallback } from "react";
import { interpretPython } from "../../engine/interpreter.js";
import CodePanel from "../shared/CodePanel.jsx";
import ExecutionControls, { SPEEDS } from "../shared/ExecutionControls.jsx";
import ThoughtPaths from "../shared/ThoughtPaths.jsx";
import LineIdentify from "../shared/LineIdentify.jsx";
import CallStackViz from "./CallStackViz.jsx";
import { OutputPanel } from "../shared/VisualBlock.jsx";
import { useSession } from "../../context/SessionContext.jsx";
import CoderModeOverlay from "../coder/CoderModeOverlay.jsx";
import {
  STAGES,
  THOUGHT_OPTIONS,
  BASE_CASE_OPTIONS,
  RECURSIVE_CASE_OPTIONS,
  BRANCH_INTROS,
  SEARCH_CODE,
  RECURSION_CODE,
  LOOP_CODE,
  CODE_ANNOTATION_PROMPTS,
  COMPARISON_POINTS,
} from "../../data/recursionData.js";

/* ── Stage progress dot row ── */
function StageProgress({ current, stages, onClickStage }) {
  return (
    <div className="stage-progress">
      {stages.map((s, i) => (
        <button
          key={s.id}
          className={`stage-dot${i === current ? " active" : i < current ? " done" : ""}`}
          title={s.title}
          onClick={() => i < current && onClickStage?.(i)}
          style={{ cursor: i < current ? "pointer" : "default", border: "none", padding: 0 }}
          aria-label={`Stage ${i + 1}: ${s.title}${i < current ? " (completed)" : i === current ? " (current)" : ""}`}
        />
      ))}
    </div>
  );
}

/* ── Execution hook ── */
function useSimulator(code) {
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const timerRef = useRef(null);

  useEffect(() => {
    const s = interpretPython(code);
    setSteps(s);
    setStepIdx(0);
    setPlaying(false);
  }, [code]);

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const play = useCallback(() => {
    clearTimer();
    setPlaying(true);
    timerRef.current = setInterval(() => {
      setStepIdx((i) => {
        if (i >= steps.length - 1) { clearTimer(); setPlaying(false); return i; }
        return i + 1;
      });
    }, SPEEDS[speedIdx].ms);
  }, [steps.length, speedIdx]);

  const pause = useCallback(() => { clearTimer(); setPlaying(false); }, []);
  const next = useCallback(() => { pause(); setStepIdx((i) => Math.min(i + 1, steps.length - 1)); }, [pause, steps.length]);
  const prev = useCallback(() => { pause(); setStepIdx((i) => Math.max(0, i - 1)); }, [pause]);
  const restart = useCallback(() => { pause(); setStepIdx(0); }, [pause]);
  const seek = useCallback((pct) => { pause(); setStepIdx(Math.round(pct * (steps.length - 1))); }, [pause, steps.length]);
  const changeSpeed = useCallback((idx) => {
    setSpeedIdx(idx);
    if (playing) {
      clearTimer();
      timerRef.current = setInterval(() => {
        setStepIdx((i) => { if (i >= steps.length - 1) { clearTimer(); setPlaying(false); return i; } return i + 1; });
      }, SPEEDS[idx].ms);
    }
  }, [playing, steps.length]);

  useEffect(() => () => clearTimer(), []);

  const step = steps[stepIdx] || null;
  const prevStep = steps[stepIdx - 1] || null;
  return { steps, stepIdx, step, prevStep, playing, speedIdx, play, pause, next, prev, restart, seek, changeSpeed };
}

/* ── Notebook Stack Visual ── */
function NotebookStack({ count = 20, splitAt = null }) {
  const notebooks = Array.from({ length: Math.min(count, 8) });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "20px 0" }}>
      {splitAt !== null && (
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Left half → {Math.floor(count / 2)} notebooks
        </div>
      )}
      {notebooks.map((_, i) => (
        <div
          key={i}
          style={{
            width: splitAt !== null && i >= Math.floor(notebooks.length / 2) ? 120 : 160,
            height: 22,
            borderRadius: 4,
            background: i === Math.floor(notebooks.length / 2) - 1 && splitAt === null
              ? "linear-gradient(90deg, rgba(88,86,214,0.15), rgba(88,86,214,0.08))"
              : "rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: "var(--muted)",
            fontFamily: "var(--mono)",
          }}
        >
          {i === Math.floor(notebooks.length / 2) - 1 && splitAt === null ? "📓 math notes?" : "📒"}
        </div>
      ))}
      {count > 8 && (
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
          + {count - 8} more notebooks
        </div>
      )}
    </div>
  );
}

/* ── Experiment Stage ── */
function ExperimentStage({ onComplete }) {
  const [n, setN] = useState(4);
  const code = `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)

result = factorial(${n})
print("${n}! =", result)`;

  const sim = useSimulator(code);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Callback to book stack */}
      <div className="callback-banner">
        <span className="callback-icon">🔁</span>
        <span>
          <strong>Remember the book stack?</strong> Here, <code style={{ fontSize: 13, background: "rgba(88,86,214,0.12)", padding: "1px 5px", borderRadius: 4 }}>n</code> is the number of times the function splits the problem further before hitting the base case (n = 0).
        </span>
      </div>

      <div style={{ padding: "16px 20px", borderRadius: "var(--r)", background: "var(--indigo-light)", border: "1px solid rgba(88,86,214,0.2)", fontSize: 14.5, lineHeight: 1.75 }}>
        <strong>Observe the stack depth.</strong> Change n — how many frames appear? What happens to each frame's value of n? When does the stack start shrinking?
      </div>

      {/* n slider */}
      <div className="glass-sm" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>n = </label>
          <span style={{ fontSize: 32, fontWeight: 800, color: "var(--indigo)", fontFamily: "var(--mono)", lineHeight: 1 }}>{n}</span>
        </div>
        <input
          type="range" min={0} max={8} value={n}
          onChange={(e) => setN(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--indigo)" }}
          aria-label={`Set n to ${n}`}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          <span>0 (base case)</span>
          <span>8 (8 frames deep)</span>
        </div>
      </div>

      {/* Prediction prompts */}
      <div style={{ display: "flex", gap: 12 }}>
        {[
          { q: "Max stack depth?", a: `${n + 1} frames` },
          { q: "Base case triggers at?", a: `n = 0` },
          { q: "Result?", a: `${Array.from({ length: n }, (_, i) => n - i).reduce((a, b) => a * b, 1) || 1}` },
        ].map(({ q, a }) => (
          <div key={q} style={{
            flex: 1, padding: "12px 14px", borderRadius: "var(--r-sm)",
            border: "1px solid var(--border-2)", background: "var(--surface)", fontSize: 13,
          }}>
            <div style={{ fontWeight: 600, color: "var(--text-3)", marginBottom: 4 }}>{q}</div>
            <div style={{ fontFamily: "var(--mono)", color: "var(--indigo)", fontWeight: 700 }}>{a}</div>
          </div>
        ))}
      </div>

      {/* Code + stack */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div className="panel-label">Same idea, different shape — counting arrangements</div>
          <CodePanel code={code} activeLine={sim.step?.line || 0} maxHeight="260px" />
        </div>
        <div>
          <div className="panel-label">Call stack</div>
          <CallStackViz step={sim.step} prevStep={sim.prevStep} />
        </div>
      </div>

      <ExecutionControls
        stepIndex={sim.stepIdx} totalSteps={sim.steps.length}
        playing={sim.playing} speedIdx={sim.speedIdx}
        onPlay={sim.play} onPause={sim.pause} onNext={sim.next}
        onPrev={sim.prev} onRestart={sim.restart} onSeek={sim.seek}
        onSpeedChange={sim.changeSpeed} currentStep={sim.step}
      />

      {/* Optional depth/stack-overflow branch */}
      <details className="optional-deeper">
        <summary>🐇 Go deeper (optional) — what happens with 1,000,000 notebooks?</summary>
        <div className="optional-deeper-body">
          <p>Each time you split, someone is <em>waiting</em> for their half to finish before combining answers. That waiting list — called the <strong>call stack</strong> — has a size limit.</p>
          <p>With 1,000,000 notebooks, you'd need ~20 splits (log₂ 1,000,000 ≈ 20), so the stack would grow to 20 frames. That's fine.</p>
          <p>But if you never split — just called yourself 1,000,000 times in a row — the stack hits its limit and crashes. Programmers call this a <strong>stack overflow</strong>. Recursion is powerful, but deeply linear recursion on huge inputs needs care.</p>
        </div>
      </details>

      <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={onComplete}>
        Compare with a loop →
      </button>
    </div>
  );
}

/* ── Compare Stage ── */
function CompareStage({ onComplete }) {
  const [activeTab, setActiveTab] = useState("recursion");
  const recSim = useSimulator(RECURSION_CODE);
  const loopSim = useSimulator(LOOP_CODE);
  const sim = activeTab === "recursion" ? recSim : loopSim;
  const code = activeTab === "recursion" ? RECURSION_CODE : LOOP_CODE;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "16px 20px", borderRadius: "var(--r)", background: "var(--indigo-light)", border: "1px solid rgba(88,86,214,0.2)", fontSize: 14.5, lineHeight: 1.75 }}>
        Step through both. Notice: recursion builds up frames; the loop never leaves one frame. The result is identical — the journey is completely different.
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, padding: "4px", background: "var(--bg-2)", borderRadius: "var(--r-sm)", width: "fit-content" }}>
        {[["recursion", "🔁 Recursion"], ["loop", "🔄 Loop"]].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "var(--font)", fontWeight: 600, fontSize: 13.5,
              background: activeTab === id ? "white" : "transparent",
              color: activeTab === id ? "var(--indigo)" : "var(--muted)",
              boxShadow: activeTab === id ? "var(--shadow-sm)" : "none",
              transition: "all 0.18s ease",
            }}
          >{label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <CodePanel code={code} activeLine={sim.step?.line || 0} maxHeight="260px" />
        </div>
        <div>
          <CallStackViz step={sim.step} prevStep={sim.prevStep} />
        </div>
      </div>

      <ExecutionControls
        stepIndex={sim.stepIdx} totalSteps={sim.steps.length}
        playing={sim.playing} speedIdx={sim.speedIdx}
        onPlay={sim.play} onPause={sim.pause} onNext={sim.next}
        onPrev={sim.prev} onRestart={sim.restart} onSeek={sim.seek}
        onSpeedChange={sim.changeSpeed} currentStep={sim.step}
      />

      {/* Comparison table */}
      <div className="glass-strong" style={{ borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>
          Side-by-side comparison
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "var(--bg-2)" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--muted)", fontWeight: 600, fontSize: 12, width: "28%" }}>Aspect</th>
              <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--indigo)", fontWeight: 600, fontSize: 12 }}>🔁 Recursion</th>
              <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--sky)", fontWeight: 600, fontSize: 12 }}>🔄 Loop</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_POINTS.map((row, i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 16px", color: "var(--text-3)", fontWeight: 600 }}>{row.aspect}</td>
                <td style={{ padding: "10px 16px", color: "var(--text-2)", lineHeight: 1.55 }}>{row.recursion}</td>
                <td style={{ padding: "10px 16px", color: "var(--text-2)", lineHeight: 1.55 }}>{row.loop}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="discovery-banner">
        <div className="discovery-icon">💡</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>You discovered it</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-2)", margin: 0 }}>
            Recursion is really just: solve the small case directly, and hand off the bigger case in smaller pieces. Each piece uses the exact same method, until only the small case is left.
          </p>
        </div>
      </div>

      <button className="btn btn-emerald" style={{ alignSelf: "flex-start" }} onClick={onComplete}>
        ✓ Complete Recursion experience
      </button>
    </div>
  );
}

/* ── Main Experience ── */
export default function RecursionExperience({ onHome }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [thoughtSelected, setThoughtSelected] = useState(null);
  const [thoughtBranchHint, setThoughtBranchHint] = useState("divide");
  const [thoughtDone, setThoughtDone] = useState(false);
  const [baseCaseSelected, setBaseCaseSelected] = useState(null);
  const [baseCaseDone, setBaseCaseDone] = useState(false);
  const [recursiveCaseSelected, setRecursiveCaseSelected] = useState(null);
  const [recursiveCaseDone, setRecursiveCaseDone] = useState(false);
  const [codeIdentified, setCodeIdentified] = useState(false);
  const [coderOpen, setCoderOpen] = useState(false);
  const bodyRef = useRef(null);
  const { recordChoice } = useSession();

  // Render Coder Mode overlay when open
  if (coderOpen) {
    return <CoderModeOverlay concept="recursion" onClose={() => setCoderOpen(false)} />;
  }

  const scrollTop = () => setTimeout(() => bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
  const goNext = () => { setStageIdx((i) => Math.min(i + 1, STAGES.length - 1)); scrollTop(); };
  const goPrev = () => { setStageIdx((i) => Math.max(0, i - 1)); scrollTop(); };
  const goTo  = (idx) => { setStageIdx(idx); scrollTop(); };

  const stage = STAGES[stageIdx];

  // Get the branch intro for the current hint
  const branchIntro = BRANCH_INTROS[thoughtBranchHint] || BRANCH_INTROS.divide;

  return (
    <div className="experience-shell">
      {/* Header */}
      <div className="stage-header">
        <button className="btn btn-sm btn-icon" onClick={onHome} title="Home" aria-label="Go home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="stage-badge tag tag-indigo">🔁 Recursion</span>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Stage {stageIdx + 1} of {STAGES.length}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className={`btn btn-sm ${stage.id === "code-sim" ? "coder-btn-highlight pulse-glow" : "coder-btn-header"}`}
            onClick={() => setCoderOpen(true)}
          >
            ⌨️ Coder Mode
          </button>
          <StageProgress current={stageIdx} stages={STAGES} onClickStage={goTo} />
        </div>
      </div>

      {/* Body */}
      <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: "32px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>

        {/* Stage title */}
        <div className="anim-fade" style={{ marginBottom: 28 }}>
          <h1 className="stage-title">{stage.title}</h1>
          <p className="stage-subtitle">{stage.subtitle}</p>
        </div>

        {/* ── STORY ── */}
        {stage.id === "story" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="story-card" style={{ "--before-bg": "var(--indigo)" }}>
              <div style={{ display: "flex", gap: 20, marginBottom: 20, alignItems: "flex-start" }}>
                <div style={{ fontSize: 48, lineHeight: 1 }}>📚</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--indigo)", marginBottom: 8 }}>
                    The situation
                  </div>
                  <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-2)", margin: 0 }}>
                    You have <strong>20 identical-looking notebooks</strong> stacked on a table.
                    Somewhere in there is the one with your <strong>math notes</strong>.
                    You can only check one notebook at a time by opening it.
                  </p>
                </div>
              </div>

              <NotebookStack count={20} />

              <div style={{ padding: "16px 20px", background: "var(--indigo-light)", borderRadius: "var(--r-sm)", border: "1px solid rgba(88,86,214,0.2)" }}>
                <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, fontWeight: 500, color: "var(--text)" }}>
                  🤔 Before we think about code — how would <em>you</em> personally search through these notebooks?
                </p>
              </div>
            </div>

            <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={goNext}>
              Think about it →
            </button>
          </div>
        )}

        {/* ── THOUGHT PATHS ── */}
        {stage.id === "thought-paths" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <ThoughtPaths
              question="How would you search through 20 identical notebooks?"
              options={THOUGHT_OPTIONS}
              selected={thoughtSelected}
              onSelect={(idx, hint) => {
                setThoughtSelected(idx);
                setThoughtBranchHint(hint || "divide");
                setThoughtDone(true);
                recordChoice({ module: "recursion", stage: "thought-paths", optionIdx: idx, branchHint: hint });
              }}
              disabled={thoughtDone}
            />

            {thoughtDone && (
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn" onClick={goPrev}>← Back</button>
                <button className="btn btn-primary" onClick={goNext}>What happens at the very end? →</button>
              </div>
            )}
          </div>
        )}

        {/* ── BASE CASE ── */}
        {stage.id === "base-case" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Branch intro — different per option picked */}
            <div className="scenario-card">
              <div className="scenario-label">Following your thinking...</div>
              <p className="scenario-text">{branchIntro}</p>
            </div>

            <ThoughtPaths
              question="What should happen when there's only 1 notebook left?"
              options={BASE_CASE_OPTIONS}
              selected={baseCaseSelected}
              onSelect={(idx, hint) => {
                setBaseCaseSelected(idx);
                setBaseCaseDone(true);
                recordChoice({ module: "recursion", stage: "base-case", optionIdx: idx, branchHint: hint });
              }}
              disabled={baseCaseDone}
            />

            {baseCaseDone && (
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn" onClick={goPrev}>← Back</button>
                <button className="btn btn-primary" onClick={goNext}>The same strategy, smaller →</button>
              </div>
            )}
          </div>
        )}

        {/* ── RECURSIVE CASE ── */}
        {stage.id === "recursive-case" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="scenario-card">
              <div className="scenario-label">Now zoom out</div>
              <p className="scenario-text">
                For any stack bigger than 1 notebook, you don't personally check every one. You say: "Someone check the left half. Someone else check the right half. Use the exact same method I'm using." What's happening here?
              </p>
            </div>

            <ThoughtPaths
              question="Which description fits what's happening?"
              options={RECURSIVE_CASE_OPTIONS}
              selected={recursiveCaseSelected}
              onSelect={(idx, hint) => {
                setRecursiveCaseSelected(idx);
                setRecursiveCaseDone(true);
                recordChoice({ module: "recursion", stage: "recursive-case", optionIdx: idx, branchHint: hint });
              }}
              disabled={recursiveCaseDone}
            />

            {recursiveCaseDone && (
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn" onClick={goPrev}>← Back</button>
                <button className="btn btn-primary" onClick={goNext}>See it in Python →</button>
              </div>
            )}
          </div>
        )}

        {/* ── CODE + SIMULATION ── */}
        {stage.id === "code-sim" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ padding: "14px 18px", borderRadius: "var(--r)", background: "var(--indigo-light)", border: "1px solid rgba(88,86,214,0.2)", fontSize: 14.5, lineHeight: 1.75 }}>
              Below is the book-stack search in Python — almost word-for-word the pattern you reasoned through. Before reading: tap the two important lines.
            </div>

            {!codeIdentified ? (
              <LineIdentify
                code={SEARCH_CODE}
                targets={[
                  {
                    lineNum: CODE_ANNOTATION_PROMPTS.baseCaseLineNum,
                    role: "base-case",
                    promptText: CODE_ANNOTATION_PROMPTS.baseCasePrompt,
                    correctHint: "Yes — when only 1 notebook is left, just check it directly. No more splitting.",
                  },
                  {
                    lineNum: CODE_ANNOTATION_PROMPTS.recursiveCaseLineNum,
                    role: "recursive",
                    promptText: CODE_ANNOTATION_PROMPTS.recursiveCasePrompt,
                    correctHint: "Right — the function calls itself on each half, applying the same search to a smaller stack.",
                  },
                ]}
                onComplete={() => setCodeIdentified(true)}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="concept-reveal anim-pop">
                  Base case + Recursive case — that's all recursion is. Every recursive function has exactly these two parts.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16 }}>
                  <div>
                    <div className="panel-label">Python — book stack search</div>
                    <CodePanel code={SEARCH_CODE} maxHeight="200px" />
                  </div>
                  <div>
                    <div className="panel-label">Call stack (when running on 8 notebooks)</div>
                    <CallStackViz step={null} prevStep={null} />
                  </div>
                </div>

                {/* Coder Mode entry */}
                <div style={{
                  padding: "18px 22px",
                  borderRadius: "var(--r-lg)",
                  background: "linear-gradient(135deg, rgba(88,86,214,0.08), rgba(0,122,255,0.06))",
                  border: "1.5px solid rgba(88,86,214,0.2)",
                  display: "flex", alignItems: "center", gap: 16,
                }}>
                  <div style={{ fontSize: 32 }}>⌨️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Ready to build it yourself?</div>
                    <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>
                      Open Coder Mode — drag and drop the building blocks to recreate this function, then watch it execute step by step.
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ flexShrink: 0, fontWeight: 700 }}
                    onClick={() => setCoderOpen(true)}
                  >
                    ⌨️ Build it yourself →
                  </button>
                </div>

                <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={onHome}>
                  Finish lesson 🏁
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── EXPERIMENT ── */}
        {stage.id === "experiment" && (
          <div className="anim-fade">
            <ExperimentStage onComplete={goNext} />
          </div>
        )}

        {/* ── COMPARE ── */}
        {stage.id === "compare" && (
          <div className="anim-fade">
            <CompareStage onComplete={goNext} />
          </div>
        )}

        {/* Back nav */}
        {!["story", "thought-paths", "base-case", "recursive-case", "code-sim", "experiment", "compare"].includes(stage.id) && (
          <div style={{ marginTop: 24 }}>
            <button className="btn" onClick={goPrev}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
