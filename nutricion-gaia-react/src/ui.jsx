import { useEffect, useMemo, useState } from "react";
import { ALLERGENS, FOODS, GROUPS, GROUP_BY_ID } from "./foods";
import { STATUS_LABEL, customKey, statusOf } from "./logic";

export function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function StatusBadge({ status }) {
  if (!status) return <span className="badge badge-nuevo">No introducido</span>;
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function GroupTag({ groupId }) {
  const g = GROUP_BY_ID[groupId];
  if (!g) return null;
  return (
    <span className="group-tag" style={{ "--g": g.color }}>
      {g.emoji} {g.name}
    </span>
  );
}

// Chip de un alimento con el color de su grupo y un marco según su estado.
export function FoodChip({ name, group, status, onClick, children }) {
  const g = GROUP_BY_ID[group];
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`food-chip status-${status || "nuevo"}`}
      style={{ "--g": g ? g.color : "#9a9184" }}
      onClick={onClick}
      title={status ? STATUS_LABEL[status] : "No introducido"}
    >
      {status === "prueba" && "🧪 "}
      {status === "reaccion" && "⚠️ "}
      {name}
      {children}
    </Tag>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Buscador de alimentos del catálogo, con opción de cargar uno a mano.
// onlyNew: muestra solo los que todavía no se introdujeron (para pruebas).
export function FoodPicker({ state, onPick, onlyNew = false, exclude = new Set() }) {
  const [query, setQuery] = useState("");
  const [customGroup, setCustomGroup] = useState("");

  const q = normalize(query.trim());

  const results = useMemo(() => {
    const list = FOODS.map((f) => ({ ...f, key: f.id, status: statusOf(state, f.id) })).filter(
      (f) => !exclude.has(f.key) && (!onlyNew || !f.status)
    );
    if (q) return list.filter((f) => normalize(f.name).includes(q));
    return list;
  }, [state, q, onlyNew, exclude]);

  const sections = useMemo(() => {
    if (q) return [{ title: null, foods: results }];
    if (onlyNew) {
      return GROUPS.map((g) => ({ title: `${g.emoji} ${g.name}`, foods: results.filter((f) => f.group === g.id) })).filter(
        (s) => s.foods.length
      );
    }
    return [
      { title: "🧪 En prueba", foods: results.filter((f) => f.status === "prueba") },
      { title: "✅ Ya introducidos", foods: results.filter((f) => f.status === "seguro") },
    ].filter((s) => s.foods.length);
  }, [results, q, onlyNew]);

  const exactMatch = results.some((f) => normalize(f.name) === q);

  function pickCustom() {
    const name = query.trim();
    onPick({ key: customKey(name), name, group: customGroup || null, custom: true });
    setQuery("");
  }

  return (
    <div className="picker">
      <input
        type="search"
        className="picker-search"
        placeholder={onlyNew ? "Buscar alimento nuevo…" : "Buscar alimento (ej. lentejas, huevo)…"}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {!q && !onlyNew && <p className="hint">Escribí para buscar en todo el catálogo o cargar algo que no esté.</p>}

      {sections.map((s, i) => (
        <div key={s.title || i} className="picker-section">
          {s.title && <h3>{s.title}</h3>}
          <div className="chip-wrap">
            {s.foods.map((f) => (
              <FoodChip key={f.key} name={f.name} group={f.group} status={f.status} onClick={() => onPick(f)}>
                {f.allergen && <span className="chip-allergen" title={`Alérgeno: ${ALLERGENS[f.allergen]}`}> ⚑</span>}
              </FoodChip>
            ))}
          </div>
        </div>
      ))}

      {q && results.length === 0 && <p className="hint">No está en el catálogo.</p>}

      {q && !exactMatch && (
        <div className="custom-add">
          <select value={customGroup} onChange={(e) => setCustomGroup(e.target.value)} aria-label="Grupo">
            <option value="">Sin grupo (preparación, otro)</option>
            {GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.emoji} {g.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn-link" onClick={pickCustom}>
            + Cargar «{query.trim()}»
          </button>
        </div>
      )}
    </div>
  );
}
