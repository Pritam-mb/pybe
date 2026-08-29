#!/usr/bin/env node
/**
 * check-feedback-length.js
 * Ensures no feedback string in recursionData.js or bfsDfsData.js exceeds 40 words.
 * Run: npm run check-feedback
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "../src");

const MAX_WORDS = 40;

function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// Extract all string values from feedback/feedbackType-adjacent fields
function extractFeedbackStrings(filePath) {
  const src = readFileSync(filePath, "utf8");
  const results = [];

  // Match `feedback: "..."` or `feedback:\n    "..."` patterns (single or double quoted)
  const regex = /feedback\s*:\s*["'`]([\s\S]*?)["'`],?/g;
  let match;
  while ((match = regex.exec(src)) !== null) {
    const text = match[1].replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
    results.push({ file: filePath, text });
  }

  return results;
}

const files = [
  resolve(SRC, "data/recursionData.js"),
  resolve(SRC, "data/bfsDfsData.js"),
];

let failCount = 0;

for (const file of files) {
  const items = extractFeedbackStrings(file);
  for (const { text } of items) {
    const words = countWords(text);
    const shortFile = file.split("/src/")[1];
    if (words > MAX_WORDS) {
      console.error(`\x1b[31m✗ OVER ${MAX_WORDS} words (${words}):\x1b[0m [${shortFile}]`);
      console.error(`  "${text.slice(0, 80)}..."\n`);
      failCount++;
    }
  }
}

if (failCount === 0) {
  console.log(`\x1b[32m✓ All feedback strings are ≤ ${MAX_WORDS} words.\x1b[0m`);
  process.exit(0);
} else {
  console.error(`\x1b[31m${failCount} violation(s) found. Shorten the strings above.\x1b[0m`);
  process.exit(1);
}
