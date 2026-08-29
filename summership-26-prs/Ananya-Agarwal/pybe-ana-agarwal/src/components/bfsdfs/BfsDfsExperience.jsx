import React, { useState, useRef } from "react";
import ThoughtPaths from "../shared/ThoughtPaths.jsx";
import LineIdentify from "../shared/LineIdentify.jsx";
import TreeExplorer from "./TreeExplorer.jsx";
import TraversalViz from "./TraversalViz.jsx";
import CodePanel from "../shared/CodePanel.jsx";
import CoderModeOverlay from "../coder/CoderModeOverlay.jsx";
import { useSession } from "../../context/SessionContext.jsx";
import {
  STAGES, STRATEGY_OPTIONS, STRATEGY_BRANCH_INTROS,
  DFS_CODE, BFS_CODE, COMPARISON_ROWS,
  DFS_ANNOTATION, BFS_ANNOTATION,
  DFS_ORDER, BFS_ORDER,
  REFLECT_SCENARIOS,
} from "../../data/bfsDfsData.js";

/* ── Stage progress ── */
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
          aria-label={`Stage ${i + 1}: ${s.title}`}
        />
      ))}
    </div>
  );
}

/* ── Reflect stage — two scenarios, both picks get reasoning ── */
function ReflectStage({ onComplete }) {
  const [scenarioAnswers, setScenarioAnswers] = useState({});
  const [transferText, setTransferText] = useState("");
  const [transferSubmitted, setTransferSubmitted] = useState(false);
  const allAnswered = REFLECT_SCENARIOS.every(s => scenarioAnswers[s.id] !== undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Callback to recursion */}
      <div className="callback-banner">
        <span className="callback-icon">🔁</span>
        <span>
          Notice: the DFS code from earlier looks almost identical to the recursive book-stack search — because it <em>is</em> the same idea. A function calling itself is DFS on the call tree.
        </span>
      </div>

      {/* Two mini-scenarios */}
      {REFLECT_SCENARIOS.map((sc, si) => {
        const answer = scenarioAnswers[sc.id];
        const answered = answer !== undefined;
        return (
          <div key={sc.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="scenario-card">
              <div className="scenario-label">Scenario {si + 1}</div>
              <p className="scenario-text">{sc.scenario}</p>
            </div>

            <div className="question-heading">{sc.question}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sc.options.map((opt, oi) => {
                const isSelected = answer === oi;
                const isOther = answered && !isSelected;
                return (
                  <button
                    key={oi}
                    className={`thought-option${isSelected ? " selected" : ""}`}
                    disabled={answered && !isSelected}
                    onClick={() => !answered && setScenarioAnswers(prev => ({ ...prev, [sc.id]: oi }))}
                    style={{ opacity: isOther ? 0.4 : 1 }}
                  >
                    <div className={`thought-letter${isSelected ? " selected" : ""}`}>{opt.letter}</div>
                    <span style={{ flex: 1, textAlign: "left" }}>{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Both options get reasoning — no wrong answer */}
            {answered && (
              <div className={`thought-feedback ${sc.options[answer].feedbackType} anim-fade`} role="status">
                <div className="thought-feedback-label">
                  {sc.options[answer].feedbackType === "good" ? "✓ Good thinking" : "💡 Worth noting"}
                </div>
                <div className="thought-feedback-body">{sc.options[answer].feedback}</div>
              </div>
            )}
          </div>
        );
      })}

      {/* Transfer-check — free text */}
      {allAnswered && !transferSubmitted && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
            In your own words:
          </div>
          <div style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.7 }}>
            If a friend asked "when do I use BFS vs DFS?" — what would you tell them? Write 1–2 sentences.
          </div>
          <textarea
            className="textarea"
            placeholder="Type your answer here..."
            value={transferText}
            onChange={(e) => setTransferText(e.target.value)}
            style={{ minHeight: 80 }}
          />
          <button
            className="btn btn-primary"
            style={{ alignSelf: "flex-start" }}
            disabled={transferText.trim().length === 0}
            onClick={() => setTransferSubmitted(true)}
          >
            Submit →
          </button>
        </div>
      )}

      {/* Final discovery banner — shown after transfer-check */}
      {transferSubmitted && (
        <div className="discovery-banner anim-fade">
          <div className="discovery-icon">💡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Here's how programmers think about it</div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-2)", margin: 0 }}>
              Stack → newest discovery first → go deep. Queue → oldest discovery first → spread wide. <strong>Change the data structure, change the journey.</strong> The code is otherwise identical.
            </p>
          </div>
        </div>
      )}

      {transferSubmitted && (
        <button className="btn btn-emerald anim-fade" style={{ alignSelf: "flex-start" }} onClick={onComplete}>
          ✓ Complete BFS vs DFS experience
        </button>
      )}
    </div>
  );
}

/* ── Compare stage ── */
function CompareStage({ onComplete }) {
  const [activeMode, setActiveMode] = useState("dfs");
  const [dfsComplete, setDfsComplete] = useState(false);
  const [bfsComplete, setBfsComplete] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "14px 18px", borderRadius: "var(--r)", background: "var(--surface)", border: "1px solid var(--border)", fontSize: 14.5, lineHeight: 1.75 }}>
        Run both strategies on the same tree. Watch the order of visits and which data structure is used. They both find all apples — the journey is completely different.
      </div>

      <div style={{ display: "flex", gap: 8, padding: "4px", background: "var(--bg-2)", borderRadius: "var(--r-sm)", width: "fit-content" }}>
        {[["dfs", "📚 Stack-first"], ["bfs", "🌊 Queue-first"]].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveMode(id)}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "var(--font)", fontWeight: 600, fontSize: 13.5,
              background: activeMode === id ? "white" : "transparent",
              color: activeMode === id ? "var(--indigo)" : "var(--muted)",
              boxShadow: activeMode === id ? "var(--shadow-sm)" : "none",
              transition: "all 0.18s ease",
            }}
          >{label}</button>
        ))}
      </div>

      <TraversalViz
        key={activeMode}
        mode={activeMode}
        onComplete={() => {
          if (activeMode === "dfs") setDfsComplete(true);
          else setBfsComplete(true);
        }}
      />

      {(dfsComplete || bfsComplete) && (
        <div className="anim-fade glass-strong" style={{ borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>
            Stack-first vs Queue-first — direct comparison
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: "var(--bg-2)" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--muted)", fontWeight: 600, fontSize: 12, width: "26%" }}>Aspect</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "var(--indigo)", fontWeight: 600, fontSize: 12 }}>📚 Depth-First (DFS)</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#1a6b29", fontWeight: 600, fontSize: 12 }}>🌊 Breadth-First (BFS)</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 16px", color: "var(--text-3)", fontWeight: 600 }}>{row.aspect}</td>
                    <td style={{ padding: "10px 16px", color: "var(--text-2)", lineHeight: 1.55 }}>{row.dfs}</td>
                    <td style={{ padding: "10px 16px", color: "var(--text-2)", lineHeight: 1.55 }}>{row.bfs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dfsComplete && bfsComplete && (
        <button className="btn btn-primary anim-fade" style={{ alignSelf: "flex-start" }} onClick={onComplete}>
          When would you choose each? →
        </button>
      )}
    </div>
  );
}

/* ── Main Experience ── */
export default function BfsDfsExperience({ onHome }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [strategySelected, setStrategySelected] = useState(null);
  const [strategyBranchHint, setStrategyBranchHint] = useState("depth");
  const [strategyDone, setStrategyDone] = useState(false);
  const [explorationDone, setExplorationDone] = useState(false);
  const [dfsCodeIdentified, setDfsCodeIdentified] = useState(false);
  const [bfsCodeIdentified, setBfsCodeIdentified] = useState(false);
  const [coderConcept, setCoderConcept] = useState(null); // null | 'dfs' | 'bfs'
  const bodyRef = useRef(null);
  const { tendency, recordChoice } = useSession();

  if (coderConcept) {
    return <CoderModeOverlay concept={coderConcept} onClose={() => setCoderConcept(null)} />;
  }

  const scrollTop = () => setTimeout(() => bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
  const goNext = () => { setStageIdx((i) => Math.min(i + 1, STAGES.length - 1)); scrollTop(); };
  const goPrev = () => { setStageIdx((i) => Math.max(0, i - 1)); scrollTop(); };
  const goTo  = (idx) => { setStageIdx(idx); scrollTop(); };

  const stage = STAGES[stageIdx];
  const branchIntro = STRATEGY_BRANCH_INTROS[strategyBranchHint] || STRATEGY_BRANCH_INTROS.depth;

  // Tendency-based bridge sentence for the story stage
  const tendencyBridge = tendency === "brute"
    ? "You've been building an instinct for why splitting a problem helps. Now let's see that same idea in a branching tree — where each node has multiple sub-problems."
    : tendency === "divide"
    ? "You've spotted the self-similarity pattern. Trees take it further — each node is its own sub-problem, and there can be more than two children."
    : "Let's take the same divide-and-conquer thinking from the notebook search and apply it to a tree — where branches can go in multiple directions.";

  return (
    <div className="experience-shell">
      <div className="stage-header">
        <button className="btn btn-sm btn-icon" onClick={onHome} aria-label="Go home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="stage-badge tag tag-emerald">🌲 BFS vs DFS</span>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Stage {stageIdx + 1} of {STAGES.length}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className={`btn btn-sm ${stage.id === "dfs-code" || stage.id === "bfs-code" ? "coder-btn-highlight pulse-glow" : "coder-btn-header"}`}
            onClick={() => setCoderConcept(stage.id === "bfs-code" ? "bfs" : "dfs")}
          >
            ⌨️ Coder Mode
          </button>
          <StageProgress current={stageIdx} stages={STAGES} onClickStage={goTo} />
        </div>
      </div>

      <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: "32px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div className="anim-fade" style={{ marginBottom: 28 }}>
          <h1 className="stage-title">{stage.title}</h1>
          <p className="stage-subtitle">{stage.subtitle}</p>
        </div>

        {/* ── STORY ── */}
        {stage.id === "story" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Callback to recursion module */}
            <div className="callback-banner">
              <span className="callback-icon">📚</span>
              <span>{tendencyBridge}</span>
            </div>

            <div className="story-card">
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ fontSize: 48 }}>🌳</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#1a6b29", marginBottom: 8 }}>
                    The situation
                  </div>
                  <p style={{ fontSize: 16, lineHeight: 1.8, margin: 0 }}>
                    Someone reorganised your notebooks — not in a line, but into <strong>boxes inside boxes</strong>, like folders inside folders. Somewhere in there, scattered across different branches, are <strong>three apples</strong> 🍎.
                  </p>
                  <p style={{ fontSize: 16, lineHeight: 1.8, margin: "12px 0 0" }}>
                    You start at the root box. Your task: <strong>find all the apples</strong>. How you explore is up to you.
                  </p>
                </div>
              </div>
              <div style={{ padding: "14px 18px", background: "rgba(52,199,89,0.07)", border: "1px solid rgba(52,199,89,0.2)", borderRadius: "var(--r-sm)", fontSize: 14.5, lineHeight: 1.75, fontStyle: "italic" }}>
                No algorithms yet. No DFS, no BFS. Just you, a tree, and three apples to find.
              </div>
            </div>

            <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={goNext}>
              Start exploring →
            </button>
          </div>
        )}

        {/* ── EXPLORE ── */}
        {stage.id === "explore" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ padding: "14px 18px", background: "var(--emerald-light)", border: "1px solid rgba(52,199,89,0.25)", borderRadius: "var(--r)", fontSize: 14.5, lineHeight: 1.75 }}>
              <strong>Click nodes to explore.</strong> You can only move to nodes connected to one you've already visited. Find all three apples 🍎 — in whatever order feels right.
            </div>

            <TreeExplorer
              mode="free"
              onDone={() => setExplorationDone(true)}
            />

            {explorationDone && (
              <button className="btn btn-primary anim-fade" style={{ alignSelf: "flex-start" }} onClick={goNext}>
                Reflect on your strategy →
              </button>
            )}
          </div>
        )}

        {/* ── STRATEGY ── */}
        {stage.id === "strategy" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <ThoughtPaths
              question="Think back to how you moved through the tree. Which description fits your exploration?"
              options={STRATEGY_OPTIONS}
              selected={strategySelected}
              onSelect={(idx, hint) => {
                setStrategySelected(idx);
                setStrategyBranchHint(hint || "depth");
                setStrategyDone(true);
                recordChoice({ module: "bfsdfs", stage: "strategy", optionIdx: idx, branchHint: hint });
              }}
              disabled={strategyDone}
            />

            {strategyDone && (
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn" onClick={goPrev}>← Back</button>
                <button className="btn btn-primary" onClick={goNext}>How do you remember where to go back? →</button>
              </div>
            )}
          </div>
        )}

        {/* ── DFS FORMAL ── */}
        {stage.id === "dfs-formal" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Branch intro based on strategy chosen */}
            <div className="scenario-card">
              <div className="scenario-label">Following your thinking...</div>
              <p className="scenario-text">{branchIntro}</p>
            </div>

            <div className="question-heading">When you "set aside" a box to come back to later — how do you think you should keep track of those boxes?</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                {
                  key: "stack",
                  label: "A pile — I grab the most recently set-aside box first",
                  reveal: (
                    <>
                      <div className="thought-feedback insight anim-fade" style={{ marginTop: 8 }}>
                        <div className="thought-feedback-label">💡 That's exactly what produces depth-first exploration</div>
                        <div className="thought-feedback-body">Last-in, first-out: you always return to the most recently discovered branch. Programmers call this a <strong>stack</strong>.</div>
                        <div className="concept-reveal anim-pop">DFS uses a stack — that's why it goes deep before coming back.</div>
                      </div>
                    </>
                  ),
                },
                {
                  key: "queue",
                  label: "A line — I grab the earliest set-aside box first",
                  reveal: (
                    <>
                      <div className="thought-feedback good anim-fade" style={{ marginTop: 8 }}>
                        <div className="thought-feedback-label">✓ That's what produces level-by-level exploration</div>
                        <div className="thought-feedback-body">First-in, first-out: you visit the oldest discovered box next. Programmers call this a <strong>queue</strong>.</div>
                        <div className="concept-reveal anim-pop">BFS uses a queue — that's why it spreads wide before going deep.</div>
                      </div>
                    </>
                  ),
                },
              ].map(opt => (
                <FormalOption key={opt.key} label={opt.label} reveal={opt.reveal} />
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>See the stack-first strategy in Python →</button>
            </div>
          </div>
        )}

        {/* ── DFS CODE ── */}
        {stage.id === "dfs-code" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: "14px 18px", background: "var(--indigo-light)", border: "1px solid rgba(88,86,214,0.2)", borderRadius: "var(--r)", fontSize: 14.5, lineHeight: 1.75 }}>
              Here is depth-first search in Python. Before reading it — tap the line you think is the stack operation.
            </div>

            {!dfsCodeIdentified ? (
              <LineIdentify
                code={DFS_CODE}
                targets={[
                  {
                    lineNum: DFS_ANNOTATION.targetLineNum,
                    role: "base-case",
                    promptText: DFS_ANNOTATION.prompt,
                    correctHint: DFS_ANNOTATION.correctHint,
                  },
                ]}
                onComplete={() => setDfsCodeIdentified(true)}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div className="panel-label">Python — Depth-First Search</div>
                    <CodePanel code={DFS_CODE} maxHeight="280px" />
                  </div>
                  <div>
                    <div className="panel-label">Live traversal</div>
                    <TraversalViz mode="dfs" onComplete={undefined} />
                  </div>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "var(--r)", background: "var(--surface)", border: "1px solid var(--border)", fontSize: 13.5, lineHeight: 1.7 }}>
                  <strong>Key observation:</strong> <code style={{ fontSize: 12, background: "var(--bg-2)", padding: "1px 5px", borderRadius: 3 }}>stack.pop()</code> removes from the <em>end</em> (LIFO). The most recently discovered node is the next to be visited — that's what makes it go deep.
                </div>
                <div style={{
                  padding: "16px 20px", borderRadius: "var(--r-lg)",
                  background: "linear-gradient(135deg, rgba(88,86,214,0.08), rgba(0,122,255,0.06))",
                  border: "1.5px solid rgba(88,86,214,0.2)",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <div style={{ fontSize: 28 }}>⌨️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>Build the DFS function yourself</div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>Drag stack, pop, and loop blocks to assemble DFS — then run it to see the traversal order.</div>
                  </div>
                  <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={() => setCoderConcept("dfs")}>
                    ⌨️ Build it →
                  </button>
                </div>
                <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={goNext}>
                  Next stage →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── BFS DISCOVER ── */}
        {stage.id === "bfs-discover" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="scenario-card">
              <div className="scenario-label">A different kind of memory</div>
              <p className="scenario-text">
                Instead of a pile — what if you kept a <em>line</em>, where the first box you set aside is the first one you go back to? How would that change the order of exploration?
              </p>
            </div>

            <div className="question-heading">If you grab the <em>oldest</em> set-aside box first, what order do you think you'd visit the tree?</div>

            {/* Level diagram */}
            <div style={{ padding: "20px", background: "var(--bg)", borderRadius: "var(--r-lg)", border: "1px solid var(--border)" }}>
              {[
                { level: "Level 0", nodes: ["START"] },
                { level: "Level 1", nodes: ["A", "B"] },
                { level: "Level 2", nodes: ["C", "D", "E", "F"] },
                { level: "Level 3", nodes: ["G", "H"] },
              ].map(({ level, nodes }) => (
                <div key={level} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", width: 60, flexShrink: 0 }}>{level}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {nodes.map((n) => {
                      const hasApple = ["C", "F", "H"].includes(n);
                      return (
                        <div key={n} style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: hasApple ? "var(--emerald-light)" : "var(--surface)",
                          border: `2px solid ${hasApple ? "var(--emerald)" : "var(--border-2)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, fontFamily: "var(--mono)",
                          color: hasApple ? "#1a6b29" : "var(--text-2)", position: "relative",
                        }}>
                          {n}
                          {hasApple && <span style={{ position: "absolute", top: -8, right: -8, fontSize: 12 }}>🍎</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ height: 1, flex: 1, borderBottom: "1px dashed var(--border-2)" }} />
                </div>
              ))}
            </div>

            <div className="discovery-banner">
              <div className="discovery-icon">💡</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Level-by-level exploration</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-2)", margin: 0 }}>
                  To visit all of Level 1 before Level 2, you need to remember all Level 1 nodes while still at Level 0. A queue — first in, first out — does exactly this. Whatever you discovered first gets visited first.
                </p>
                <div className="concept-reveal anim-pop" style={{ marginTop: 12 }}>
                  BFS = queue-based — oldest discovery visited next → level-by-level order.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>BFS in Python →</button>
            </div>
          </div>
        )}

        {/* ── BFS CODE ── */}
        {stage.id === "bfs-code" && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: "14px 18px", background: "var(--emerald-light)", border: "1px solid rgba(52,199,89,0.2)", borderRadius: "var(--r)", fontSize: 14.5, lineHeight: 1.75 }}>
              BFS looks almost identical to DFS in Python. Before reading — tap the line you think is the queue operation.
            </div>

            {!bfsCodeIdentified ? (
              <LineIdentify
                code={BFS_CODE}
                targets={[
                  {
                    lineNum: BFS_ANNOTATION.targetLineNum,
                    role: "recursive",
                    promptText: BFS_ANNOTATION.prompt,
                    correctHint: BFS_ANNOTATION.correctHint,
                  },
                ]}
                onComplete={() => setBfsCodeIdentified(true)}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div className="panel-label">Python — Breadth-First Search</div>
                    <CodePanel code={BFS_CODE} maxHeight="280px" />
                  </div>
                  <div>
                    <div className="panel-label">Live traversal</div>
                    <TraversalViz mode="bfs" onComplete={undefined} />
                  </div>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "var(--r)", background: "var(--surface)", border: "1px solid var(--border)", fontSize: 13.5, lineHeight: 1.7 }}>
                  <strong>One small change:</strong> <code style={{ fontSize: 12, background: "var(--bg-2)", padding: "1px 5px", borderRadius: 3 }}>queue.pop(0)</code> vs <code style={{ fontSize: 12, background: "var(--bg-2)", padding: "1px 5px", borderRadius: 3 }}>stack.pop()</code> — completely different traversal order.
                </div>
                <div style={{
                  padding: "16px 20px", borderRadius: "var(--r-lg)",
                  background: "linear-gradient(135deg, rgba(88,86,214,0.08), rgba(0,122,255,0.06))",
                  border: "1.5px solid rgba(88,86,214,0.2)",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <div style={{ fontSize: 28 }}>⌨️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>Build the BFS function yourself</div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>Drag queue, dequeue, and loop blocks to assemble BFS — then run it to see how the level-by-level journey works.</div>
                  </div>
                  <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={() => setCoderConcept("bfs")}>
                    ⌨️ Build it →
                  </button>
                </div>
                <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={goNext}>
                  Compare journeys →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── COMPARE ── */}
        {stage.id === "compare" && (
          <div className="anim-fade">
            <CompareStage onComplete={goNext} />
          </div>
        )}

        {/* ── REFLECT ── */}
        {stage.id === "reflect" && (
          <div className="anim-fade">
            <ReflectStage onComplete={onHome} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Local helper for DFS Formal stage ── */
function FormalOption({ label, reveal }) {
  const [picked, setPicked] = useState(false);
  return (
    <div>
      <button
        className={`thought-option${picked ? " selected" : ""}`}
        onClick={() => setPicked(true)}
        disabled={picked}
        aria-pressed={picked}
      >
        <div className={`thought-letter${picked ? " selected" : ""}`}>{picked ? "✓" : "?"}</div>
        <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      </button>
      {picked && reveal}
    </div>
  );
}
