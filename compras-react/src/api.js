const ENDPOINT = "/.netlify/functions/compras-data";

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
  if (!res.ok) throw new Error("No se pudo cargar la lista");
  return res.json();
}

export const addItem = (name, qty, category) => postAction({ action: "add", name, qty, category });
export const updateItem = (id, qty, category) => postAction({ action: "update", id, qty, category });
export const addProduct = (name, category) => postAction({ action: "addProduct", name, category });
export const toggleItem = (id) => postAction({ action: "toggle", id });
export const removeItem = (id) => postAction({ action: "remove", id });
export const clearDone = () => postAction({ action: "clearDone" });
export const forget = (name, category) => postAction({ action: "forget", name, category });
