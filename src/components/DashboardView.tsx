"use client";
import { useState, useEffect, useCallback } from "react";

// ── Palette ───────────────────────────────────────────────────────────────────
const BG     = "#080b14";
const CARD   = "#0d1117";
const CARD2  = "#111827";
const BORD   = "rgba(255,255,255,0.07)";
const CYAN   = "#06b6d4";
const PRP    = "#7c3aed";
const GOLD   = "#f59e0b";
const EME    = "#10b981";
const RED    = "#ef4444";
const TEXT   = "#f1f5f9";
const MUTED  = "#64748b";
const SUB    = "#94a3b8";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Kpis {
  totalJuegos: number; totalLeads: number;
  leadsInteresados: number; leadsPorConfirmar: number;
  leadsNoInteresados: number; leadsHoy: number; valorPipeline: number;
}
interface Lead {
  fecha: string; cliente: string; producto: string; idProducto: string;
  categoria: string; precioUSD: number; cantidad: number;
  canal: string; estado: string; accion: string; notas: string;
}
interface TopJuego { producto: string; categoria: string; count: number; precioUSD: number; }
interface DashData { kpis: Kpis; leadsRecientes: Lead[]; topJuegos: TopJuego[]; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const estadoMeta: Record<string, { color: string; label: string; icon: string }> = {
  interesado:    { color: EME,  label: "Interesado",    icon: "🟢" },
  por_confirmar: { color: GOLD, label: "Por confirmar", icon: "🟡" },
  no_interesado: { color: RED,  label: "No interesado", icon: "🔴" },
};
const getMeta = (e: string) => estadoMeta[e] ?? { color: MUTED, label: e, icon: "⚪" };

function canalIcon(c: string) {
  if (c === "telegram")  return "✈️";
  if (c === "whatsapp")  return "📱";
  if (c === "web")       return "🌐";
  return "💬";
}

function rankMedal(i: number) {
  if (i === 0) return "🥇";
  if (i === 1) return "🥈";
  if (i === 2) return "🥉";
  return `#${i + 1}`;
}

// ── Glow KPI Card ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub: string; color: string; icon: string;
}) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${color}30`,
      borderRadius: 16, padding: "20px 22px",
      boxShadow: `0 0 24px ${color}18, inset 0 1px 0 ${color}20`,
      position: "relative", overflow: "hidden",
    }}>
      {/* glow blob */}
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${color}15`, filter: "blur(20px)" }} />
      <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "monospace", lineHeight: 1, letterSpacing: "-1px" }}>{value}</div>
      <div style={{ fontSize: 11, color: SUB, marginTop: 8 }}>{sub}</div>
      <div style={{ position: "absolute", right: 18, top: 18, fontSize: 28, opacity: .18 }}>{icon}</div>
    </div>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function Leaderboard({ topJuegos }: { topJuegos: TopJuego[] }) {
  const max = Math.max(...topJuegos.map(j => j.count), 1);
  return (
    <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORD}`, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 16 }}>🏆</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: TEXT, letterSpacing: ".5px" }}>TOP JUEGOS MÁS SOLICITADOS</span>
      </div>
      {topJuegos.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", color: MUTED, fontSize: 13 }}>Sin datos aún</div>
      ) : (
        <div style={{ padding: "8px 0" }}>
          {topJuegos.map((j, i) => {
            const pct = (j.count / max) * 100;
            const barColor = i === 0 ? GOLD : i === 1 ? CYAN : i === 2 ? EME : PRP;
            const short = j.producto.length > 22 ? j.producto.slice(0, 21) + "…" : j.producto;
            return (
              <div key={i} style={{ padding: "10px 20px", borderBottom: i < topJuegos.length - 1 ? `1px solid ${BORD}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: i < 3 ? 18 : 13, minWidth: 28, textAlign: "center", fontFamily: "monospace", color: MUTED }}>{rankMedal(i)}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: TEXT }}>{short}</span>
                  <span style={{ fontSize: 12, color: CYAN, fontFamily: "monospace", fontWeight: 700 }}>${j.precioUSD}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: barColor, fontFamily: "monospace", minWidth: 30, textAlign: "right" }}>{j.count}</span>
                </div>
                {/* progress bar */}
                <div style={{ marginLeft: 38, height: 4, background: BORD, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 2,
                    boxShadow: `0 0 8px ${barColor}`, transition: "width .5s ease" }} />
                </div>
                <div style={{ marginLeft: 38, marginTop: 3, fontSize: 10, color: MUTED }}>{j.categoria.split("/")[0].trim()}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Funnel ────────────────────────────────────────────────────────────────────
function SalesFunnel({ kpis }: { kpis: Kpis }) {
  const stages = [
    { label: "Total contactos",  count: kpis.totalLeads,          color: SUB,  icon: "📨" },
    { label: "Interesados",      count: kpis.leadsInteresados,    color: EME,  icon: "🎯" },
    { label: "Por confirmar",    count: kpis.leadsPorConfirmar,   color: GOLD, icon: "⏳" },
    { label: "No interesados",   count: kpis.leadsNoInteresados,  color: RED,  icon: "✗"  },
  ];
  const total = kpis.totalLeads || 1;
  const convRate = kpis.totalLeads > 0
    ? ((kpis.leadsInteresados + kpis.leadsPorConfirmar) / kpis.totalLeads * 100).toFixed(0)
    : "0";

  return (
    <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORD}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>📊</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: TEXT, letterSpacing: ".5px" }}>EMBUDO DE VENTAS</span>
        </div>
        <div style={{ background: `${EME}18`, border: `1px solid ${EME}40`, borderRadius: 20, padding: "3px 12px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: EME }}>{convRate}% conversión</span>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        {stages.map(({ label, count, color, icon }, i) => {
          const pct = (count / total) * 100;
          const width = `${Math.max(pct, 4)}%`;
          return (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: SUB }}>{label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: MUTED }}>{pct.toFixed(0)}%</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color, fontFamily: "monospace" }}>{count}</span>
                </div>
              </div>
              <div style={{ height: 8, background: BORD, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}88)`,
                  borderRadius: 4, boxShadow: `0 0 10px ${color}60`, transition: "width .6s ease" }} />
              </div>
            </div>
          );
        })}
        {/* Pipeline value */}
        <div style={{ marginTop: 16, background: `${PRP}12`, border: `1px solid ${PRP}30`, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: SUB }}>💰 Pipeline activo</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: PRP, fontFamily: "monospace" }}>
            ${kpis.valorPipeline.toFixed(0)} <span style={{ fontSize: 10, color: MUTED, fontWeight: 400 }}>USD</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Live Feed ─────────────────────────────────────────────────────────────────
function LiveFeed({ leads }: { leads: Lead[] }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORD}`, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14 }}>⚡</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: TEXT, letterSpacing: ".5px" }}>ACTIVIDAD RECIENTE</span>
        <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: EME, boxShadow: `0 0 8px ${EME}` }} />
      </div>
      {leads.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", color: MUTED, fontSize: 13 }}>Sin actividad aún</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORD}` }}>
                {["Juego", "Cliente", "Precio", "Canal", "Estado", "Fecha"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => {
                const meta = getMeta(l.estado);
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORD}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{l.producto}</div>
                      <div style={{ fontSize: 10, color: MUTED, fontFamily: "monospace" }}>{l.idProducto}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: SUB, fontWeight: 500 }}>{l.cliente}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800, color: CYAN, fontFamily: "monospace" }}>${l.precioUSD}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: MUTED }}>{canalIcon(l.canal)} {l.canal}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                        background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}40`,
                        whiteSpace: "nowrap", boxShadow: `0 0 8px ${meta.color}20`,
                      }}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 11, color: MUTED, whiteSpace: "nowrap" }}>
                      {String(l.fecha).slice(0, 10)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function DashboardView() {
  const [data, setData]       = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [lastUpd, setLastUpd] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setLastUpd(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
  }, [load]);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: BG, gap: 16 }}>
      <div style={{ fontSize: 32 }}>🎮</div>
      <div style={{ width: 36, height: 36, border: `3px solid ${PRP}`, borderTopColor: CYAN, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: BG, color: RED, fontSize: 13 }}>
      ⚠ {error}
    </div>
  );

  if (!data) return null;
  const { kpis, leadsRecientes, topJuegos } = data;
  const convRate = kpis.totalLeads > 0
    ? ((kpis.leadsInteresados + kpis.leadsPorConfirmar) / kpis.totalLeads * 100).toFixed(0)
    : "0";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: BG, color: TEXT, fontFamily: "'Segoe UI', system-ui, sans-serif", overflowY: "auto" }}>

      {/* ── HEADER ── */}
      <div style={{ background: `linear-gradient(135deg, #0d1117 0%, #111827 50%, #0d1117 100%)`, borderBottom: `1px solid ${BORD}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${PRP}, ${CYAN})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 0 20px ${PRP}40` }}>
            🎮
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.5px" }}>
              <span style={{ background: `linear-gradient(90deg, ${CYAN}, ${PRP})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LUCY GAMER</span>
              <span style={{ color: SUB, fontWeight: 400, fontSize: 13, marginLeft: 8 }}>· Panel de Ventas</span>
            </div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 1, letterSpacing: ".5px" }}>
              {kpis.totalJuegos} juegos en catálogo · {lastUpd ? `↻ ${lastUpd.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: `${EME}15`, border: `1px solid ${EME}40`, borderRadius: 20, padding: "5px 14px", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: EME, boxShadow: `0 0 6px ${EME}` }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: EME }}>LIVE</span>
          </div>
          <button onClick={load} disabled={loading}
            style={{ padding: "6px 14px", fontSize: 11, background: `${PRP}20`, border: `1px solid ${PRP}40`, color: PRP, borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", fontWeight: 600 }}>
            {loading ? "..." : "⟳ Actualizar"}
          </button>
        </div>
      </div>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── KPI STRIP ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14 }}>
          <KpiCard label="Interesados"    value={kpis.leadsInteresados}   sub="Listos para asesor"              color={EME}   icon="🎯" />
          <KpiCard label="Por confirmar"  value={kpis.leadsPorConfirmar}  sub="Necesitan seguimiento"           color={GOLD}  icon="⏳" />
          <KpiCard label="Leads hoy"      value={kpis.leadsHoy}           sub={`de ${kpis.totalLeads} totales`} color={CYAN}  icon="📅" />
          <KpiCard label="Conversión"     value={`${convRate}%`}          sub="interesados + por confirmar"     color={PRP}   icon="📈" />
        </div>

        {/* ── CHARTS ROW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Leaderboard topJuegos={topJuegos} />
          <SalesFunnel kpis={kpis} />
        </div>

        {/* ── LIVE FEED ── */}
        <LiveFeed leads={leadsRecientes} />

      </div>
    </div>
  );
}
