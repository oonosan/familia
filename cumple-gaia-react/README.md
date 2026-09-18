# Cumple de Gaia — app React

App de una sola página para organizar el cumpleaños de 5 años y el bautismo de Gaia
(18 de octubre de 2026), tematica "selva". Convertida a React a partir de la versión
en Artifact, con el mismo diseño, el mismo carrusel horizontal (hero → invitados →
gastos → alcanza) y los datos que ya estaban cargados.

## Cómo correrla

```bash
npm install
npm run dev
```

Abrí la URL que muestra la terminal (por defecto http://localhost:5173).

Para generar una versión de producción (archivos estáticos listos para subir a
cualquier hosting):

```bash
npm run build
```

Los archivos quedan en `dist/`.

## Datos

Todo se guarda en `localStorage`, en el navegador donde la abras — no hay backend.
La primera vez que se abre en un navegador nuevo, arranca con los invitados y
gastos que ya estaban cargados en el Artifact original (ver `src/seedData.js`).
A partir de ahí, cada cambio (agregar invitado, marcar como pagado, editar un
gasto, etc.) se guarda solo, y `seedData.js` deja de usarse.

Si querés compartir los datos entre varias personas o varios dispositivos, esta
versión no lo hace automáticamente (a diferencia del Artifact, que sí tenía base
de datos compartida) — cada navegador tiene su propia copia.

## Estructura

- `src/App.jsx` — arma el carrusel de 4 pantallas.
- `src/components/Hero.jsx` — portada con la imagen de la selva.
- `src/components/Invitados.jsx` — alta y lista de invitados, contador de adultos/niños confirmados.
- `src/components/Gastos.jsx` + `EditorGasto.jsx` — alta, lista y edición de gastos (con cantidad por paquete, precio por unidad, link de compra).
- `src/components/Alcanza.jsx` — resumen de servilletas/cubiertos/vasos comprados vs. sugeridos.
- `src/logic.js` — todos los cálculos (cantidades, precios, detección de vajilla) sin nada de UI.
- `src/useCarousel.js` — el hook que maneja scroll con mouse/trackpad/touch y transiciones entre pantallas.
- `src/usePersisted.js` — estado global + persistencia en localStorage.
- `src/seedData.js` — los datos reales con los que arranca la primera vez.
