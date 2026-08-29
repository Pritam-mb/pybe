import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function apiFetch(path, options) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Chapter Card Overlay ──────────────────────────────────────────────
function ChapterCard({ arcLabel, actNumber, actName, concept, onStart }) {
  const [leaving, setLeaving] = useState(false);
  function handleStart() {
    setLeaving(true);
    setTimeout(onStart, 400); // match animation duration
  }
  return (
    <div className={`chapter-card-overlay ${leaving ? 'leaving' : ''}`}>
      <div className="chapter-arc-label">{arcLabel}</div>
      <div className="chapter-num">ACT {actNumber}</div>
      <div className="chapter-name">{actName}</div>
      <div className="chapter-concept">{concept}</div>
      <button className="chapter-btn" onClick={handleStart}>
        Begin Act {actNumber} ▶
      </button>
    </div>
  );
}

// ── Typewriter Dialogue Box ───────────────────────────────────────────
function DialogueBox({ speaker, text, avatarStr, onComplete, isLast }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    const speed = speaker.name === 'Narrator' ? 25 : 35;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speaker]);

  function handleAdvance() {
    if (isTyping) {
      setDisplayedText(text);
      setIsTyping(false);
    } else {
      onComplete();
    }
  }

  const isNarrator = speaker.name === 'Narrator';
  const isPip = speaker.name === 'Pip';
  
  let avatarClass = "char-avatar";
  if (isNarrator) avatarClass += " narrator";
  if (isPip) avatarClass += " pip";

  let nameClass = "char-name";
  if (isNarrator) nameClass += " narrator";
  if (isPip) nameClass += " pip";

  let textClass = "dialogue-text";
  if (isNarrator) textClass += " narrator-style";

  return (
    <div className="dialogue-area" onClick={handleAdvance} style={{ cursor: 'pointer' }}>
      <div className="dialogue-box">
        <div className={avatarClass}>{avatarStr}</div>
        <div className="dialogue-content">
          <div className={nameClass}>{speaker.name}</div>
          <div className={textClass}>
            {displayedText}
            {isTyping && <span className="dialogue-cursor" />}
          </div>
          {!isTyping && (
            <div className="dialogue-advance">
              <button className="advance-btn">
                {isLast ? 'Continue' : 'Next'} ▶
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Observation Input ────────────────────────────────────────────────
function ObservationInput({ prompt, questions, onSubmit, loading }) {
  const [answer, setAnswer] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!answer.trim() || loading) return;
    onSubmit(answer);
  }

  return (
    <div className="observation-panel">
      {prompt && (
        <div className="priya-prompt">
          <span style={{ fontSize: '1.2rem' }}>📝</span>
          <div>{prompt}</div>
        </div>
      )}
      
      <div className="question-chips">
        {questions.map((q, i) => (
          <div className="question-chip" key={i}>
            <span className="q-num">{i + 1}</span>
            <span>{q}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea 
          className="obs-textarea"
          placeholder="Type your observation..."
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          disabled={loading}
        />
        <div className="obs-actions">
          <button className="btn-submit" type="submit" disabled={!answer.trim() || loading}>
            {loading ? <><div className="spin"/> Evaluating...</> : 'Record in Journal'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Pip Correction ───────────────────────────────────────────────────
function OwlCorrection({ misconception, question }) {
  return (
    <div className="owl-correction">
      <div className="owl-avatar">🦉</div>
      <div className="owl-body">
        <div className="owl-name">Pip the Owl</div>
        {misconception && <div className="owl-misconception">{misconception}</div>}
        <div className="owl-question">{question}</div>
      </div>
    </div>
  );
}

// ── Code Solve ───────────────────────────────────────────────────────
function CodeSolve({ codeReveal, onSolve }) {
  const [blankValue, setBlankValue] = useState('');
  const [status, setStatus] = useState(null); // 'correct' | 'wrong' | null
  const [showHint, setShowHint] = useState(false);

  const blankDef = codeReveal.blanks[0]; // Currently supporting one blank per act

  function handleCheck() {
    if (blankValue.trim() === blankDef.answer) {
      setStatus('correct');
      setTimeout(onSolve, 1500);
    } else {
      setStatus('wrong');
      setTimeout(() => setStatus(null), 1500);
    }
  }

  const lines = codeReveal.template.split('\n');

  return (
    <div className="code-solve">
      <div className="code-intro">
        Let's translate that observation into Python. Fill in the missing piece.
      </div>

      <div className="code-window">
        <div className="code-titlebar">
          <div className="cdot r"/><div className="cdot a"/><div className="cdot g"/>
          <span className="code-filename">{codeReveal.file}</span>
        </div>
        <div className="code-body">
          {lines.map((line, i) => {
            if (line.includes('____')) {
              const parts = line.split('____');
              return (
                <div key={i} className="code-line">
                  {parts[0]}
                  <input
                    className={`blank-input ${status || ''}`}
                    value={blankValue}
                    onChange={e => { setBlankValue(e.target.value); setStatus(null); }}
                    placeholder={blankDef.placeholder}
                    spellCheck={false}
                  />
                  {parts[1]}
                </div>
              );
            }
            return <div key={i} className="code-line">{line}</div>;
          })}
        </div>
      </div>

      {status === 'wrong' && (
        <div style={{color:'var(--red)', fontSize:'0.85rem', marginBottom:'0.85rem'}}>
          ❌ Not quite. Look closely at the pattern you described.
        </div>
      )}
      
      {status === 'correct' && (
        <div className="code-explanation">
          <strong>✅ Correct!</strong> {codeReveal.explanation}
        </div>
      )}

      {status !== 'correct' && (
        <>
          {!showHint ? (
            <div className="hint-pill" onClick={() => setShowHint(true)}>💡 Need a hint?</div>
          ) : (
            <div className="hint-text">💡 <strong>Hint:</strong> {blankDef.hint}</div>
          )}
          <div style={{display:'flex', justifyContent:'flex-end'}}>
            <button className="btn-submit" onClick={handleCheck} disabled={!blankValue.trim()}>
              Run Code
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Field Journal Sidebar ────────────────────────────────────────────
function FieldJournal({ saga, currentActNumber, completedActs }) {
  if (!saga) return <div className="field-journal"/>;

  return (
    <div className="field-journal">
      <div className="journal-header">
        <div className="journal-title">
          <span>📖</span> Field Journal
        </div>
      </div>
      <div className="journal-scroll">
        {saga.arcs.map(arc => (
          <div className="arc-group" key={arc.arc}>
            <div className="arc-label">
              Arc {arc.arc} — {arc.name}
              <div className="arc-bar" />
            </div>
            {arc.acts.map(act => {
              const isDone = completedActs.includes(act.act);
              const isActive = act.act === currentActNumber;
              const isLocked = !isDone && !isActive;
              
              let cls = "act-entry ";
              if (isDone) cls += "done";
              if (isActive) cls += "active";
              if (isLocked) cls += "locked";

              return (
                <div key={act.act} className={cls}>
                  <div className="act-icon">{isDone ? '✅' : isActive ? '🔵' : '□'}</div>
                  <div className="act-name">
                    {act.name}
                    {(isDone || isActive) && <div className="act-discovery">{act.concept}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────
function App() {
  const [saga, setSaga] = useState(null);
  const [allActs, setAllActs] = useState([]);
  
  // State Machine
  // Modes: 'intro' -> 'narrating' -> 'observation' -> 'evaluating' -> 'code' -> 'success'
  const [actIndex, setActIndex] = useState(0);
  const [mode, setMode] = useState('intro'); 
  
  // Narrative State
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [correction, setCorrection] = useState(null);
  
  // Journal State
  const [completedActs, setCompletedActs] = useState([]);

  useEffect(() => {
    Promise.all([
      apiFetch('/journey'),
      apiFetch('/journey/acts')
    ]).then(([s, acts]) => {
      setSaga(s);
      setAllActs(acts.sort((a,b) => a.act - b.act));
    }).catch(console.error);
  }, []);

  if (!saga) return <div className="loading-screen"><div className="spin"/>Loading Saga...</div>;

  const currentAct = allActs[actIndex];
  
  // Handle Saga Complete
  if (!currentAct) {
    return (
      <div className="app">
        <div className="topbar">
          <div className="topbar-brand">
            <span>PyBe</span> <small>Inheritance Discovery</small>
          </div>
        </div>
        <div className="story-area">
          <div className="scene">
             <div className="saga-complete">
               <span className="saga-trophy">🏆</span>
               <div className="saga-title">Saga Complete</div>
               <div className="saga-subtitle">You have discovered the core patterns of Object-Oriented Inheritance.</div>
               <div className="saga-stats">
                 <div className="stat-box"><strong>{completedActs.length}</strong><span>Acts Completed</span></div>
                 <div className="stat-box"><strong>Arc 2</strong><span>Reached</span></div>
               </div>
               <button className="chapter-btn" onClick={() => window.location.reload()}>Play Again</button>
             </div>
          </div>
        </div>
        <FieldJournal saga={saga} currentActNumber={999} completedActs={completedActs} />
      </div>
    );
  }

  const arcInfo = saga.arcs.find(a => a.arc === currentAct.arcNumber);

  // ── Actions ──
  
  const handleDialogueComplete = () => {
    if (dialogueIndex < currentAct.narrative.length - 1) {
      setDialogueIndex(i => i + 1);
    } else {
      setMode(currentAct.observationPrompt ? 'observation' : 'code');
    }
  };

  const handleObservationSubmit = async (answer) => {
    setMode('evaluating');
    setCorrection(null);
    try {
      const result = await apiFetch('/journey/evaluate', {
        method: 'POST',
        body: JSON.stringify({ actNumber: currentAct.act, userAnswer: answer })
      });
      if (result.understood) {
        setCorrection(null);
        setMode(currentAct.codeReveal ? 'code' : 'success');
      } else {
        setCorrection(result);
        setMode('observation');
      }
    } catch (err) {
      console.error(err);
      setMode('observation'); // Fallback on error
    }
  };

  const handleCodeSolve = () => {
    setMode('success');
  };

  const handleNextAct = () => {
    setCompletedActs(prev => [...prev, currentAct.act]);
    setActIndex(i => i + 1);
    setDialogueIndex(0);
    setCorrection(null);
    setMode('intro');
  };

  const currentDialogue = currentAct.narrative[dialogueIndex];
  const speaker = saga.characters[currentDialogue.speaker];

  return (
    <div className="app">
      {mode === 'intro' && (
        <ChapterCard 
          arcLabel={`Arc ${arcInfo.arc} — ${arcInfo.name}`}
          actNumber={currentAct.act}
          actName={currentAct.name}
          concept={currentAct.concept}
          onStart={() => setMode('narrating')}
        />
      )}

      <div className="topbar">
        <div className="topbar-brand">
          <span>PyBe</span> <small>Wildlife Observer</small>
        </div>
        <div className="topbar-arc">
          <div className="arc-dot" style={{background: arcInfo.color}} />
          Arc {arcInfo.arc}: {arcInfo.name}
        </div>
      </div>

      <div className="story-area">
        <div className="scene">
          {currentAct.image && (
            <img src={currentAct.image} alt={currentAct.name} className="scene-bg" />
          )}
           
          {/* Correction Bubble injected above observation if wrong */}
          {correction && (
            <OwlCorrection 
              misconception={correction.misconception} 
              question={correction.followUpQuestion} 
            />
          )}

          {/* Observation Panel */}
          {mode === 'observation' || mode === 'evaluating' ? (
            <ObservationInput 
              prompt={currentAct.observationPrompt}
              questions={currentAct.questions}
              onSubmit={handleObservationSubmit}
              loading={mode === 'evaluating'}
            />
          ) : null}

          {/* Code Panel */}
          {mode === 'code' && currentAct.codeReveal && (
            <CodeSolve 
              codeReveal={currentAct.codeReveal}
              onSolve={handleCodeSolve}
            />
          )}

          {/* Success Reveal */}
          {mode === 'success' && (
            <div className="act-success">
               <span className="success-icon">✅</span>
               <div className="success-title">Discovery Logged</div>
               <div className="success-subtitle">You successfully identified the {currentAct.concept} pattern.</div>
               <button className="chapter-btn" onClick={handleNextAct}>Continue Saga ▶</button>
            </div>
          )}

        </div>
        
        {/* Dialogue Box (only during narrating mode) */}
        {mode === 'narrating' && (
          <DialogueBox 
            speaker={speaker}
            text={currentDialogue.text}
            avatarStr={speaker.avatar}
            isLast={dialogueIndex === currentAct.narrative.length - 1}
            onComplete={handleDialogueComplete}
          />
        )}
      </div>

      <FieldJournal 
        saga={saga} 
        currentActNumber={currentAct.act} 
        completedActs={completedActs} 
      />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
