// Categorías de la lista (en el orden en que se recorre el súper) y las
// palabras que usamos para adivinar la categoría de lo que se escribe.
// Los ids tienen que coincidir con CATEGORIES en
// netlify/functions/compras-data.mjs.
export const CATEGORIES = [
  { id: "verduleria", label: "Verdulería", emoji: "🥕" },
  { id: "carniceria", label: "Carnicería", emoji: "🥩" },
  { id: "lacteos", label: "Lácteos y fiambres", emoji: "🧀" },
  { id: "panaderia", label: "Panadería", emoji: "🥖" },
  { id: "almacen", label: "Almacén", emoji: "🥫" },
  { id: "bebe", label: "Bebé", emoji: "🍼" },
  { id: "limpieza", label: "Limpieza", emoji: "🧽" },
  { id: "perfumeria", label: "Perfumería y farmacia", emoji: "🧴" },
  { id: "otros", label: "Otros", emoji: "🛒" },
];

export const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

const KEYWORDS = {
  verduleria: [
    "papa", "batata", "zanahoria", "cebolla", "ajo", "tomate", "lechuga", "zapallo", "calabaza", "zapallito",
    "brocoli", "brócoli", "espinaca", "acelga", "morron", "morrón", "pepino", "choclo", "chaucha", "palta",
    "banana", "manzana", "pera", "naranja", "mandarina", "limon", "limón", "frutilla", "arandano", "arándano",
    "uva", "durazno", "kiwi", "melon", "melón", "sandia", "sandía", "fruta", "verdura", "perejil", "albahaca",
    "berenjena", "remolacha", "rucula", "rúcula", "puerro", "apio", "huevo",
  ],
  carniceria: [
    "carne", "pollo", "milanesa", "bife", "asado", "picada", "nalga", "cuadril", "peceto", "vacio", "vacío",
    "matambre", "chorizo", "morcilla", "cerdo", "bondiola", "pescado", "merluza", "salmon", "salmón", "hamburguesa",
    "pechuga", "pata", "muslo", "osobuco", "carre", "carré",
  ],
  lacteos: [
    "leche", "yogur", "yogurt", "queso", "manteca", "crema", "dulce de leche", "jamon", "jamón", "salame",
    "fiambre", "ricota", "mozzarella", "muzzarella", "postre", "flan",
  ],
  panaderia: ["pan", "facturas", "medialuna", "tostada", "bizcocho", "galleta de arroz", "prepizza", "tapas"],
  almacen: [
    "arroz", "fideo", "harina", "azucar", "azúcar", "sal", "aceite", "vinagre", "yerba", "cafe", "café",
    "té", "mate cocido", "galletita", "cacao", "mermelada", "atun", "atún", "lata", "polenta", "lenteja",
    "garbanzo", "poroto", "avena", "cereal", "mayonesa", "ketchup", "mostaza", "pure", "puré", "salsa",
    "agua", "gaseosa", "jugo", "vino", "cerveza", "soda", "caldo", "condimento", "oregano", "orégano", "pimienta",
    "levadura", "chocolate", "snack", "papas fritas", "maní", "mani", "nuez", "nueces", "almendra",
  ],
  bebe: ["pañal", "panal", "toallita", "toallitas", "leche de formula", "fórmula", "formula", "mamadera", "chupete", "babero", "papilla"],
  limpieza: [
    "lavandina", "detergente", "jabon en polvo", "jabón en polvo", "jabon liquido para ropa", "suavizante", "esponja",
    "trapo", "rejilla", "papel higienico", "papel higiénico", "rollo de cocina", "servilleta", "bolsa", "lustramuebles",
    "limpiador", "desengrasante", "cif", "virulana", "escoba", "secador", "lampazo", "insecticida", "raid",
  ],
  perfumeria: [
    "shampoo", "champu", "acondicionador", "jabon", "jabón", "pasta de dientes", "dentifrico", "dentífrico",
    "cepillo", "desodorante", "crema de enjuague", "algodon", "algodón", "hisopo", "toalla femenina", "tampon",
    "tampón", "protector", "ibuprofeno", "paracetamol", "curita", "alcohol", "remedio", "vitamina", "repelente",
  ],
};

function normalize(s) {
  return ` ${s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")} `;
}

const NORMALIZED = Object.entries(KEYWORDS).map(([cat, words]) => [
  cat,
  [...new Set(words.map((w) => normalize(w).trim()))],
]);

// Adivina la categoría por palabra clave (gana la coincidencia más larga,
// así "jabón en polvo" va a limpieza y no a perfumería). null si no sabe.
export function guessCategory(name) {
  const text = normalize(name);
  let best = null;
  let bestLen = 0;
  for (const [cat, words] of NORMALIZED) {
    for (const w of words) {
      if (w.length > bestLen && new RegExp(`(^|[^a-z])${w}(s|es)?([^a-z]|$)`).test(text)) {
        best = cat;
        bestLen = w.length;
      }
    }
  }
  return best;
}
