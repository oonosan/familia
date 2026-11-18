import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addItem, clearDone, fetchState, forget, removeItem, toggleItem, updateItem } from "./api";
import { CATEGORIES, categoryById, guessCategory } from "./categories";

const POLL_MS = 15000;
const SUGGESTIONS = 14;

export default function App() {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setState(await fetchState());
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    const onFocus = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [load]);

  // Corre una acción contra el servidor y reemplaza el estado con la
  // respuesta. Devuelve true si salió bien.
  async function run(action) {
    setBusy(true);
    setError(null);
    try {
      setState(await action());
      return true;
    } catch (e) {
      setError(e.message);
      load();
      return false;
    } finally {
      setBusy(false);
    }
  }

  // Tildar/destildar se ve al instante; si el servidor falla, se recarga.
  function toggle(id) {
    setState((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) }));
    run(() => toggleItem(id));
  }

  const pending = useMemo(() => (state ? state.items.filter((i) => !i.done) : []), [state]);
  const done = useMemo(() => (state ? state.items.filter((i) => i.done) : []), [state]);

  const groups = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        ...c,
        items: pending.filter((i) => (categoryById[i.category] ? i.category : "otros") === c.id),
      })).filter((g) => g.items.length > 0),
    [pending]
  );

  const suggestions = useMemo(() => {
    if (!state) return [];
    const onList = new Set(pending.map((i) => i.name.toLowerCase()));
    return Object.values(state.history)
      .filter((h) => !onList.has(h.name.toLowerCase()))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, SUGGESTIONS);
  }, [state, pending]);

  if (!state) {
    return (
      <>
        <Header />
        <main className="page">
          {error ? (
            <div className="card error">
              {error} <button onClick={load}>Reintentar</button>
            </div>
          ) : (
            <p className="muted center">Cargando la lista…</p>
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <Header count={pending.length} />
      <main className="page">
        {error && <div className="card error">{error}</div>}

        <AddForm
          history={state.history}
          busy={busy}
          onAdd={(name, qty, category) => run(() => addItem(name, qty, category))}
        />

        {suggestions.length > 0 && (
          <section className="suggestions">
            <h2>Lo de siempre</h2>
            <div className="chips">
              {suggestions.map((s) => (
                <span key={s.name} className="chip">
                  <button
                    className="chip-add"
                    disabled={busy}
                    onClick={() => run(() => addItem(s.name, "", s.category))}
                    title={`Agregar ${s.name}`}
                  >
                    + {s.name}
                  </button>
                  <button
                    className="chip-forget"
                    disabled={busy}
                    onClick={() => run(() => forget(s.name))}
                    aria-label={`Sacar ${s.name} de las sugerencias`}
                    title="Sacar de las sugerencias"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>
        )}

        {pending.length === 0 ? (
          <div className="card empty">
            <span className="empty-emoji">🧺</span>
            {done.length > 0 ? "¡Listo! Ya está todo en el changuito." : "La lista está vacía. Anotá lo que haga falta."}
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.id} className="card group">
              <h2>
                <span aria-hidden="true">{g.emoji}</span> {g.label}
                <span className="badge">{g.items.length}</span>
              </h2>
              <ul className="items">
                {g.items.map((item) =>
                  editingId === item.id ? (
                    <EditRow
                      key={item.id}
                      item={item}
                      busy={busy}
                      onCancel={() => setEditingId(null)}
                      onSave={async (name, qty, category) => {
                        if (await run(() => updateItem(item.id, name, qty, category))) setEditingId(null);
                      }}
                    />
                  ) : (
                    <ItemRow
                      key={item.id}
                      item={item}
                      busy={busy}
                      onToggle={() => toggle(item.id)}
                      onEdit={() => setEditingId(item.id)}
                      onRemove={() => run(() => removeItem(item.id))}
                    />
                  )
                )}
              </ul>
            </section>
          ))
        )}

        {done.length > 0 && (
          <section className="card group done-group">
            <h2>
              <span aria-hidden="true">✅</span> En el changuito
              <span className="badge">{done.length}</span>
            </h2>
            <ul className="items">
              {done.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  busy={busy}
                  onToggle={() => toggle(item.id)}
                  onRemove={() => run(() => removeItem(item.id))}
                />
              ))}
            </ul>
            <button
              className="btn ghost full"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`¿Sacar de la lista los ${done.length} comprados?`)) run(clearDone);
              }}
            >
              Vaciar comprados
            </button>
          </section>
        )}
      </main>
    </>
  );
}

function Header({ count }) {
  return (
    <header className="top">
      <a className="back" href="/" aria-label="Volver al inicio">
        ‹
      </a>
      <h1>🛒 Lista de compras</h1>
      {count > 0 && <span className="top-count">{count} por comprar</span>}
    </header>
  );
}

function AddForm({ history, busy, onAdd }) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [category, setCategory] = useState("otros");
  const [manualCategory, setManualCategory] = useState(false);
  const inputRef = useRef(null);

  // Mientras no se elija categoría a mano, la adivinamos: primero por el
  // historial (como se anotó la última vez) y si no, por palabra clave.
  function changeName(value) {
    setName(value);
    if (manualCategory) return;
    const known = history[value.trim().toLowerCase()];
    setCategory(known?.category || guessCategory(value) || "otros");
  }

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    if (await onAdd(name.trim(), qty.trim(), category)) {
      setName("");
      setQty("");
      setCategory("otros");
      setManualCategory(false);
      inputRef.current?.focus();
    }
  }

  const names = Object.values(history).map((h) => h.name);

  return (
    <form className="card add" onSubmit={submit}>
      <div className="add-row">
        <input
          ref={inputRef}
          className="add-name"
          value={name}
          onChange={(e) => changeName(e.target.value)}
          placeholder="¿Qué hace falta?"
          aria-label="Producto"
          maxLength={80}
          list="history-names"
          autoComplete="off"
        />
        <input
          className="add-qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Cant."
          aria-label="Cantidad"
          maxLength={30}
        />
      </div>
      <datalist id="history-names">
        {names.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <div className="add-row">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setManualCategory(true);
          }}
          aria-label="Categoría"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
        <button className="btn primary" type="submit" disabled={busy || !name.trim()}>
          Agregar
        </button>
      </div>
    </form>
  );
}

function ItemRow({ item, busy, onToggle, onEdit, onRemove }) {
  return (
    <li className={`item ${item.done ? "is-done" : ""}`}>
      <button
        className="check"
        onClick={onToggle}
        aria-pressed={item.done}
        aria-label={item.done ? `Desmarcar ${item.name}` : `Marcar ${item.name} como comprado`}
      >
        <span className="box" aria-hidden="true">
          {item.done ? "✓" : ""}
        </span>
        <span className="item-text">
          <span className="item-name">{item.name}</span>
          {item.qty && <span className="item-qty">{item.qty}</span>}
        </span>
      </button>
      {onEdit && (
        <button className="icon" onClick={onEdit} disabled={busy} aria-label={`Editar ${item.name}`} title="Editar">
          ✎
        </button>
      )}
      <button className="icon" onClick={onRemove} disabled={busy} aria-label={`Borrar ${item.name}`} title="Borrar">
        ×
      </button>
    </li>
  );
}

function EditRow({ item, busy, onSave, onCancel }) {
  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(item.qty);
  const [category, setCategory] = useState(item.category);

  return (
    <li className="item editing">
      <form
        className="edit-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSave(name.trim(), qty.trim(), category);
        }}
      >
        <div className="add-row">
          <input className="add-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-label="Producto" autoFocus />
          <input className="add-qty" value={qty} onChange={(e) => setQty(e.target.value)} maxLength={30} placeholder="Cant." aria-label="Cantidad" />
        </div>
        <div className="add-row">
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoría">
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn primary" disabled={busy || !name.trim()}>
            Guardar
          </button>
        </div>
      </form>
    </li>
  );
}
