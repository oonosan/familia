// Catálogo de alimentos típicos de la alimentación argentina, agrupados
// siguiendo las Guías Alimentarias para la Población Argentina (con verduras
// y frutas, y cereales y legumbres, separados para ver mejor la variedad).
// Es información orientativa: ante cualquier duda, manda la nutricionista.

export const GROUPS = [
  { id: "verduras", name: "Verduras", emoji: "🥦", color: "#4f9a5b" },
  { id: "frutas", name: "Frutas", emoji: "🍎", color: "#8e5bb5" },
  { id: "cereales", name: "Cereales, papa y batata", emoji: "🍚", color: "#d39b2a" },
  { id: "legumbres", name: "Legumbres", emoji: "🫘", color: "#8a5a3c" },
  { id: "lacteos", name: "Lácteos", emoji: "🥛", color: "#4a86c5" },
  { id: "carnes", name: "Carnes, pescado y huevo", emoji: "🍗", color: "#c8463d" },
  { id: "grasas", name: "Aceites, semillas y frutos secos", emoji: "🫒", color: "#8c8a2e" },
];

export const GROUP_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

// Nutrientes que vale la pena seguir en una nena chiquita. "key" marca los
// que se usan para avisar qué puede estar faltando en la semana.
export const NUTRIENTS = [
  { id: "proteinas", name: "Proteínas", key: true, info: "Crecimiento y músculos" },
  { id: "hierro", name: "Hierro", key: true, info: "Previene la anemia. El de las carnes se absorbe mucho mejor" },
  { id: "zinc", name: "Zinc", key: true, info: "Defensas y crecimiento" },
  { id: "calcio", name: "Calcio", key: true, info: "Huesos y dientes" },
  { id: "vitA", name: "Vitamina A", key: true, info: "Vista, piel y defensas" },
  { id: "vitC", name: "Vitamina C", key: true, info: "Defensas; ayuda a absorber el hierro de los vegetales" },
  { id: "vitD", name: "Vitamina D", key: false, info: "Absorción del calcio. Viene sobre todo del sol" },
  { id: "vitE", name: "Vitamina E", key: false, info: "Antioxidante" },
  { id: "vitK", name: "Vitamina K", key: false, info: "Coagulación y huesos" },
  { id: "vitB", name: "Vitaminas B", key: false, info: "Energía y sistema nervioso" },
  { id: "vitB12", name: "Vitamina B12", key: true, info: "Sangre y sistema nervioso. Solo en alimentos animales" },
  { id: "folatos", name: "Folatos", key: false, info: "Formación de células" },
  { id: "omega3", name: "Omega 3", key: true, info: "Desarrollo del cerebro y la vista" },
  { id: "fibra", name: "Fibra", key: true, info: "Tránsito intestinal" },
  { id: "potasio", name: "Potasio", key: false, info: "Músculos y corazón" },
  { id: "magnesio", name: "Magnesio", key: false, info: "Músculos y huesos" },
  { id: "yodo", name: "Yodo", key: false, info: "Tiroides y desarrollo" },
];

export const NUTRIENT_BY_ID = Object.fromEntries(NUTRIENTS.map((n) => [n.id, n]));

// Alérgenos de declaración obligatoria en Argentina (más sésamo).
export const ALLERGENS = {
  leche: "Leche",
  huevo: "Huevo",
  gluten: "Trigo / gluten",
  mani: "Maní",
  frutos_secos: "Frutos secos",
  soja: "Soja",
  pescado: "Pescado",
  mariscos: "Mariscos",
  sesamo: "Sésamo",
};

export const EFFECTS = {
  astringente: { name: "Astringente", info: "Puede endurecer la caca" },
  laxante: { name: "Laxante", info: "Ayuda a ablandar la caca" },
  neutro: { name: "Neutro", info: "" },
};

// histamina: alimentos que pueden liberar histamina y dar ronchas o
// enrojecimiento (sobre todo alrededor de la boca) sin que sea una alergia.
export const FOODS = [
  // Verduras
  { id: "calabaza", name: "Calabaza / zapallo anco", group: "verduras", nutrients: ["vitA", "vitC", "potasio", "fibra"], effect: "neutro" },
  { id: "zapallito", name: "Zapallito verde", group: "verduras", nutrients: ["vitC", "potasio", "folatos"], effect: "laxante", note: "Suave, ideal para empezar." },
  { id: "zucchini", name: "Zucchini", group: "verduras", nutrients: ["vitC", "potasio", "folatos"], effect: "laxante" },
  { id: "zanahoria", name: "Zanahoria", group: "verduras", nutrients: ["vitA", "potasio", "fibra"], effect: "astringente", note: "Cocida es astringente; cruda rallada, menos." },
  { id: "brocoli", name: "Brócoli", group: "verduras", nutrients: ["vitC", "vitK", "folatos", "calcio", "fibra"], effect: "laxante", note: "Puede dar gases." },
  { id: "coliflor", name: "Coliflor", group: "verduras", nutrients: ["vitC", "vitK", "folatos", "fibra"], effect: "neutro", note: "Puede dar gases." },
  { id: "chaucha", name: "Chaucha", group: "verduras", nutrients: ["vitC", "vitK", "folatos", "fibra"], effect: "laxante" },
  { id: "acelga", name: "Acelga", group: "verduras", nutrients: ["hierro", "vitA", "vitK", "folatos", "magnesio", "fibra"], effect: "laxante", note: "Rica en nitratos: en chiquitos, en porciones moderadas. El hierro vegetal se absorbe mejor con vitamina C." },
  { id: "espinaca", name: "Espinaca", group: "verduras", nutrients: ["hierro", "vitA", "vitK", "folatos", "magnesio", "fibra"], effect: "laxante", histamina: true, note: "Rica en nitratos: en chiquitos, en porciones moderadas." },
  { id: "remolacha", name: "Remolacha", group: "verduras", nutrients: ["folatos", "potasio", "fibra"], effect: "laxante", note: "Tiñe de rojo la caca y el pis: no es sangre." },
  { id: "tomate", name: "Tomate", group: "verduras", nutrients: ["vitC", "vitA", "potasio"], effect: "neutro", histamina: true, note: "Ácido: puede irritar la piel alrededor de la boca sin ser alergia." },
  { id: "morron", name: "Morrón", group: "verduras", nutrients: ["vitC", "vitA"], effect: "neutro", note: "El rojo tiene muchísima vitamina C." },
  { id: "cebolla", name: "Cebolla", group: "verduras", nutrients: ["vitC"], effect: "neutro", note: "Cocida, para dar sabor. Puede dar gases." },
  { id: "puerro", name: "Puerro", group: "verduras", nutrients: ["vitK", "folatos"], effect: "laxante" },
  { id: "berenjena", name: "Berenjena", group: "verduras", nutrients: ["fibra", "potasio"], effect: "neutro" },
  { id: "lechuga", name: "Lechuga", group: "verduras", nutrients: ["vitK", "folatos", "vitA"], effect: "laxante", note: "Cruda: cortada bien fina." },
  { id: "pepino", name: "Pepino", group: "verduras", nutrients: ["vitK", "potasio"], effect: "neutro" },

  // Frutas
  { id: "banana", name: "Banana", group: "frutas", nutrients: ["potasio", "magnesio", "vitB", "vitC"], effect: "astringente", note: "Más astringente cuanto más verde. Bien madura, casi neutra." },
  { id: "manzana", name: "Manzana", group: "frutas", nutrients: ["fibra", "vitC"], effect: "astringente", note: "Cocida o rallada sin cáscara: astringente. Cruda con cáscara: más bien laxante." },
  { id: "pera", name: "Pera", group: "frutas", nutrients: ["fibra", "vitC", "vitK"], effect: "laxante", note: "Tiene sorbitol, ablanda la caca." },
  { id: "arandanos", name: "Arándanos", group: "frutas", nutrients: ["vitC", "vitK", "fibra"], effect: "neutro", note: "Cortados al medio o aplastados (riesgo de atragantamiento)." },
  { id: "frutilla", name: "Frutilla", group: "frutas", nutrients: ["vitC", "folatos", "fibra"], effect: "neutro", histamina: true, note: "Frecuente que dé ronchitas alrededor de la boca." },
  { id: "durazno", name: "Durazno", group: "frutas", nutrients: ["vitA", "vitC", "fibra"], effect: "laxante" },
  { id: "damasco", name: "Damasco", group: "frutas", nutrients: ["vitA", "vitC", "fibra", "potasio"], effect: "laxante" },
  { id: "ciruela", name: "Ciruela", group: "frutas", nutrients: ["fibra", "potasio", "vitK"], effect: "laxante", note: "De las más laxantes (también la ciruela pasa)." },
  { id: "naranja", name: "Naranja / mandarina", group: "frutas", nutrients: ["vitC", "folatos", "fibra"], effect: "laxante", histamina: true, note: "Ácida: puede irritar alrededor de la boca." },
  { id: "kiwi", name: "Kiwi", group: "frutas", nutrients: ["vitC", "vitK", "fibra"], effect: "laxante", histamina: true, note: "Puede dar picazón en la boca; algunas personas son alérgicas." },
  { id: "mamon", name: "Mamón (papaya)", group: "frutas", nutrients: ["vitC", "vitA", "folatos"], effect: "laxante", histamina: true },
  { id: "melon", name: "Melón", group: "frutas", nutrients: ["vitA", "vitC", "potasio"], effect: "laxante" },
  { id: "sandia", name: "Sandía", group: "frutas", nutrients: ["vitA", "vitC"], effect: "neutro", note: "Sin semillas." },
  { id: "uva", name: "Uva", group: "frutas", nutrients: ["vitK", "potasio"], effect: "laxante", note: "Siempre cortada en cuartos (riesgo de atragantamiento)." },
  { id: "anana", name: "Ananá", group: "frutas", nutrients: ["vitC"], effect: "laxante", histamina: true, note: "Ácida: puede irritar alrededor de la boca." },
  { id: "mango", name: "Mango", group: "frutas", nutrients: ["vitA", "vitC", "folatos"], effect: "laxante", note: "La cáscara puede dar dermatitis de contacto." },
  { id: "membrillo", name: "Membrillo", group: "frutas", nutrients: ["fibra", "vitC"], effect: "astringente", note: "Cocido. El dulce de membrillo tiene mucha azúcar." },
  { id: "palta", name: "Palta", group: "frutas", nutrients: ["vitE", "potasio", "folatos", "fibra"], effect: "neutro", note: "Grasas buenas y muy buena textura para chiquitos." },

  // Cereales, papa y batata
  { id: "arroz", name: "Arroz blanco", group: "cereales", nutrients: ["vitB"], effect: "astringente", note: "Sin gluten." },
  { id: "arroz_integral", name: "Arroz integral", group: "cereales", nutrients: ["fibra", "magnesio", "vitB"], effect: "laxante", note: "Sin gluten." },
  { id: "papa", name: "Papa", group: "cereales", nutrients: ["potasio", "vitC", "vitB"], effect: "astringente", note: "En puré es astringente." },
  { id: "batata", name: "Batata", group: "cereales", nutrients: ["vitA", "vitC", "potasio", "fibra"], effect: "neutro" },
  { id: "choclo", name: "Choclo", group: "cereales", nutrients: ["fibra", "vitB", "magnesio"], effect: "neutro", note: "Sin gluten. Granos enteros: aplastados o en crema." },
  { id: "polenta", name: "Polenta", group: "cereales", nutrients: ["vitB"], effect: "neutro", note: "Harina de maíz, sin gluten." },
  { id: "mandioca", name: "Mandioca", group: "cereales", nutrients: ["vitC", "potasio"], effect: "neutro", note: "Sin gluten. Siempre bien cocida." },
  { id: "quinoa", name: "Quinoa", group: "cereales", nutrients: ["proteinas", "hierro", "magnesio", "fibra", "zinc"], effect: "laxante", note: "Sin gluten. Lavarla bien antes de cocinar." },
  { id: "avena", name: "Avena", group: "cereales", nutrients: ["fibra", "hierro", "magnesio", "zinc", "vitB"], effect: "laxante", allergen: "gluten", note: "Suele tener trazas de trigo (gluten)." },
  { id: "fideos", name: "Fideos (trigo)", group: "cereales", nutrients: ["vitB", "hierro"], effect: "neutro", allergen: "gluten" },
  { id: "pan", name: "Pan", group: "cereales", nutrients: ["vitB", "hierro"], effect: "neutro", allergen: "gluten", note: "La harina de trigo en Argentina viene fortificada con hierro y ácido fólico." },
  { id: "galletitas", name: "Galletitas de agua", group: "cereales", nutrients: ["vitB"], effect: "astringente", allergen: "gluten", note: "Elegir las bajas en sodio." },
  { id: "semola", name: "Sémola", group: "cereales", nutrients: ["vitB", "hierro"], effect: "neutro", allergen: "gluten" },

  // Legumbres
  { id: "arvejas", name: "Arvejas", group: "legumbres", nutrients: ["proteinas", "fibra", "vitC", "vitK", "hierro"], effect: "laxante" },
  { id: "lentejas", name: "Lentejas", group: "legumbres", nutrients: ["proteinas", "hierro", "zinc", "folatos", "fibra"], effect: "laxante", note: "Remojar y cocinar bien; pueden dar gases." },
  { id: "garbanzos", name: "Garbanzos", group: "legumbres", nutrients: ["proteinas", "hierro", "zinc", "folatos", "fibra"], effect: "laxante", note: "El hummus suele llevar tahini (sésamo)." },
  { id: "porotos", name: "Porotos", group: "legumbres", nutrients: ["proteinas", "hierro", "zinc", "folatos", "fibra", "magnesio"], effect: "laxante", note: "Remojar y cocinar bien; pueden dar gases." },
  { id: "soja", name: "Soja (tofu, bebida de soja)", group: "legumbres", nutrients: ["proteinas", "hierro", "calcio", "magnesio"], effect: "neutro", allergen: "soja" },

  // Lácteos
  { id: "leche_materna", name: "Teta (leche materna)", group: "lacteos", nutrients: ["proteinas", "calcio", "vitA", "vitB12", "omega3"], effect: "laxante", alwaysSafe: true, note: "Lo que comió la mamá puede pasar en pequeñas cantidades a la leche." },
  { id: "leche_formula", name: "Leche de fórmula", group: "lacteos", nutrients: ["calcio", "proteinas", "hierro", "vitD", "vitB12"], effect: "neutro", allergen: "leche", note: "Las fórmulas comunes son a base de leche de vaca." },
  { id: "leche_vaca", name: "Leche de vaca", group: "lacteos", nutrients: ["calcio", "proteinas", "vitB12", "vitD"], effect: "neutro", allergen: "leche", note: "En exceso puede constipar y quitar hambre de otros alimentos." },
  { id: "yogur", name: "Yogur natural", group: "lacteos", nutrients: ["calcio", "proteinas", "vitB12"], effect: "neutro", allergen: "leche", note: "Mejor sin azúcar agregada." },
  { id: "queso_blando", name: "Queso blando (cremoso, port salut)", group: "lacteos", nutrients: ["calcio", "proteinas", "vitB12"], effect: "astringente", allergen: "leche", note: "Elegir los bajos en sodio." },
  { id: "ricota", name: "Ricota", group: "lacteos", nutrients: ["calcio", "proteinas"], effect: "neutro", allergen: "leche" },
  { id: "queso_crema", name: "Queso crema / untable", group: "lacteos", nutrients: ["calcio", "vitA"], effect: "neutro", allergen: "leche" },

  // Carnes, pescado y huevo
  { id: "vaca", name: "Carne de vaca", group: "carnes", nutrients: ["proteinas", "hierro", "zinc", "vitB12"], effect: "neutro", note: "La mejor fuente de hierro que se absorbe bien." },
  { id: "pollo", name: "Pollo", group: "carnes", nutrients: ["proteinas", "vitB", "zinc", "vitB12"], effect: "neutro" },
  { id: "cerdo", name: "Cerdo", group: "carnes", nutrients: ["proteinas", "vitB", "zinc", "hierro", "vitB12"], effect: "neutro", note: "Bien cocido." },
  { id: "higado", name: "Hígado", group: "carnes", nutrients: ["hierro", "vitA", "vitB12", "folatos", "zinc", "proteinas"], effect: "neutro", note: "Tiene muchísima vitamina A: no más de una vez por semana." },
  { id: "huevo", name: "Huevo", group: "carnes", nutrients: ["proteinas", "vitB12", "vitD", "vitA"], effect: "neutro", allergen: "huevo", histamina: true, note: "Siempre bien cocido. La clara es la parte más alergénica." },
  { id: "merluza", name: "Merluza", group: "carnes", nutrients: ["proteinas", "yodo", "vitB12", "omega3"], effect: "neutro", allergen: "pescado", note: "Pescado blanco y suave. Revisar bien las espinas." },
  { id: "salmon", name: "Salmón", group: "carnes", nutrients: ["omega3", "proteinas", "vitD", "vitB12"], effect: "neutro", allergen: "pescado", note: "De los que más omega 3 tienen." },
  { id: "atun", name: "Atún", group: "carnes", nutrients: ["proteinas", "omega3", "vitD", "vitB12"], effect: "neutro", allergen: "pescado", histamina: true, note: "Limitar por el mercurio. En lata, al natural." },
  { id: "mariscos", name: "Mariscos (langostinos, calamar)", group: "carnes", nutrients: ["proteinas", "zinc", "yodo", "vitB12"], effect: "neutro", allergen: "mariscos", histamina: true },

  // Aceites, semillas y frutos secos
  { id: "aceite_oliva", name: "Aceite de oliva", group: "grasas", nutrients: ["vitE"], effect: "laxante", note: "Un chorrito crudo sobre la comida." },
  { id: "aceite_girasol", name: "Aceite de girasol", group: "grasas", nutrients: ["vitE"], effect: "neutro" },
  { id: "aceite_canola", name: "Aceite de canola", group: "grasas", nutrients: ["vitE", "omega3"], effect: "neutro" },
  { id: "manteca", name: "Manteca", group: "grasas", nutrients: ["vitA"], effect: "neutro", allergen: "leche" },
  { id: "chia", name: "Semillas de chía", group: "grasas", nutrients: ["omega3", "fibra", "calcio"], effect: "laxante", note: "Hidratadas o molidas." },
  { id: "lino", name: "Semillas de lino", group: "grasas", nutrients: ["omega3", "fibra"], effect: "laxante", note: "Molidas, si no pasan enteras." },
  { id: "sesamo", name: "Sésamo / tahini", group: "grasas", nutrients: ["calcio", "hierro", "magnesio"], effect: "neutro", allergen: "sesamo" },
  { id: "mani", name: "Maní / pasta de maní", group: "grasas", nutrients: ["proteinas", "vitE", "magnesio"], effect: "neutro", allergen: "mani", note: "Es una legumbre. Nunca entero en chiquitos: solo pasta untada fina." },
  { id: "nueces", name: "Nueces", group: "grasas", nutrients: ["omega3", "magnesio", "vitE"], effect: "neutro", allergen: "frutos_secos", note: "Solo molidas (riesgo de atragantamiento)." },
  { id: "almendras", name: "Almendras", group: "grasas", nutrients: ["calcio", "vitE", "magnesio"], effect: "neutro", allergen: "frutos_secos", note: "Solo molidas o en pasta." },
];

export const FOOD_BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f]));
