import { categoryImage } from "./categories";

// Ilustración de la categoría; si todavía no tiene imagen, su emoji.
export function CategoryArt({ category, size = "md" }) {
  const src = categoryImage(category.id);
  return (
    <span className={`cat-art cat-art-${size}`} aria-hidden="true">
      {src ? <img src={src} alt="" /> : <span className="cat-emoji">{category.emoji}</span>}
    </span>
  );
}

// Etiqueta chica con el color de la categoría.
export function CategoryTag({ category }) {
  return (
    <span className="cat-tag" style={{ "--cat": category.color, "--cat-soft": category.soft }}>
      {category.label}
    </span>
  );
}
