"use client";
import { useState, useEffect } from "react";

const BG = "#0a0c10"; const CARD = "#1a1d27"; const BORD = "#2a2d3e";
const PRP = "#6c63ff"; const TEAL = "#00d4aa"; const RED = "#ff6b6b";
const TEXT = "#e2e8f0"; const MUTED = "#8892a4"; const YELLOW = "#ffd166";
const ORANGE = "#ff9f43";

interface Juego {
  id: string;
  categoria: string;
  producto: string;
  precioUSD: number;
  valoracion: string;
  tamano: string;
}

function valoracionColor(v: string): string {
  if (v === "Excelente")  return TEAL;
  if (v === "Muy Bueno")  return PRP;
  if (v === "Bueno")      return YELLOW;
  if (v === "Regular")    return ORANGE;
  return MUTED;
}

function valoracionEmoji(v: string): string {
  if (v === "Excelente")  return "⭐⭐⭐⭐⭐";
  if (v === "Muy Bueno")  return "⭐⭐⭐⭐";
  if (v === "Bueno")      return "⭐⭐⭐";
  if (v === "Regular")    return "⭐⭐";
  return "⭐";
}

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: "100%", background: BG, border: `1px solid ${focused ? PRP : BORD}`, borderRadius: 8,
    padding: "9px 12px", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box",
  };
}

export function ProductosView() {
  const [juegos, setJuegos] = useState<Juego[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [catFilter, setCatFilter] = useState("Todos");
  const [valFilter, setValFilter] = useState("Todos");

  async function load() {
    setLoading(true);
    try {
      const data = await fetch("/api/dashboard").then(r => r.json()) as { catalogo?: Juego[] };
      if (data.catalogo) setJuegos(data.catalogo);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // --- Derived ---
  const categorias = ["Todos", ...Array.from(new Set(juegos.map(j => j.categoria.split("/")[0].trim()))).sort()];
  const valoraciones = ["Todos", "Excelente", "Muy Bueno", "Bueno", "Regular"];

  const filtered = juegos.filter(j => {
    const q = search.toLowerCase();
    const catMatch = catFilter === "Todos" || j.categoria.toLowerCase().includes(catFilter.toLowerCase());
    const valMatch = valFilter === "Todos" || j.valoracion === valFilter;
    const textMatch = !q || j.producto.toLowerCase().includes(q) || j.categoria.toLowerCase().includes(q);
    return catMatch && valMatch && textMatch;
  });

  // KPIs
  const totalJuegos = juegos.length;
  const excelentes = juegos.filter(j => j.valoracion === "Excelente").length;
  const muyBuenos  = juegos.filter(j => j.valoracion === "Muy Bueno").length;
  const precioMin  = juegos.length ? Math.min(...juegos.map(j => j.precioUSD)) : 0;
  const precioMax  = juegos.length ? Math.max(...juegos.map(j => j.precioUSD)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", background: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "14px 24px", borderBottom: `1px solid ${BORD}`, background: CARD, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>🎮 Catálogo de Juegos</h2>
            <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Fuente: Google Sheets · gestionado por Lucy Gamer</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar juego..."
              style={{ ...inputStyle(searchFocus), width: 160, fontSize: 12 }}
              onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)} />
            <button onClick={load} style={{ padding: "8px 14px", fontSize: 12, background: "transparent", border: `1px solid ${BORD}`, color: MUTED, borderRadius: 8, cursor: "pointer" }}>↻</button>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total juegos",  value: totalJuegos,              color: TEXT },
            { label: "Excelentes",    value: excelentes,               color: TEAL },
            { label: "Muy buenos",    value: muyBuenos,                color: PRP },
            { label: "Precio desde",  value: `$${precioMin} USD`,      color: YELLOW },
            { label: "Precio hasta",  value: `$${precioMax} USD`,      color: ORANGE },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 10, padding: "12px 16px" }}>
              <p style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: ".5px" }}>Valoración</span>
            {valoraciones.map(v => (
              <button key={v} onClick={() => setValFilter(v)}
                style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, cursor: "pointer", border: "1px solid",
                  background: valFilter === v ? PRP : "transparent",
                  borderColor: valFilter === v ? PRP : BORD,
                  color: valFilter === v ? "#fff" : MUTED }}>
                {v}
              </button>
            ))}
          </div>
          {(search || catFilter !== "Todos" || valFilter !== "Todos") && (
            <button onClick={() => { setSearch(""); setCatFilter("Todos"); setValFilter("Todos"); }}
              style={{ fontSize: 11, background: "transparent", border: "none", color: PRP, cursor: "pointer" }}>
              ✕ Limpiar ({filtered.length}/{totalJuegos})
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 12, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>Cargando catálogo...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>Sin resultados.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORD}` }}>
                    {["ID", "Juego", "Categoría", "Tamaño", "Valoración", "Precio USD"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((j, i) => {
                    const color = valoracionColor(j.valoracion);
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${BORD}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.02)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 11, color: MUTED }}>{j.id}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: TEXT, maxWidth: 220 }}>
                          {j.producto}
                        </td>
                        <td style={{ padding: "10px 14px", color: MUTED, fontSize: 12, maxWidth: 200 }}>{j.categoria}</td>
                        <td style={{ padding: "10px 14px", color: MUTED, fontSize: 12, whiteSpace: "nowrap" }}>{j.tamano}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                            background: `${color}1a`, color, border: `1px solid ${color}44`, whiteSpace: "nowrap" }}>
                            {valoracionEmoji(j.valoracion)} {j.valoracion}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: TEAL, fontSize: 14 }}>
                          ${j.precioUSD} <span style={{ fontSize: 10, color: MUTED, fontWeight: 400 }}>USD</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ fontSize: 11, color: MUTED, marginTop: 12, textAlign: "center" }}>
          Precios calculados por Lucy según tamaño GB · Para consultas usa <strong style={{ color: PRP }}>Chat IA</strong>
        </p>
      </div>
    </div>
  );
}
