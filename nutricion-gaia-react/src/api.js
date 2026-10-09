const ENDPOINT = "/.netlify/functions/nutricion-data";

async function postAction(body) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error((await res.text()) || "Error de red");
  }
  return res.json();
}

export async function fetchState() {
  const res = await fetch(ENDPOINT, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar el registro");
  return res.json();
}

export function addItem(date, slot, food) {
  return postAction({ action: "addItem", date, slot, food: food.key, name: food.name, group: food.group });
}

export function removeItem(id) {
  return postAction({ action: "removeItem", id });
}

export function setNote(date, slot, note) {
  return postAction({ action: "setNote", date, slot, note });
}

export function setStatus(food, status) {
  return postAction({ action: "setStatus", food, status });
}

export function startTrial(food, date) {
  return postAction({ action: "startTrial", food: food.key, name: food.name, date });
}

export function endTrial(id, result, date) {
  return postAction({ action: "endTrial", id, result, date });
}

export function deleteTrial(id) {
  return postAction({ action: "deleteTrial", id });
}

export function addReaction(date, symptoms, suspects, note) {
  return postAction({ action: "addReaction", date, symptoms, suspects, note });
}

export function deleteReaction(id) {
  return postAction({ action: "deleteReaction", id });
}
