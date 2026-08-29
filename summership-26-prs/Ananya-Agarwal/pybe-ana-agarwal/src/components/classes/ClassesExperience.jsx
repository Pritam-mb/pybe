import React, { useState, useEffect, useRef, useCallback } from "react";
import { interpretPython } from "../../engine/interpreter.js";
import CodePanel from "../shared/CodePanel.jsx";
import ExecutionControls, { SPEEDS } from "../shared/ExecutionControls.jsx";
import ThoughtPaths from "../shared/ThoughtPaths.jsx";
import { BlueprintViz, SelfAnimationViz } from "./BlueprintViz.jsx";
import InheritanceViz from "./InheritanceViz.jsx";
import { ObjectBlock, OutputPanel } from "../shared/VisualBlock.jsx";
import {
  STAGES, THOUGHT_OPTIONS, CHARACTER_CLASS_CODE, INHERITANCE_CODE,
  CHALLENGE_STARTER, SELF_ANIMATION_STEPS, INHERITANCE_CONCEPTS,
} from "../../data/classesData.js";

/* ── Simulator hook ── */
function useSimulator(code) {
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!code) return;
    const s = interpretPython(code);
    setSteps(s);
    setStepIdx(0);
    setPlaying(false);
  }, [code]);

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const play = useCallback(() => {
    clearTimer(); setPlaying(true);
    timerRef.current = setInterval(() => {
      setStepIdx((i) => { if (i >= steps.length - 1) { clearTimer(); setPlaying(false); return i; } return i + 1; });
    }, SPEEDS[speedIdx].ms);
  }, [steps.length, speedIdx]);
  const pause = useCallback(() => { clearTimer(); setPlaying(false); }, []);
  const next = useCallback(() => { pause(); setStepIdx((i) => Math.min(i + 1, steps.length - 1)); }, [pause, steps.length]);
  const prev = useCallback(() => { pause(); setStepIdx((i) => Math.max(0, i - 1)); }, [pause]);
  const restart = useCallback(() => { pause(); setStepIdx(0); }, [pause]);
  const seek = useCallback((pct) => { pause(); setStepIdx(Math.round(pct * (steps.length - 1))); }, [pause, steps.length]);
  const changeSpeed = useCallback((idx) => { setSpeedIdx(idx); }, []);
  useEffect(() => () => clearTimer(), []);

  return { steps, stepIdx, step: steps[stepIdx] || null, prevStep: steps[stepIdx - 1] || null, playing, speedIdx, play, pause, next, prev, restart, seek, changeSpeed };
}

/* ── Object state panel from interpreter step ── */
function ObjectStatePanel({ step }) {
  if (!step) return null;
  // Pull objects from globals and stack
  const objects = [];
  const allVars = { ...step.globals };
  step.stack?.forEach((f) => { Object.assign(allVars, f.vars); });
  Object.entries(allVars).forEach(([k, v]) => {
    if (v?.type === "object") {
      objects.push({ name: k, className: v.value.className, fields: v.value.fields });
    }
  });
  if (objects.length === 0) return (
    <div style={{ padding: 16, fontSize: 13, color: "var(--muted)", border: "1px dashed var(--border-2)", borderRadius: "var(--r)", textAlign: "center" }}>
      — no objects created yet —
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4 }}>Live Object State</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {objects.map((obj) => {
          const fields = {};
          Object.entries(obj.fields || {}).forEach(([k, v]) => {
            fields[k] = v?.type === "function" ? "<method>" : String(v?.value ?? "None");
          });
          return (
            <div key={obj.name} className="obj-card" style={{ minWidth: 160 }}>
              <div className="obj-header" style={{ background: "var(--sky-light)", color: "var(--sky)", borderColor: "rgba(0,122,255,0.2)", fontSize: 12 }}>
                <span>◈</span><span>{obj.name}</span>
                <span style={{ fontSize: 10, opacity: 0.7 }}>: {obj.className}</span>
              </div>
              <div className="obj-body">
                {Object.entries(obj.fields || {}).filter(([k]) => k !== "self").map(([k, v]) => {
                  const disp = v?.type === "function" ? "<method>" : v?.type === "none" ? "None" : String(v?.value ?? "?");
                  return (
                    <div key={k} className="obj-attr">
                      <span className="obj-attr-key">{k}</span>
                      <span style={{ color: "var(--muted)", fontSize: 11 }}>=</span>
                      <span className="obj-attr-val">{typeof disp === "string" && v?.type === "str" ? `'${disp}'` : disp}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {step.output?.length > 0 && <OutputPanel output={step.output} />}
    </div>
  );
}

/* ── Challenge Stage ── */
function ChallengeStage({ onComplete }) {
  const [code, setCode] = useState(CHALLENGE_STARTER);
  const [ran, setRan] = useState(false);
  const sim = useSimulator(ran ? code : null);

  const runCode = () => { setRan(false); setTimeout(() => setRan(true), 50); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="discovery-banner">
        <div className="discovery-icon">🎯</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Your challenge</div>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-2)", margin: 0 }}>
            An <code style={{ fontSize: 13, background: "var(--bg-2)", padding: "1px 6px", borderRadius: 4 }}>Animal</code> class is provided. 
            Create a <code style={{ fontSize: 13, background: "var(--bg-2)", padding: "1px 6px", borderRadius: 4 }}>Dog</code> class that:
          </p>
          <ul style={{ margin: "10px 0 0 0", padding: "0 0 0 20px", fontSize: 14, lineHeight: 1.8, color: "var(--text-2)" }}>
            <li>Inherits from <code style={{ fontSize: 12, background: "var(--bg-2)", padding: "1px 5px", borderRadius: 3 }}>Animal</code></li>
            <li>Overrides <code style={{ fontSize: 12, background: "var(--bg-2)", padding: "1px 5px", borderRadius: 3 }}>speak()</code> to return a WOOF in uppercase</li>
            <li>Creates a Dog instance and calls speak()</li>
          </ul>
        </div>
      </div>

      {/* Code editor */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 8 }}>Edit your code:</div>
        <textarea
          className="textarea"
          value={code}
          onChange={(e) => { setCode(e.target.value); setRan(false); }}
          style={{ fontFamily: "var(--mono)", fontSize: 13, minHeight: 240 }}
          spellCheck={false}
        />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-primary" onClick={runCode}>▶ Run code</button>
        <button className="btn" onClick={() => { setCode(CHALLENGE_STARTER); setRan(false); }}>Reset</button>
      </div>

      {/* Live output + objects */}
      {ran && sim.steps.length > 0 && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <CodePanel code={code} activeLine={sim.step?.line || 0} maxHeight="220px" />
            </div>
            <div>
              <ObjectStatePanel step={sim.step} />
            </div>
          </div>
          <ExecutionControls
            stepIndex={sim.stepIdx} totalSteps={sim.steps.length}
            playing={sim.playing} speedIdx={sim.speedIdx}
            onPlay={sim.play} onPause={sim.pause} onNext={sim.next}
            onPrev={sim.prev} onRestart={sim.restart} onSeek={sim.seek}
            onSpeedChange={sim.changeSpeed} currentStep={sim.step}
          />
          {/* Check for success: output contains WOOF */}
          {sim.step?.output?.some((l) => l.toUpperCase().includes("WOOF")) && (
            <div className="anim-pop" style={{
              padding: "16px 20px",
              borderRadius: "var(--r)",
              background: "var(--emerald-light)",
              border: "1.5px solid rgba(52,199,89,0.4)",
              fontSize: 15, fontWeight: 600, color: "#1a6b29",
            }}>
              ✓ Dog.speak() overrides Animal.speak() and returns uppercase WOOF. You built a working inheritance hierarchy!
            </div>
          )}
        </div>
      )}

      <button className="btn btn-emerald" style={{ alignSelf: "flex-start" }} onClick={onComplete}>
        ✓ Complete Classes & Objects experience
      </button>
    </div>
  );
}

/* ── Stage progress ── */
function StageProgress({ current, stages, onClickStage }) {
  return (
    <div className="stage-progress" style={{ gap: 4 }}>
      {stages.map((s, i) => (
        <div
          key={s.id}
          className={`stage-dot${i === current ? " active" : i < current ? " done" : ""}`}
          title={s.title}
          onClick={() => i < current && onClickStage?.(i)}
          style={{ cursor: i < current ? "pointer" : "default" }}
        />
      ))}
    </div>
  );
}

/* ── Main Experience ── */
export default function ClassesExperience({ onHome }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [thoughtSelected, setThoughtSelected] = useState(null);
  const [thoughtDone, setThoughtDone] = useState(false);
  const bodyRef = useRef(null);

  const charSim = useSimulator(CHARACTER_CLASS_CODE);
  const inheritSim = useSimulator(INHERITANCE_CODE);

  const goNext = () => {
    setStageIdx((i) => Math.min(i + 1, STAGES.length - 1));
    setTimeout(() => bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };
  const goPrev = () => setStageIdx((i) => Math.max(0, i - 1));
  const goTo = (idx) => setStageIdx(idx);

  const stage = STAGES[stageIdx];

  return (
    <div className="experience-shell">
      <div className="stage-header">
        <button className="btn btn-sm btn-icon" onClick={onHome}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="stage-badge tag tag-sky">🏛️ Classes & Objects</span>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Stage {stageIdx + 1} of {STAGES.length}</span>
          </div>
        </div>
        <StageProgress current={stageIdx} stages={STAGES} onClickStage={goTo} />
      </div>

      <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: "32px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div className="anim-fade" style={{ marginBottom: 28 }}>
          <h1 className="stage-title">{stage.title}</h1>
          <p className="stage-subtitle">{stage.subtitle}</p>
        </div>

        {/* ── STORY ── */}
        {stage.id === "story" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="story-card">
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ fontSize: 48 }}>🎮</div>
                <div>
                  <p style={{ fontSize: 16, lineHeight: 1.75, margin: 0 }}>
                    You are building a game. It has players and enemies. Every character in the game has a <strong>name</strong>, <strong>health</strong>, and a <strong>position</strong>. Every character can <strong>move</strong>, <strong>attack</strong>, and <strong>take damage</strong>.
                  </p>
                </div>
              </div>

              {/* Characters grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { name: "Player 1", icon: "🦸", health: 100 },
                  { name: "Player 2", icon: "🦹", health: 85 },
                  { name: "Enemy 1", icon: "👹", health: 60 },
                  { name: "Enemy 2", icon: "👺", health: 70 },
                ].map((c) => (
                  <div key={c.name} style={{ padding: "14px 12px", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--surface)", textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{c.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>{c.name}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>HP: {c.health}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "16px 20px", background: "var(--sky-light)", border: "1px solid rgba(0,122,255,0.2)", borderRadius: "var(--r-sm)" }}>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
                  💭 If you wrote separate variables for each character — player1_name, player2_name, enemy1_name… — and separate functions too — what would happen when you needed to change how damage works across all of them?
                </p>
              </div>
            </div>

            <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={goNext}>
              Think about it →
            </button>
          </div>
        )}

        {/* ── PROBLEM ── */}
        {stage.id === "problem" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="story-card">
              <p style={{ fontSize: 15, lineHeight: 1.75, marginBottom: 20 }}>
                Here is what that approach would look like for just two players:
              </p>
              <div className="code-panel" style={{ padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.8, color: "var(--text-2)" }}>
                  <div><span className="tok-kw">player1_name</span> = <span className="tok-str">"Aria"</span></div>
                  <div><span className="tok-kw">player1_health</span> = <span className="tok-num">100</span></div>
                  <div><span className="tok-kw">player2_name</span> = <span className="tok-str">"Kabir"</span></div>
                  <div><span className="tok-kw">player2_health</span> = <span className="tok-num">75</span></div>
                  <div style={{ marginTop: 8 }}><span className="tok-cmt"># Now for enemies...</span></div>
                  <div style={{ color: "var(--rose)", fontStyle: "italic" }}># 20 more variables...</div>
                </div>
              </div>
              <div style={{ padding: "14px 18px", background: "var(--rose-light)", border: "1px solid rgba(255,59,48,0.25)", borderRadius: "var(--r-sm)", fontSize: 14, lineHeight: 1.65 }}>
                ⚠️ Now imagine adding 20 enemies. Or changing how all characters take damage. You'd need to update 20 different functions in 20 different places.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>What's a better approach? →</button>
            </div>
          </div>
        )}

        {/* ── THOUGHT PATHS ── */}
        {stage.id === "thought-paths" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ padding: "16px 20px", background: "rgba(0,122,255,0.05)", border: "1px solid rgba(0,122,255,0.15)", borderRadius: "var(--r)", fontSize: 15, lineHeight: 1.65 }}>
              How would you organise four different characters that all share the same structure?
            </div>
            <ThoughtPaths
              options={THOUGHT_OPTIONS}
              selected={thoughtSelected}
              onSelect={(idx) => { setThoughtSelected(idx); setThoughtDone(true); }}
              disabled={thoughtDone}
            />
            {thoughtDone && (
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn" onClick={goPrev}>← Back</button>
                <button className="btn btn-primary" onClick={goNext}>See the blueprint →</button>
              </div>
            )}
          </div>
        )}

        {/* ── BLUEPRINT ── */}
        {stage.id === "blueprint" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ padding: "14px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 14.5, lineHeight: 1.65 }}>
              A <strong>class</strong> is a blueprint. It defines the shape — what attributes every character has, and what methods every character can call. Then you create <strong>objects</strong> (instances) from that blueprint by calling the class name.
            </div>

            <BlueprintViz
              className="Character"
              attributes={["name", "health", "position"]}
              methods={["move", "take_damage", "status"]}
              objects={[
                { name: "player1", fields: { name: "Aria", health: 100, position: 0 } },
                { name: "player2", fields: { name: "Kabir", health: 75, position: 0 } },
              ]}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ padding: "14px 18px", borderRadius: "var(--r)", background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Class:</div>
                <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0, color: "var(--text-2)" }}>Defined once. Contains the attribute names and method logic. Does not hold actual values like "Aria" or 100.</p>
              </div>
              <div style={{ padding: "14px 18px", borderRadius: "var(--r)", background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Object:</div>
                <p style={{ fontSize: 14, lineHeight: 1.65, margin: 0, color: "var(--text-2)" }}>Created from the class. Holds its own actual values. player1 and player2 are separate objects — changing one does not change the other.</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>Understand self →</button>
            </div>
          </div>
        )}

        {/* ── SELF ── */}
        {stage.id === "self" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ padding: "14px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 14.5, lineHeight: 1.65 }}>
              When you write <code style={{ fontSize: 13, background: "var(--bg-2)", padding: "1px 6px", borderRadius: 4 }}>player1.take_damage(20)</code>, Python needs to know: which object should the method act on? The answer is <strong>self</strong>. Python automatically passes the object as the first argument.
            </div>

            <SelfAnimationViz steps={SELF_ANIMATION_STEPS} />

            <div className="discovery-banner">
              <div className="discovery-icon">💡</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Why self?</div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-2)", margin: 0 }}>
                  Without self, the method would not know which object's health to modify. player1 and player2 both have health — self tells the method "you are operating on this specific object".
                  This is why every method in a class takes self as its first parameter.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>The constructor →</button>
            </div>
          </div>
        )}

        {/* ── CONSTRUCTOR ── */}
        {stage.id === "constructor" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: "14px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 14.5, lineHeight: 1.65 }}>
              <code style={{ fontSize: 13, background: "var(--bg-2)", padding: "1px 6px", borderRadius: 4 }}>__init__</code> is called automatically when you create an object. Step through the execution — watch how each attribute is set on the new object.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 8 }}>Code</div>
                <CodePanel code={CHARACTER_CLASS_CODE} activeLine={charSim.step?.line || 0} maxHeight="320px" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 8 }}>Live Object State</div>
                <ObjectStatePanel step={charSim.step} />
              </div>
            </div>

            <ExecutionControls
              stepIndex={charSim.stepIdx} totalSteps={charSim.steps.length}
              playing={charSim.playing} speedIdx={charSim.speedIdx}
              onPlay={charSim.play} onPause={charSim.pause} onNext={charSim.next}
              onPrev={charSim.prev} onRestart={charSim.restart} onSeek={charSim.seek}
              onSpeedChange={charSim.changeSpeed} currentStep={charSim.step}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>Inheritance →</button>
            </div>
          </div>
        )}

        {/* ── INHERITANCE ── */}
        {stage.id === "inheritance" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ padding: "14px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 14.5, lineHeight: 1.65 }}>
              A child class can extend a parent class. It inherits all parent methods automatically, can add its own, and can override existing ones with new behaviour.
            </div>

            <InheritanceViz />

            {/* Key concepts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {INHERITANCE_CONCEPTS.map((c) => (
                <div key={c.title} style={{ padding: "14px 16px", borderRadius: "var(--r)", background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{c.icon} {c.title}</div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0, color: "var(--text-2)" }}>{c.desc}</p>
                </div>
              ))}
            </div>

            {/* Code + sim */}
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, marginTop: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 8 }}>Python code</div>
                <CodePanel code={INHERITANCE_CODE} activeLine={inheritSim.step?.line || 0} maxHeight="280px" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 8 }}>Live State</div>
                <ObjectStatePanel step={inheritSim.step} />
              </div>
            </div>
            <ExecutionControls
              stepIndex={inheritSim.stepIdx} totalSteps={inheritSim.steps.length}
              playing={inheritSim.playing} speedIdx={inheritSim.speedIdx}
              onPlay={inheritSim.play} onPause={inheritSim.pause} onNext={inheritSim.next}
              onPrev={inheritSim.prev} onRestart={inheritSim.restart} onSeek={inheritSim.seek}
              onSpeedChange={inheritSim.changeSpeed} currentStep={inheritSim.step}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>Build it yourself →</button>
            </div>
          </div>
        )}

        {/* ── CHALLENGE ── */}
        {stage.id === "challenge" && (
          <div className="anim-fade">
            <ChallengeStage onComplete={onHome} />
          </div>
        )}
      </div>
    </div>
  );
}
