// Protege todo el sitio: sin cookie de sesión válida, redirige a /login.html.
// Corre en cada request (config.path abajo) salvo la propia página de login
// y el endpoint de auth, que tienen que quedar accesibles sin sesión.
const PUBLIC_PATHS = new Set(["/login.html", "/favicon.ico"]);

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  if (PUBLIC_PATHS.has(path) || path.startsWith("/.netlify/functions/auth")) {
    return context.next();
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)home_session=([^;]+)/);
  const token = match ? match[1] : null;
  const secret = Deno.env.get("HOME_SESSION_SECRET");

  if (token && secret && token === secret) {
    return context.next();
  }

  const loginUrl = new URL("/login.html", url);
  loginUrl.searchParams.set("next", path);
  return Response.redirect(loginUrl, 302);
};

export const config = { path: "/*" };
