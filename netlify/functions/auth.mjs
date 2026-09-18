// Verifica el PIN numérico y, si es correcto, setea la cookie de sesión
// que la edge function `gate` usa para autorizar el resto del sitio.
export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let pin;
  try {
    const body = await req.json();
    pin = String(body.pin ?? "");
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const expectedPin = process.env.HOME_PIN;
  const secret = process.env.HOME_SESSION_SECRET;

  if (!expectedPin || !secret) {
    return new Response("Falta configurar HOME_PIN / HOME_SESSION_SECRET en Netlify", { status: 500 });
  }

  if (pin !== expectedPin) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const cookie = [
    `home_session=${secret}`,
    "Path=/",
    "Max-Age=7776000", // 90 días
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": cookie,
    },
  });
};
