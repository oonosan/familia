import { FOODS, FOOD_BY_ID, GROUPS, NUTRIENTS } from "./foods";

export const SLOTS = [
  { id: "desayuno", name: "Desayuno" },
  { id: "almuerzo", name: "Almuerzo" },
  { id: "merienda", name: "Merienda" },
  { id: "cena", name: "Cena" },
  { id: "colacion", name: "Colaciones" },
  { id: "mamadera", name: "Teta / mamadera" },
];

export const SLOT_BY_ID = Object.fromEntries(SLOTS.map((s) => [s.id, s]));

// Se espera 3 días con cada alimento nuevo antes de sumar otro.
export const TRIAL_DAYS = 3;

// Cuántos días de la semana conviene que aparezca cada grupo. Sirve solo para
// marcar "poco"; no es una indicación nutricional.
const GROUP_TARGET = { verduras: 7, frutas: 7, cereales: 7, lacteos: 7, carnes: 5, legumbres: 2, grasas: 5 };

// ---------- Fechas ----------

function pad(n) {
  return String(n).padStart(2, "0");
}

function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromISO(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISO(new Date());
}

export function addDays(iso, n) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function daysBetween(fromIso, toIso) {
  return Math.round((fromISO(toIso) - fromISO(fromIso)) / 86400000);
}

// La semana arranca el lunes.
export function weekStart(iso) {
  const d = fromISO(iso);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return toISO(d);
}

export function weekDays(startIso) {
  return Array.from({ length: 7 }, (_, i) => addDays(startIso, i));
}

export function formatShort(iso) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function weekdayShort(iso) {
  const label = fromISO(iso).toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function weekdayLong(iso) {
  return `${fromISO(iso).toLocaleDateString("es-AR", { weekday: "long" })} ${formatShort(iso)}`;
}

export function weekLabel(startIso) {
  return `${formatShort(startIso)} al ${formatShort(addDays(startIso, 6))}`;
}

// ---------- Alimentos ----------

export function customKey(name) {
  return `x:${name.trim().toLowerCase()}`;
}

// Datos de un alimento por su key: los del catálogo traen todo; los cargados
// a mano solo nombre y (opcionalmente) grupo.
export function foodInfo(key, fallback = {}) {
  const f = FOOD_BY_ID[key];
  if (f) return { ...f, key };
  return { key, name: fallback.name || key.replace(/^x:/, ""), group: fallback.group || null, nutrients: [], custom: true };
}

export function activeTrials(state) {
  return state.trials.filter((t) => !t.result).sort((a, b) => a.start.localeCompare(b.start));
}

// "seguro" | "prueba" | "reaccion" | null (todavía no introducido)
export function statusOf(state, key) {
  if (state.trials.some((t) => t.food === key && !t.result)) return "prueba";
  return state.status[key] || (FOOD_BY_ID[key]?.alwaysSafe ? "seguro" : null);
}

export const STATUS_LABEL = {
  seguro: "Introducido",
  prueba: "En prueba",
  reaccion: "Dio reacción",
};

// Desde qué día conviene empezar otro alimento nuevo (null = ya se puede).
export function nextNewFoodDate(state, today) {
  const trials = activeTrials(state);
  if (trials.length === 0) return null;
  const last = trials[trials.length - 1].start;
  const next = addDays(last, TRIAL_DAYS);
  return next > today ? next : null;
}

export function trialDay(trial, today) {
  return daysBetween(trial.start, today) + 1;
}

// Alimentos del catálogo que todavía no comió, ordenados para sugerir:
// primero los que cubren lo que falta y los que no son alérgenos frecuentes.
export function suggestNewFoods(state, { groups = [], nutrients = [] } = {}, limit = 8) {
  return FOODS.filter((f) => !statusOf(state, f.id))
    .map((f) => {
      let score = 0;
      if (groups.includes(f.group)) score += 3;
      score += f.nutrients.filter((n) => nutrients.includes(n)).length * 2;
      if (f.allergen) score -= 4;
      if (f.histamina) score -= 1;
      return { food: f, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.food);
}

// ---------- Análisis semanal ----------

export function analyzeDays(state, days) {
  const daySet = new Set(days);
  const items = state.items.filter((i) => daySet.has(i.date));
  const recordedDays = new Set(items.map((i) => i.date)).size;

  const groupDays = Object.fromEntries(GROUPS.map((g) => [g.id, new Set()]));
  const nutrientDays = Object.fromEntries(NUTRIENTS.map((n) => [n.id, new Set()]));
  const nutrientFoods = Object.fromEntries(NUTRIENTS.map((n) => [n.id, new Set()]));
  const distinct = new Map();

  for (const item of items) {
    const info = foodInfo(item.food, item);
    distinct.set(item.food, info.name);
    if (info.group && groupDays[info.group]) groupDays[info.group].add(item.date);
    for (const n of info.nutrients) {
      nutrientDays[n].add(item.date);
      nutrientFoods[n].add(info.name);
    }
  }

  const groups = GROUPS.map((g) => {
    const count = groupDays[g.id].size;
    let level = "ok";
    if (recordedDays > 0) {
      if (count === 0) level = "falta";
      else if (count / recordedDays < GROUP_TARGET[g.id] / 7 / 2) level = "poco";
    }
    return { group: g, days: count, level };
  });

  const nutrients = NUTRIENTS.filter((n) => n.key).map((n) => {
    const count = nutrientDays[n.id].size;
    let level = "ok";
    if (recordedDays > 0) {
      if (count === 0) level = "falta";
      else if (count / recordedDays < 0.35) level = "poco";
    }
    return { nutrient: n, days: count, foods: [...nutrientFoods[n.id]], level };
  });

  return { recordedDays, groups, nutrients, distinct: [...distinct.values()] };
}

export function groupsOfDay(state, date) {
  const set = new Set();
  for (const i of state.items) {
    if (i.date !== date) continue;
    const g = foodInfo(i.food, i).group;
    if (g) set.add(g);
  }
  return set;
}

// Alimentos ya introducidos de un grupo / con un nutriente, para sugerir.
export function safeFoodsWith(state, { group, nutrient }) {
  return FOODS.filter(
    (f) => statusOf(state, f.id) === "seguro" && (!group || f.group === group) && (!nutrient || f.nutrients.includes(nutrient))
  );
}

// Todo lo que comió entre `daysBefore` días antes y el día indicado.
export function eatenAround(state, date, daysBefore = 2) {
  const from = addDays(date, -daysBefore);
  const byFood = new Map();
  for (const i of state.items) {
    if (i.date < from || i.date > date) continue;
    const entry = byFood.get(i.food) || { key: i.food, name: foodInfo(i.food, i).name, dates: new Set() };
    entry.dates.add(i.date);
    byFood.set(i.food, entry);
  }
  return [...byFood.values()]
    .map((e) => ({ ...e, dates: [...e.dates].sort(), status: statusOf(state, e.key) }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
