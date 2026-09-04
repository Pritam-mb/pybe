import React, { useEffect, useState } from 'react';
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

// ── Case Study Selector ───────────────────────────────────────────────
function SagaSelect({ sagas, onSelect }) {
  return (
    <div className="saga-select">
      <div className="saga-select-header">
        <div className="ss-kicker">PyBe Discovery</div>
        <h1 className="ss-title">Choose a Case Study</h1>
        <p className="ss-subtitle">
          Each saga is a guided story where you discover a computer-science concept
          yourself — before anyone tells you its name.
        </p>
      </div>
      <div className="saga-grid">
        {sagas.map((s) => (
          <button
            key={s.id}
            className="saga-card"
            style={{ '--saga-accent': s.accent }}
            onClick={() => onSelect(s.id)}
          >
            <div className="saga-card-icon">{s.icon}</div>
            <div className="saga-card-title">{s.title}</div>
            <div className="saga-card-sub">{s.subtitle}</div>
            <div className="saga-card-meta">
              <span>{s.arcCount} Arc{s.arcCount !== 1 ? 's' : ''}</span>
              <span>{s.actCount} Acts</span>
            </div>
            <div className="saga-card-cta">Begin Case Study ▶</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Chapter Card Overlay ──────────────────────────────────────────────
function ChapterCard({ arcLabel, actNumber, actName, concept, onStart }) {
  const [leaving, setLeaving] = useState(false);
  function handleStart() {
    setLeaving(true);
    setTimeout(onStart, 400);
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
    const speed = speaker.name === 'Narrator' ? 22 : 28;
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

  let avatarClass = 'char-avatar';
  if (isNarrator) avatarClass += ' narrator';
  if (isPip) avatarClass += ' pip';

  let nameClass = 'char-name';
  if (isNarrator) nameClass += ' narrator';
  if (isPip) nameClass += ' pip';

  let textClass = 'dialogue-text';
  if (isNarrator) textClass += ' narrator-style';

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

// ── Wrong Answer Understanding Window ────────────────────────────────
function WrongAnswerWindow({ correction, onRetry }) {
  return (
    <div className="wrong-answer-window">
      <div className="waw-header">
        <span className="waw-owl">🦉</span>
        <div className="waw-header-text">
          <div className="waw-title">Let's Think This Through Together</div>
          <div className="waw-subtitle">Pip the Owl has some thoughts for you...</div>
        </div>
      </div>

      {correction.misconception && (
        <div className="waw-section waw-miss">
          <div className="waw-section-label">📌 What was missing from your answer:</div>
          <div className="waw-section-body">{correction.misconception}</div>
        </div>
      )}

      <div className="waw-section waw-guide">
        <div className="waw-section-label">🔍 Try thinking about it this way:</div>
        <div className="waw-followup-q">{correction.followUpQuestion}</div>
      </div>

      <div className="waw-footer">
        <div className="waw-tip">
          💡 Struggling with this is part of discovering the concept. Take your time — the answer is already in the story.
        </div>
        <button className="btn-submit" onClick={onRetry}>
          ↩ Try Again
        </button>
      </div>
    </div>
  );
}

// ── Reasoning Capture (after correct observation) ─────────────────────
function ReasoningCapture({ onSubmit }) {
  const [text, setText] = useState('');

  return (
    <div className="reasoning-window">
      <div className="reasoning-header">
        <span className="reasoning-star">✨</span>
        <div>
          <div className="reasoning-title">Excellent Observation!</div>
          <div className="reasoning-sub">You got it. But before we move on...</div>
        </div>
      </div>

      <div className="reasoning-body">
        <div className="reasoning-question">
          How did you figure that out?
        </div>
        <div className="reasoning-hint">
          Describe the thinking process you used — what clues did you look for? What did you compare?
          This helps you build a <strong>reasoning pattern</strong> you can apply to any new problem.
        </div>
        <textarea
          className="obs-textarea"
          style={{ minHeight: '90px' }}
          placeholder="I noticed that... / I figured it out by comparing... / My approach was..."
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
        />
        <div className="reasoning-actions">
          <button
            className="btn-submit"
            onClick={() => onSubmit(text)}
            disabled={!text.trim()}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Story Bridge Phase (after MCQ, before slides) ────────────────────
// Reuses DialogueBox — feels like the story is still going
function StoryBridgePhase({ storyBridge, saga, onComplete }) {
  const [idx, setIdx] = useState(0);

  const current = storyBridge[idx];
  const speaker = saga.characters[current.speaker];

  const handleNext = () => {
    if (idx < storyBridge.length - 1) {
      setIdx(i => i + 1);
    } else {
      onComplete();
    }
  };

  return (
    <DialogueBox
      speaker={speaker}
      text={current.text}
      avatarStr={speaker.avatar}
      isLast={idx === storyBridge.length - 1}
      onComplete={handleNext}
    />
  );
}

// ── Slide Teacher (step-by-step code teaching) ────────────────────────
function SlideTeacher({ slides, filename, onComplete }) {
  const [slideIdx, setSlideIdx] = useState(0);
  const slide = slides[slideIdx];
  const isLast = slideIdx === slides.length - 1;

  const lines = slide.code.split('\n');
  const highlights = slide.highlightWords || [];

  const isHighlightedLine = (line) =>
    highlights.some(word => line.includes(word));

  return (
    <div className="slide-teacher">
      {/* ── Step indicator ── */}
      <div className="slide-header">
        <div className="slide-step-pill">
          Step {slideIdx + 1} of {slides.length}
        </div>
        <div className="slide-title">{slide.slideTitle}</div>
      </div>

      {/* ── Story connection quote ── */}
      <div className="slide-story-quote">
        <span className="slide-quote-icon">💬</span>
        <span className="slide-quote-text">{slide.storyConnection}</span>
      </div>

      {/* ── Code window ── */}
      <div className="code-window slide-code-window">
        <div className="code-titlebar">
          <div className="cdot r" /><div className="cdot a" /><div className="cdot g" />
          <span className="code-filename">{filename}</span>
          <span className="cdp-badge" style={{ marginLeft: 'auto' }}>read only</span>
        </div>
        <div className="code-body">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`code-line ${isHighlightedLine(line) ? 'st-highlight-line' : ''}`}
            >
              {line || '\u00a0'}
            </div>
          ))}
        </div>
      </div>

      {/* ── Explanation ── */}
      <div className="slide-explanation">
        <span className="cdp-exp-icon">💡</span>
        <span>{slide.explanation}</span>
      </div>

      {/* ── Navigation ── */}
      <div className="slide-nav">
        {slideIdx > 0 && (
          <button
            className="slide-back-btn"
            onClick={() => setSlideIdx(i => i - 1)}
          >
            ← Previous
          </button>
        )}
        {!isLast ? (
          <button
            className="chapter-btn"
            onClick={() => setSlideIdx(i => i + 1)}
          >
            Next Step →
          </button>
        ) : (
          <button className="chapter-btn" onClick={onComplete}>
            ✏️ Now Write It Yourself!
          </button>
        )}
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
    setAnswer('');
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
            {loading ? <><div className="spin" /> Evaluating...</> : 'Record in Journal'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Pip Retry Reminder (shows above obs input on retry) ──────────────
function OwlRetryReminder({ question }) {
  return (
    <div className="owl-correction">
      <div className="owl-avatar">🦉</div>
      <div className="owl-body">
        <div className="owl-name">Pip's Guiding Question</div>
        <div className="owl-question">{question}</div>
      </div>
    </div>
  );
}

// ── MCQ Panel ─────────────────────────────────────────────────────────
function McqPanel({ mcq, onCorrect }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [status, setStatus] = useState(null);
  const [showHint, setShowHint] = useState(false);

  function handleSelect(idx) {
    if (status === 'correct') return;
    setSelectedIdx(idx);
    if (idx === mcq.answerIndex) {
      setStatus('correct');
      setTimeout(onCorrect, 1500);
    } else {
      setStatus('wrong');
      setShowHint(true);
    }
  }

  return (
    <div className="mcq-panel">
      <div className="mcq-question">{mcq.question}</div>
      <div className="mcq-options">
        {mcq.options.map((opt, i) => {
          let cls = 'mcq-option';
          if (selectedIdx === i) {
            cls += status === 'correct' ? ' correct' : status === 'wrong' ? ' wrong' : '';
          } else if (status === 'correct' && i === mcq.answerIndex) {
            cls += ' correct';
          }
          return (
            <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={status === 'correct'}>
              {opt}
            </button>
          );
        })}
      </div>
      {showHint && status === 'wrong' && (
        <div className="owl-correction" style={{ marginTop: '1rem' }}>
          <div className="owl-avatar">🦉</div>
          <div className="owl-body">
            <div className="owl-name">Pip the Owl</div>
            <div className="owl-misconception">Not quite — look at the options again.</div>
            <div className="owl-question">{mcq.hint}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Code Solve ───────────────────────────────────────────────────────
function CodeSolve({ codeReveal, onSolve }) {
  const [blankValue, setBlankValue] = useState('');
  const [status, setStatus] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const blankDef = codeReveal.blanks[0];

  function handleCheck() {
    if (blankValue.trim() === blankDef.answer) {
      setStatus('correct');
      setTimeout(onSolve, 1500);
    } else {
      setStatus('wrong');
      setAttempts(a => a + 1);
      setTimeout(() => setStatus(null), 1500);
    }
  }

  const lines = codeReveal.template.split('\n');

  return (
    <div className="code-solve">
      <div className="code-intro">
        You've seen how Python writes this. Now fill in the missing piece <strong>yourself</strong>.
      </div>

      <div className="code-window">
        <div className="code-titlebar">
          <div className="cdot r" /><div className="cdot a" /><div className="cdot g" />
          <span className="code-filename">{codeReveal.file}</span>
          <span className="cdp-badge" style={{ marginLeft: 'auto' }}>editable</span>
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
                    autoFocus
                  />
                  {parts[1]}
                </div>
              );
            }
            return <div key={i} className="code-line">{line || '\u00a0'}</div>;
          })}
        </div>
      </div>

      {status === 'wrong' && (
        <div style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '0.85rem' }}>
          ❌ Not quite — think back to the concept doc you just read.
        </div>
      )}

      {status === 'correct' && (
        <div className="code-explanation">
          <strong>✅ Correct!</strong> {codeReveal.explanation}
        </div>
      )}

      {status !== 'correct' && (
        <>
          {attempts >= 1 && !showHint && (
            <div className="hint-pill" onClick={() => setShowHint(true)}>💡 Need a hint?</div>
          )}
          {showHint && (
            <div className="hint-text">💡 <strong>Hint:</strong> {blankDef.hint}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-submit" onClick={handleCheck} disabled={!blankValue.trim()}>
              Run Code ▶
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Field Journal Sidebar ────────────────────────────────────────────
function FieldJournal({ saga, currentActNumber, completedActs, xp }) {
  if (!saga) return <div className="field-journal" />;

  return (
    <div className="field-journal">
      <div className="journal-header">
        <div className="journal-title">
          <span>📖 Field Journal</span>
          <span className="journal-xp">{xp} XP</span>
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

              let cls = 'act-entry ';
              if (isDone) cls += 'done';
              if (isActive) cls += 'active';
              if (isLocked) cls += 'locked';

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
  const [sagas, setSagas] = useState([]);
  const [sagaId, setSagaId] = useState(null);
  const [saga, setSaga] = useState(null);
  const [allActs, setAllActs] = useState([]);

  // State Machine
  // Modes: 'intro' → 'narrating' → 'observation' → 'evaluating'
  //        → 'wrong-answer' (show why) → 'observation' (retry)
  //        → 'reasoning' (how did you solve it?) → 'mcq'
  //        → 'story-bridge' (Priya/Pip connect story to Python) ← NEW
  //        → 'slide-teach' (step-by-step code slides) ← NEW
  //        → 'code' → 'success'
  const [actIndex, setActIndex] = useState(0);
  const [mode, setMode] = useState('intro');
  const [bridgeIdx, setBridgeIdx] = useState(0);

  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [correction, setCorrection] = useState(null);
  const [retryQuestion, setRetryQuestion] = useState(null);

  const [completedActs, setCompletedActs] = useState([]);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    apiFetch('/sagas').then(setSagas).catch(console.error);
  }, []);

  const resetGameState = () => {
    setActIndex(0);
    setMode('intro');
    setBridgeIdx(0);
    setDialogueIndex(0);
    setCorrection(null);
    setRetryQuestion(null);
    setCompletedActs([]);
    setXp(0);
  };

  const handleSelectSaga = (id) => {
    setSagaId(id);
    setSaga(null);
    setAllActs([]);
    resetGameState();
    Promise.all([
      apiFetch(`/sagas/${id}`),
      apiFetch(`/sagas/${id}/acts`)
    ]).then(([s, acts]) => {
      setSaga(s);
      setAllActs(acts.sort((a, b) => a.act - b.act));
    }).catch(console.error);
  };

  const handleBackToCaseStudies = () => {
    setSagaId(null);
    setSaga(null);
    setAllActs([]);
    resetGameState();
  };

  if (!sagas.length) return <div className="loading-screen"><div className="spin" />Loading PyBe...</div>;
  if (!sagaId) return <SagaSelect sagas={sagas} onSelect={handleSelectSaga} />;
  if (!saga) return <div className="loading-screen"><div className="spin" />Loading Case Study...</div>;

  const currentAct = allActs[actIndex];

  // Saga Complete screen
  if (!currentAct) {
    return (
      <div className="app">
        <div className="topbar">
          <div className="topbar-brand">
            <span>PyBe</span> <small>{saga.title}</small>
          </div>
        </div>
        <div className="story-area">
          <div className="scene">
            <div className="saga-complete">
              <span className="saga-trophy">🏆</span>
              <div className="saga-title">Saga Complete</div>
              <div className="saga-subtitle">{saga.completeMessage}</div>
              <div className="saga-stats">
                <div className="stat-box"><strong>{completedActs.length}</strong><span>Acts Completed</span></div>
                <div className="stat-box"><strong>{xp}</strong><span>Total XP</span></div>
              </div>
              <div className="saga-actions">
                <button className="chapter-btn" onClick={() => window.location.reload()}>Play Again</button>
                <button className="slide-back-btn" onClick={handleBackToCaseStudies}>← All Case Studies</button>
              </div>
            </div>
          </div>
        </div>
        <FieldJournal saga={saga} currentActNumber={999} completedActs={completedActs} xp={xp} />
      </div>
    );
  }

  const arcInfo = saga.arcs.find(a => a.arc === currentAct.arcNumber);

  // ── Actions ──

  const handleDialogueComplete = () => {
    if (dialogueIndex < currentAct.narrative.length - 1) {
      setDialogueIndex(i => i + 1);
    } else {
      setRetryQuestion(null);
      setMode(currentAct.observationPrompt ? 'observation' : 'mcq');
    }
  };

  const handleObservationSubmit = async (answer) => {
    setMode('evaluating');
    setCorrection(null);
    try {
      const result = await apiFetch(`/sagas/${saga.id}/evaluate`, {
        method: 'POST',
        body: JSON.stringify({ actNumber: currentAct.act, userAnswer: answer })
      });
      if (result.understood) {
        setCorrection(null);
        setRetryQuestion(null);
        setMode('reasoning'); // Step: ask HOW they solved it
      } else {
        setCorrection(result);
        setMode('wrong-answer'); // Step: show understanding window
      }
    } catch (err) {
      console.error(err);
      setMode('observation');
    }
  };

  // From wrong-answer window → retry observation with follow-up question
  const handleWrongAnswerRetry = () => {
    setRetryQuestion(correction.followUpQuestion);
    setCorrection(null);
    setMode('observation');
  };

  // After reasoning is submitted → proceed to MCQ or next phase
  const handleReasoningSubmit = (_reasoning) => {
    if (currentAct.mcq) {
      setMode('mcq');
    } else if (currentAct.storyBridge?.length) {
      setBridgeIdx(0);
      setMode('story-bridge');
    } else if (currentAct.syntaxLesson?.length) {
      setMode('slide-teach');
    } else if (currentAct.codeReveal) {
      setMode('code');
    } else {
      handleSuccessState();
    }
  };

  // After MCQ correct → story bridge (if exists) → slides → code
  const handleMcqCorrect = () => {
    if (currentAct.storyBridge?.length) {
      setBridgeIdx(0);
      setMode('story-bridge');
    } else if (currentAct.syntaxLesson?.length) {
      setMode('slide-teach');
    } else if (currentAct.codeReveal) {
      setMode('code');
    } else {
      handleSuccessState();
    }
  };

  // After story bridge dialogues → go to slide teaching
  const handleStoryBridgeDone = () => {
    setMode('slide-teach');
  };

  // After all slides are done → code challenge (if exists) or success
  const handleSlideTeachDone = () => {
    if (currentAct.codeReveal) {
      setMode('code');
    } else {
      handleSuccessState();
    }
  };

  const handleCodeSolve = () => handleSuccessState();

  const handleSuccessState = () => {
    setXp(prev => prev + 100);
    setMode('success');
  };

  const handleNextAct = () => {
    setCompletedActs(prev => [...prev, currentAct.act]);
    setActIndex(i => i + 1);
    setDialogueIndex(0);
    setCorrection(null);
    setRetryQuestion(null);
    setBridgeIdx(0);
    setMode('intro');
  };

  const currentDialogue = currentAct.narrative[dialogueIndex];
  const speaker = currentDialogue ? saga.characters[currentDialogue.speaker] : null;

  // On retry, replace original questions with follow-up question
  const displayQuestions = retryQuestion ? [retryQuestion] : currentAct.questions;

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
          <span>PyBe</span> <small>{saga.title}</small>
        </div>
        <div className="topbar-arc">
          <div className="arc-dot" style={{ background: arcInfo.color }} />
          Arc {arcInfo.arc}: {arcInfo.name}
        </div>
      </div>

      <div className="story-area">
        <div className="scene">
          {currentAct.image && (
            <img src={currentAct.image} alt={currentAct.name} className="scene-bg" />
          )}

          {/* ── WRONG ANSWER: Full understanding panel ── */}
          {mode === 'wrong-answer' && correction && (
            <WrongAnswerWindow
              correction={correction}
              onRetry={handleWrongAnswerRetry}
            />
          )}

          {/* ── OBSERVATION RETRY: Pip's guiding question reminder ── */}
          {(mode === 'observation' || mode === 'evaluating') && retryQuestion && (
            <OwlRetryReminder question={retryQuestion} />
          )}

          {/* ── REASONING CAPTURE ── */}
          {mode === 'reasoning' && (
            <ReasoningCapture onSubmit={handleReasoningSubmit} />
          )}

          {/* ── OBSERVATION INPUT ── */}
          {(mode === 'observation' || mode === 'evaluating') && (
            <ObservationInput
              prompt={currentAct.observationPrompt}
              questions={displayQuestions}
              onSubmit={handleObservationSubmit}
              loading={mode === 'evaluating'}
            />
          )}

          {/* ── MCQ ── */}
          {mode === 'mcq' && currentAct.mcq && (
            <McqPanel
              mcq={currentAct.mcq}
              onCorrect={handleMcqCorrect}
            />
          )}

          {/* ── SLIDE TEACH: Step-by-step code slides ── */}
          {mode === 'slide-teach' && currentAct.syntaxLesson?.length && (
            <SlideTeacher
              slides={currentAct.syntaxLesson}
              filename={currentAct.codeReveal?.file || currentAct.slidesFile || 'example.py'}
              onComplete={handleSlideTeachDone}
            />
          )}

          {/* ── CODE CHALLENGE ── */}
          {mode === 'code' && currentAct.codeReveal && (
            <CodeSolve
              codeReveal={currentAct.codeReveal}
              onSolve={handleCodeSolve}
            />
          )}

          {/* ── SUCCESS ── */}
          {mode === 'success' && (
            <div className="act-success">
              <span className="success-icon">✅</span>
              <div className="success-title">Discovery Logged</div>
              <div className="success-subtitle">You successfully identified the {currentAct.concept} pattern.</div>
              <div className="xp-badge">
                <span className="xp-icon">⭐</span> +100 XP
              </div>
              <button className="chapter-btn" onClick={handleNextAct}>Continue Saga ▶</button>
            </div>
          )}
        </div>

        {/* Narrative Dialogue */}
        {mode === 'narrating' && currentDialogue && (
          <DialogueBox
            speaker={speaker}
            text={currentDialogue.text}
            avatarStr={speaker.avatar}
            isLast={dialogueIndex === currentAct.narrative.length - 1}
            onComplete={handleDialogueComplete}
          />
        )}

        {/* ── STORY BRIDGE: Priya/Pip connect story → Python ── */}
        {mode === 'story-bridge' && currentAct.storyBridge?.length && (
          <StoryBridgePhase
            storyBridge={currentAct.storyBridge}
            saga={saga}
            onComplete={handleStoryBridgeDone}
          />
        )}
      </div>

      <FieldJournal
        saga={saga}
        currentActNumber={currentAct.act}
        completedActs={completedActs}
        xp={xp}
      />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
