// Guarda/lee horas trabajadas y pagos de Sil y Adri en Netlify Blobs: un
// store separado por trabajadora ("horas-sil", "horas-adri"), compartido por
// todos los que entran con el PIN. Nada se guarda en localStorage.
import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";

const WORKERS = new Set(["sil", "adri"]);

export default async (req) => {
  const url = new URL(req.url);
  const worker = url.searchParams.get("worker");
  if (!WORKERS.has(worker)) {
    return new Response("Unknown worker", { status: 400 });
  }

  const store = getStore({ name: `horas-${worker}`, consistency: "strong" });
  const KEY = "state";

  if (req.method === "GET") {
    const { state, changed } = migrate((await store.get(KEY, { type: "json" })) || emptyState());
    if (changed) await store.setJSON(KEY, state);
    return json(state);
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const { state } = migrate((await store.get(KEY, { type: "json" })) || emptyState());

    if (body.action === "checkin") {
      if (state.activeCheckIn) {
        return new Response("Ya hay un check-in abierto", { status: 409 });
      }
      state.activeCheckIn = nowInArgentina();
    } else if (body.action === "cancelCheckin") {
      if (!state.activeCheckIn) {
        return new Response("No hay check-in abierto", { status: 409 });
      }
      state.activeCheckIn = null;
    } else if (body.action === "checkout") {
      if (!state.activeCheckIn) {
        return new Response("No hay check-in abierto", { status: 409 });
      }
      const rate = requireRate(body.rate);
      if (rate == null) {
        return new Response("Rate inválida", { status: 400 });
      }
      const { date, time: inTime } = state.activeCheckIn;
      const outTime = nowInArgentina().time;
      const hours = diffHoursFromTimes(inTime, outTime);
      if (hours == null) {
        return new Response(
          "Pasó menos de un minuto desde el check-in. Si fue un error, usá «Cancelar check-in».",
          { status: 400 }
        );
      }
      state.records.push(makeRecord(date, inTime, outTime, hours, rate));
      state.activeCheckIn = null;
    } else if (body.action === "addManual") {
      const rate = requireRate(body.rate);
      if (rate == null || !isValidDate(body.date) || !isValidTime(body.in) || !isValidTime(body.out)) {
        return new Response("Datos inválidos", { status: 400 });
      }
      const hours = diffHoursFromTimes(body.in, body.out);
      if (hours == null) {
        return new Response("La salida debe ser después del ingreso", { status: 400 });
      }
      state.records.push(makeRecord(body.date, body.in, body.out, hours, rate));
    } else if (body.action === "addAbsence") {
      if (!isValidDate(body.date)) {
        return new Response("Fecha inválida", { status: 400 });
      }
      state.records.push({
        id: randomUUID(),
        date: body.date,
        in: null,
        out: null,
        hours: 0,
        amount: 0,
        paid: true,
        absence: true,
      });
    } else if (body.action === "editRecord") {
      const rec = state.records.find((r) => r.id === body.id);
      if (!rec) {
        return new Response("Registro no encontrado", { status: 404 });
      }
      const rate = requireRate(body.rate);
      if (rate == null || !isValidDate(body.date) || !isValidTime(body.in) || !isValidTime(body.out)) {
        return new Response("Datos inválidos", { status: 400 });
      }
      const hours = diffHoursFromTimes(body.in, body.out);
      if (hours == null) {
        return new Response("La salida debe ser después del ingreso", { status: 400 });
      }
      // Se mantiene el valor de hora con el que se creó el registro, así un
      // aumento posterior no cambia lo ya trabajado.
      const recRate = rec.rate ?? rate;
      rec.date = body.date;
      rec.in = body.in;
      rec.out = body.out;
      rec.hours = round2(hours);
      rec.rate = recRate;
      rec.amount = round2(hours * recRate);
    } else if (body.action === "togglePaid") {
      const rec = state.records.find((r) => r.id === body.id);
      if (!rec) {
        return new Response("Registro no encontrado", { status: 404 });
      }
      rec.paid = !rec.paid;
    } else if (body.action === "deleteRecord") {
      const exists = state.records.some((r) => r.id === body.id);
      if (!exists) {
        return new Response("Registro no encontrado", { status: 404 });
      }
      state.records = state.records.filter((r) => r.id !== body.id);
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

function migrate(state) {
  let changed = false;
  for (const r of state.records) {
    if (!r.id) {
      r.id = randomUUID();
      changed = true;
    }
    // Registros viejos no guardaban el valor de hora: se deduce del monto y
    // de las horas exactas (el monto está redondeado a centavos).
    if (!r.absence && r.rate == null && r.in && r.out) {
      const exact = diffHoursFromTimes(r.in, r.out);
      if (exact) {
        r.rate = Math.round(r.amount / exact);
        changed = true;
      }
    }
  }
  return { state, changed };
}

function makeRecord(date, inTime, outTime, exactHours, rate) {
  return {
    id: randomUUID(),
    date,
    in: inTime,
    out: outTime,
    hours: round2(exactHours),
    rate,
    amount: round2(exactHours * rate),
    paid: false,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function requireRate(rate) {
  const n = Number(rate);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function isValidDate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidTime(s) {
  return typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
}

function json(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

// La función corre en UTC; las horas se registran en hora de Argentina.
function nowInArgentina() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function diffHoursFromTimes(inTime, outTime) {
  const [ih, im] = inTime.split(":").map(Number);
  const [oh, om] = outTime.split(":").map(Number);
  const inMinutes = ih * 60 + im;
  const outMinutes = oh * 60 + om;
  if (outMinutes <= inMinutes) return null;
  return (outMinutes - inMinutes) / 60;
}
