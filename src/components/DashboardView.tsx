"use client";
import { useState, useEffect, useCallback } from "react";

const BG    = "#0a0c10";
const CARD  = "#1a1d27";
const BORD  = "#2a2d3e";
const TEAL  = "#00d4aa";
const RED   = "#ff6b6b";
const YELL  = "#ffd166";
const PRP   = "#6c63ff";
const TEXT  = "#e2e8f0";
const MUTED = "#8892a4";
const ORANGE = "#ff9f43";

interface Kpis {
  totalJuegos: number;
  totalLeads: number;
  leadsInteresados: number;
  leadsPorConfirmar: number;
  leadsNoInteresados: number;
  leadsHoy: number;
  valorPipeline: number;
}

interface Lead {
  fecha: string;
  cliente: string;
  producto: string;
  idProducto: string;
  categoria: string;
  precioUSD: number;
  cantidad: number;
  canal: string;
  estado: string;
  accion: string;
  notas: string;
}

interface TopJuego {
  producto: string;
  categoria: string;
  count: number;
  precioUSD: number;
}

interface DashboardData {
  kpis: Kpis;
  leadsRecientes: Lead[];
  topJuegos: TopJuego[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function estadoColor(e: string) {
  if (e === "interesado")    return TEAL;
  if (e === "por_confirmar") return YELL;
  if (e === "no_interesado") return RED;
  return MUTED;
}
function estadoLabel(e: string) {
  if (e === "interesado")    return "🟢 Interesado";
  if (e === "por_confirmar") return "🟡 Por confirmar";
  if (e === "no_interesado") return "🔴 No interesado";
  return e;
}
function canalIcon(c: string) {
  if (c === "telegram") return "✈️";
  if (c === "web")      return "🌐";
  if (c === "whatsapp") return "📱";
  return "💬";
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent, icon }: {
  label: string; value: string | number; sub: string; accent: string; icon: string;
}) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORD}`, borderTop: `3px solid ${accent}`,
      borderRadius: 12, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>{sub}</div>
      <div style={{ position: "absolute", right: 12, top: 12, fontSize: 22, opacity: .1 }}>{icon}</div>
    </div>
  );
}

// ─── HBar ────────────────────────────────────────────────────────────────────
function HBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ flex: 1, height: 6, background: BORD, borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 3, transition: "width .4s" }} />
    </div>
  );
}

// ─── Top Juegos ───────────────────────────────────────────────────────────────
function TopJuegosChart({ topJuegos }: { topJuegos: TopJuego[] }) {
  const maxCount = Math.max(...topJuegos.map(j => j.count), 1);
  return (
    <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>🎮 Top juegos por interés</div>
      {topJuegos.length === 0 ? (
        <div style={{ color: MUTED, fontSize: 12 }}>Sin leads aún</div>
      ) : topJuegos.map((j, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${BORD}`, fontSize: 12 }}>
          <div style={{ minWidth: 130, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.producto}</div>
          <HBar pct={(j.count / maxCount) * 100} color={PRP} />
          <div style={{ minWidth: 28, textAlign: "right", fontWeight: 700, color: PRP }}>{j.count}</div>
          <div style={{ minWidth: 52, textAlign: "right", color: TEAL, fontWeight: 600 }}>${j.precioUSD}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Funnel ───────────────────────────────────────────────────────────────────
function FunnelCard({ kpis }: { kpis: Kpis }) {
  const total = kpis.totalLeads || 1;
  const stages = [
    { label: "Total leads",      count: kpis.totalLeads,         color: MUTED,   pct: 100 },
    { label: "Interesados",      count: kpis.leadsInteresados,   color: TEAL,    pct: (kpis.leadsInteresados / total) * 100 },
    { label: "Por confirmar",    count: kpis.leadsPorConfirmar,  color: YELL,    pct: (kpis.leadsPorConfirmar / total) * 100 },
    { label: "No interesados",   count: kpis.leadsNoInteresados, color: RED,     pct: (kpis.leadsNoInteresados / total) * 100 },
  ];
  return (
    <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 14 }}>📊 Embudo de ventas</div>
      {stages.map(({ label, count, color, pct }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${BORD}`, fontSize: 12 }}>
          <div style={{ minWidth: 120, color: MUTED }}>{label}</div>
          <HBar pct={pct} color={color} />
          <div style={{ minWidth: 28, textAlign: "right", fontWeight: 700, color }}>{count}</div>
          <div style={{ minWidth: 42, textAlign: "right", fontSize: 11, color: MUTED }}>{pct.toFixed(0)}%</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function DashboardView() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: BG }}>
      <div style={{ width: 28, height: 28, border: `3px solid ${PRP}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: BG, color: RED, fontSize: 13 }}>{error}</div>
  );

  if (!data) return null;

  const { kpis, leadsRecientes, topJuegos } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: BG, color: TEXT, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORD}`, padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>
          <span style={{ color: PRP }}>🎮 Lucy</span> Gamer — Panel de Ventas
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ background: PRP, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 20, letterSpacing: ".5px" }}>
            {kpis.totalJuegos} JUEGOS
          </span>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: MUTED }}>
              ↻ {lastUpdated.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button onClick={load} disabled={loading}
            style={{ background: "transparent", border: `1px solid ${BORD}`, color: MUTED, fontSize: 11, padding: "4px 12px", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .5 : 1 }}>
            {loading ? "..." : "Actualizar"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginBottom: 18 }}>
          <KpiCard label="Leads interesados"   value={kpis.leadsInteresados}    sub="Listos para asesor"           accent={TEAL}   icon="🟢" />
          <KpiCard label="Por confirmar"        value={kpis.leadsPorConfirmar}   sub="Seguimiento pendiente"        accent={YELL}   icon="🟡" />
          <KpiCard label="Leads hoy"            value={kpis.leadsHoy}            sub={`de ${kpis.totalLeads} totales`} accent={PRP} icon="📅" />
          <KpiCard label="Pipeline"             value={`$${kpis.valorPipeline.toFixed(0)}`} sub="USD en interesados + confirmar" accent={ORANGE} icon="💰" />
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12, marginBottom: 18 }}>
          <TopJuegosChart topJuegos={topJuegos} />
          <FunnelCard kpis={kpis} />
        </div>

        {/* Recent leads */}
        <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: `1px solid ${BORD}` }}>
            <span style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: ".5px" }}>Últimos leads</span>
          </div>
          {leadsRecientes.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: MUTED, fontSize: 13 }}>Sin leads aún</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORD}` }}>
                  {["Fecha", "Cliente", "Juego", "Precio", "Canal", "Estado", "Acción"].map(h => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: ".5px", whiteSpace: "nowrap", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadsRecientes.map((l, i) => {
                  const eColor = estadoColor(l.estado);
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORD}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "9px 14px", color: MUTED, whiteSpace: "nowrap" }}>{String(l.fecha).slice(0, 10)}</td>
                      <td style={{ padding: "9px 14px", color: TEXT, fontWeight: 600 }}>{l.cliente}</td>
                      <td style={{ padding: "9px 14px", color: TEXT, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <div>{l.producto}</div>
                        <div style={{ fontSize: 10, color: MUTED }}>{l.idProducto}</div>
                      </td>
                      <td style={{ padding: "9px 14px", color: TEAL, fontWeight: 700 }}>${l.precioUSD}</td>
                      <td style={{ padding: "9px 14px", color: MUTED }}>{canalIcon(l.canal)} {l.canal}</td>
                      <td style={{ padding: "9px 14px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                          background: `${eColor}1a`, color: eColor, border: `1px solid ${eColor}44`, whiteSpace: "nowrap" }}>
                          {estadoLabel(l.estado)}
                        </span>
                      </td>
                      <td style={{ padding: "9px 14px", color: MUTED, fontSize: 11 }}>{l.accion || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
