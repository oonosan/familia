// Guarda/lee horas trabajadas y pagos de Sil y Adri en Netlify Blobs: un
// store separado por trabajadora ("horas-sil", "horas-adri"), compartido por
// todos los que entran con el PIN. Nada se guarda en localStorage.
import { getStore } from "@netlify/blobs";

const WORKERS = new Set(["sil", "adri"]);

export default async (req) => {
  const url = new URL(req.url);
  const worker = url.searchParams.get("worker");
  if (!WORKERS.has(worker)) {
    return new Response("Unknown worker", { status: 400 });
  }

  const store = getStore(`horas-${worker}`);
  const KEY = "state";

  if (req.method === "GET") {
    const data = (await store.get(KEY, { type: "json" })) || emptyState();
    return json(data);
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const state = (await store.get(KEY, { type: "json" })) || emptyState();

    if (body.action === "checkin") {
      if (state.activeCheckIn) {
        return new Response("Ya hay un check-in abierto", { status: 409 });
      }
      const now = new Date();
      state.activeCheckIn = { date: toDateStr(now), time: toTimeStr(now) };
    } else if (body.action === "checkout") {
      if (!state.activeCheckIn) {
        return new Response("No hay check-in abierto", { status: 409 });
      }
      const rate = Number(body.rate);
      if (!Number.isFinite(rate) || rate <= 0) {
        return new Response("Rate inválida", { status: 400 });
      }
      const now = new Date();
      const { date, time: inTime } = state.activeCheckIn;
      const outTime = toTimeStr(now);
      const hours = diffHours(date, inTime, now);
      const amount = Math.round(hours * rate * 100) / 100;
      state.records.push({ date, in: inTime, out: outTime, hours, amount, paid: false });
      state.activeCheckIn = null;
    } else if (body.action === "togglePaid") {
      const rec = state.records.find((r) => r.date === body.date && r.in === body.in);
      if (!rec) {
        return new Response("Registro no encontrado", { status: 404 });
      }
      rec.paid = !rec.paid;
    } else {
      return new Response("Acción desconocida", { status: 400 });
    }

    await store.setJSON(KEY, state);
    return json(state);
  }

  return new Response("Method Not Allowed", { status: 405 });
};

function emptyState() {
  return { activeCheckIn: null, records: [] };
}

function json(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTimeStr(d) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function diffHours(dateStr, inTime, now) {
  const [h, m] = inTime.split(":").map(Number);
  const start = new Date(`${dateStr}T00:00:00`);
  start.setHours(h, m, 0, 0);
  const ms = now - start;
  return Math.round((ms / 3600000) * 100) / 100;
}
