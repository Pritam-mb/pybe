import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * SessionContext — persists every learner choice across modules for the whole session.
 *
 * tendency: "brute" | "divide" | "mixed"
 *   "brute"  → ≥2/3 of picks were brute-force / linear / random options
 *   "divide" → ≥2/3 of picks were divide-conquer / structured options
 *   "mixed"  → everything else
 */

const BRUTE_HINTS  = new Set(["brute", "random", "unsure"]);
const DIVIDE_HINTS = new Set(["divide", "depth", "breadth"]);

function deriveTendency(choices) {
  if (choices.length === 0) return "mixed";
  const brute  = choices.filter(c => BRUTE_HINTS.has(c.branchHint)).length;
  const divide = choices.filter(c => DIVIDE_HINTS.has(c.branchHint)).length;
  const ratio  = choices.length;
  if (brute  / ratio >= 0.67) return "brute";
  if (divide / ratio >= 0.67) return "divide";
  return "mixed";
}

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [choices, setChoices] = useState([]);

  const recordChoice = useCallback(({ module, stage, optionIdx, branchHint }) => {
    setChoices(prev => {
      // Avoid duplicate entries for the same module+stage
      const filtered = prev.filter(c => !(c.module === module && c.stage === stage));
      return [...filtered, { module, stage, optionIdx, branchHint }];
    });
  }, []);

  const tendency = deriveTendency(choices);

  return (
    <SessionContext.Provider value={{ choices, tendency, recordChoice }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
