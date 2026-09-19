# home

Monorepo con las apps privadas de la casa (cumpleaños, gastos, etc.), detrás
de un PIN numérico. Deployado en Netlify y publicado en `home.onokaren.com`.

## Cómo está armado

- `public/` — la landing: `login.html` (form de PIN) e `index.html` (listado
  de apps, protegido).
- `netlify/functions/auth.mjs` — valida el PIN contra la variable de entorno
  `HOME_PIN` y, si coincide, setea una cookie `HttpOnly` de sesión.
- `netlify/edge-functions/gate.js` — corre en cada request; si no hay cookie
  de sesión válida, redirige a `/login.html`. Así nadie llega a una app
  (ni a `index.html`) sin haber puesto el PIN antes.
- `cumple-gaia-react/` — la primera app (ya existía), sin cambios funcionales
  salvo que ahora buildea con `base: /cumple-gaia/` para vivir en esa subruta.
- `horas-react/` — registro de horas y pagos de Sil (niñera) y Adri (limpieza).
  Es una sola app que se buildea dos veces con distintas env vars
  (`VITE_WORKER`, `VITE_WORKER_NAME`, `VITE_WORKER_RATE`, `VITE_BASE`) para
  vivir en `/sil/` y `/adri/` con su propio nombre y tarifa. Los datos
  (check-in/check-out, horas y pagado) se guardan en Netlify Blobs vía
  `netlify/functions/horas-data.mjs`, un store separado por trabajadora
  (`horas-sil`, `horas-adri`) — nada se guarda en localStorage.
- `scripts/build.mjs` — arma `dist/` copiando `public/` y el build de cada
  app hija a su subcarpeta. Para sumar una app nueva, agregarla a la lista
  `APPS` en ese script (opcionalmente con `env` si la app necesita variables
  de build distintas, como `horas-react`).

El PIN nunca queda en el código ni en el repo: vive solo como variable de
entorno en Netlify. La cookie de sesión es `HttpOnly` (JS del browser no
puede leerla) y `Secure` (solo viaja por HTTPS).

## Pasos pendientes (fuera de este repo, a mano)

1. ~~Crear el sitio en Netlify apuntando a este repo~~ — hecho, deployado en
   `home.onokaren.com`.
2. En Netlify → Site configuration → Environment variables, tienen que existir
   estas dos (scope: Functions + Runtime como mínimo):
   - `HOME_PIN`: el PIN numérico.
   - `HOME_SESSION_SECRET`: un string random largo (ej. generado con
     `openssl rand -hex 32`). No es el PIN — es el "secreto" de la cookie.
3. Después de agregar o cambiar cualquiera de las dos, hay que volver a
   deployar (Deploys → Trigger deploy → Clear cache and deploy site) para que
   la function y la edge function la vean.

## Cómo agregar una app nueva

1. Crear su carpeta acá adentro (ej. `gastos-casa/`) con su propio
   `package.json` y build propio.
2. Si es Vite, configurar `base: "/gastos-casa/"` en build (mismo patrón que
   `cumple-gaia-react/vite.config.js`).
3. Agregar una entrada a `APPS` en `scripts/build.mjs`.
4. Agregar una tarjeta en `public/index.html`.

## Desarrollo local

Requiere [Netlify CLI](https://docs.netlify.com/cli/get-started/)
(`npm install -g netlify-cli`) para levantar functions + edge functions +
redirects como en producción:

```bash
netlify dev
```

Cada app individual (ej. `cumple-gaia-react/`) también se puede correr suelta
con `npm run dev` adentro de su carpeta, como antes.
