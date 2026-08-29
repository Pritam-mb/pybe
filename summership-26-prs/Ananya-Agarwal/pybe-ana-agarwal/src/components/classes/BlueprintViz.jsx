import React, { useState, useEffect } from "react";

/**
 * BlueprintViz
 * Animated class blueprint → object creation diagram
 */
export function BlueprintViz({ objects = [], className = "Character", attributes = [], methods = [] }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, 2)), 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: "20px", background: "var(--bg)", borderRadius: "var(--r-lg)", border: "1px solid var(--border)" }}>
      {/* Class blueprint */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: step >= 1 ? 32 : 0 }}>
        <div className="blueprint-card" style={{ minWidth: 220, textAlign: "center" }}>
          <div className="blueprint-label">class {className}</div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 8 }}>Attributes</div>
            {attributes.map((a) => (
              <div key={a} style={{ fontFamily: "var(--mono)", fontSize: 13, padding: "3px 0", color: "var(--text-2)", borderBottom: "1px solid var(--border)" }}>
                {a}
              </div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", margin: "12px 0 8px" }}>Methods</div>
            {methods.map((m) => (
              <div key={m} style={{ fontFamily: "var(--mono)", fontSize: 13, padding: "3px 0", color: "var(--indigo)", borderBottom: "1px solid var(--border)" }}>
                {m}()
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Arrows to objects */}
      {step >= 1 && (
        <div className="anim-fade">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ height: 24, borderLeft: "2px solid var(--border-2)", width: 0, margin: "0 auto" }} />
              <div style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0" }}>instantiate →</div>
              <div style={{ height: 24, borderLeft: "2px solid var(--border-2)", width: 0, margin: "0 auto" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {objects.map((obj, i) => (
              <div
                key={obj.name}
                className="anim-pop"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="obj-card" style={{ minWidth: 160 }}>
                  <div className="obj-header" style={{
                    background: "var(--indigo-light)",
                    color: "var(--indigo)",
                    borderColor: "rgba(88,86,214,0.2)",
                    fontSize: 12,
                  }}>
                    <span>◈</span>
                    <span>{obj.name}</span>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>: {className}</span>
                  </div>
                  <div className="obj-body">
                    {Object.entries(obj.fields || {}).map(([k, v]) => (
                      <div key={k} className="obj-attr">
                        <span className="obj-attr-key">{k}</span>
                        <span style={{ color: "var(--muted)", fontSize: 11 }}>=</span>
                        <span className="obj-attr-val">{typeof v === "string" ? `'${v}'` : String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {step >= 2 && (
            <div className="anim-fade" style={{ marginTop: 16, padding: "12px 16px", borderRadius: "var(--r-sm)", background: "var(--emerald-light)", border: "1px solid rgba(52,199,89,0.25)", fontSize: 13.5, color: "#1a6b29" }}>
              ✓ Both objects share the same <em>class definition</em> but hold their own independent <em>instance state</em>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * SelfAnimationViz
 * Animated step-by-step walkthrough of how self works in method dispatch
 */
export function SelfAnimationViz({ steps = [] }) {
  const [step, setStep] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Current step */}
      <div style={{
        padding: "20px 24px",
        borderRadius: "var(--r-lg)",
        background: "var(--surface)",
        border: "1.5px solid var(--border-2)",
        minHeight: 100,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 10 }}>
          Step {step + 1}: {steps[step]?.label}
        </div>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 15, fontWeight: 600,
          color: "var(--indigo)", marginBottom: 8,
          padding: "10px 14px", background: "var(--indigo-light)",
          borderRadius: "var(--r-sm)", border: "1px solid rgba(88,86,214,0.2)",
        }}>
          {steps[step]?.code}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.65 }}>
          {steps[step]?.desc}
        </div>
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            style={{
              width: i === step ? 28 : 10, height: 10,
              borderRadius: 5, border: "none", cursor: "pointer",
              background: i === step ? "var(--indigo)" : i < step ? "var(--emerald)" : "var(--border-2)",
              transition: "all 0.22s ease",
              padding: 0,
            }}
          />
        ))}
        <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 8 }}>{step + 1}/{steps.length}</span>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>← Prev</button>
        <button className="btn btn-sm btn-primary" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1}>Next →</button>
      </div>
    </div>
  );
}
