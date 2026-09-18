# familia

Monorepo con las apps privadas de la casa (cumpleaños, gastos, etc.), pensado
para vivir en `onokaren.com/familia`, detrás de un PIN numérico.

## Cómo está armado

- `public/` — la landing: `login.html` (form de PIN) e `index.html` (listado
  de apps, protegido).
- `netlify/functions/auth.mjs` — valida el PIN contra la variable de entorno
  `FAMILIA_PIN` y, si coincide, setea una cookie `HttpOnly` de sesión.
- `netlify/edge-functions/gate.js` — corre en cada request; si no hay cookie
  de sesión válida, redirige a `/login.html`. Así nadie llega a una app
  (ni a `index.html`) sin haber puesto el PIN antes.
- `cumple-gaia-react/` — la primera app (ya existía), sin cambios funcionales
  salvo que ahora buildea con `base: /cumple-gaia/` para vivir en esa subruta.
- `scripts/build.mjs` — arma `dist/` copiando `public/` y el build de cada
  app hija a su subcarpeta. Para sumar una app nueva, agregarla a la lista
  `APPS` en ese script.

El PIN nunca queda en el código ni en el repo: vive solo como variable de
entorno en Netlify. La cookie de sesión es `HttpOnly` (JS del browser no
puede leerla) y `Secure` (solo viaja por HTTPS).

## Pasos pendientes (fuera de este repo, a mano)

1. **Crear el sitio en Netlify** apuntando a este repo (build command
   `npm run build`, publish `dist`, ya quedan seteados en `netlify.toml`).
2. En Netlify → Site settings → Environment variables, agregar:
   - `FAMILIA_PIN`: el PIN numérico que van a usar (ej. `4 a 8` dígitos).
   - `FAMILIA_SESSION_SECRET`: un string random largo (ej. generado con
     `openssl rand -hex 32`). No es el PIN — es el "secreto" de la cookie.
3. Copiar la URL que te da Netlify para este sitio (algo como
   `https://familia-onokaren.netlify.app`).
4. En el **repo de la web personal** (onokaren.com), agregar una regla de
   redirect/proxy para que `/familia/*` sirva este sitio sin cambiar la URL
   visible. En su `netlify.toml` (o archivo `_redirects`):

   ```
   /familia/*  https://familia-onokaren.netlify.app/:splat  200
   ```

   (Reemplazar por la URL real del sitio del paso 3. El `200` es clave: hace
   que sea un proxy/rewrite, no un redirect — la URL en el navegador sigue
   siendo `onokaren.com/familia/...`.)

   No hace falta tocar GoDaddy para esto — el dominio ya apunta a Netlify
   para el sitio principal, y ese sitio es el que hace de proxy hacia este.

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
