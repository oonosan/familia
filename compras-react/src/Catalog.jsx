import { useMemo, useState } from "react";
import { CATEGORIES, allEntries, categoryOf, entryKey, normalize } from "./categories";
import { CategoryArt } from "./ui";

// Pestaña "Productos": todo lo que se puede anotar (catálogo + lo que ya se
// anotó alguna vez), por sección. Tocar un producto lo suma a la lista.
export default function Catalog({ history, pending, busy, onAdd }) {
  const [search, setSearch] = useState("");
  const query = normalize(search);

  const onList = useMemo(() => new Set(pending.map((i) => entryKey(i.name, i.category))), [pending]);

  const groups = useMemo(() => {
    const entries = allEntries(history).filter((e) => !query || e.norm.includes(query));
    return CATEGORIES.map((c) => ({
      ...c,
      entries: entries
        .filter((e) => categoryOf(e.category).id === c.id)
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    })).filter((g) => g.entries.length > 0);
  }, [history, query]);

  return (
    <>
      <div className="card catalog-search">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto…"
          aria-label="Buscar producto"
        />
        <p className="muted small">Tocá un producto para sumarlo a la lista.</p>
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
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
