import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getEgfrColor(egfr) {
  if (egfr == null) return "#888";
  const n = parseFloat(egfr);
  if (n >= 90) return "#0d9e75";
  if (n >= 60) return "#6ab04c";
  if (n >= 45) return "#f9ca24";
  if (n >= 30) return "#f0932b";
  if (n >= 15) return "#eb4d4b";
  return "#6f1e51";
}

function getRiskColor(score) {
  if (score == null) return "#888";
  if (score < 30) return "#0d9e75";
  if (score < 60) return "#f0932b";
  return "#eb4d4b";
}

function getEgfrStage(egfr) {
  if (egfr == null) return { stage: "?", label: "No data" };
  const n = parseFloat(egfr);
  if (n >= 90) return { stage: "G1", label: "Normal" };
  if (n >= 60) return { stage: "G2", label: "Mildly reduced" };
  if (n >= 45) return { stage: "G3a", label: "Mild–moderate" };
  if (n >= 30) return { stage: "G3b", label: "Moderate–severe" };
  if (n >= 15) return { stage: "G4", label: "Severely reduced" };
  return { stage: "G5", label: "Kidney failure" };
}

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

function normRisk(scan) {
  if (!scan) return null;
  if (scan.ckdProbability != null) return parseFloat(scan.ckdProbability) ;
  if (scan.risk_score != null) return parseFloat(scan.risk_score);
  return null;
}

function isCKDDetected(scan) {
  return scan.ckdDetected === true || scan.ckdDetected === "true" || scan.prediction === "CKD";
}

function getTrend(values) {
  const valid = values.filter(v => v != null);
  if (valid.length < 2) return "stable";
  const pct = ((valid[valid.length - 1] - valid[0]) / valid[0]) * 100;
  if (Math.abs(pct) < 5) return "stable";
  return pct > 0 ? "improving" : "worsening";
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const ProgressBar = ({ value, max, color, height = 6 }) => (
  <div style={{ background: "#f0f0f0", borderRadius: 99, overflow: "hidden", height }}>
    <div style={{
      width: `${Math.min(100, (value / max) * 100)}%`,
      height: "100%", background: color, borderRadius: 99,
      transition: "width 0.6s ease",
    }} />
  </div>
);

const TrendBadge = ({ trend }) => {
  const config = {
    improving: { icon: "↑", label: "Improving", bg: "#e8faf3", color: "#0d9e75", border: "#0d9e7533" },
    stable:    { icon: "→", label: "Stable",    bg: "#f0f4ff", color: "#4a7fcb", border: "#4a7fcb33" },
    worsening: { icon: "↓", label: "Worsening", bg: "#fff5f5", color: "#eb4d4b", border: "#eb4d4b33" },
  };
  const c = config[trend] || config.stable;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {c.icon} {c.label}
    </span>
  );
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{
      fontSize: 10, fontWeight: 700, color: "#bbb",
      letterSpacing: "0.1em", textTransform: "uppercase",
      marginBottom: 12, paddingBottom: 8, borderBottom: "0.5px solid #f2f2f2",
    }}>
      {title}
    </div>
    {children}
  </div>
);

const StatCard = ({ label, value, unit, color, sub }) => (
  <div style={{
    background: "#fff", border: "0.5px solid #ebebeb",
    borderRadius: 14, padding: "16px 18px", flex: 1, minWidth: 120,
  }}>
    <div style={{
      fontSize: 10, fontWeight: 700, color: "#bbb",
      letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8,
    }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span style={{ fontSize: 26, fontWeight: 700, color: color || "#111", lineHeight: 1 }}>
        {value ?? "—"}
      </span>
      {unit && <span style={{ fontSize: 12, color: "#bbb" }}>{unit}</span>}
    </div>
    {sub && <div style={{ fontSize: 11, color: "#aaa", marginTop: 5 }}>{sub}</div>}
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "0.5px solid #e0e0e0",
      borderRadius: 10, padding: "10px 14px", fontSize: 13,
      boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
    }}>
      <div style={{ fontWeight: 600, color: "#333", marginBottom: 5 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</strong>
          {p.name === "CKD Risk" ? "%" : p.name === "eGFR" ? " mL/min" : ""}
        </div>
      ))}
    </div>
  );
};

// ─── Stage Journey ────────────────────────────────────────────────────────────
const StageJourney = ({ scans }) => {
  const stages = ["G1", "G2", "G3a", "G3b", "G4", "G5"];
  const stageColors = {
    G1: "#0d9e75", G2: "#6ab04c", G3a: "#f9ca24",
    G3b: "#f0932b", G4: "#eb4d4b", G5: "#6f1e51",
  };

  const scanStages = scans.filter(s => s.egfr != null)
    .map(s => getEgfrStage(parseFloat(s.egfr)).stage);

  if (scanStages.length < 1) return null;

  return (
    <div style={{
      background: "#fff", border: "0.5px solid #ebebeb",
      borderRadius: 16, padding: "20px 22px", marginBottom: 28,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: "#bbb",
        letterSpacing: "0.1em", textTransform: "uppercase",
        marginBottom: 16, paddingBottom: 10, borderBottom: "0.5px solid #f2f2f2",
      }}>
        CKD Stage Journey
      </div>

      {/* Stage ladder */}
      <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        {stages.map((s, i) => {
          const isVisited = scanStages.includes(s);
          const isCurrent = scanStages[scanStages.length - 1] === s;
          return (
            <React.Fragment key={s}>
              <div style={{
                padding: "6px 12px", borderRadius: 8,
                fontSize: 12, fontWeight: 700, position: "relative",
                background: isCurrent ? stageColors[s] : isVisited ? `${stageColors[s]}20` : "#f5f5f5",
                color: isCurrent ? "#fff" : isVisited ? stageColors[s] : "#ccc",
                border: `1.5px solid ${isVisited ? stageColors[s] : "#eee"}`,
              }}>
                {s}
                {isCurrent && (
                  <span style={{
                    position: "absolute", top: -7, right: -4,
                    fontSize: 8, background: "#fff", borderRadius: 4,
                    padding: "1px 3px", color: stageColors[s],
                    border: `1px solid ${stageColors[s]}`, fontWeight: 800,
                  }}>NOW</span>
                )}
              </div>
              {i < stages.length - 1 && <div style={{ color: "#ddd", fontSize: 12 }}>→</div>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Scan → Stage chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {scans.filter(s => s.egfr != null).map((s, i) => {
          const { stage } = getEgfrStage(parseFloat(s.egfr));
          return (
            <div key={i} style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 6,
              background: `${stageColors[stage]}15`,
              color: stageColors[stage],
              border: `0.5px solid ${stageColors[stage]}33`,
              fontWeight: 600,
            }}>
              {fmtDate(s.uploadedAt || s.date)} → {stage}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Scan-to-Scan Delta ───────────────────────────────────────────────────────
const ScanDelta = ({ prev, curr }) => {
  const prevEgfr = prev.egfr != null ? parseFloat(prev.egfr) : null;
  const currEgfr = curr.egfr != null ? parseFloat(curr.egfr) : null;
  const prevRisk = normRisk(prev);
  const currRisk = normRisk(curr);

  const egfrDelta = prevEgfr != null && currEgfr != null ? currEgfr - prevEgfr : null;
  const riskDelta = prevRisk != null && currRisk != null ? currRisk - prevRisk : null;

  if (egfrDelta == null && riskDelta == null) return null;

  return (
    <div style={{
      display: "flex", gap: 8, flexWrap: "wrap",
      padding: "8px 10px", marginTop: 8,
      background: "#fafafa", borderRadius: 8,
      borderLeft: "3px solid #ebebeb",
    }}>
      <span style={{
        fontSize: 10, color: "#bbb", fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase", alignSelf: "center",
      }}>vs prev</span>
      {egfrDelta != null && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
          background: egfrDelta >= 0 ? "#e8faf3" : "#fff5f5",
          color: egfrDelta >= 0 ? "#0d9e75" : "#eb4d4b",
        }}>
          eGFR {egfrDelta >= 0 ? "+" : ""}{egfrDelta.toFixed(1)}
        </span>
      )}
      {riskDelta != null && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
          background: riskDelta <= 0 ? "#e8faf3" : "#fff5f5",
          color: riskDelta <= 0 ? "#0d9e75" : "#eb4d4b",
        }}>
          Risk {riskDelta > 0 ? "+" : ""}{riskDelta.toFixed(1)}%
        </span>
      )}
    </div>
  );
};

// ─── Visit Row ────────────────────────────────────────────────────────────────
const VisitRow = ({ scan, prevScan, isLast }) => {
  const ckd = isCKDDetected(scan);
  const egfrColor = getEgfrColor(scan.egfr);
  const risk = normRisk(scan);

  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0 }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%", marginTop: 5, flexShrink: 0,
          background: ckd ? "#eb4d4b" : "#0d9e75",
        }} />
        {!isLast && <div style={{ width: 1.5, flex: 1, background: "#eee", margin: "4px 0", minHeight: 20 }} />}
      </div>

      <div style={{
        flex: 1, background: "#fff",
        border: "0.5px solid #ebebeb", borderRadius: 12,
        padding: "14px 16px", marginBottom: 14,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>
              {fmtDate(scan.uploadedAt || scan.date)}
            </div>
            <div style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>Kidney scan report</div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: ckd ? "#eb4d4b18" : "#0d9e7518",
            color: ckd ? "#c0392b" : "#0a8a66",
            border: `1px solid ${ckd ? "#eb4d4b33" : "#0d9e7533"}`,
          }}>
            {ckd ? "CKD Detected" : "Normal"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
          <div style={{ background: "#fafafa", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: egfrColor }}>{scan.egfr ?? "—"}</div>
            <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>eGFR</div>
          </div>
          <div style={{ background: "#fafafa", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: getRiskColor(risk) }}>
              {risk != null ? `${risk.toFixed(1)}%` : "—"}
            </div>
            <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>CKD Risk</div>
          </div>
          {scan.normalProbability != null && (
            <div style={{ background: "#fafafa", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0d9e75" }}>
                {(parseFloat(scan.normalProbability) ).toFixed(1)}%
              </div>
              <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>Normal prob.</div>
            </div>
          )}
          {scan.ckdStage && (
            <div style={{ background: "#fafafa", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: egfrColor }}>{scan.ckdStage}</div>
              <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>Stage</div>
            </div>
          )}
        </div>

        {/* Delta from previous scan */}
        {prevScan && <ScanDelta prev={prevScan} curr={scan} />}

        {(scan.message || scan.doctor_comment) && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid #f2f2f2" }}>
            {scan.message && (
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.55, margin: "0 0 4px" }}>{scan.message}</p>
            )}
            {scan.doctor_comment && (
              <p style={{ fontSize: 12, color: "#999", fontStyle: "italic", margin: 0 }}>
                Dr. note: {scan.doctor_comment}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PatientTimeline = ({ patientId: propPatientId }) => {
  const [inputValue, setInputValue]           = useState(propPatientId || "");
  const [activePatientId, setActivePatientId] = useState(propPatientId || "");
  const [scans, setScans]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (propPatientId) { setInputValue(propPatientId); setActivePatientId(propPatientId); }
  }, [propPatientId]);

  useEffect(() => {
    if (!activePatientId) { setLoading(false); setScans([]); return; }
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/scans/${activePatientId}`)
      .then(r => { if (!r.ok) throw new Error(`Server returned ${r.status}`); return r.json(); })
      .then(data => {
        const sorted = [...data].sort(
          (a, b) => new Date(a.uploadedAt || a.date) - new Date(b.uploadedAt || b.date)
        );
        setScans(sorted);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [activePatientId]);

  const handleSearch  = () => { const t = inputValue.trim(); if (t) setActivePatientId(t); };
  const handleKeyDown = e  => { if (e.key === "Enter") handleSearch(); };

  // Derived data
  const latest       = scans[scans.length - 1];
  const latestEgfr   = latest?.egfr != null ? parseFloat(latest.egfr) : null;
  const latestRisk   = normRisk(latest);
  const latestPred   = latest ? (isCKDDetected(latest) ? "CKD" : "Normal") : null;
  const firstEgfr    = scans[0]?.egfr != null ? parseFloat(scans[0].egfr) : null;
  const egfrChange   = latestEgfr != null && firstEgfr != null && scans.length > 1
    ? latestEgfr - firstEgfr : null;

  const egfrTrend = getTrend(scans.map(s => s.egfr != null ? parseFloat(s.egfr) : null));
  const rawRiskTrend = getTrend(scans.map(s => normRisk(s)));
  // Lower risk = good, so invert
  const riskTrend = rawRiskTrend === "improving" ? "worsening"
    : rawRiskTrend === "worsening" ? "improving" : "stable";

  const chartData = scans.map(s => ({
    date: fmtDate(s.uploadedAt || s.date),
    eGFR: s.egfr != null ? parseFloat(s.egfr) : null,
    "CKD Risk": normRisk(s),
  }));

  const hasEgfr = chartData.some(d => d.eGFR != null);
  const hasRisk = chartData.some(d => d["CKD Risk"] != null);
  const descScans = [...scans].reverse();

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", maxWidth: 860 }}>

      {/* ── Search Bar ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "#bbb",
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10,
        }}>
          Patient Lookup
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter Patient ID (e.g. P-00123)"
            style={{
              flex: 1, padding: "11px 16px", fontSize: 14,
              border: "0.5px solid #ddd", borderRadius: 10, outline: "none",
              color: "#222", background: "#fff", fontFamily: "inherit",
            }}
            onFocus={e => (e.target.style.borderColor = "#378ADD")}
            onBlur={e  => (e.target.style.borderColor = "#ddd")}
          />
          <button
            onClick={handleSearch}
            disabled={!inputValue.trim()}
            style={{
              padding: "11px 22px", fontSize: 13, fontWeight: 700,
              border: "none", borderRadius: 10, fontFamily: "inherit",
              background: inputValue.trim() ? "#378ADD" : "#e0e0e0",
              color: inputValue.trim() ? "#fff" : "#aaa",
              cursor: inputValue.trim() ? "pointer" : "not-allowed",
            }}
          >
            Load Records
          </button>
        </div>
      </div>

      {/* ── States ── */}
      {!activePatientId && (
        <div style={{
          textAlign: "center", padding: "3rem", color: "#ccc", fontSize: 14,
          background: "#fafafa", borderRadius: 14, border: "0.5px dashed #e5e5e5",
        }}>
          Enter a patient ID above to view their CKD scan history.
        </div>
      )}
      {activePatientId && loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#bbb", fontSize: 14 }}>
          Loading records for <strong style={{ color: "#555" }}>{activePatientId}</strong>…
        </div>
      )}
      {activePatientId && !loading && error && (
        <div style={{
          background: "#fff5f5", border: "0.5px solid #ffcccc",
          borderRadius: 12, padding: "1.25rem 1.5rem", color: "#c0392b", fontSize: 13,
        }}>
          <strong>Could not load patient data:</strong> {error}
        </div>
      )}
      {activePatientId && !loading && !error && scans.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#bbb", fontSize: 14 }}>
          No scan records found for <strong style={{ color: "#555" }}>{activePatientId}</strong>.
        </div>
      )}

      {/* ── Main Results ── */}
      {!loading && !error && scans.length > 0 && (
        <>
          {/* Latest stats */}
          <Section title="Latest results">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <StatCard
                label="eGFR"
                value={latestEgfr?.toFixed(1)}
                unit="mL/min"
                color={getEgfrColor(latestEgfr)}
                sub={egfrChange != null
                  ? `${egfrChange > 0 ? "▲" : "▼"} ${Math.abs(egfrChange).toFixed(1)} since first scan`
                  : undefined}
              />
              <StatCard
                label="CKD Risk"
                value={latestRisk != null ? latestRisk.toFixed(1) : null}
                unit="%"
                color={getRiskColor(latestRisk)}
              />
              <StatCard
                label="Stage"
                value={latest?.ckdStage ?? getEgfrStage(latestEgfr).stage}
                color={getEgfrColor(latestEgfr)}
                sub={getEgfrStage(latestEgfr).label}
              />
              <StatCard
                label="Prediction"
                value={latestPred}
                color={latestPred === "CKD" ? "#eb4d4b" : "#0d9e75"}
                sub={`${scans.length} scan${scans.length !== 1 ? "s" : ""} on record`}
              />
            </div>
          </Section>

          {/* Stage journey */}
          <StageJourney scans={scans} />

          {/* eGFR Chart */}
          {hasEgfr && (
            <Section title={`eGFR trend · ${egfrTrend === "improving" ? "↑ Improving" : egfrTrend === "worsening" ? "↓ Declining" : "→ Stable"}`}>
              <div style={{
                background: "#fff", border: "0.5px solid #ebebeb",
                borderRadius: 14, padding: "20px 12px 10px",
              }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8, paddingRight: 8 }}>
                  <TrendBadge trend={egfrTrend} />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                    <defs>
                      <linearGradient id="egfrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#378ADD" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} domain={[0, 130]} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={90} stroke="#0d9e7530" strokeDasharray="4 3"
                      label={{ value: "G1 ≥90", fontSize: 9, fill: "#0d9e75", position: "insideTopRight" }} />
                    <ReferenceLine y={60} stroke="#f0932b30" strokeDasharray="4 3"
                      label={{ value: "G3 <60", fontSize: 9, fill: "#f0932b", position: "insideTopRight" }} />
                    <ReferenceLine y={30} stroke="#eb4d4b30" strokeDasharray="4 3"
                      label={{ value: "G4 <30", fontSize: 9, fill: "#eb4d4b", position: "insideTopRight" }} />
                    <Area type="monotone" dataKey="eGFR"
                      stroke="#378ADD" strokeWidth={2.5}
                      fill="url(#egfrGrad)"
                      dot={{ r: 4, fill: "#378ADD", strokeWidth: 0 }}
                      activeDot={{ r: 6 }} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 11, color: "#ccc", textAlign: "center", marginTop: 2 }}>
                  Higher eGFR = better kidney function
                </div>
              </div>
            </Section>
          )}

          {/* Risk Chart */}
          {hasRisk && (
            <Section title={`CKD Risk score · ${riskTrend === "improving" ? "↓ Decreasing (good)" : riskTrend === "worsening" ? "↑ Increasing (concern)" : "→ Stable"}`}>
              <div style={{
                background: "#fff", border: "0.5px solid #ebebeb",
                borderRadius: 14, padding: "20px 12px 10px",
              }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8, paddingRight: 8 }}>
                  <TrendBadge trend={riskTrend} />
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eb4d4b" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#eb4d4b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#bbb" }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={60} stroke="#eb4d4b30" strokeDasharray="4 3"
                      label={{ value: "High risk", fontSize: 9, fill: "#eb4d4b", position: "insideTopRight" }} />
                    <ReferenceLine y={30} stroke="#f0932b30" strokeDasharray="4 3"
                      label={{ value: "Moderate", fontSize: 9, fill: "#f0932b", position: "insideTopRight" }} />
                    <Area type="monotone" dataKey="CKD Risk"
                      stroke="#eb4d4b" strokeWidth={2.5}
                      fill="url(#riskGrad)"
                      dot={{ r: 4, fill: "#eb4d4b", strokeWidth: 0 }}
                      activeDot={{ r: 6 }} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 11, color: "#ccc", textAlign: "center", marginTop: 2 }}>
                  Lower is better
                </div>
              </div>
            </Section>
          )}

          {/* Scan history with deltas */}
          <Section title={`Scan history · ${scans.length} record${scans.length !== 1 ? "s" : ""}`}>
            {descScans.map((scan, i) => {
              // In descending order, "previous" is the one that came before in time = descScans[i+1]
              const prevScan = i < descScans.length - 1 ? descScans[i + 1] : null;
              return (
                <VisitRow
                  key={scan._id || i}
                  scan={scan}
                  prevScan={prevScan}
                  isLast={i === descScans.length - 1}
                />
              );
            })}
          </Section>
        </>
      )}
    </div>
  );
};

export default PatientTimeline;
