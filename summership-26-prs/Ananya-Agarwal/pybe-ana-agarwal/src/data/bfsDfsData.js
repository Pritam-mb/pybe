/* ============================================================
   BFS / DFS EXPERIENCE — lesson data & tree structure
   9 stages: story → explore → strategy → dfs-formal → dfs-code → bfs-discover → bfs-code → compare → reflect
   NOTE: Algorithm names (DFS/BFS) do NOT appear in option text —
   only revealed in feedback after selection.
   ============================================================ */

export const STAGES = [
  { id: "story",        title: "Boxes inside boxes inside boxes", subtitle: "A search problem — no algorithms yet" },
  { id: "explore",      title: "Explore the tree",                subtitle: "Find all the apples — your way" },
  { id: "strategy",     title: "How did you move through it?",    subtitle: "Spot the pattern in your own behaviour" },
  { id: "dfs-formal",   title: "How do you remember where to go back?", subtitle: "The data structure behind the strategy" },
  { id: "dfs-code",     title: "That strategy in Python",         subtitle: "Predict before you read" },
  { id: "bfs-discover", title: "A different kind of memory",      subtitle: "What if you explored everything nearby first?" },
  { id: "bfs-code",     title: "The second strategy in Python",   subtitle: "One small change — completely different journey" },
  { id: "compare",      title: "Same tree, two journeys",         subtitle: "Run both and see where they differ" },
  { id: "reflect",      title: "When would you choose each?",     subtitle: "Two scenarios — you decide" },
];

/* The tree — stored as adjacency list with node metadata */
export const TREE = {
  nodes: [
    { id: "start", label: "S",  hasApple: false, level: 0 },
    { id: "A",     label: "A",  hasApple: false, level: 1 },
    { id: "B",     label: "B",  hasApple: false, level: 1 },
    { id: "C",     label: "C",  hasApple: true,  level: 2 },
    { id: "D",     label: "D",  hasApple: false, level: 2 },
    { id: "E",     label: "E",  hasApple: false, level: 2 },
    { id: "F",     label: "F",  hasApple: true,  level: 2 },
    { id: "G",     label: "G",  hasApple: false, level: 3 },
    { id: "H",     label: "H",  hasApple: true,  level: 3 },
  ],
  edges: [
    ["start", "A"],
    ["start", "B"],
    ["A", "C"],
    ["A", "D"],
    ["B", "E"],
    ["B", "F"],
    ["C", "G"],
    ["C", "H"],
  ],
  appleNodes: ["C", "F", "H"],
};

/* DFS traversal order (left-first, stack) */
export const DFS_ORDER = ["start", "A", "C", "G", "H", "D", "B", "E", "F"];

/* BFS traversal order (level-by-level, queue) */
export const BFS_ORDER = ["start", "A", "B", "C", "D", "E", "F", "G", "H"];

/* Strategy options — algorithm names are NOT in text, only in feedback */
export const STRATEGY_OPTIONS = [
  {
    letter: "A",
    text: "I went as deep as possible into one branch before coming back to try another.",
    branchHint: "depth",
    feedbackType: "good",
    feedback:
      "You followed one path until you couldn't go further, then returned to an earlier choice point. Programmers call this Depth-First Search (DFS). What did you need to remember so you could return?",
    conceptReveal: "Depth-First Search (DFS) = dive as deep as possible, then backtrack.",
  },
  {
    letter: "B",
    text: "I explored everything close to the start before going any deeper.",
    branchHint: "breadth",
    feedbackType: "good",
    feedback:
      "You spread outward before going down — visited all nearby boxes before opening deeper ones. That is Breadth-First Search (BFS). To do this, you needed to remember all nearby boxes before going further.",
    conceptReveal: "Breadth-First Search (BFS) = explore all nodes at the current level before going deeper.",
  },
  {
    letter: "C",
    text: "I moved toward whichever box looked most likely to have an apple.",
    branchHint: "brute",
    feedbackType: "insight",
    feedback:
      "You used a heuristic — an estimate of where to look. That's called informed search. The two strategies we'll study work without any hints. Your instinct was actually more sophisticated.",
  },
  {
    letter: "D",
    text: "I'm not sure — I just clicked around.",
    branchHint: "random",
    feedbackType: "insight",
    feedback:
      "Random exploration finds everything eventually. What you probably did follows one of two patterns without realising — let's look at what each pattern looks like.",
  },
];

/* Branch intros for dfs-formal stage, based on strategy choice */
export const STRATEGY_BRANCH_INTROS = {
  depth:
    "You went deep, then backtracked. Every time you went deeper, you had to remember where to return. What kind of 'memory' lets you retrieve the most recent location first?",
  breadth:
    "You explored level by level. To visit all of level 1 before level 2, you needed to remember all level-1 boxes while still at level 0. What kind of 'memory' serves the oldest entries first?",
  brute:
    "Let's look at two formal strategies. Each uses a different kind of memory to decide where to go next. Which type of memory do you think produces a deep-first journey?",
  random:
    "Whether you knew it or not, your path likely matched one of two patterns. Each pattern comes from a different kind of memory. Let's look at what they are.",
};

/* Code annotation prompts */
export const DFS_ANNOTATION = {
  prompt: "Before reading — which line do you think represents the 'pile' (last-in, first-out)?",
  targetLineNum: 5, // "node = stack.pop()"
  correctHint: "stack.pop() takes from the end — the most recently added node. That's what makes it go deep.",
};

export const BFS_ANNOTATION = {
  prompt: "Before reading — which line do you think represents the 'queue' (first-in, first-out)?",
  targetLineNum: 5, // "node = queue.pop(0)"
  correctHint: "queue.pop(0) takes from the front — the earliest added node. That's what keeps it level-by-level.",
};

export const DFS_CODE = `stack = ["start"]
visited = []

while stack:
    node = stack.pop()
    if node not in visited:
        visited.append(node)
        neighbors = graph[node]
        for n in neighbors:
            stack.append(n)

print("DFS order:", visited)`;

export const BFS_CODE = `queue = ["start"]
visited = []

while queue:
    node = queue.pop(0)
    if node not in visited:
        visited.append(node)
        neighbors = graph[node]
        for n in neighbors:
            queue.append(n)

print("BFS order:", visited)`;

/* Comparison table */
export const COMPARISON_ROWS = [
  { aspect: "Structure used",      dfs: "Stack (last in, first out)",    bfs: "Queue (first in, first out)" },
  { aspect: "Strategy",            dfs: "Go deep, then backtrack",       bfs: "Explore all neighbours first" },
  { aspect: "Memory usage",        dfs: "Proportional to tree depth",    bfs: "Proportional to tree width" },
  { aspect: "Finds shortest path?",dfs: "Not guaranteed",                bfs: "Yes (unweighted graphs)" },
  { aspect: "Good for",            dfs: "Mazes, puzzles, topological sort", bfs: "Shortest path, level-by-level" },
];

/* Reflect stage — two mini-scenarios, each with 2 options (no wrong answer) */
export const REFLECT_SCENARIOS = [
  {
    id: "deep",
    scenario:
      "Your apple is buried deep in one specific branch of the tree — you saw the label from a distance.",
    question: "Which approach finds it faster here?",
    options: [
      {
        letter: "A",
        text: "Dive deep down that branch immediately.",
        feedbackType: "good",
        feedback:
          "Good instinct. You know where to dig — going deep immediately follows that one path without detours.",
      },
      {
        letter: "B",
        text: "Check every box level by level first.",
        feedbackType: "insight",
        feedback:
          "You'd find it — but you'd visit every box on levels 1, 2, and 3 before reaching it. Extra work when you already have a direction.",
      },
    ],
  },
  {
    id: "shallow",
    scenario:
      "Your apple is probably near the top of the tree, but you're not sure which side.",
    question: "Which approach finds it faster here?",
    options: [
      {
        letter: "A",
        text: "Check every box at each level before going deeper.",
        feedbackType: "good",
        feedback:
          "Good instinct. Checking all nearby boxes first keeps the search wide and shallow — you won't miss it.",
      },
      {
        letter: "B",
        text: "Dive deep down one branch first.",
        feedbackType: "insight",
        feedback:
          "You'd find it eventually — but you might dive deep down the wrong branch first, doing extra work.",
      },
    ],
  },
];

/* Layout coordinates for the SVG tree (percentage of container) */
export const TREE_LAYOUT = {
  start: { x: 50, y: 8  },
  A:     { x: 28, y: 28 },
  B:     { x: 72, y: 28 },
  C:     { x: 16, y: 52 },
  D:     { x: 40, y: 52 },
  E:     { x: 60, y: 52 },
  F:     { x: 84, y: 52 },
  G:     { x: 10, y: 76 },
  H:     { x: 22, y: 76 },
};
