import { useMemo, useState } from "react";
import { CATEGORIES, allEntries, categoryById, categoryOf, entryKey, normalize } from "./categories";
import { CategoryArt, CategoryPicker } from "./ui";

// Pestaña "Productos": todo lo que se puede anotar (catálogo + lo que ya se
// anotó o se sumó alguna vez), por sección. Tocar un producto lo suma a la
// lista; los productos nuevos se suman al catálogo sin agregarlos a la lista.
export default function Catalog({ history, pending, busy, onAdd, onAddProduct }) {
  const [search, setSearch] = useState("");
  const [picking, setPicking] = useState(false);
  const [notice, setNotice] = useState(null);
  const query = normalize(search);

  const onList = useMemo(() => new Set(pending.map((i) => entryKey(i.name, i.category))), [pending]);
  const entries = useMemo(() => allEntries(history), [history]);

  const groups = useMemo(() => {
    const filtered = entries.filter((e) => !query || e.norm.includes(query));
    return CATEGORIES.map((c) => ({
      ...c,
      entries: filtered
        .filter((e) => categoryOf(e.category).id === c.id)
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    })).filter((g) => g.entries.length > 0 || !query);
  }, [entries, query]);

  const exists = query.length > 0 && entries.some((e) => e.norm === query);

  async function createProduct(name, category) {
    if (await onAddProduct(name.trim(), category)) {
      setNotice(`«${name.trim()}» se sumó a ${categoryById[category].label}.`);
      return true;
    }
    return false;
  }

  return (
    <>
      <div className="card catalog-search">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPicking(false);
            setNotice(null);
          }}
          placeholder="Buscar producto…"
          aria-label="Buscar producto"
        />
        {notice ? (
          <p className="notice small">✓ {notice}</p>
        ) : (
          <p className="muted small">Tocá un producto para sumarlo a la lista.</p>
        )}
        {query && !exists && !picking && (
          <button className="btn primary" onClick={() => setPicking(true)}>
            + Agregar «{search.trim()}» como producto nuevo
          </button>
        )}
        {picking && query && (
          <CategoryPicker
            name={search}
            busy={busy}
            question="¿En qué sección va el producto"
            onPick={async (category) => {
              if (await createProduct(search, category)) {
                setPicking(false);
                setSearch("");
              }
            }}
            onCancel={() => setPicking(false)}
          />
        )}
      </div>

      {groups.length === 0 ? (
        <div className="card empty">
          <span className="empty-emoji">🔎</span>
          No hay productos que coincidan con «{search.trim()}».
        </div>
      ) : (
        <div className="groups">
          {groups.map((g) => (
            <section key={g.id} className="group" style={{ "--cat": g.color, "--cat-soft": g.soft }}>
              <header className="group-head">
                <CategoryArt category={g} />
                <h2 className="group-title">{g.label}</h2>
                <span className="badge">{g.entries.length}</span>
              </header>
              <div className="catalog-chips">
                {g.entries.map((e) => {
                  const added = onList.has(entryKey(e.name, e.category));
                  return (
                    <button
                      key={e.norm}
                      className={`catalog-chip ${added ? "is-added" : ""}`}
                      disabled={busy || added}
                      onClick={() => onAdd(e.name, "", e.category)}
                      aria-label={added ? `${e.name}: ya está en la lista` : `Agregar ${e.name} a la lista`}
                    >
                      <span aria-hidden="true">{added ? "✓" : "+"}</span> {e.name}
                    </button>
                  );
                })}
                <NewProductChip
                  category={g}
                  busy={busy}
                  existing={g.entries}
                  onCreate={(name) => createProduct(name, g.id)}
                />
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

// Último chip de cada sección: se abre en un campo para sumar un producto
// nuevo a esa sección.
function NewProductChip({ category, busy, existing, onCreate }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const duplicate = existing.some((e) => e.norm === normalize(name));

  if (!editing) {
    return (
      <button className="catalog-chip new-chip" onClick={() => setEditing(true)}>
        + Nuevo
      </button>
    );
  }

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || duplicate) return;
    if (await onCreate(name)) {
      setName("");
      setEditing(false);
    }
  }

  return (
    <form className="new-chip-form" onSubmit={submit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
        placeholder={`Nuevo en ${category.label}`}
        aria-label={`Producto nuevo en ${category.label}`}
        maxLength={80}
        autoFocus
      />
      <button className="btn primary" type="submit" disabled={busy || !name.trim() || duplicate}>
        {duplicate ? "Ya está" : "Sumar"}
      </button>
      <button className="btn ghost" type="button" onClick={() => setEditing(false)}>
        ×
      </button>
    </form>
  );
}
