// Guarda/lee la lista de compras de la casa en Netlify Blobs (store
// "compras"), compartida por todos los que entran con el PIN. Nada se guarda
// en localStorage.
//
// Además de la lista guarda un "historial" de lo que se fue anotando
// (nombre + categoría + cuántas veces), para sugerirlo de nuevo con un toque.
// Un mismo nombre puede estar en dos categorías (ej. patamuslo de la
// carnicería y patamuslo del freezer), así que todo se identifica por
// categoría + nombre.
import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";

const KEY = "state";
const CATEGORIES = new Set([
  "frutas-verduras",
  "heladera",
  "carniceria",
  "freezer",
  "almacen",
  "snacks",
  "limpieza",
  "aseo",
  "gaia",
  "huevos",
  "bebidas",
  "otros",
]);
const MAX_ITEMS = 300;
const MAX_HISTORY = 200;

export default async (req) => {
  const store = getStore({ name: "compras", consistency: "strong" });

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
    case "add": {
      if (!isText(body.name, 80) || !CATEGORIES.has(body.category) || (body.qty && !isText(body.qty, 30))) {
        return bad("Datos inválidos");
      }
      const name = body.name.trim();
      const key = entryKey(name, body.category);
      // Si ya está pendiente en la lista no lo duplicamos: solo actualizamos
      // la cantidad si vino una nueva.
      const existing = state.items.find((i) => !i.done && entryKey(i.name, i.category) === key);
      if (existing) {
        if (body.qty) existing.qty = body.qty.trim();
      } else {
        if (state.items.length >= MAX_ITEMS) return bad("La lista está llena");
        state.items.push({
          id: randomUUID(),
          name,
          qty: body.qty ? body.qty.trim() : "",
          category: body.category,
          done: false,
          addedAt: new Date().toISOString(),
        });
      }
      const prev = state.history[key];
      state.history[key] = { name, category: body.category, count: (prev?.count || 0) + 1 };
      trimHistory(state);
      break;
    }
    case "update": {
      const item = state.items.find((i) => i.id === body.id);
      if (!item) return notFound();
      if (!isText(body.name, 80) || !CATEGORIES.has(body.category) || (body.qty && !isText(body.qty, 30))) {
        return bad("Datos inválidos");
      }
      item.name = body.name.trim();
      item.qty = body.qty ? body.qty.trim() : "";
      item.category = body.category;
      const key = entryKey(item.name, item.category);
      state.history[key] = { name: item.name, category: item.category, count: state.history[key]?.count || 1 };
      break;
    }
    case "toggle": {
      const item = state.items.find((i) => i.id === body.id);
      if (!item) return notFound();
      item.done = !item.done;
      break;
    }
    case "remove": {
      if (!state.items.some((i) => i.id === body.id)) return notFound();
      state.items = state.items.filter((i) => i.id !== body.id);
      break;
    }
    case "clearDone": {
      state.items = state.items.filter((i) => !i.done);
      break;
    }
    case "forget": {
      if (!isText(body.name, 80) || !CATEGORIES.has(body.category)) return bad("Datos inválidos");
      delete state.history[entryKey(body.name, body.category)];
      break;
    }
    default:
      return bad("Acción desconocida");
  }

  await store.setJSON(KEY, state);
  return json(state);
};

function entryKey(name, category) {
  const n = name.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").trim();
  return `${category}|${n}`;
}

function emptyState() {
  return { items: [], history: {} };
}

// Si el historial crece demasiado, se quedan los más usados.
function trimHistory(state) {
  const entries = Object.entries(state.history);
  if (entries.length <= MAX_HISTORY) return;
  entries.sort((a, b) => b[1].count - a[1].count);
  state.history = Object.fromEntries(entries.slice(0, MAX_HISTORY));
}

function isText(s, max) {
  return typeof s === "string" && s.trim().length > 0 && s.length <= max;
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
