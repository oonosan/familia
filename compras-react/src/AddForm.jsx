import { useId, useMemo, useRef, useState } from "react";
import { CATALOG, CATEGORIES, categoryOf, entryKey, normalize } from "./categories";
import { CategoryArt, CategoryTag } from "./ui";

const MAX_OPTIONS = 8;

// Alta de productos: autocompletar sobre el catálogo + el historial, donde
// cada opción muestra su categoría al lado (el mismo nombre puede aparecer en
// dos categorías). Si lo escrito no está, aparece "Agregar" y después se
// elige la categoría.
export default function AddForm({ history, pending, busy, onAdd }) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [picking, setPicking] = useState(false);
  const inputRef = useRef(null);
  const listId = useId();

  // Catálogo + historial, sin repetir (el historial gana: trae cómo se
  // escribió y cuántas veces se anotó).
  const entries = useMemo(() => {
    const map = new Map();
    for (const c of CATALOG) map.set(entryKey(c.name, c.category), { ...c, count: 0 });
    for (const h of Object.values(history)) {
      map.set(entryKey(h.name, h.category), { name: h.name, category: h.category, count: h.count });
    }
    return [...map.values()].map((e) => ({ ...e, norm: normalize(e.name) }));
  }, [history]);

  const onList = useMemo(() => new Set(pending.map((i) => entryKey(i.name, i.category))), [pending]);

  const query = normalize(name);
  const options = useMemo(() => {
    if (!query) return [];
    return entries
      .map((e) => {
        let score;
        if (e.norm === query) score = 0;
        else if (e.norm.startsWith(query)) score = 1;
        else if (e.norm.split(/\s+/).some((w) => w.startsWith(query))) score = 2;
        else if (e.norm.includes(query)) score = 3;
        else return null;
        return { ...e, score };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score || b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, MAX_OPTIONS);
  }, [entries, query]);

  const exact = options.filter((o) => o.norm === query);
  const isNew = query.length > 0 && exact.length === 0;
  const showList = open && options.length > 0 && !picking;

  function reset() {
    setName("");
    setQty("");
    setActive(-1);
    setPicking(false);
    setOpen(false);
    inputRef.current?.focus();
  }

  async function add(entryName, category) {
    if (await onAdd(entryName.trim(), qty.trim(), category)) reset();
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown" && options.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % options.length);
    } else if (e.key === "ArrowUp" && options.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setPicking(false);
      setActive(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (busy) return;
      if (showList && active >= 0) add(options[active].name, options[active].category);
      else if (exact.length === 1) add(exact[0].name, exact[0].category);
      else if (isNew) setPicking(true);
      else setOpen(true);
    }
  }

  return (
    <div className="card add">
      <div className="add-row">
        <div className="combo">
          <input
            ref={inputRef}
            className="add-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setOpen(true);
              setActive(-1);
              setPicking(false);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            placeholder="¿Qué hace falta?"
            aria-label="Producto"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
            maxLength={80}
            autoComplete="off"
          />
          {showList && (
            <ul className="combo-list" id={listId} role="listbox">
              {options.map((o, i) => {
                const cat = categoryOf(o.category);
                const already = onList.has(entryKey(o.name, o.category));
                return (
                  <li
                    key={`${o.category}|${o.norm}`}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className={`combo-option ${i === active ? "is-active" : ""}`}
                    // mousedown para que no se pierda el foco antes del click
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!busy) add(o.name, o.category);
                    }}
                    onMouseEnter={() => setActive(i)}
                  >
                    <span className="combo-name">
                      {o.name}
                      {already && <span className="combo-already"> · ya está</span>}
                    </span>
                    <CategoryTag category={cat} />
                  </li>
                );
              })}
              {/* Por si existe pero en otra sección (ej. algo fresco que
                  el catálogo solo tiene en el freezer). */}
              <li
                className="combo-other"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setPicking(true);
                }}
              >
                + Agregar «{name.trim()}» en otra sección…
              </li>
            </ul>
          )}
        </div>
        <input
          className="add-qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Cant."
          aria-label="Cantidad"
          maxLength={30}
        />
        {isNew && !picking && (
          <button className="btn primary" disabled={busy} onClick={() => setPicking(true)}>
            + Agregar
          </button>
        )}
      </div>

      {picking && query && (
        <div className="picker">
          <p className="picker-title">
            ¿En qué sección va <strong>«{name.trim()}»</strong>?
          </p>
          <div className="picker-grid">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className="picker-option"
                style={{ "--cat": c.color, "--cat-soft": c.soft }}
                disabled={busy}
                onClick={() => add(name, c.id)}
              >
                <CategoryArt category={c} size="sm" />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
          <button className="btn ghost full" onClick={() => setPicking(false)}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
