// Categorías de la lista, con su color y emoji (el emoji se usa si la
// sección no tiene imagen en src/assets/categorias/<id>.webp), y el catálogo
// de productos conocidos para el autocompletar.
// Los ids tienen que coincidir con CATEGORIES en
// netlify/functions/compras-data.mjs.
export const CATEGORIES = [
  { id: "frutas-verduras", label: "Frutas y verduras", emoji: "🥦", color: "#5f9e5c", soft: "#e5f2e1" },
  { id: "heladera", label: "Heladera", emoji: "🧀", color: "#4f8cc9", soft: "#e2edf9" },
  { id: "carniceria", label: "Carnicería", emoji: "🥩", color: "#d0606f", soft: "#fbe3e6" },
  { id: "freezer", label: "Freezer", emoji: "🧊", color: "#3aa1b2", soft: "#dcf1f4" },
  { id: "almacen", label: "Alacena y almacén", emoji: "🥫", color: "#d48a2e", soft: "#fcecd6" },
  { id: "snacks", label: "Snacks", emoji: "🍫", color: "#8e6bc9", soft: "#eee6f9" },
  { id: "limpieza", label: "Limpieza", emoji: "🧽", color: "#2f9a83", soft: "#d9f1ea" },
  { id: "aseo", label: "Aseo personal", emoji: "🧴", color: "#c26aa8", soft: "#f8e3f1" },
  { id: "gaia", label: "Gaia", emoji: "🍼", color: "#e07c5a", soft: "#fde6dd" },
  { id: "huevos", label: "Huevos", emoji: "🥚", color: "#c9a019", soft: "#faf1d2" },
  { id: "bebidas", label: "Bebidas", emoji: "🧃", color: "#6a79cf", soft: "#e6e8fa" },
  { id: "otros", label: "Otros", emoji: "🛒", color: "#7b8580", soft: "#ebeeec" },
];

export const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export function categoryOf(id) {
  return categoryById[id] || categoryById.otros;
}

// Imágenes de cada sección (opcionales). Las que no estén usan el emoji.
const images = import.meta.glob("./assets/categorias/*.webp", { eager: true, import: "default" });
export function categoryImage(id) {
  return images[`./assets/categorias/${id}.webp`] || null;
}

// Productos conocidos por categoría. Un mismo nombre puede estar en varias
// (ej. patamuslo fresco de la carnicería y patamuslo del freezer): el
// autocompletar muestra cada uno con su categoría al lado.
const CATALOG_BY_CATEGORY = {
  "frutas-verduras": [
    "Banana", "Manzana", "Pera", "Naranja", "Mandarina", "Limón", "Frutillas", "Arándanos", "Uvas", "Kiwi",
    "Durazno", "Palta", "Papa", "Batata", "Zanahoria", "Cebolla", "Ajo", "Tomate", "Lechuga", "Rúcula",
    "Espinaca", "Acelga", "Brócoli", "Coliflor", "Zapallo", "Calabaza", "Zapallito", "Zucchini", "Berenjena",
    "Morrón", "Pepino", "Choclo", "Chauchas", "Remolacha", "Apio", "Puerro", "Hongos", "Perejil", "Albahaca",
  ],
  heladera: [
    "Leche", "Manteca", "Queso cremoso", "Queso rallado", "Queso en barra", "Queso crema", "Ricota",
    "Muzzarella", "Yogur", "Yogur griego", "Crema", "Dulce de leche", "Jamón cocido", "Salame", "Tapas de empanadas",
    "Tapas de tarta", "Fideos frescos", "Ravioles",
  ],
  carniceria: [
    "Carne picada", "Bife", "Nalga", "Cuadril", "Peceto", "Vacío", "Asado", "Matambre", "Osobuco", "Milanesas",
    "Pollo entero", "Pechuga", "Patamuslo", "Suprema", "Bondiola", "Chorizo", "Merluza", "Salmón", "Pescado",
  ],
  freezer: [
    "Pacú", "Muzzarelitas", "Frutos rojos", "Pizza", "Patamuslo", "Hamburguesas", "Medallones de pollo",
    "Bastones de pescado", "Papas fritas congeladas", "Espinaca congelada", "Arvejas congeladas", "Helado", "Hielo",
  ],
  almacen: [
    "Lentejas", "Garbanzos", "Porotos", "Harina de almendras", "Harina", "Arroz", "Fideos", "Polenta", "Avena",
    "Yerba", "Manzanilla", "Café", "Té", "Azúcar", "Edulcorante", "Sal", "Aceite", "Aceite de oliva", "Vinagre",
    "Mayonesa", "Mostaza", "Ketchup", "Puré de tomate", "Atún", "Arvejas en lata", "Choclo en lata", "Caldo",
    "Orégano", "Pimienta", "Pimentón", "Mermelada", "Miel", "Pan", "Pan lactal", "Galletitas", "Galletas de arroz",
    "Cacao", "Semillas de chía", "Nueces", "Almendras", "Levadura",
  ],
  snacks: ["Papas fritas", "Chocolate", "Maní", "Palitos", "Chizitos", "Turrón", "Alfajores", "Barritas de cereal", "Pochoclos"],
  limpieza: [
    "Cif crema", "Cif piso", "Blem", "Lavandina", "Detergente", "Jabón en polvo", "Jabón líquido para ropa",
    "Suavizante", "Esponjas", "Rejillas", "Trapo de piso", "Papel higiénico", "Rollo de cocina", "Servilletas",
    "Bolsas de residuos", "Insecticida", "Desengrasante",
  ],
  aseo: [
    "Shampoo", "Acondicionador", "Jabón líquido", "Jabón", "Pasta de dientes", "Cepillo de dientes", "Desodorante",
    "Algodón", "Hisopos", "Crema de manos", "Protector solar", "Repelente", "Toallitas femeninas", "Ibuprofeno",
    "Paracetamol", "Curitas", "Alcohol en gel",
  ],
  gaia: [
    "Pañales", "Óleo calcáreo", "Toallitas húmedas", "Crema para paspadura", "Shampoo de bebé", "Jabón de bebé",
    "Leche de fórmula", "Colitas para el pelo",
  ],
  huevos: ["Huevos", "Maple de huevos"],
  bebidas: ["Agua", "Agua con gas", "Soda", "Gaseosa", "Jugo", "Vino", "Cerveza", "Agua saborizada"],
};

export const CATALOG = Object.entries(CATALOG_BY_CATEGORY).flatMap(([category, names]) =>
  names.map((name) => ({ name, category }))
);

export function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

export function entryKey(name, category) {
  return `${category}|${normalize(name)}`;
}
