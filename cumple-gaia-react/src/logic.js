// Lógica de negocio pura (sin DOM), portada 1:1 desde el artefacto original.

export const CATS = {
  lugar: { n: "Lugar", c: "var(--selva)" },
  comida: { n: "Comida", c: "var(--dorado)" },
  bebidas: { n: "Bebidas", c: "var(--rosa)" },
  torta: { n: "Torta", c: "var(--fucsia)" },
  globos: { n: "Globos", c: "#4FA6D8" },
  vajilla: { n: "Vajilla", c: "var(--hoja)" },
  deco: { n: "Decoración", c: "var(--uva)" },
  otros: { n: "Otros", c: "var(--ink-soft)" },
};

export const ESTADOS = ["confirmado", "pendiente", "no"];
export const ETIQ = { confirmado: "Confirmado", pendiente: "Pendiente", no: "No viene" };

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const moneyU = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });

export function fmt(n) {
  return money.format(Math.round(n || 0));
}
export function fmtU(n) {
  n = n || 0;
  return n >= 100 ? money.format(Math.round(n)) : moneyU.format(n);
}

export function normalizarUrl(v) {
  v = (v || "").trim();
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = "https://" + v.replace(/^\/+/, "");
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.href;
  } catch (e) {
    return "";
  }
}

// "servilletas" -> "servilleta"; deja igual lo que no termina en -s.
export function singular(p) {
  p = (p || "").trim();
  if (/[^s]s$/i.test(p)) return p.slice(0, -1);
  if (/es$/i.test(p) && p.length > 4) return p.slice(0, -2);
  return p;
}

export function dominio(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return "link";
  }
}

export function uid() {
  return "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function personasConfirmadas(invitados) {
  let p = 0;
  invitados.forEach((i) => {
    if (i.estado === "confirmado") p += (Number(i.adultos) || 0) + (Number(i.ninos) || 0);
  });
  return p;
}

// Cuánto hay que comprar, cuánto sale en total y a cuánto sale cada unidad.
export function calcular(g, personas) {
  const precio = Number(g.monto) || 0;
  const porPaquete = Number(g.porPaquete) > 0 ? Number(g.porPaquete) : 1;
  const unidad = (g.unidad || "").trim();
  const u = unidad || "unidades";
  const envase = porPaquete > 1;
  let cantidad, detalle = "";

  if (g.modo === "persona") {
    const porPersona = Number(g.porPersona) > 0 ? Number(g.porPersona) : 1;
    const necesarias = Math.ceil(personas * porPersona);
    cantidad = Math.ceil(necesarias / porPaquete);
    if (!personas) {
      cantidad = 0;
      detalle = "Se calcula cuando confirmes invitados · " + porPersona + " " + u + " por persona";
    } else if (envase) {
      detalle =
        necesarias + " " + u + " para " + personas + " personas · de a " + porPaquete +
        " → comprar " + cantidad + (cantidad === 1 ? " paquete" : " paquetes");
    } else {
      detalle = necesarias + " " + u + " para " + personas + " personas";
    }
  } else {
    cantidad = Number(g.cantidad) > 0 ? Math.round(Number(g.cantidad)) : 1;
    if (envase)
      detalle =
        cantidad + (cantidad === 1 ? " paquete de " : " paquetes de ") + porPaquete +
        " = " + cantidad * porPaquete + " " + u;
    else if (cantidad > 1) detalle = cantidad + " " + u;
  }

  return {
    cantidad,
    total: precio * cantidad,
    detalle,
    unitario: envase && precio ? precio / porPaquete : 0,
    unidad,
    auto: g.modo === "persona",
    etiqueta: "×" + cantidad,
  };
}

// Cuántas unidades sueltas (no paquetes) representa un gasto.
export function unidadesCompradas(g, personas) {
  const c = calcular(g, personas);
  const porPaquete = Number(g.porPaquete) > 0 ? Number(g.porPaquete) : 1;
  return c.cantidad * porPaquete;
}

// Detecta si un gasto es de servilletas, cubiertos o vasos por su nombre.
const VJ_TIPOS = [
  ["servilletas", /servillet/i],
  ["cubiertos", /cubiert|tenedor|cuchara|cuchillo/i],
  ["vasos", /\bvasos?\b/i],
];
export function tipoVajilla(concepto) {
  const texto = concepto || "";
  for (const [tipo, re] of VJ_TIPOS) if (re.test(texto)) return tipo;
  return null;
}
export const VJ_ETIQUETA = { servilletas: "Servilletas", cubiertos: "Cubiertos", vasos: "Vasos" };

export function countdownTexto() {
  const target = new Date(2026, 9, 18);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = Math.round((target - hoy) / 86400000);
  if (dias > 1) return "Faltan " + dias + " días";
  if (dias === 1) return "¡Mañana!";
  if (dias === 0) return "¡Es hoy!";
  return "18 de octubre";
}
