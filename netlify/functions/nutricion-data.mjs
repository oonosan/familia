// Guarda/lee el registro de comidas, pruebas de alimentos nuevos y
// reacciones de Gaia en Netlify Blobs (store "nutricion-gaia"), compartido
// por todos los que entran con el PIN. Nada se guarda en localStorage.
//
// Los alimentos se identifican por "key": el id del catálogo del front
// (ej. "pollo") o "x:<nombre>" para los que se cargan a mano.
import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";

const KEY = "state";
const SLOTS = new Set(["desayuno", "almuerzo", "merienda", "cena", "colacion", "mamadera"]);
const STATUSES = new Set(["seguro", "reaccion"]);
const RESULTS = new Set(["tolerado", "reaccion"]);

// Lo que comió sin problemas después de la reacción alérgica de la semana
// del 28/09/2026: punto de partida de los alimentos ya introducidos.
const INITIAL_SAFE = [
  "vaca",
  "pollo",
  "papa",
  "calabaza",
  "zanahoria",
  "batata",
  "arroz",
  "brocoli",
  "arandanos",
  "banana",
  "manzana",
  "pera",
  "chaucha",
  "arvejas",
];

export default async (req) => {
  const store = getStore({ name: "nutricion-gaia", consistency: "strong" });

  if (req.method === "GET") {
    return json((await store.get(KEY, { type: "json" })) || emptyState());
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const state = (await store.get(KEY, { type: "json" })) || emptyState();

  switch (body.action) {
    case "addItem": {
      if (!isValidDate(body.date) || !SLOTS.has(body.slot) || !isFoodKey(body.food) || !isText(body.name, 80)) {
        return bad("Datos inválidos");
      }
      state.items.push({
        id: randomUUID(),
        date: body.date,
        slot: body.slot,
        food: body.food,
        name: body.name.trim(),
        group: isText(body.group, 20) ? body.group : null,
      });
      break;
    }
    case "removeItem": {
      if (!state.items.some((i) => i.id === body.id)) return notFound();
      state.items = state.items.filter((i) => i.id !== body.id);
      break;
    }
    case "setNote": {
      if (!isValidDate(body.date) || !SLOTS.has(body.slot) || typeof body.note !== "string" || body.note.length > 300) {
        return bad("Datos inválidos");
      }
      const k = `${body.date}|${body.slot}`;
      if (body.note.trim()) state.notes[k] = body.note.trim();
      else delete state.notes[k];
      break;
    }
    case "setStatus": {
      if (!isFoodKey(body.food) || (body.status !== null && !STATUSES.has(body.status))) {
        return bad("Datos inválidos");
      }
      if (body.status) state.status[body.food] = body.status;
      else delete state.status[body.food];
      break;
    }
    case "startTrial": {
      if (!isFoodKey(body.food) || !isText(body.name, 80) || !isValidDate(body.date)) {
        return bad("Datos inválidos");
      }
      if (state.trials.some((t) => t.food === body.food && !t.result)) {
        return new Response("Ya hay una prueba abierta de ese alimento", { status: 409 });
      }
      state.trials.push({ id: randomUUID(), food: body.food, name: body.name.trim(), start: body.date, end: null, result: null });
      break;
    }
    case "endTrial": {
      const trial = state.trials.find((t) => t.id === body.id);
      if (!trial) return notFound();
      if (!RESULTS.has(body.result) || !isValidDate(body.date)) return bad("Datos inválidos");
      trial.result = body.result;
      trial.end = body.date;
      state.status[trial.food] = body.result === "tolerado" ? "seguro" : "reaccion";
      break;
    }
    case "deleteTrial": {
      if (!state.trials.some((t) => t.id === body.id)) return notFound();
      state.trials = state.trials.filter((t) => t.id !== body.id);
      break;
    }
    case "addReaction": {
      const suspects = Array.isArray(body.suspects) ? body.suspects.filter(isFoodKey).slice(0, 40) : [];
      if (!isValidDate(body.date) || !isText(body.symptoms, 500) || (body.note && !isText(body.note, 1000))) {
        return bad("Datos inválidos");
      }
      state.reactions.push({
        id: randomUUID(),
        date: body.date,
        symptoms: body.symptoms.trim(),
        suspects,
        note: body.note ? body.note.trim() : "",
      });
      break;
    }
    case "deleteReaction": {
      if (!state.reactions.some((r) => r.id === body.id)) return notFound();
      state.reactions = state.reactions.filter((r) => r.id !== body.id);
      break;
    }
    default:
      return bad("Acción desconocida");
  }

  await store.setJSON(KEY, state);
  return json(state);
};

function emptyState() {
  return {
    items: [],
    notes: {},
    status: Object.fromEntries(INITIAL_SAFE.map((id) => [id, "seguro"])),
    trials: [],
    reactions: [],
  };
}

function isValidDate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isText(s, max) {
  return typeof s === "string" && s.trim().length > 0 && s.length <= max;
}

function isFoodKey(s) {
  return isText(s, 90);
}

function bad(msg) {
  return new Response(msg, { status: 400 });
}

function notFound() {
  return new Response("No encontrado", { status: 404 });
}

function json(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
