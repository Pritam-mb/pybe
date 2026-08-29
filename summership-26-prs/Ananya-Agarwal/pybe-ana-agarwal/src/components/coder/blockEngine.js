/**
 * blockEngine.js — Generic block tree → Python code + run step generator
 *
 * This engine is concept-agnostic: it reads the block tree + block definitions
 * and produces both Python code and a sequence of animated run steps.
 * Adding a new concept only requires new entries in toolBlocks.js.
 */

import { BLOCK_DEFS } from "../../data/toolBlocks.js";

/* ─────────────────────────────────────────────
   BLOCK TREE UTILITIES
   ───────────────────────────────────────────── */

let _idCounter = 1;
export function createBlock(type) {
  return { id: `b_${_idCounter++}_${type}`, type, children: [] };
}

export function insertBlock(tree, parentId, newBlock) {
  if (parentId === null) return [...tree, newBlock];
  return tree.map(b => {
    if (b.id === parentId) return { ...b, children: [...b.children, newBlock] };
    return { ...b, children: insertBlock(b.children, parentId, newBlock) };
  });
}

export function removeBlock(tree, blockId) {
  return tree
    .filter(b => b.id !== blockId)
    .map(b => ({ ...b, children: removeBlock(b.children, blockId) }));
}

export function findBlock(tree, blockId) {
  for (const b of tree) {
    if (b.id === blockId) return b;
    const found = findBlock(b.children, blockId);
    if (found) return found;
  }
  return null;
}

export function findParentId(tree, blockId, parentId = null) {
  for (const b of tree) {
    if (b.id === blockId) return parentId;
    const found = findParentId(b.children, blockId, b.id);
    if (found !== undefined) return found;
  }
  return undefined;
}

/** Returns all block ids in depth-first order */
export function flattenIds(tree) {
  const ids = [];
  function walk(blocks) {
    for (const b of blocks) {
      ids.push(b.id);
      walk(b.children);
    }
  }
  walk(tree);
  return ids;
}

/* ─────────────────────────────────────────────
   PYTHON CODE GENERATION
   ───────────────────────────────────────────── */

function blockToCode(block, concept, depth = 0) {
  const def = BLOCK_DEFS[block.type];
  if (!def) return `${"    ".repeat(depth)}# unknown block: ${block.type}`;

  const childCode = block.children
    .map(c => blockToCode(c, concept, depth + 1))
    .join("\n");

  if (def.codeLines) {
    const raw = def.codeLines(block, childCode, concept);
    // Indent for depth
    if (depth === 0) return raw;
    return raw.split("\n").map(l => `${"    ".repeat(depth - 1)}${l}`).join("\n");
  }
  return `${"    ".repeat(depth)}# ${block.type}`;
}

export function generatePythonCode(tree, concept) {
  if (tree.length === 0) return "# Drag blocks from the toolbox to start building";
  return tree.map(b => blockToCode(b, concept, 0)).join("\n\n");
}

/* ─────────────────────────────────────────────
   VALIDATION
   ───────────────────────────────────────────── */

export function validateTree(tree, concept) {
  const issues = [];
  const ids = flattenIds(tree);

  if (tree.length === 0) {
    return { valid: false, issues: ["No blocks on canvas — drag a 'def' block to start."] };
  }

  const hasDef = tree.some(b => b.type === "def");
  if (!hasDef) {
    issues.push("No 'def' block found — your function needs a definition container.");
  }

  if (concept === "recursion") {
    const allTypes = ids.map(id => findBlock(tree, id)?.type).filter(Boolean);
    if (!allTypes.includes("if-base")) {
      issues.push("Missing base case (if block) — without it, recursion runs forever.");
    }
    if (!allTypes.includes("call-self")) {
      issues.push("Missing recursive call — the function never calls itself.");
    }
    if (!allTypes.includes("return-base")) {
      issues.push("Missing return in base case — the function won't return a result.");
    }
  }

  if (concept === "dfs") {
    const allTypes = ids.map(id => findBlock(tree, id)?.type).filter(Boolean);
    if (!allTypes.includes("while-loop")) issues.push("Missing while loop — DFS needs to keep exploring until the stack is empty.");
    if (!allTypes.includes("pop-stack")) issues.push("Missing stack pop — DFS needs to take from the top of the pile.");
  }

  if (concept === "bfs") {
    const allTypes = ids.map(id => findBlock(tree, id)?.type).filter(Boolean);
    if (!allTypes.includes("while-loop")) issues.push("Missing while loop — BFS needs to keep exploring until the queue is empty.");
    if (!allTypes.includes("dequeue")) issues.push("Missing dequeue — BFS needs to take from the front of the line.");
  }

  return { valid: issues.length === 0, issues };
}

/* ─────────────────────────────────────────────
   RUN STEP GENERATION
   Produces an ordered animation sequence.
   "Incomplete" builds still produce steps — the
   missing pieces cause the visualizer to show
   what goes wrong, not an error screen.
   ───────────────────────────────────────────── */

export function generateRunSteps(tree, concept) {
  const steps = [];
  const { issues } = validateTree(tree, concept);

  if (tree.length === 0) {
    return [{ blockId: null, label: "Nothing to run — drag a 'def' block to start building.", type: "warning", virtual: true }];
  }

  // Walk the tree to produce steps
  walkSteps(tree, steps, concept, 0);

  // If incomplete, append a warning step
  if (issues.length > 0) {
    issues.forEach(issue => {
      steps.push({ blockId: null, label: `⚠️ ${issue}`, type: "warning", virtual: true });
    });
  }

  // For recursion with call-self but no base case: simulate infinite loop warning
  if (concept === "recursion") {
    const allTypes = flattenIds(tree).map(id => findBlock(tree, id)?.type).filter(Boolean);
    const hasCallSelf = allTypes.includes("call-self");
    const hasBase = allTypes.includes("if-base");
    if (hasCallSelf && !hasBase) {
      steps.push({ blockId: null, type: "warning", virtual: true, label: "⚠️ No base case — this calls itself forever! The call stack would overflow. Add an 'if (base case)' block to stop it." });
    }
  }

  return steps.length > 0 ? steps : [{ blockId: null, label: "Build complete — nothing to trace.", type: "info", virtual: true }];
}

function walkSteps(blocks, steps, concept, depth) {
  for (const block of blocks) {
    const def = BLOCK_DEFS[block.type];
    if (!def) continue;

    const label = typeof def.executionDesc === "function"
      ? def.executionDesc(block)
      : def.executionDesc;

    steps.push({ blockId: block.id, label, type: "enter", depth });

    // Recurse into children
    if (block.children.length > 0) {
      walkSteps(block.children, steps, concept, depth + 1);
    }

    // For call-self: simulate 2 recursive levels
    if (block.type === "call-self" && depth < 2) {
      steps.push({ blockId: block.id, label: `↩ Recursing (depth ${depth + 1}) — calling search() on a smaller half`, type: "recurse", depth: depth + 1, virtual: false });
      if (depth < 1) {
        steps.push({ blockId: block.id, label: `↩ Recursing again (depth ${depth + 2}) — even smaller stack`, type: "recurse", depth: depth + 2, virtual: false });
        steps.push({ blockId: block.id, label: `✓ Base case reached at depth ${depth + 2} — returning answer`, type: "return", depth: depth + 2, virtual: false });
      }
      steps.push({ blockId: block.id, label: `↑ Returning from depth ${depth + 1} — combining results`, type: "return", depth: depth + 1, virtual: false });
    }

    // For while-loop: simulate 3 iterations
    if (block.type === "while-loop") {
      for (let i = 1; i <= 2; i++) {
        steps.push({ blockId: block.id, label: `🔄 Loop iteration ${i + 1} — still items to explore`, type: "loop", depth, virtual: true });
        walkSteps(block.children, steps, concept, depth + 1);
      }
      steps.push({ blockId: block.id, label: `✓ Loop done — list is empty, search complete`, type: "done", depth, virtual: true });
    }
  }
}

/* ─────────────────────────────────────────────
   DYNAMIC INPUT/OUTPUT EVALUATOR
   ───────────────────────────────────────────── */
export function evaluateBlockTree(tree, concept, inputs) {
  const allTypes = flattenIds(tree).map(id => findBlock(tree, id)?.type).filter(Boolean);
  
  if (!allTypes.includes("def")) {
    return { success: false, output: "No function definition found. Drag a 'def' block to start." };
  }

  if (concept === "recursion") {
    const stack = inputs?.stack || [];
    
    const hasBase = allTypes.includes("if-base");
    const hasReturnBase = allTypes.includes("return-base") || allTypes.includes("return-true");
    const hasCallSelf = allTypes.includes("call-self");
    const hasSplit = allTypes.includes("split");

    if (hasCallSelf && !hasBase) {
      return {
        success: false,
        output: "RecursionError: maximum recursion depth exceeded (Stack Overflow)!\n" +
                "The function calls itself indefinitely because there is no 'if (base case)' checking when to stop."
      };
    }

    if (hasBase && !hasReturnBase) {
      return {
        success: false,
        output: "Warning: Base case reached but it did not return any answer.\nResult: None"
      };
    }

    if (!hasCallSelf) {
      if (stack.length === 1) {
        const found = stack[0] === "math notes";
        return {
          success: true,
          output: `search(${JSON.stringify(stack)})\n` +
                  `↳ Stack size is 1. Base case triggers.\n` +
                  `Result: ${found}`
        };
      }
      return {
        success: true,
        output: `search(${JSON.stringify(stack)})\n` +
                `↳ Stack size is ${stack.length} (> 1). Base case check failed.\n` +
                `Result: None (no recursive call to explore further)`
      };
    }

    const logs = [];
    let stepsCount = 0;
    
    function runSearch(subStack, depth = 0) {
      stepsCount++;
      if (stepsCount > 50) {
        throw new Error("Stack Overflow");
      }
      const indent = "  ".repeat(depth);
      logs.push(`${indent}search(${JSON.stringify(subStack)})`);
      
      if (subStack.length === 1) {
        const found = subStack[0] === "math notes";
        logs.push(`${indent} ↳ Base Case: checks 1 notebook directly → ${found}`);
        return found;
      }
      
      if (hasSplit) {
        const mid = Math.floor(subStack.length / 2);
        const left = subStack.slice(0, mid);
        const right = subStack.slice(mid);
        logs.push(`${indent} ↳ Split: left half size ${left.length}, right half size ${right.length}`);
        
        const leftResult = runSearch(left, depth + 1);
        if (leftResult) {
          logs.push(`${indent} ↳ Found in left half!`);
          return true;
        }
        
        const rightResult = runSearch(right, depth + 1);
        if (rightResult) {
          logs.push(`${indent} ↳ Found in right half!`);
          return true;
        }
        
        logs.push(`${indent} ↳ Not found in either half.`);
        return false;
      }
      
      return false;
    }

    try {
      const finalResult = runSearch(stack);
      return {
        success: true,
        output: logs.join("\n") + `\n\nFinal Result: ${finalResult}`
      };
    } catch (e) {
      return {
        success: false,
        output: "RecursionError: maximum recursion depth exceeded (Stack Overflow)!"
      };
    }
  }

  if (concept === "dfs" || concept === "bfs") {
    const startNode = inputs?.startNode || "start";
    const appleNodes = inputs?.appleNodes || ["C", "F", "H"];

    const graph = {
      start: ["A", "B"],
      A: ["C", "D"],
      B: ["E", "F"],
      C: ["G", "H"],
      D: [],
      E: [],
      F: [],
      G: [],
      H: [],
    };

    const hasLoop = allTypes.includes("while-loop");
    const hasPop = allTypes.includes("pop-stack");
    const hasDequeue = allTypes.includes("dequeue");
    const hasVisited = allTypes.includes("check-visited");
    const hasNeighbors = allTypes.includes("add-neighbors");
    const hasPush = allTypes.includes("push-stack");
    const hasEnqueue = allTypes.includes("enqueue");

    if (!hasLoop) {
      return {
        success: true,
        output: `Initialized search list with ['${startNode}']\nResult: Stopped before starting loop.`
      };
    }

    if (!hasPop && !hasDequeue) {
      return {
        success: false,
        output: "Warning: Loop entered but no element was popped or dequeued. Infinite loop detected!"
      };
    }

    const isQueue = hasDequeue || hasEnqueue; 
    const visited = [];
    const list = [startNode];
    const logs = [`Starting search from node '${startNode}' using ${isQueue ? "Queue (FIFO)" : "Stack (LIFO)"}`];
    
    let iterations = 0;
    while (list.length > 0) {
      iterations++;
      if (iterations > 100) {
        logs.push("⚠️ Loop limit reached to prevent browser crash.");
        break;
      }
      
      logs.push(`List state: ${JSON.stringify(list)}`);
      const curr = isQueue ? list.shift() : list.pop();
      logs.push(`  ↳ Visited: '${curr}'`);
      
      if (hasVisited) {
        if (!visited.includes(curr)) {
          visited.push(curr);
          if (appleNodes.includes(curr)) {
            logs.push(`    🍎 APPLE FOUND AT NODE '${curr}'!`);
          }
          
          if (hasNeighbors) {
            const neighbors = graph[curr] || [];
            if (neighbors.length > 0) {
              logs.push(`    ↳ Neighbors of '${curr}': ${JSON.stringify(neighbors)}`);
              
              if (hasEnqueue || hasPush) {
                for (const n of neighbors) {
                  list.push(n);
                }
                logs.push(`      ↳ Added neighbors to list.`);
              } else {
                logs.push(`      ⚠️ Found neighbors, but did not append to list. Drag a 'push' or 'enqueue' block.`);
              }
            }
          }
        } else {
          logs.push(`    ⚠️ Node '${curr}' already visited. Skipping.`);
        }
      } else {
        visited.push(curr);
        const neighbors = graph[curr] || [];
        for (const n of neighbors) {
          list.push(n);
        }
      }
    }

    return {
      success: true,
      output: logs.join("\n") + `\n\nFinal visited sequence: ${JSON.stringify(visited)}`
    };
  }

  return { success: false, output: "Unsupported concept" };
}

