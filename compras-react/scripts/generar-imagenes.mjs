// Genera las ilustraciones de cada sección de la lista con la API de Gemini
// y las guarda como webp en src/assets/categorias/<id>.webp.
//
// Uso (desde compras-react/):
//   node scripts/generar-imagenes.mjs              -> genera las que faltan
//   node scripts/generar-imagenes.mjs freezer gaia -> regenera esas
//
// Lee GEMINI_API_KEY del .env de la raíz del repo (no se commitea).
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
const SIZE = 256;
const CONCURRENCY = 3;

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const OUT_DIR = here("../src/assets/categorias/");

const STYLE =
  "Cute kawaii illustration in soft pastel colors, like a sticker from a cozy hand-drawn planner: " +
  "gentle watercolor-like flat shading, thin soft brown outlines, rounded friendly shapes, a couple of tiny " +
  "sparkles or a small heart as decoration. Centered composition that fills most of a square frame, " +
  "plain pure white background. No text, no letters, no labels, no border, no shadow box.";

const SUBJECTS = {
  "frutas-verduras": "a wicker basket overflowing with broccoli, carrots, a red tomato, lettuce, a banana and a green apple",
  heladera: "a glass milk bottle, a block of butter, a wedge of yellow cheese with holes and a small yogurt cup",
  carniceria: "a raw red beef steak, a raw chicken leg and a salmon fillet on a wooden cutting board",
  freezer: "a frosty bag of frozen red berries, a frozen pizza box and a few ice cubes with little snowflakes",
  almacen: "a small wooden pantry shelf with glass jars of lentils, flour and chickpeas, a bag of yerba mate, a coffee jar and a box of chamomile tea",
  snacks: "an open bag of potato chips with chips spilling out and a chocolate bar with a few pieces broken off",
  limpieza: "a blue spray cleaner bottle, a white cream cleanser bottle, a big floor cleaner jug and a yellow-green sponge",
  aseo: "a pink shampoo bottle, a lilac liquid soap pump dispenser and a toothbrush",
  gaia: "a small stack of baby diapers, a baby lotion bottle and a baby rattle",
  huevos: "an open cardboard egg carton with brown and cream eggs",
  bebidas: "a bottle of mineral water, a juice box with a straw and a soda bottle",
  otros: "a cute pink shopping basket with a heart on the front",
};

function loadKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const envPath = here("../../.env");
  if (existsSync(envPath)) {
    const m = readFileSync(envPath, "utf8").match(/^GEMINI_API_KEY=(.*)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

async function generate(key, id) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${STYLE}\n\nSubject: ${SUBJECTS[id]}.` }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1" } },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${data.error?.message || "error"}`);
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error("la respuesta no trajo imagen");
  const png = Buffer.from(part.inlineData.data, "base64");
  const webp = await sharp(png).resize(SIZE, SIZE, { fit: "cover" }).webp({ quality: 82 }).toBuffer();
  writeFileSync(`${OUT_DIR}${id}.webp`, webp);
  return webp.length;
}

const key = loadKey();
if (!key) {
  console.error("Falta GEMINI_API_KEY en el .env de la raíz del repo.");
  process.exit(1);
}
mkdirSync(OUT_DIR, { recursive: true });

const requested = process.argv.slice(2);
const unknown = requested.filter((id) => !SUBJECTS[id]);
if (unknown.length) {
  console.error(`No conozco: ${unknown.join(", ")}. Opciones: ${Object.keys(SUBJECTS).join(", ")}`);
  process.exit(1);
}
const queue = requested.length
  ? requested
  : Object.keys(SUBJECTS).filter((id) => !existsSync(`${OUT_DIR}${id}.webp`));

console.log(`Modelo ${MODEL}: ${queue.length} imagen(es) para generar.`);
let failed = 0;
async function worker() {
  while (queue.length) {
    const id = queue.shift();
    try {
      const bytes = await generate(key, id);
      console.log(`✓ ${id} (${Math.round(bytes / 1024)} KB)`);
    } catch (e) {
      failed++;
      console.error(`✗ ${id}: ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
process.exit(failed ? 1 : 0);
