/* ============================================================
   RECURSION EXPERIENCE — lesson data & thought paths
   Book Stack scenario throughout (framework-aligned)
   7 stages: story → thought-paths → base-case → recursive-case → code-sim → experiment → compare
   ============================================================ */

/* ── Primary micro-code (book stack, shown first) ── */
export const SEARCH_CODE = `def search(stack):
    if len(stack) == 1:        # base case
        return stack[0] == "math notes"
    mid = len(stack) // 2
    return search(stack[:mid]) or search(stack[mid:])`;

/* ── Secondary code (factorial, shown in experiment stage as "same idea, different shape") ── */
export const RECURSION_CODE = `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)

result = factorial(4)
print("4! =", result)`;

export const LOOP_CODE = `def factorial_loop(n):
    result = 1
    for i in range(1, n + 1):
        result = result * i
    return result

result = factorial_loop(4)
print("4! =", result)`;

/* ── Stages ── */
export const STAGES = [
  {
    id: "story",
    title: "20 notebooks, 1 with your math notes",
    subtitle: "Start here — no code yet",
  },
  {
    id: "thought-paths",
    title: "How would you search?",
    subtitle: "Pick the approach that feels most natural to you",
  },
  {
    id: "base-case",
    title: "What happens at the very end?",
    subtitle: "Follow the split all the way down",
  },
  {
    id: "recursive-case",
    title: "The same strategy, smaller",
    subtitle: "Spot the pattern",
  },
  {
    id: "experiment",
    title: "Experiment with depth",
    subtitle: "Change n — watch the stack grow and shrink",
  },
  {
    id: "compare",
    title: "Recursion vs. Loop",
    subtitle: "Same result — very different runtime behaviour",
  },
  {
    id: "code-sim",
    title: "Python expresses it",
    subtitle: "Predict first — then step through",
  },
];

/* ── Thought options (≤40 words each) ── */
export const THOUGHT_OPTIONS = [
  {
    letter: "A",
    text: "Start from the top, check each notebook one by one until I find it.",
    branchHint: "brute",
    feedbackType: "insight",
    feedback:
      "That works — you'll always find it. But if it's the last one, you check all 20. What if there were 1,000 notebooks?",
  },
  {
    letter: "B",
    text: "Split the stack in half, search each half using the same method.",
    branchHint: "divide",
    feedbackType: "good",
    feedback:
      "You just threw away half the problem immediately. Each half is the same search, just smaller. That's a pattern worth following all the way down.",
  },
  {
    letter: "C",
    text: "Pick notebooks randomly until I get lucky.",
    branchHint: "random",
    feedbackType: "insight",
    feedback:
      "Random can get lucky or very unlucky — no guarantee it gets faster over time. What makes a method reliable regardless of where the notebook is?",
  },
];

/* ── Branch intros: next screen (base-case) differs by option picked ── */
export const BRANCH_INTROS = {
  brute:
    "That works — you'd always find it. Now imagine handing off half the stack to a friend, who hands off half of theirs. Eventually a friend gets exactly 1 notebook. What should they do?",
  divide:
    "You're splitting and handing off halves — each is the same search problem, just smaller. Follow it all the way down: what happens when a half contains just 1 notebook?",
  random:
    "Let's build a reliable method instead. Imagine you kept splitting the stack until someone was handed exactly 1 notebook. What would that person do?",
};

/* ── Base-case options ── */
export const BASE_CASE_OPTIONS = [
  {
    letter: "A",
    text: "Split it in half again.",
    branchHint: "brute",
    feedbackType: "insight",
    feedback:
      "You can't split 1 notebook in half — this would loop forever. This is exactly the trap recursion falls into without a stopping rule.",
  },
  {
    letter: "B",
    text: "Just check it directly — is it the math notes or not?",
    branchHint: "divide",
    feedbackType: "good",
    feedback:
      "Exactly. When the problem is small enough to answer directly, you stop splitting and just answer. Programmers call this the base case.",
    conceptReveal: "Base case = the smallest version of the problem you solve directly, without breaking it down further.",
  },
  {
    letter: "C",
    text: "Give up — one notebook isn't enough to be sure.",
    branchHint: "random",
    feedbackType: "insight",
    feedback:
      "Understandable, but then you'd never find your notes! With 1 notebook left, you can just open it and check — no splitting needed.",
  },
];

/* ── Recursive-case options ── */
export const RECURSIVE_CASE_OPTIONS = [
  {
    letter: "A",
    text: "The same process is being repeated on smaller pieces of the same problem.",
    branchHint: "divide",
    feedbackType: "good",
    feedback:
      "Exactly — the function calls the same search strategy on a smaller stack. That reuse is the whole trick.",
    conceptReveal: "Recursive case = applying the same method to a smaller sub-problem, until you hit the base case.",
  },
  {
    letter: "B",
    text: "It's a totally different process for each half.",
    branchHint: "brute",
    feedbackType: "insight",
    feedback:
      "Actually — it's the same rule applied again, just to a smaller stack. Look at the function name inside the function.",
  },
  {
    letter: "C",
    text: "Not sure — it looks like it loops back somehow.",
    branchHint: "random",
    feedbackType: "insight",
    feedback:
      "Almost — it does loop back, but not like a for-loop. The function calls itself with a smaller input each time, until it can answer directly.",
  },
];

/* ── Code annotation prompts ── */
export const CODE_ANNOTATION_PROMPTS = {
  baseCasePrompt: "Tap the line you think is the base case — where the function stops splitting and just answers.",
  recursiveCasePrompt: "Now tap the recursive case — the line where the function calls itself.",
  baseCaseLineNum: 2,    // 1-indexed: "if len(stack) == 1:"
  recursiveCaseLineNum: 5, // "return search(stack[:mid]) or search(stack[mid:])"
};

/* ── Block arrangement ── */
export const BLOCKS = [
  { id: "problem",       label: "PROBLEM",              desc: "The search for 1 notebook in the stack",   color: "#5856d6" },
  { id: "smaller",       label: "MAKE SMALLER",         desc: "Split the stack in half",                  color: "#007aff" },
  { id: "solve-smaller", label: "SOLVE SMALLER VERSION",desc: "Search each half using the same method",   color: "#34c759" },
  { id: "use-result",    label: "USE RESULT",           desc: "Found it in left half OR right half",      color: "#ff9500" },
  { id: "base-case",     label: "BASE CASE",            desc: "Stack of 1 → just check it directly",     color: "#af52de" },
];

export const CORRECT_BLOCK_ORDER = ["base-case", "problem", "smaller", "solve-smaller", "use-result"];

/* ── Comparison table (shortened) ── */
export const COMPARISON_POINTS = [
  {
    aspect: "How it works",
    recursion: "Function calls itself with a smaller input",
    loop: "One frame repeats with an updated variable",
  },
  {
    aspect: "Stack depth",
    recursion: "One frame per call — grows then unwinds",
    loop: "One frame throughout",
  },
  {
    aspect: "Stopping",
    recursion: "Base case returns immediately",
    loop: "Loop condition exits",
  },
  {
    aspect: "Return values",
    recursion: "Travel back through waiting frames",
    loop: "Accumulate in one variable",
  },
  {
    aspect: "Best for",
    recursion: "Self-similar problems (trees, graphs, parsing)",
    loop: "Simple repetition with easy in-place state",
  },
];
