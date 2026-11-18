import { CATEGORIES, categoryImage } from "./categories";

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

// Grilla para elegir en qué sección va un producto nuevo.
export function CategoryPicker({ name, busy, onPick, onCancel, question = "¿En qué sección va" }) {
  return (
    <div className="picker">
      <p className="picker-title">
        {question} <strong>«{name.trim()}»</strong>?
      </p>
      <div className="picker-grid">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className="picker-option"
            style={{ "--cat": c.color, "--cat-soft": c.soft }}
            disabled={busy}
            onClick={() => onPick(c.id)}
          >
            <CategoryArt category={c} size="sm" />
            <span>{c.label}</span>
          </button>
        ))}
      </div>
      {onCancel && (
        <button className="btn ghost full" onClick={onCancel}>
          Cancelar
        </button>
      )}
    </div>
  );
}
