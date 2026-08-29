import React, { useMemo } from "react";

/* Lightweight syntax highlighter */
const KWS = new Set(["def","class","return","if","else","elif","for","while","in","not","and","or",
  "True","False","None","break","continue","pass","import","from","as","is","global","lambda"]);

function highlightLine(src) {
  const out = [];
  let i = 0;
  const n = src.length;

  while (i < n) {
    if (src[i] === "#") { out.push({ text: src.slice(i), cls: "tok-cmt" }); break; }

    if (src[i] === '"' || src[i] === "'") {
      let j = i;
      const q = src[i]; j++;
      while (j < n && src[j] !== q) {
        if (src[j] === "\\" && j+1 < n) j++;
        j++;
      }
      j++;
      out.push({ text: src.slice(i, j), cls: "tok-str" });
      i = j; continue;
    }

    if (/[0-9]/.test(src[i]) || (src[i] === "." && i+1 < n && /[0-9]/.test(src[i+1]))) {
      let j = i;
      while (j < n && /[0-9.]/.test(src[j])) j++;
      out.push({ text: src.slice(i, j), cls: "tok-num" });
      i = j; continue;
    }

    if (/[A-Za-z_]/.test(src[i])) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      let cls = "";
      if (word === "f" || word === "F") {
        // peek: if next char is a quote, it's an f-string prefix — highlight as string
        cls = (j < n && (src[j] === '"' || src[j] === "'")) ? "tok-str" : "";
      } else if (KWS.has(word)) cls = "tok-kw";
      else if (j < n && src[j] === "(") cls = "tok-func";
      else if (/^[A-Z]/.test(word)) cls = "tok-cls";
      out.push({ text: word, cls });
      i = j; continue;
    }

    const ops2 = ["==","!=","<=",">=","+=","-=","*=","/=","//","**","->"];
    if (i+1 < n && ops2.includes(src.slice(i,i+2))) {
      out.push({ text: src.slice(i,i+2), cls: "tok-op" });
      i += 2; continue;
    }
    if ("+-*/%=<>!:,()[]{}".includes(src[i])) {
      out.push({ text: src[i], cls: "tok-op" });
      i++; continue;
    }

    out.push({ text: src[i], cls: "" });
    i++;
  }
  return out;
}

function CodeLine({ line, lineNo, isActive, showLineNumbers }) {
  const tokens = useMemo(() => highlightLine(line), [line]);
  return (
    <div className={`code-line${isActive ? " active" : ""}`} style={{ minHeight: 22 }}>
      {showLineNumbers && (
        <span className="code-line-num">{lineNo}</span>
      )}
      <span className="code-line-content">
        {tokens.map((tok, ti) =>
          tok.cls ? (
            <span key={ti} className={tok.cls}>{tok.text}</span>
          ) : (
            <span key={ti}>{tok.text}</span>
          )
        )}
        {line === "" && <span> </span>}
      </span>
    </div>
  );
}

/**
 * CodePanel
 * Props:
 *   code: string          — Python source
 *   activeLine: number    — 1-indexed line to highlight (0 = none)
 *   maxHeight: string     — CSS max-height
 *   showLineNumbers: bool
 */
export default function CodePanel({ code = "", activeLine = 0, maxHeight = "400px", showLineNumbers = true }) {
  const lines = useMemo(() => code.split("\n"), [code]);

  return (
    <div className="code-panel" style={{ maxHeight, overflowY: "auto" }}>
      <div style={{ padding: "12px 0" }}>
        {lines.map((line, idx) => (
          <CodeLine
            key={idx}
            line={line}
            lineNo={idx + 1}
            isActive={idx + 1 === activeLine}
            showLineNumbers={showLineNumbers}
          />
        ))}
      </div>
    </div>
  );
}
