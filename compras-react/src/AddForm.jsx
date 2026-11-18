import { useId, useMemo, useRef, useState } from "react";
import { allEntries, categoryOf, entryKey, normalize } from "./categories";
import { CategoryPicker, CategoryTag } from "./ui";

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

  const entries = useMemo(() => allEntries(history), [history]);

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
  // El desplegable aparece siempre que haya algo escrito: además de las
  // coincidencias, la última fila permite agregar lo escrito eligiendo la
  // sección (aunque no haya ninguna coincidencia).
  const showList = open && query.length > 0 && !picking;
  const rows = options.length + 1;
  const addRow = options.length;

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
    if (e.key === "ArrowDown" && query) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % rows);
    } else if (e.key === "ArrowUp" && query) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a <= 0 ? rows - 1 : a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setPicking(false);
      setActive(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (busy) return;
      if (showList && active === addRow) setPicking(true);
      else if (showList && active >= 0) add(options[active].name, options[active].category);
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
              {/* Agregar lo escrito tal cual: si no existe, o si existe pero
                  se quiere en otra sección (ej. algo fresco que el catálogo
                  solo tiene en el freezer). */}
              <li
                id={`${listId}-${addRow}`}
                role="option"
                aria-selected={active === addRow}
                className={`combo-other ${options.length === 0 ? "is-only" : ""} ${active === addRow ? "is-active" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setPicking(true);
                }}
                onMouseEnter={() => setActive(addRow)}
              >
                <span>
                  + Agregar <strong>«{name.trim()}»</strong>
                  {isNew ? "" : " en otra sección"}
                </span>
                <span className="combo-hint">elegir sección</span>
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
        <CategoryPicker
          name={name}
          busy={busy}
          onPick={(category) => add(name, category)}
          onCancel={() => setPicking(false)}
        />
      )}
    </div>
  );
}
