import React from "react";
import { pyRepr } from "../../engine/interpreter.js";

/* Color map for Python types */
const TYPE_COLORS = {
  int: "#007aff", float: "#007aff", str: "#d35400", bool: "#5856d6",
  none: "#8e8e93", list: "#ff3b30", tuple: "#ff9500", dict: "#34c759",
  set: "#af52de", function: "#5856d6", object: "#5ac8fa", range: "#007aff",
};

function typeColor(val) {
  if (!val) return "#8e8e93";
  return TYPE_COLORS[val.type] || "#8e8e93";
}

function valStr(val) {
  if (!val) return "None";
  if (val.type === "function") return `<fn ${val.value.name}>`;
  return pyRepr(val, false);
}

/* -------- Variable block -------- */
export function VarBlock({ name, value, highlighted = false }) {
  const color = typeColor(value);
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "4px 10px",
      borderRadius: 6,
      background: highlighted ? `${color}18` : "transparent",
      border: highlighted ? `1px solid ${color}40` : "1px solid transparent",
      transition: "all 0.22s ease",
    }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--text-3)", minWidth: 70 }}>{name}</span>
      <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--bg-2)", padding: "1px 5px", borderRadius: 4 }}>
        {value?.type || "?"}
      </span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 600, color }}>
        {valStr(value)}
      </span>
    </div>
  );
}

/* -------- Function Frame (call stack) -------- */
export function FrameBlock({ frame, isActive = false, isNew = false }) {
  const vars = Object.entries(frame.vars || {}).filter(([k]) => k !== "self");
  return (
    <div
      className={`stack-frame${isActive ? " active" : ""}${isNew ? " new" : ""}`}
    >
      <div className="stack-frame-header">
        <span style={{ fontSize: 13 }}>⬡</span>
        <span>{frame.name}( )</span>
        <span style={{ color: "var(--muted)", fontSize: 11, fontWeight: 400 }}>line {frame.line}</span>
      </div>
      <div className="stack-frame-body">
        {vars.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--muted)" }}>— no local variables yet —</div>
        ) : (
          vars.map(([k, v]) => <VarBlock key={k} name={k} value={v} />)
        )}
      </div>
    </div>
  );
}

/* -------- Object Block -------- */
export function ObjectBlock({ name, className, fields = {}, theme = "sky" }) {
  const entries = Object.entries(fields);
  return (
    <div className={`obj-card vblock-${theme}`}>
      <div className="obj-header" style={{ fontSize: 12 }}>
        <span style={{ fontSize: 14 }}>◈</span>
        <span>{name}</span>
        <span style={{ fontSize: 11, opacity: 0.7 }}>: {className}</span>
      </div>
      <div className="obj-body">
        {entries.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--muted)" }}>— empty —</div>
        ) : (
          entries.map(([k, v]) => (
            <div key={k} className="obj-attr">
              <span className="obj-attr-key">{k}</span>
              <span style={{ color: "var(--muted)", fontSize: 11 }}>=</span>
              <span className="obj-attr-val" style={{ color: typeColor(v) }}>{valStr(v)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* -------- Queue / Stack node -------- */
export function DSNode({ label, variant = "default" }) {
  const cls = variant === "head" ? "ds-node queue-head"
    : variant === "top" ? "ds-node stack-top"
    : "ds-node";
  return <div className={cls}>{label}</div>;
}

/* -------- Queue panel -------- */
export function QueuePanel({ items = [], label = "QUEUE" }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="ds-label">{label}</span>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>FRONT → ← BACK</span>
      </div>
      <div className="ds-panel" style={{ minHeight: 56 }}>
        {items.length === 0 ? (
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>— empty —</span>
        ) : (
          items.map((item, i) => (
            <DSNode key={i} label={item} variant={i === 0 ? "head" : "default"} />
          ))
        )}
      </div>
    </div>
  );
}

/* -------- Stack panel -------- */
export function StackPanel({ items = [], label = "STACK" }) {
  const reversed = [...items].reverse(); // top of stack first
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span className="ds-label">{label}</span>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>↑ TOP</span>
      </div>
      <div className="ds-panel" style={{ flexDirection: "column", gap: 4 }}>
        {reversed.length === 0 ? (
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>— empty —</span>
        ) : (
          reversed.map((item, i) => (
            <DSNode key={i} label={item} variant={i === 0 ? "top" : "default"} />
          ))
        )}
      </div>
    </div>
  );
}

/* -------- Globals panel -------- */
export function GlobalsPanel({ globals = {} }) {
  const entries = Object.entries(globals).filter(([, v]) => v?.type !== "function");
  return (
    <div className="glass-sm" style={{ padding: "10px 14px" }}>
      <div className="ds-label" style={{ marginBottom: 8 }}>Global Variables</div>
      {entries.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--muted)" }}>— none yet —</div>
      ) : (
        entries.map(([k, v]) => <VarBlock key={k} name={k} value={v} />)
      )}
    </div>
  );
}

/* -------- Output panel -------- */
export function OutputPanel({ output = [] }) {
  return (
    <div className="glass-sm" style={{ padding: "10px 14px", fontFamily: "var(--mono)", fontSize: 12.5 }}>
      <div className="ds-label" style={{ marginBottom: 8 }}>Console Output</div>
      {output.length === 0 ? (
        <div style={{ color: "var(--muted)" }}>— no output yet —</div>
      ) : (
        output.map((line, i) => (
          <div key={i} style={{ color: "var(--text-2)", lineHeight: 1.7 }}>{line}</div>
        ))
      )}
    </div>
  );
}
