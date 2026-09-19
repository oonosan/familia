import { WORKER_ID, HOURLY_RATE } from "./config";

const ENDPOINT = "/.netlify/functions/horas-data";

async function postAction(body) {
  const res = await fetch(`${ENDPOINT}?worker=${WORKER_ID}`, {
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
  const res = await fetch(`${ENDPOINT}?worker=${WORKER_ID}`);
  if (!res.ok) throw new Error("No se pudo cargar el estado");
  return res.json();
}

export function checkIn() {
  return postAction({ action: "checkin" });
}

export function checkOut() {
  return postAction({ action: "checkout", rate: HOURLY_RATE });
}

export function togglePaid(id) {
  return postAction({ action: "togglePaid", id });
}

export function addManualRecord(date, inTime, outTime) {
  return postAction({ action: "addManual", date, in: inTime, out: outTime, rate: HOURLY_RATE });
}

export function editRecord(id, date, inTime, outTime) {
  return postAction({ action: "editRecord", id, date, in: inTime, out: outTime, rate: HOURLY_RATE });
}
