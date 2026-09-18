// Guarda/lee el estado de "Cumple de Gaia" en Netlify Blobs: un único JSON
// bajo una key fija, compartido por todos los que entran con el PIN.
import { getStore } from "@netlify/blobs";

const STORE = "cumple-gaia";
const KEY = "state";

export default async (req) => {
  const store = getStore(STORE);

  if (req.method === "GET") {
    const data = await store.get(KEY, { type: "json" });
    return new Response(JSON.stringify(data || null), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }
    await store.setJSON(KEY, body);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
};
