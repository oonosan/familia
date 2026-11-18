import { useCallback, useEffect, useMemo, useState } from "react";
import { addItem, addProduct, clearDone, fetchState, forget, removeItem, toggleItem, updateItem } from "./api";
import { CATEGORIES, categoryOf, entryKey } from "./categories";
import AddForm from "./AddForm";
import Catalog from "./Catalog";
import { CategoryArt, CategoryTag } from "./ui";

const POLL_MS = 15000;
const SUGGESTIONS = 14;

// "miércoles 18 de noviembre", en hora de Argentina.
const DAY_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Argentina/Buenos_Aires",
});

function formatDay(iso) {
  const parts = Object.fromEntries(DAY_FORMAT.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.weekday} ${parts.day} de ${parts.month}`;
}

const TABS = [
  { id: "lista", label: "Lista" },
  { id: "productos", label: "Productos" },
];

function tabFromHash() {
  const id = window.location.hash.slice(1);
  return TABS.some((t) => t.id === id) ? id : "lista";
}

export default function App() {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [tab, setTab] = useState(tabFromHash);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function goTo(id) {
    window.location.hash = id;
    setTab(id);
    window.scrollTo({ top: 0 });
  }

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

  // Lo comprado, agrupado por el día en que se tildó (más nuevo primero).
  const doneByDay = useMemo(() => {
    const sorted = [...done].sort((a, b) => (b.doneAt || "").localeCompare(a.doneAt || ""));
    const days = [];
    for (const item of sorted) {
      const label = item.doneAt ? formatDay(item.doneAt) : "";
      if (days.at(-1)?.label === label) days.at(-1).items.push(item);
      else days.push({ label, items: [item] });
    }
    return days;
  }, [done]);

  const groups = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        ...c,
        items: pending.filter((i) => categoryOf(i.category).id === c.id),
      })).filter((g) => g.items.length > 0),
    [pending],
  );

  const suggestions = useMemo(() => {
    if (!state) return [];
    const onList = new Set(pending.map((i) => entryKey(i.name, i.category)));
    return (
      Object.values(state.history)
        // count 0: productos sumados al catálogo que nunca se anotaron.
        .filter((h) => h.count > 0 && !onList.has(entryKey(h.name, h.category)))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, SUGGESTIONS)
    );
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
      <Header count={pending.length} tab={tab} onTab={goTo} />
      <main className="page">
        {error && <div className="card error">{error}</div>}

        {tab === "productos" ? (
          <Catalog
            history={state.history}
            pending={pending}
            busy={busy}
            onAdd={(name, qty, category) => run(() => addItem(name, qty, category))}
            onAddProduct={(name, category) => run(() => addProduct(name, category))}
          />
        ) : (
          <>
            <AddForm
              history={state.history}
              pending={pending}
              busy={busy}
              onAdd={(name, qty, category) => run(() => addItem(name, qty, category))}
            />

            {suggestions.length > 0 && (
              <section className="suggestions">
                <h2>Lo de siempre</h2>
                <div className="chips">
                  {suggestions.map((s) => {
                    const cat = categoryOf(s.category);
                    return (
                      <span
                        key={`${s.category}|${s.name}`}
                        className="chip"
                        style={{ "--cat": cat.color, "--cat-soft": cat.soft }}
                      >
                        <button
                          className="chip-add"
                          disabled={busy}
                          onClick={() => run(() => addItem(s.name, "", s.category))}
                          title={`Agregar ${s.name} (${cat.label})`}
                        >
                          <span className="chip-dot" aria-hidden="true" />+ {s.name}
                        </button>
                        <button
                          className="chip-forget"
                          disabled={busy}
                          onClick={() => run(() => forget(s.name, s.category))}
                          aria-label={`Sacar ${s.name} de las sugerencias`}
                          title="Sacar de las sugerencias"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            {pending.length === 0 ? (
              <div className="card empty">
                <span className="empty-emoji">🧺</span>
                {done.length > 0
                  ? "¡Listo! Ya está todo en el changuito."
                  : "La lista está vacía. Anotá lo que haga falta."}
              </div>
            ) : (
              <div className="groups">
                {groups.map((g) => (
                  <section key={g.id} className="group" style={{ "--cat": g.color, "--cat-soft": g.soft }}>
                    <header className="group-head">
                      <CategoryArt category={g} />
                      <h2 className="group-title">{g.label}</h2>
                      <span className="badge">{g.items.length}</span>
                    </header>
                    <ul className="items">
                      {g.items.map((item) =>
                        editingId === item.id ? (
                          <EditRow
                            key={item.id}
                            item={item}
                            busy={busy}
                            onCancel={() => setEditingId(null)}
                            onSave={async (qty, category) => {
                              if (await run(() => updateItem(item.id, qty, category))) setEditingId(null);
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
                        ),
                      )}
                    </ul>
                  </section>
                ))}
              </div>
            )}

            {done.length > 0 && (
              <section className="card done-group">
                <h2>
                  <span aria-hidden="true">✅</span> En el changuito
                  <span className="badge">{done.length}</span>
                </h2>
                {doneByDay.map((day) => (
                  <div key={day.label} className="done-day">
                    {day.label && <h3 className="done-date">{day.label}</h3>}
                    <ul className="items">
                      {day.items.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          busy={busy}
                          showCategory
                          onToggle={() => toggle(item.id)}
                          onRemove={() => run(() => removeItem(item.id))}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
                <ClearDone count={done.length} busy={busy} onConfirm={() => run(clearDone)} />
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

function Header({ count, tab, onTab }) {
  return (
    <header className="top">
      <div className="top-row">
        <a className="back" href="/" aria-label="Volver al inicio">
          ‹
        </a>
        <h1>🛒 Lista de compras</h1>
        {count > 0 && <span className="top-count">{count} por comprar</span>}
      </div>
      {onTab && (
        <nav className="tabs" aria-label="Secciones">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? "is-active" : ""}`}
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => onTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}

function ItemRow({ item, busy, showCategory, onToggle, onEdit, onRemove }) {
  const cat = categoryOf(item.category);
  return (
    <li className={`item ${item.done ? "is-done" : ""}`} style={{ "--cat": cat.color, "--cat-soft": cat.soft }}>
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
          {showCategory && <CategoryTag category={cat} />}
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

// Edición de un ítem: cantidad y sección. El nombre no se cambia (para
// otro producto, se borra y se agrega el nuevo).
function EditRow({ item, busy, onSave, onCancel }) {
  const [qty, setQty] = useState(item.qty);
  const [category, setCategory] = useState(categoryOf(item.category).id);

  return (
    <li className="item editing">
      <form
        className="edit-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(qty.trim(), category);
        }}
      >
        <p className="edit-name">{item.name}</p>
        <div className="edit-fields">
          <input
            className="edit-qty"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            maxLength={30}
            placeholder="Cantidad"
            aria-label="Cantidad"
            autoFocus
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Sección">
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="edit-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn primary" disabled={busy}>
            Guardar
          </button>
        </div>
      </form>
    </li>
  );
}

// "Vaciar comprados" con confirmación en la misma página (sin
// window.confirm, que algunos navegadores bloquean y devuelve "no" sin
// mostrar nada).
function ClearDone({ count, busy, onConfirm }) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button className="btn ghost full" disabled={busy} onClick={() => setAsking(true)}>
        Vaciar comprados
      </button>
    );
  }

  return (
    <div className="confirm">
      <p>
        ¿Sacar de la lista {count === 1 ? "el producto comprado" : `los ${count} productos comprados`}?
      </p>
      <div className="confirm-actions">
        <button className="btn ghost" onClick={() => setAsking(false)}>
          Cancelar
        </button>
        <button
          className="btn danger"
          disabled={busy}
          onClick={async () => {
            if (await onConfirm()) setAsking(false);
          }}
        >
          Sí, vaciar
        </button>
      </div>
    </div>
  );
}
