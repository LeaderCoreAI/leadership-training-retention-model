import { useState, useMemo, useCallback } from "react";
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from "recharts";

// ─── Parameter Definitions ────────────────────────────────────────────────────
// Each parameter is tagged as:
//   RESEARCH: Directly from meta-analytic data or peer-reviewed studies
//   ESTIMATED: Interpolated from best available evidence, user-adjustable

const MONTHS = 24;
const SPM = 4; // steps per month (weekly)
const TOTAL = MONTHS * SPM;

// ─── Curve Generators ─────────────────────────────────────────────────────────

function elearningCurve(p) {
  const pts = [];
  for (let i = 0; i <= TOTAL; i++) {
    const m = i / SPM;
    // E-learning: mostly declarative, some contextual memory
    // Decay split: declarative portion decays fast, small residual from meaningful context
    const decl = (1 - p.elearningFloor / 100) * Math.exp(-p.elearningDecayRate * m);
    const retention = Math.max(p.elearningFloor / 100, decl + p.elearningFloor / 100);
    pts.push({ step: i, month: Math.round(m * 10) / 10, retention: Math.round(retention * 1000) / 10 });
  }
  return pts;
}

function singleWorkshopCurve(p) {
  const pts = [];
  for (let i = 0; i <= TOTAL; i++) {
    const m = i / SPM;
    const declPortion = (1 - p.workshopExperientialRatio / 100);
    const expPortion = p.workshopExperientialRatio / 100;
    const decl = declPortion * Math.exp(-p.workshopDeclDecay * m);
    const exp = expPortion * Math.exp(-p.workshopExpDecay * m);
    const floor = p.workshopFloor / 100;
    const retention = Math.max(floor, decl + exp);
    pts.push({ step: i, month: Math.round(m * 10) / 10, retention: Math.round(retention * 1000) / 10 });
  }
  return pts;
}

function multiWorkshopCurve(p) {
  const pts = [];
  const workshops = [0, 2, 4];
  let cur = 0;
  for (let i = 0; i <= TOTAL; i++) {
    const m = i / SPM;
    const isWS = workshops.some(wm => Math.abs(m - wm) < 0.05);
    if (isWS) {
      const boost = cur < 0.1 ? p.workshopBoostInitial / 100 : Math.min(0.97, cur + (1 - cur) * (p.workshopBoostSubsequent / 100));
      cur = boost;
    }
    if (!isWS && i > 0) {
      cur = cur * Math.exp(-p.multiWorkshopDecay * (1 / SPM));
    }
    if (i === 0) cur = 1.0;  // Month 0 = program kickoff, 100% baseline
    const floor = p.multiWorkshopFloor / 100;
    pts.push({ step: i, month: Math.round(m * 10) / 10, retention: Math.round(Math.max(floor, cur) * 1000) / 10 });
  }
  return pts;
}

function simCurve(p, mode) {
  // mode: "continuous" | "maintenance" | "stops"
  const pts = [];
  const workshops = [0, 2, 4];
  let cur = 0;
  let procBase = 0;
  const stopMonth = 6;
  const intensiveEnd = 6;

  for (let i = 0; i <= TOTAL; i++) {
    const m = i / SPM;
    const wk = i;
    const isWS = workshops.some(wm => Math.abs(m - wm) < 0.05);
    if (isWS) {
      const boost = cur < 0.1 ? p.workshopBoostInitial / 100 : Math.min(0.97, cur + (1 - cur) * (p.workshopBoostSubsequent / 100));
      cur = boost;
    }

    let freq;
    if (mode === "continuous") freq = p.simFrequency;
    else if (mode === "maintenance") freq = m <= intensiveEnd ? p.simFrequency : p.maintenanceFrequency;
    else freq = p.simFrequency; // stops

    const active = mode === "stops" ? m <= stopMonth : true;
    const isSim = !isWS && wk > 0 && wk % freq === 0 && active;

    if (isSim) {
      const potency = (mode === "maintenance" && m > intensiveEnd) ? (p.maintenancePotency / 100) : 1.0;
      const boost = ((p.simBoostBase / 100) + (1 - cur) * (p.simBoostAdaptive / 100)) * potency;
      cur = Math.min(0.97, cur + boost);
      const procGain = (mode === "maintenance" && m > intensiveEnd)
        ? (p.proceduralConversionRate / 100) * 0.4
        : (p.proceduralConversionRate / 100);
      procBase = Math.min(p.proceduralCeiling / 100, procBase + procGain);
    }

    if (!isWS && !isSim && i > 0) {
      let decayRate, procDecay;
      if (mode === "stops" && m > stopMonth) {
        decayRate = p.openSkillDecayRate;
        procDecay = p.openSkillProceduralDecay;
      } else {
        decayRate = p.simActiveDecayRate;
        procDecay = p.proceduralBaseDecay;
      }
      // Decay slows as cur approaches procBase (procedural floor acts as attractor)
      // This models the fact that procedural memory resists further decay
      const distFromFloor = procBase > 0 ? Math.max(0, (cur - procBase) / cur) : 1;
      const effectiveDecay = decayRate * (0.3 + 0.7 * distFromFloor);
      cur = cur * Math.exp(-effectiveDecay * (1 / SPM));
      procBase = procBase * Math.exp(-procDecay * (1 / SPM));
    }

    cur = Math.max(cur, procBase);
    if (i === 0) cur = 1.0;  // Month 0 = program kickoff, 100% baseline
    const floor = mode === "stops" ? p.simStopsFloor / 100 : p.multiWorkshopFloor / 100;
    pts.push({ step: i, month: Math.round(m * 10) / 10, retention: Math.round(Math.max(floor, cur) * 1000) / 10 });
  }
  return pts;
}

function merge(el, sw, mw, sc, sm, ss) {
  return el.map((e, i) => ({
    month: e.month, elearning: e.retention, singleWorkshop: sw[i].retention,
    multiWorkshop: mw[i].retention, simContinuous: sc[i].retention,
    simMaintenance: sm[i].retention, simStops: ss[i].retention,
  }));
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULTS = {
  // E-learning
  elearningDecayRate: 0.35,     // ESTIMATED: monthly decay for passive e-learning
  elearningFloor: 10,           // ESTIMATED: residual retention % after 24mo

  // Workshop components
  workshopExperientialRatio: 55, // ESTIMATED: % of workshop learning that is experiential vs declarative
  workshopDeclDecay: 0.30,       // ESTIMATED: declarative component monthly decay
  workshopExpDecay: 0.10,        // ESTIMATED: experiential component monthly decay
  workshopFloor: 15,             // ESTIMATED: single workshop residual floor %
  workshopBoostInitial: 90,      // ESTIMATED: initial workshop retention %
  workshopBoostSubsequent: 80,   // ESTIMATED: subsequent workshop re-boost efficiency %

  // Multi-workshop
  multiWorkshopDecay: 0.12,      // ESTIMATED: between-workshop monthly decay
  multiWorkshopFloor: 25,        // ESTIMATED: multi-workshop residual floor %

  // Simulation parameters
  simFrequency: 2,               // USER CHOICE: weeks between intensive sims
  maintenanceFrequency: 8,       // USER CHOICE: weeks between maintenance sims
  simBoostBase: 5,               // ESTIMATED: base retention boost per sim session %
  simBoostAdaptive: 15,          // ESTIMATED: additional boost scaled by gap from ceiling %
  proceduralConversionRate: 2.5, // ESTIMATED: procedural floor gain per sim session %
  proceduralCeiling: 65,         // ESTIMATED: max procedural floor %
  simActiveDecayRate: 0.07,      // RESEARCH-ANCHORED: ~0.08 SD/mo (Tatel & Ackerman 2025)
  proceduralBaseDecay: 0.015,    // ESTIMATED: procedural memory monthly decay
  maintenancePotency: 75,        // ESTIMATED: maintenance sim effectiveness vs intensive %

  // Open skill decay (when practice stops)
  openSkillDecayRate: 0.10,      // ESTIMATED: faster than closed skill decay
  openSkillProceduralDecay: 0.04,// ESTIMATED: open skill procedural floor decay
  simStopsFloor: 32,             // ESTIMATED: floor when sim practice ceases — higher than multi-workshop due to accumulated procedural encoding
};

// ─── Parameter metadata for UI ────────────────────────────────────────────────
const PARAMS = [
  { section: "E-Learning Curve", items: [
    { key: "elearningDecayRate", label: "Monthly decay rate", min: 0.1, max: 0.6, step: 0.01, tag: "ESTIMATED", note: "How fast passive e-learning fades. Higher = faster loss." },
    { key: "elearningFloor", label: "Residual floor %", min: 5, max: 25, step: 1, tag: "ESTIMATED", note: "Minimum retention from meaningful context (not zero like syllables)." },
  ]},
  { section: "Single Workshop", items: [
    { key: "workshopExperientialRatio", label: "Experiential ratio %", min: 30, max: 80, step: 5, tag: "ESTIMATED", note: "% of learning that is experiential vs. lecture-based." },
    { key: "workshopDeclDecay", label: "Declarative decay rate", min: 0.15, max: 0.45, step: 0.01, tag: "ESTIMATED", note: "Monthly decay for the lecture/theory component." },
    { key: "workshopExpDecay", label: "Experiential decay rate", min: 0.04, max: 0.18, step: 0.01, tag: "ESTIMATED", note: "Monthly decay for the hands-on/exercise component." },
    { key: "workshopFloor", label: "Residual floor %", min: 8, max: 30, step: 1, tag: "ESTIMATED", note: "Minimum retention from a single workshop." },
  ]},
  { section: "Multi-Workshop Program", items: [
    { key: "workshopBoostSubsequent", label: "Re-boost efficiency %", min: 60, max: 95, step: 5, tag: "ESTIMATED", note: "How much of the gap each subsequent workshop (mo 2, 4) closes." },
    { key: "multiWorkshopDecay", label: "Between-workshop decay", min: 0.08, max: 0.25, step: 0.01, tag: "ESTIMATED", note: "Monthly decay between and after workshops." },
    { key: "multiWorkshopFloor", label: "Residual floor %", min: 15, max: 40, step: 1, tag: "ESTIMATED", note: "Long-term minimum from spaced multi-workshop program. Should be meaningfully above single workshop." },
  ]},
  { section: "Simulation Practice", items: [
    { key: "simBoostBase", label: "Base boost per session %", min: 2, max: 10, step: 0.5, tag: "ESTIMATED", note: "Flat retention boost from each sim session." },
    { key: "simBoostAdaptive", label: "Adaptive boost factor %", min: 5, max: 25, step: 1, tag: "ESTIMATED", note: "Additional boost scaled by how much room to improve." },
    { key: "proceduralConversionRate", label: "Procedural conversion %/session", min: 1, max: 5, step: 0.5, tag: "ESTIMATED", note: "How much each sim raises the procedural memory floor." },
    { key: "proceduralCeiling", label: "Procedural ceiling %", min: 45, max: 80, step: 5, tag: "ESTIMATED", note: "Maximum procedural floor achievable through practice." },
    { key: "simActiveDecayRate", label: "Decay rate (active practice)", min: 0.04, max: 0.12, step: 0.01, tag: "RESEARCH", note: "~0.08 SD/mo from Tatel & Ackerman 2025 meta-analysis." },
    { key: "proceduralBaseDecay", label: "Procedural floor decay", min: 0.005, max: 0.03, step: 0.005, tag: "ESTIMATED", note: "How slowly the procedural memory floor erodes." },
    { key: "maintenancePotency", label: "Maintenance potency %", min: 50, max: 100, step: 5, tag: "ESTIMATED", note: "Effectiveness of maintenance sims vs. intensive sims." },
  ]},
  { section: "When Practice Stops (Open Skill Decay)", items: [
    { key: "openSkillDecayRate", label: "Open skill decay rate", min: 0.06, max: 0.15, step: 0.01, tag: "ESTIMATED", note: "Faster than closed skills. Interpersonal = adaptive/open." },
    { key: "openSkillProceduralDecay", label: "Procedural floor decay (no practice)", min: 0.02, max: 0.08, step: 0.01, tag: "ESTIMATED", note: "Open skill procedural memory erodes faster without practice." },
    { key: "simStopsFloor", label: "Ultimate floor %", min: 20, max: 45, step: 1, tag: "ESTIMATED", note: "Should be above multi-workshop floor — 6mo of sim practice builds procedural memory that persists even without continued practice." },
  ]},
];

// ─── UI Components ────────────────────────────────────────────────────────────

const COLORS = { elearning: "#6b7280", singleWorkshop: "#ef4444", multiWorkshop: "#f59e0b", simContinuous: "#10b981", simMaintenance: "#06b6d4", simStops: "#a855f7" };
const LABELS = { elearning: "E-Learning Only", singleWorkshop: "Single Workshop", multiWorkshop: "3 Workshops (mo 0,2,4)", simContinuous: "Workshops + Continuous Sim", simMaintenance: "Workshops + Sim → Maintenance", simStops: "Workshops + Sim → Stops at Mo 6" };

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#e0e0e0", backdropFilter: "blur(12px)" }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: "#fff" }}>Month {payload[0]?.payload?.month}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 2 }}>
          <span style={{ color: p.color, fontSize: 11 }}>{p.name}</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

const SliderParam = ({ item, value, onChange }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: "#e0e0e0", fontWeight: 500 }}>{item.label}</span>
        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, fontFamily: "'DM Mono',monospace", fontWeight: 600, background: item.tag === "RESEARCH" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: item.tag === "RESEARCH" ? "#10b981" : "#f59e0b" }}>{item.tag}</span>
      </div>
      <span style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", color: "#94a3b8", fontWeight: 600 }}>{value}</span>
    </div>
    <input type="range" min={item.min} max={item.max} step={item.step} value={value}
      onChange={e => onChange(item.key, parseFloat(e.target.value))}
      style={{ width: "100%", height: 4, appearance: "none", background: "rgba(255,255,255,0.08)", borderRadius: 2, outline: "none", cursor: "pointer", accentColor: item.tag === "RESEARCH" ? "#10b981" : "#f59e0b" }}
    />
    <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2, lineHeight: 1.4 }}>{item.note}</div>
  </div>
);

export default function App() {
  const [p, setP] = useState(DEFAULTS);
  const [vis, setVis] = useState({ elearning: true, singleWorkshop: true, multiWorkshop: true, simContinuous: true, simMaintenance: true, simStops: true });
  const [showParams, setShowParams] = useState(false);
  const [activeTab, setActiveTab] = useState("chart");

  const updateP = useCallback((key, val) => setP(prev => ({ ...prev, [key]: val })), []);
  const toggle = k => setVis(v => ({ ...v, [k]: !v[k] }));
  const resetAll = () => setP(DEFAULTS);

  const data = useMemo(() => {
    const el = elearningCurve(p);
    const sw = singleWorkshopCurve(p);
    const mw = multiWorkshopCurve(p);
    const sc = simCurve(p, "continuous");
    const sm = simCurve(p, "maintenance");
    const ss = simCurve(p, "stops");
    return merge(el, sw, mw, sc, sm, ss);
  }, [p]);

  const gv = (mo, k) => data[mo * SPM]?.[k];
  const stats = useMemo(() => {
    const keys = Object.keys(COLORS);
    const r = {};
    keys.forEach(k => { r[k] = { m0: gv(0,k), m6: gv(6,k), m12: gv(12,k), m18: gv(18,k), m24: gv(24,k) }; });
    return r;
  }, [data]);

  const modifiedCount = Object.keys(DEFAULTS).filter(k => p[k] !== DEFAULTS[k]).length;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg, #0a0a14 0%, #0f1029 40%, #0a0a14 100%)", color: "#e8e8f0", fontFamily: "'DM Sans',system-ui,sans-serif", padding: "24px 20px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 6, fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: 2, textTransform: "uppercase", color: "#10b981", opacity: 0.8 }}>Configurable Research Model · 24-Month View</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, margin: "0 0 6px 0", background: "linear-gradient(135deg, #e8e8f0 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Leadership Skill Retention: Training Approaches Compared
        </h1>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 20px 0", lineHeight: 1.6, maxWidth: 800 }}>
          All curves model leadership development programs (not syllable memorization). Parameters tagged <span style={{ color: "#10b981", fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 600 }}>RESEARCH</span> are directly from meta-analyses. Parameters tagged <span style={{ color: "#f59e0b", fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 600 }}>ESTIMATED</span> are interpolated from best available evidence — adjust them with sliders to test assumptions.
        </p>

        {/* Legend toggles */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {Object.keys(COLORS).map(k => (
            <button key={k} onClick={() => toggle(k)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, border: `1px solid ${vis[k] ? COLORS[k]+"55" : "rgba(255,255,255,0.06)"}`, background: vis[k] ? COLORS[k]+"12" : "rgba(255,255,255,0.02)", color: vis[k] ? COLORS[k] : "#555", cursor: "pointer", fontSize: 11, fontWeight: 500, fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: vis[k] ? COLORS[k] : "#333" }} />
              {LABELS[k]}
            </button>
          ))}
        </div>

        {/* Frequency controls + param toggle */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 7, padding: "4px 10px" }}>
            <span style={{ fontSize: 10, color: "#10b981", fontWeight: 500 }}>Intensive sim every</span>
            <select value={p.simFrequency} onChange={e => updateP("simFrequency", Number(e.target.value))} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 3, color: "#10b981", fontSize: 11, fontWeight: 600, padding: "1px 4px", fontFamily: "'DM Mono',monospace", cursor: "pointer" }}>
              {[1,2,3,4].map(v => <option key={v} value={v}>{v} wk</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 7, padding: "4px 10px" }}>
            <span style={{ fontSize: 10, color: "#06b6d4", fontWeight: 500 }}>Maintenance every</span>
            <select value={p.maintenanceFrequency} onChange={e => updateP("maintenanceFrequency", Number(e.target.value))} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: 3, color: "#06b6d4", fontSize: 11, fontWeight: 600, padding: "1px 4px", fontFamily: "'DM Mono',monospace", cursor: "pointer" }}>
              {[4,6,8,10,12].map(v => <option key={v} value={v}>{v} wk</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setShowParams(!showParams)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.3)", background: showParams ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.03)", color: showParams ? "#f59e0b" : "#94a3b8", cursor: "pointer", fontSize: 11, fontWeight: 500, fontFamily: "'DM Sans',sans-serif" }}>
            {showParams ? "Hide" : "Show"} Model Parameters {modifiedCount > 0 && <span style={{ marginLeft: 4, fontSize: 9, background: "rgba(245,158,11,0.2)", padding: "1px 5px", borderRadius: 3 }}>{modifiedCount} modified</span>}
          </button>
          {modifiedCount > 0 && (
            <button onClick={resetAll} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 500, fontFamily: "'DM Sans',sans-serif" }}>Reset All</button>
          )}
        </div>

        {/* Parameter Panel */}
        {showParams && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {PARAMS.map(section => (
                <div key={section.section}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#e8e8f0", marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{section.section}</div>
                  {section.items.map(item => (
                    <SliderParam key={item.key} item={item} value={p[item.key]} onChange={updateP} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 16, background: "rgba(255,255,255,0.04)", borderRadius: 7, padding: 2, width: "fit-content" }}>
          {[{ id: "chart", label: "Retention Curves" }, { id: "data", label: "Comparison Table" }].map(v => (
            <button key={v.id} onClick={() => setActiveTab(v.id)} style={{ padding: "5px 14px", borderRadius: 5, border: "none", background: activeTab === v.id ? "rgba(255,255,255,0.1)" : "transparent", color: activeTab === v.id ? "#fff" : "#6b7280", cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans',sans-serif" }}>{v.label}</button>
          ))}
        </div>

        {/* CHART */}
        {activeTab === "chart" && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "20px 12px 10px 2px", marginBottom: 20 }}>
            <ResponsiveContainer width="100%" height={440}>
              <ComposedChart data={data} margin={{ top: 8, right: 14, left: 6, bottom: 18 }}>
                <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.1} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" type="number" domain={[0,24]} ticks={[0,2,4,6,8,10,12,14,16,18,20,22,24]} tickFormatter={v => `M${v}`} tick={{ fill: "#6b7280", fontSize: 9, fontFamily: "'DM Mono',monospace" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} label={{ value: "Months", position: "insideBottom", offset: -10, fill: "#6b7280", fontSize: 10 }} />
                <YAxis domain={[0,100]} ticks={[0,20,40,60,80,100]} tickFormatter={v => `${v}%`} tick={{ fill: "#6b7280", fontSize: 9, fontFamily: "'DM Mono',monospace" }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} />
                <Tooltip content={<Tip />} />
                <ReferenceLine x={6} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                <ReferenceLine y={50} stroke="rgba(239,68,68,0.15)" strokeDasharray="8 4" />
                {[0,2,4].map(m => <ReferenceLine key={m} x={m} stroke="rgba(245,158,11,0.2)" strokeDasharray="4 4" />)}
                {vis.simContinuous && <Area type="monotone" dataKey="simContinuous" fill="url(#sg)" stroke="none" isAnimationActive={false} />}
                {vis.elearning && <Line type="monotone" dataKey="elearning" name={LABELS.elearning} stroke={COLORS.elearning} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />}
                {vis.singleWorkshop && <Line type="monotone" dataKey="singleWorkshop" name={LABELS.singleWorkshop} stroke={COLORS.singleWorkshop} strokeWidth={2} dot={false} isAnimationActive={false} />}
                {vis.multiWorkshop && <Line type="monotone" dataKey="multiWorkshop" name={LABELS.multiWorkshop} stroke={COLORS.multiWorkshop} strokeWidth={2} dot={false} isAnimationActive={false} />}
                {vis.simStops && <Line type="monotone" dataKey="simStops" name={LABELS.simStops} stroke={COLORS.simStops} strokeWidth={2.5} strokeDasharray="8 3" dot={false} isAnimationActive={false} />}
                {vis.simMaintenance && <Line type="monotone" dataKey="simMaintenance" name={LABELS.simMaintenance} stroke={COLORS.simMaintenance} strokeWidth={2.5} dot={false} isAnimationActive={false} />}
                {vis.simContinuous && <Line type="monotone" dataKey="simContinuous" name={LABELS.simContinuous} stroke={COLORS.simContinuous} strokeWidth={3} dot={false} isAnimationActive={false} />}
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 2, flexWrap: "wrap" }}>
              <span style={{ fontSize: 9, color: "#f59e0b", opacity: 0.5, fontFamily: "'DM Mono',monospace" }}>┆ Workshops at mo 0, 2, 4</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono',monospace" }}>┆ Phase change at mo 6</span>
              <span style={{ fontSize: 9, color: "#ef4444", opacity: 0.35, fontFamily: "'DM Mono',monospace" }}>─ ─ 50% threshold</span>
            </div>
          </div>
        )}

        {/* TABLE */}
        {activeTab === "data" && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "auto", marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 680 }}>
              <thead><tr style={{ background: "rgba(255,255,255,0.04)" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#94a3b8", fontWeight: 500, fontSize: 10 }}>Approach</th>
                {["Start","Mo 6","Mo 12","Mo 18","Mo 24","24-mo Loss"].map(h => <th key={h} style={{ padding: "10px 8px", textAlign: "center", color: "#94a3b8", fontWeight: 500, fontSize: 10 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {Object.keys(COLORS).map(k => {
                  const s = stats[k];
                  return (
                    <tr key={k} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS[k], flexShrink: 0 }} />
                        <span style={{ fontWeight: 500, color: COLORS[k], fontSize: 11 }}>{LABELS[k]}</span>
                      </td>
                      {[s?.m0, s?.m6, s?.m12, s?.m18, s?.m24].map((v,i) => <td key={i} style={{ padding: "8px", textAlign: "center", fontFamily: "'DM Mono',monospace", color: "#e8e8f0", fontSize: 11 }}>{v}%</td>)}
                      <td style={{ padding: "8px", textAlign: "center", fontFamily: "'DM Mono',monospace", fontSize: 11, color: (k === "simContinuous" || k === "simMaintenance") ? "#10b981" : "#ef4444" }}>
                        -{Math.round((s?.m0 || 0) - (s?.m24 || 0))}pp
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 8, marginBottom: 24 }}>
          {[
            { m: `${stats.simContinuous?.m24}%`, l: "Continuous sim @ 24mo", a: COLORS.simContinuous },
            { m: `${stats.simMaintenance?.m24}%`, l: "Maintenance @ 24mo", a: COLORS.simMaintenance },
            { m: `${stats.simStops?.m24}%`, l: "Sim stops @ 24mo", a: COLORS.simStops },
            { m: `${stats.multiWorkshop?.m24}%`, l: "Workshops only @ 24mo", a: COLORS.multiWorkshop },
            { m: `${stats.elearning?.m24}%`, l: "E-learning only @ 24mo", a: COLORS.elearning },
            { m: `${Math.round((stats.simMaintenance?.m24||0) - (stats.simStops?.m24||0))}pp`, l: "Maintenance vs stopping", a: "#06b6d4" },
          ].map((c, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${c.a}22`, borderRadius: 9, padding: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'DM Mono',monospace", color: c.a, marginBottom: 1 }}>{c.m}</div>
              <div style={{ fontSize: 10, color: "#b0b0c0", fontWeight: 500 }}>{c.l}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px 0" }}>Phased Practice Model</h3>
          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, margin: "30px 0 14px 0", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "25%", height: 4, background: "linear-gradient(90deg, #f59e0b, #10b981)", borderRadius: "2px 0 0 2px" }} />
            <div style={{ position: "absolute", top: 0, left: "25%", width: "25%", height: 4, background: "linear-gradient(90deg, #10b981, #06b6d4)" }} />
            <div style={{ position: "absolute", top: 0, left: "50%", width: "50%", height: 4, background: "linear-gradient(90deg, #06b6d4, #06b6d466)", borderRadius: "0 2px 2px 0" }} />
          </div>
          <div style={{ display: "flex", fontSize: 9, color: "#94a3b8", fontFamily: "'DM Mono',monospace" }}>
            <div style={{ width: "25%", textAlign: "center" }}><span style={{ color: "#f59e0b" }}>▍</span> INTENSIVE<br /><span style={{ fontSize: 8, color: "#6b7280" }}>Mo 0–6 · Workshops + sims</span></div>
            <div style={{ width: "25%", textAlign: "center" }}><span style={{ color: "#10b981" }}>▍</span> BUILDING<br /><span style={{ fontSize: 8, color: "#6b7280" }}>Mo 7–12 · Monthly sims</span></div>
            <div style={{ flex: 1, textAlign: "center" }}><span style={{ color: "#06b6d4" }}>▍</span> MAINTENANCE<br /><span style={{ fontSize: 8, color: "#6b7280" }}>Mo 13+ · Quarterly sims · Never stops</span></div>
          </div>
        </div>

        <div style={{ fontSize: 9, color: "#4a4a5a", textAlign: "center", fontFamily: "'DM Mono',monospace", lineHeight: 1.5 }}>
          Research anchors: Cook et al. (2011), Tatel & Ackerman (2025), Lacerenza et al. (2017), Ericsson (2004, 2008), Jørgensen et al. (2025). All ESTIMATED parameters are user-adjustable.
        </div>
      </div>
    </div>
  );
}
