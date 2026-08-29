import React, {
  useState, useEffect, useRef, useCallback
} from "react";
import { TOOL_PALETTES, BLOCK_DEFS } from "../../data/toolBlocks.js";
import {
  createBlock, insertBlock, removeBlock, flattenIds,
  generatePythonCode, generateRunSteps, validateTree, evaluateBlockTree,
} from "./blockEngine.js";
import CoderTour, { TOUR_KEY } from "./CoderTour.jsx";

/* ─────────────────────────────────────────────
   BLOCK SVG ICONS
   ───────────────────────────────────────────── */
const ICONS = {
  def: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="3" width="16" height="14" rx="3" />
      <path d="M6 8h8M6 12h5" strokeLinecap="round" />
    </svg>
  ),
  "if-base": (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 3L17 17H3L10 3z" strokeLinejoin="round" />
      <path d="M10 9v4M10 14.5v.5" strokeLinecap="round" />
    </svg>
  ),
  "return-base": (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10h12M12 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "return-true": (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10h12M12 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="10" r="2" fill="currentColor" />
    </svg>
  ),
  split: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 3v5M5 12l5-4 5 4M5 12v5M15 12v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "call-self": (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 6c1 1 2 2.5 2 4a6 6 0 01-12 0c0-2 1-3.5 2-4" strokeLinecap="round" />
      <path d="M10 2v6M8 5l2-3 2 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  combine: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5v3l6 3 6-3V5M4 12l6 3 6-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "while-loop": (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 4a6 6 0 100 12 6 6 0 000-12z" />
      <path d="M10 7v3l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "pop-stack": (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="9" width="14" height="4" rx="2" />
      <rect x="5" y="13" width="10" height="4" rx="2" />
      <path d="M10 9V4M7 7l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  dequeue: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="8" width="14" height="4" rx="2" />
      <path d="M6 8V5M10 8V5M14 8V5M3 12l3 3M6 15h8" strokeLinecap="round" />
    </svg>
  ),
  "check-visited": (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10" cy="10" r="7" />
      <path d="M7 10l2.5 2.5L14 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "add-neighbors": (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10" cy="6" r="3" />
      <circle cx="4" cy="15" r="2.5" />
      <circle cx="16" cy="15" r="2.5" />
      <path d="M8 9l-2.5 4M12 9l2.5 4" strokeLinecap="round" />
    </svg>
  ),
  "push-stack": (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="9" width="14" height="4" rx="2" />
      <rect x="5" y="13" width="10" height="4" rx="2" />
      <path d="M10 9V4M7 7l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  enqueue: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="8" width="14" height="4" rx="2" />
      <path d="M6 8V5M10 8V5M14 8V5M17 12l-3 3M14 15H6" strokeLinecap="round" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   TOOLBOX
   ───────────────────────────────────────────── */
function ToolCard({ blockDef }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={`tool-card ${dragging ? "dragging" : ""}`}
      draggable
      onDragStart={(e) => {
        setDragging(true);
        e.dataTransfer.setData("blockType", blockDef.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onDragEnd={() => setDragging(false)}
      style={{ "--tool-color": blockDef.color }}
      title={blockDef.description}
    >
      <div className="tool-card-icon" style={{ color: blockDef.color }}>
        {ICONS[blockDef.id] || <span style={{ fontSize: 16 }}>⬜</span>}
      </div>
      <div className="tool-card-label">{blockDef.label}</div>
    </div>
  );
}

function CoderToolbox({ concept, toolboxRef, collapsed, onToggle }) {
  const palette = TOOL_PALETTES[concept] || TOOL_PALETTES.recursion;

  if (collapsed) {
    return (
      <aside className="coder-toolbox collapsed" onClick={onToggle} style={{ width: 40, cursor: "pointer" }} title="Expand toolbox">
        <button className="panel-toggle-btn expand-btn" onClick={(e) => { e.stopPropagation(); onToggle(); }}>›</button>
        <div className="collapsed-label">🧰 Tools</div>
      </aside>
    );
  }

  return (
    <aside className="coder-toolbox" ref={toolboxRef} id="coder-toolbox">
      <div className="coder-toolbox-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <span className="coder-zone-label">🧰 Tools</span>
          <button className="panel-toggle-btn" onClick={onToggle} title="Collapse toolbox">‹</button>
        </div>
        <span className="coder-zone-hint">Drag to canvas</span>
      </div>
      <div className="coder-tool-list">
        {palette.map(def => (
          <ToolCard key={def.id} blockDef={def} />
        ))}
      </div>
      <div className="coder-toolbox-footer">
        {palette.length} blocks · scoped
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────
   CANVAS BLOCK RENDERER
   ───────────────────────────────────────────── */
function CanvasBlock({ block, activeBlockId, onRemove, onDropInside, concept, blockRefs, onReject }) {
  const [dropHover, setDropHover] = useState(false);
  const [shake, setShake] = useState(false);
  const myRef = useRef(null);

  useEffect(() => {
    if (blockRefs) blockRefs.current[block.id] = myRef;
    return () => { if (blockRefs) delete blockRefs.current[block.id]; };
  }, [block.id, blockRefs]);

  const def = BLOCK_DEFS[block.type];
  if (!def) return null;

  const isActive = activeBlockId === block.id;

  const handleDragOver = (e) => {
    if (!def.isContainer) {
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setDropHover(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropHover(false);
    const blockType = e.dataTransfer.getData("blockType");
    if (!blockType) return;

    const newDef = BLOCK_DEFS[blockType];
    if (!newDef) return;

    // Check valid child
    if (def.isContainer && def.validChildren.includes(blockType)) {
      onDropInside(block.id, blockType);
    } else {
      // Shake — invalid drop
      setShake(true);
      setTimeout(() => setShake(false), 500);
      
      const parentDef = BLOCK_DEFS[block.type];
      const childDef = BLOCK_DEFS[blockType];
      const reason = childDef.rejectReason || `Block '${childDef.label}' cannot be placed inside '${parentDef.label}'.`;
      onReject(reason);
    }
  };

  return (
    <div
      ref={myRef}
      className={`canvas-block ${isActive ? "canvas-block-active" : ""} ${shake ? "canvas-block-shake" : ""} ${dropHover ? "canvas-block-drop-hover" : ""}`}
      style={{ "--block-color": def.color, "--block-bg": def.bgColor }}
      onDragOver={def.isContainer ? handleDragOver : undefined}
      onDragLeave={def.isContainer ? () => setDropHover(false) : undefined}
      onDrop={def.isContainer ? handleDrop : undefined}
    >
      {/* Block header */}
      <div className="canvas-block-header" style={{ borderLeftColor: def.color }}>
        <span className="canvas-block-icon" style={{ color: def.color }}>
          {ICONS[block.type]}
        </span>
        <span className="canvas-block-label">{def.label}</span>
        {isActive && <span className="canvas-block-active-badge">▶ running</span>}
        <button
          className="canvas-block-remove"
          onClick={() => onRemove(block.id)}
          title="Remove block"
          aria-label="Remove"
        >✕</button>
      </div>

      {/* Children + inner drop zone (containers only) */}
      {def.isContainer && (
        <div className={`canvas-block-children ${dropHover ? "drop-highlight" : ""}`}>
          {block.children.length === 0 && !dropHover && (
            <div className="canvas-block-empty">
              Drop blocks here ↓
            </div>
          )}
          {block.children.map(child => (
            <CanvasBlock
              key={child.id}
              block={child}
              activeBlockId={activeBlockId}
              onRemove={onRemove}
              onDropInside={onDropInside}
              concept={concept}
              blockRefs={blockRefs}
              onReject={onReject}
            />
          ))}
          {dropHover && (
            <div className="canvas-drop-zone-active">
              <span>Drop here</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   RUN PANEL (right rail)
   ───────────────────────────────────────────── */
function RunPanel({ runState, onRun, onNext, onPrev, onReset, issues, runBtnRef, runPanelRef, collapsed, onToggle }) {
  const { steps, currentStep, playing } = runState || { steps: [], currentStep: -1, playing: false };
  const step = steps[currentStep];
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  const [explainOpen, setExplainOpen] = useState(false);

  // Auto-close explanation when step changes
  useEffect(() => {
    setExplainOpen(false);
  }, [currentStep]);

  if (collapsed) {
    return (
      <aside className="coder-run-panel collapsed" onClick={onToggle} style={{ width: 40, cursor: "pointer" }} title="Expand run panel">
        <button className="panel-toggle-btn expand-btn" onClick={(e) => { e.stopPropagation(); onToggle(); }}>‹</button>
        <div className="collapsed-label">⚡ Run & Visualize</div>
      </aside>
    );
  }

  // Extract block type for "Why" details
  const blockType = step?.blockId ? step.blockId.split("_").pop() : null;
  const blockDef = blockType ? BLOCK_DEFS[blockType] : null;
  const hasExplanation = blockDef && blockDef.whyTitle && blockDef.whyText;

  return (
    <aside className="coder-run-panel" ref={runPanelRef} id="coder-run-panel">
      <div className="coder-zone-label" style={{ padding: "16px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>⚡ Run & Visualize</span>
        <button className="panel-toggle-btn" onClick={onToggle} title="Collapse run panel">›</button>
      </div>

      {/* Issues preview */}
      {issues.length > 0 && currentStep === -1 && (
        <div className="run-issues">
          {issues.map((iss, i) => (
            <div key={i} className="run-issue-item">⚠️ {iss}</div>
          ))}
          <div className="run-issue-note">Run anyway → see what happens</div>
        </div>
      )}

      {/* Run controls */}
      <div className="run-controls-bar">
        <button
          id="coder-run-btn"
          ref={runBtnRef}
          className="coder-run-btn"
          onClick={onRun}
          disabled={playing}
        >
          {currentStep === -1 ? "▶ Run" : "▶ Restart"}
        </button>
        {currentStep > -1 && (
          <>
            <button className="coder-step-btn" onClick={onPrev} disabled={currentStep <= 0}>‹</button>
            <button className="coder-step-btn" onClick={onNext} disabled={currentStep >= steps.length - 1}>›</button>
            <button className="coder-step-btn" onClick={onReset} title="Reset">↺</button>
          </>
        )}
      </div>

      {/* Progress bar */}
      {steps.length > 0 && currentStep > -1 && (
        <div className="run-progress-bar">
          <div className="run-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Current step display */}
      {step && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "12px 14px", flexShrink: 0 }}>
          <div className={`run-step-display anim-fade ${step.type}`} style={{ margin: 0 }} key={currentStep}>
            <div className="run-step-counter">Step {currentStep + 1} / {steps.length}</div>
            <div className="run-step-label">{step.label}</div>
            {step.depth > 0 && (
              <div className="run-step-depth">
                {"→ ".repeat(step.depth)} depth {step.depth}
              </div>
            )}
          </div>
          
          {hasExplanation && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                className="btn-explain-why"
                onClick={() => setExplainOpen(prev => !prev)}
              >
                {explainOpen ? "🙈 Hide explanation" : "🤔 Why? Explain more"}
              </button>
              {explainOpen && (
                <div className="step-explanation-card anim-pop">
                  <div className="step-explain-title">{blockDef.whyTitle}</div>
                  <p className="step-explain-text">{blockDef.whyText}</p>
                  {blockDef.whyExample && (
                    <>
                      <div className="step-explain-example-label">Standalone Example:</div>
                      <pre className="step-explain-code">{blockDef.whyExample}</pre>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Idle state */}
      {currentStep === -1 && (
        <div className="run-idle">
          <div className="run-idle-icon">▶</div>
          <div className="run-idle-text">Build something, then hit Run to see it execute step by step.</div>
        </div>
      )}

      {/* Completion */}
      {currentStep > -1 && currentStep === steps.length - 1 && (
        <div className="run-complete anim-fade">
          <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Run complete!</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
            {steps.filter(s => !s.virtual).length} real steps executed
          </div>
        </div>
      )}
    </aside>
  );
}

/* ─────────────────────────────────────────────
   📥 INPUT/OUTPUT VISUALIZER
   ───────────────────────────────────────────── */
function InputOutputVisualizer({ concept, blockTree }) {
  const [stackSize, setStackSize] = useState(4);
  const [targetIndex, setTargetIndex] = useState(2);
  const [startNode, setStartNode] = useState("start");
  const [appleNodes, setAppleNodes] = useState(["C", "F", "H"]);
  const [runLog, setRunLog] = useState("");

  useEffect(() => {
    let inputs = {};
    if (concept === "recursion") {
      const stack = Array.from({ length: stackSize }, (_, i) =>
        i === targetIndex ? "math notes" : "novel"
      );
      inputs = { stack };
    } else {
      inputs = { startNode, appleNodes };
    }
    const res = evaluateBlockTree(blockTree, concept, inputs);
    setRunLog(res.output);
  }, [blockTree, concept, stackSize, targetIndex, startNode, appleNodes]);

  return (
    <div className="io-visualizer">
      <div className="io-controls">
        {concept === "recursion" ? (
          <>
            <div className="io-control-row">
              <span className="io-control-label">Notebooks stack:</span>
              <div style={{ display: "flex", gap: 4 }}>
                {[4, 8, 12].map(sz => (
                  <button
                    key={sz}
                    className={`btn btn-xs ${stackSize === sz ? "btn-primary" : "btn-outline"}`}
                    onClick={() => {
                      setStackSize(sz);
                      if (targetIndex >= sz) setTargetIndex(sz - 1);
                    }}
                  >
                    {sz} books
                  </button>
                ))}
              </div>
            </div>
            
            <div className="io-control-row">
              <span className="io-control-label">Math notes position:</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {Array.from({ length: stackSize }).map((_, i) => (
                  <button
                    key={i}
                    className={`notebook-selector-btn ${targetIndex === i ? "selected" : ""}`}
                    onClick={() => setTargetIndex(i)}
                    title={`Set math notes at ${i + 1}`}
                  >
                    {targetIndex === i ? "📓" : "📒"}
                    <span className="notebook-num">{i + 1}</span>
                  </button>
                ))}
                <button
                  className={`notebook-selector-btn ${targetIndex === -1 ? "selected" : ""}`}
                  onClick={() => setTargetIndex(-1)}
                  title="No math notes in stack"
                >
                  ❌
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="io-control-row">
              <span className="io-control-label">Start node:</span>
              <div style={{ display: "flex", gap: 4 }}>
                {["start", "A", "B"].map(n => (
                  <button
                    key={n}
                    className={`btn btn-xs ${startNode === n ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setStartNode(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="io-control-row" style={{ marginTop: 8 }}>
              <span className="io-control-label">Apples inside:</span>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {["C", "F", "H"].map(id => {
                  const active = appleNodes.includes(id);
                  return (
                    <button
                      key={id}
                      className={`btn btn-xs ${active ? "btn-emerald" : "btn-outline"}`}
                      onClick={() => {
                        setAppleNodes(prev =>
                          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                        );
                      }}
                    >
                      🍎 Node {id}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="io-console">
        <div className="io-console-header">🖥️ Console Output</div>
        <pre className="io-console-log">{runLog}</pre>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN OVERLAY
   ───────────────────────────────────────────── */
export default function CoderModeOverlay({ concept = "recursion", onClose }) {
  const [blockTree, setBlockTree] = useState([]);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [runSteps, setRunSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [showTour, setShowTour] = useState(() => !localStorage.getItem(TOUR_KEY));
  const [isDragOver, setIsDragOver] = useState(false);

  // Collapsible panels state
  const [toolboxCollapsed, setToolboxCollapsed] = useState(false);
  const [runPanelCollapsed, setRunPanelCollapsed] = useState(false);
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);

  // Resizable sizes
  const [toolboxWidth, setToolboxWidth] = useState(192);
  const [runPanelWidth, setRunPanelWidth] = useState(280);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(220);

  // Rejection banner state
  const [rejectionMessage, setRejectionMessage] = useState("");

  const playTimerRef = useRef(null);
  const blockRefs = useRef({});

  // Tour target refs
  const toolboxRef = useRef(null);
  const canvasRef = useRef(null);
  const runBtnRef = useRef(null);
  const runPanelRef = useRef(null);

  const targetRefs = {
    toolbox: toolboxRef,
    canvas: canvasRef,
    "run-btn": runBtnRef,
    "run-panel": runPanelRef,
  };

  // Prevent body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Rejection message auto-dismiss
  useEffect(() => {
    if (rejectionMessage) {
      const t = setTimeout(() => setRejectionMessage(""), 5000);
      return () => clearTimeout(t);
    }
  }, [rejectionMessage]);

  // Keyboard: Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && !showTour) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, showTour]);

  // Resizing mouse down handlers
  const startResizeToolbox = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = toolboxWidth;
    
    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setToolboxWidth(Math.max(120, Math.min(300, startWidth + deltaX)));
    };
    
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const startResizeRunPanel = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = runPanelWidth;
    
    const onMouseMove = (moveEvent) => {
      const deltaX = startX - moveEvent.clientX;
      setRunPanelWidth(Math.max(200, Math.min(450, startWidth + deltaX)));
    };
    
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const startResizeBottomPanel = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = bottomPanelHeight;
    
    const onMouseMove = (moveEvent) => {
      const deltaY = startY - moveEvent.clientY;
      setBottomPanelHeight(Math.max(120, Math.min(450, startHeight + deltaY)));
    };
    
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  /* ── Block tree operations ── */
  const handleDropOnCanvas = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const blockType = e.dataTransfer.getData("blockType");
    if (!blockType) return;
    const def = BLOCK_DEFS[blockType];
    if (!def) return;
    
    // Limit to only 1 def block on the canvas to avoid def vs main block confusion
    const hasDef = blockTree.some(b => b.type === "def");
    if (blockType === "def" && hasDef) {
      setRejectionMessage("Only one function definition ('def') is allowed on the canvas. Nest other blocks inside it!");
      return;
    }

    // Only allow top-level drops if validParents includes null
    if (!def.validParents.includes(null)) {
      setRejectionMessage(def.rejectReason || `Block '${def.label}' cannot be placed at the top level.`);
      return;
    }
    const newBlock = createBlock(blockType);
    setBlockTree(t => insertBlock(t, null, newBlock));
  }, [blockTree]);

  const handleDropInside = useCallback((parentId, blockType) => {
    const newBlock = createBlock(blockType);
    setBlockTree(t => insertBlock(t, parentId, newBlock));
  }, []);

  const handleRemove = useCallback((blockId) => {
    setBlockTree(t => removeBlock(t, blockId));
    setCurrentStep(-1);
    setRunSteps([]);
  }, []);

  /* ── Run engine ── */
  const handleRun = useCallback(() => {
    const steps = generateRunSteps(blockTree, concept);
    setRunSteps(steps);
    setCurrentStep(0);
    setPlaying(true);
  }, [blockTree, concept]);

  const stepForward = useCallback(() => {
    setCurrentStep(s => Math.min(s + 1, runSteps.length - 1));
  }, [runSteps.length]);

  const stepBack = useCallback(() => {
    setCurrentStep(s => Math.max(0, s - 1));
  }, []);

  const resetRun = useCallback(() => {
    setCurrentStep(-1);
    setRunSteps([]);
    setPlaying(false);
    if (playTimerRef.current) clearInterval(playTimerRef.current);
  }, []);

  // Auto-play through steps
  useEffect(() => {
    if (!playing || currentStep < 0) return;
    if (playTimerRef.current) clearInterval(playTimerRef.current);
    playTimerRef.current = setInterval(() => {
      setCurrentStep(s => {
        if (s >= runSteps.length - 1) {
          clearInterval(playTimerRef.current);
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 900);
    return () => clearInterval(playTimerRef.current);
  }, [playing, runSteps.length]);

  // Sync active block from current step
  useEffect(() => {
    const step = runSteps[currentStep];
    if (step && !step.virtual) {
      setActiveBlockId(step.blockId);
    } else {
      setActiveBlockId(null);
    }
  }, [currentStep, runSteps]);

  const { issues } = validateTree(blockTree, concept);
  const pythonCode = generatePythonCode(blockTree, concept);

  const runState = { steps: runSteps, currentStep, playing };
  const conceptLabel = { recursion: "Recursion", dfs: "DFS", bfs: "BFS" }[concept] || concept;

  // Dynamic grid setup for collapsible side rails
  const bodyGridStyle = {
    display: "grid",
    gridTemplateColumns: `${toolboxCollapsed ? "40px" : `${toolboxWidth}px`} ${!toolboxCollapsed ? "4px" : ""} 1fr ${!runPanelCollapsed ? "4px" : ""} ${runPanelCollapsed ? "40px" : `${runPanelWidth}px`}`,
    flex: 1,
    overflow: "hidden",
  };

  return (
    <div className="coder-overlay" role="dialog" aria-modal="true" aria-label="Coder Mode">
      {/* Tour */}
      {showTour && <CoderTour onDone={() => setShowTour(false)} targetRefs={targetRefs} />}

      {/* Header */}
      <div className="coder-header">
        <div className="coder-header-left">
          <div className="coder-header-title">
            <span className="coder-header-badge">⌨️ Coder Mode</span>
            <span className="coder-header-concept">{conceptLabel}</span>
          </div>
          <div className="coder-header-hint">Build the code block by block — then run it</div>
        </div>
        <div className="coder-header-actions">
          <button
            className="coder-help-btn"
            onClick={() => setShowTour(true)}
            title="Replay tour"
            aria-label="Help / replay tour"
          >?</button>
          <button className="coder-close-btn" onClick={onClose} title="Exit Coder Mode (Esc)" aria-label="Close">
            ✕ Exit
          </button>
        </div>
      </div>

      {/* 3-Zone Body */}
      <div style={bodyGridStyle}>
        {/* Left: Toolbox */}
        <CoderToolbox
          concept={concept}
          toolboxRef={toolboxRef}
          collapsed={toolboxCollapsed}
          onToggle={() => setToolboxCollapsed(prev => !prev)}
        />
        
        {!toolboxCollapsed && (
          <div
            className="resize-handle-vertical"
            onMouseDown={startResizeToolbox}
            title="Drag to resize toolbox"
          />
        )}

        {/* Center: Canvas */}
        <div
          ref={canvasRef}
          className={`coder-canvas ${isDragOver ? "canvas-drag-over" : ""} ${blockTree.length === 0 ? "canvas-empty" : ""}`}
          id="coder-canvas"
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDropOnCanvas}
        >
          {/* Rejection Message Banner */}
          {rejectionMessage && (
            <div className="canvas-rejection-banner anim-fade">
              <span className="rejection-icon">⚠️</span>
              <span className="rejection-text">{rejectionMessage}</span>
              <button className="rejection-close" onClick={() => setRejectionMessage("")}>✕</button>
            </div>
          )}

          <div className="coder-canvas-inner">
            {blockTree.length === 0 ? (
              <div className="canvas-empty-state">
                <div className="canvas-empty-icon">📦</div>
                <div className="canvas-empty-title">Start with a "def function" block</div>
                <div className="canvas-empty-hint">Drag it from the toolbox on the left →</div>
              </div>
            ) : (
              blockTree.map(block => (
                <CanvasBlock
                  key={block.id}
                  block={block}
                  activeBlockId={activeBlockId}
                  onRemove={handleRemove}
                  onDropInside={handleDropInside}
                  concept={concept}
                  blockRefs={blockRefs}
                  onReject={setRejectionMessage}
                />
              ))
            )}
          </div>

          {/* Canvas footer actions */}
          {blockTree.length > 0 && (
            <div className="canvas-footer">
              <button className="canvas-clear-btn" onClick={() => { setBlockTree([]); resetRun(); }}>
                🗑 Clear canvas
              </button>
              <span className="canvas-block-count">{flattenIds(blockTree).length} block{flattenIds(blockTree).length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {!runPanelCollapsed && (
          <div
            className="resize-handle-vertical"
            onMouseDown={startResizeRunPanel}
            title="Drag to resize run panel"
          />
        )}

        {/* Right: Run Panel */}
        <RunPanel
          runState={runState}
          onRun={handleRun}
          onNext={stepForward}
          onPrev={stepBack}
          onReset={resetRun}
          issues={issues}
          runBtnRef={runBtnRef}
          runPanelRef={runPanelRef}
          collapsed={runPanelCollapsed}
          onToggle={() => setRunPanelCollapsed(prev => !prev)}
        />
      </div>

      {/* Resize Handle for Bottom Panel */}
      {!bottomPanelCollapsed && (
        <div
          className="resize-handle-horizontal"
          onMouseDown={startResizeBottomPanel}
          title="Drag to resize console"
        />
      )}

      {/* Expandable Bottom Drawer */}
      <div className={`coder-bottom-panel ${bottomPanelCollapsed ? "collapsed" : "expanded"}`} style={bottomPanelCollapsed ? {} : { height: bottomPanelHeight }}>
        <div className="bottom-panel-header">
          <span className="bottom-panel-title">💻 Code Equivalent & Live Sandbox Console</span>
          <button
            className="bottom-panel-toggle"
            onClick={() => setBottomPanelCollapsed(prev => !prev)}
            title={bottomPanelCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {bottomPanelCollapsed ? "▲" : "▼"}
          </button>
        </div>
        
        {!bottomPanelCollapsed && (
          <div className="bottom-panel-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, height: "calc(100% - 40px)", overflow: "hidden", padding: "12px 16px" }}>
            {/* Left: Code */}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#090d13", borderRadius: 8, border: "1px solid var(--coder-border)" }}>
              <div style={{ padding: "6px 12px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 11, fontWeight: 700, color: "var(--coder-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🐍 Live Python Translation
              </div>
              <pre className="coder-code-preview" style={{ flex: 1, margin: 0, border: "none", overflow: "auto", padding: 12 }}>{pythonCode}</pre>
            </div>
            
            {/* Right: I/O Visualizer */}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#07090e", borderRadius: 8, border: "1px solid var(--coder-border)" }}>
              <div style={{ padding: "6px 12px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 11, fontWeight: 700, color: "var(--coder-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                📥 Sandbox Console Input / Output
              </div>
              <InputOutputVisualizer
                concept={concept}
                blockTree={blockTree}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
