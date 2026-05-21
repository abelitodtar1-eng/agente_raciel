import { NextResponse } from "next/server";

const SHEET_ID = "12UZBqBcuiOATtn02AEWUG6uPxzjPoQO9DfYkOVz-0H0";

interface GvizCell { v: string | number | null; f?: string }
interface GvizRow  { c: (GvizCell | null)[] }
interface GvizCol  { label: string }
interface GvizTable { cols: GvizCol[]; rows: GvizRow[] }
interface GvizResponse { table: GvizTable }

async function fetchSheet(sheet: string): Promise<Record<string, string | number | null>[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheet)}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  const raw = await res.text();
  const jsonStr = raw.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, "").replace(/\);?\s*$/, "");
  const data: GvizResponse = JSON.parse(jsonStr);
  const cols = data.table.cols.map((c) => c.label);
  return (data.table.rows ?? []).map((row) => {
    const obj: Record<string, string | number | null> = {};
    cols.forEach((col, i) => {
      obj[col] = row.c?.[i]?.v ?? null;
    });
    return obj;
  });
}

function parseFechaMs(raw: string | number | null): number | null {
  if (!raw) return null;
  const s = String(raw);
  const m = s.match(/^Date\((\d+),(\d+),(\d+)\)/);
  if (m) return new Date(Number(m[1]), Number(m[2]), Number(m[3])).getTime();
  const t = Date.parse(s);
  return isNaN(t) ? null : t;
}

export async function GET() {
  try {
    const [catalogoRaw, leadsRaw] = await Promise.all([
      fetchSheet("Catálogo"),
      fetchSheet("Leads"),
    ]);

    // --- Catálogo: filter out summary rows (no ID or ID starts with TOTAL) ---
    const catalogo = catalogoRaw
      .filter(r => r["ID"] && !String(r["ID"]).toUpperCase().startsWith("TOTAL"))
      .map(r => ({
        id:         String(r["ID"] ?? ""),
        categoria:  String(r["Categoría"] ?? ""),
        producto:   String(r["Producto"] ?? ""),
        precioUSD:  Number(r["Precio USD"]) || 0,
        valoracion: String(r["Valoración"] ?? ""),
        tamano:     String(r["Tamaño"] ?? ""),
        imagen:     r["Imagen"] ? String(r["Imagen"]) : null,
      }));

    // --- Leads ---
    const todayMs = new Date().setHours(0, 0, 0, 0);
    const leads = leadsRaw
      .filter(r => r["Cliente"] != null)
      .map(r => ({
        fecha:     String(r["Fecha"] ?? ""),
        fechaMs:   parseFechaMs(r["Fecha"]),
        cliente:   String(r["Cliente"] ?? ""),
        contacto:  r["Contacto"] != null ? String(r["Contacto"]) : null,
        producto:  String(r["Producto"] ?? ""),
        idProducto: String(r["ID_Producto"] ?? ""),
        categoria: String(r["Categoria"] ?? r["Categoría"] ?? ""),
        precioUSD: Number(r["Precio_USD"] ?? r["Precio USD"]) || 0,
        cantidad:  Number(r["Cantidad"]) || 1,
        canal:     String(r["Canal"] ?? ""),
        estado:    String(r["Estado"] ?? ""),
        accion:    String(r["Accion"] ?? r["Acción"] ?? ""),
        notas:     String(r["Notas"] ?? ""),
      }));

    // --- KPIs ---
    const totalJuegos        = catalogo.length;
    const totalLeads         = leads.length;
    const leadsInteresados   = leads.filter(l => l.estado === "interesado").length;
    const leadsPorConfirmar  = leads.filter(l => l.estado === "por_confirmar").length;
    const leadsNoInteresados = leads.filter(l => l.estado === "no_interesado").length;
    const leadsHoy           = leads.filter(l => l.fechaMs !== null && l.fechaMs >= todayMs).length;
    const valorPipeline      = leads
      .filter(l => l.estado === "interesado" || l.estado === "por_confirmar")
      .reduce((s, l) => s + l.precioUSD * l.cantidad, 0);

    // --- Top juegos por número de leads ---
    const juegoLeadCount = new Map<string, { producto: string; categoria: string; count: number; precioUSD: number }>();
    for (const l of leads) {
      const key = l.idProducto || l.producto;
      const existing = juegoLeadCount.get(key);
      if (existing) {
        existing.count++;
      } else {
        juegoLeadCount.set(key, { producto: l.producto, categoria: l.categoria, count: 1, precioUSD: l.precioUSD });
      }
    }
    const topJuegos = Array.from(juegoLeadCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // --- Recent leads (last 15) ---
    const leadsRecientes = leads.slice(-15).reverse();

    return NextResponse.json({
      kpis: { totalJuegos, totalLeads, leadsInteresados, leadsPorConfirmar, leadsNoInteresados, leadsHoy, valorPipeline },
      catalogo,
      leadsRecientes,
      topJuegos,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
