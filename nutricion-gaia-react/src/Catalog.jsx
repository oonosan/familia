import { useState } from "react";
import { setStatus, startTrial } from "./api";
import { ALLERGENS, EFFECTS, FOODS, GROUPS, NUTRIENTS, NUTRIENT_BY_ID } from "./foods";
import { nextNewFoodDate, formatShort, statusOf } from "./logic";
import { StatusBadge, normalize } from "./ui";

const STATUS_FILTERS = [
  { id: "", name: "Todos" },
  { id: "seguro", name: "Introducidos" },
  { id: "prueba", name: "En prueba" },
  { id: "nuevo", name: "Sin introducir" },
  { id: "reaccion", name: "Dieron reacción" },
];

export default function Catalog({ state, run, busy, today }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [status, setStatusFilter] = useState("");
  const [effect, setEffect] = useState("");
  const [nutrient, setNutrient] = useState("");
  const [flags, setFlags] = useState({ allergen: false, histamina: false, hideAllergens: false });
  const [open, setOpen] = useState(null);

  const q = normalize(query.trim());
  const foods = FOODS.map((f) => ({ ...f, status: statusOf(state, f.id) })).filter((f) => {
    if (q && !normalize(f.name).includes(q)) return false;
    if (group && f.group !== group) return false;
    if (status === "nuevo" && f.status) return false;
    if (status && status !== "nuevo" && f.status !== status) return false;
    if (effect && f.effect !== effect) return false;
    if (nutrient && !f.nutrients.includes(nutrient)) return false;
    if (flags.allergen && !f.allergen) return false;
    if (flags.hideAllergens && f.allergen) return false;
    if (flags.histamina && !f.histamina) return false;
    return true;
  });

  const anyFilter = q || group || status || effect || nutrient || flags.allergen || flags.histamina || flags.hideAllergens;

  function clearFilters() {
    setQuery("");
    setGroup("");
    setStatusFilter("");
    setEffect("");
    setNutrient("");
    setFlags({ allergen: false, histamina: false, hideAllergens: false });
  }

  async function act(food, action) {
    const key = food.id;
    if (action === "trial") {
      const wait = nextNewFoodDate(state, today);
      if (wait && !window.confirm(`Todavía hay un alimento en prueba (lo ideal es esperar hasta el ${formatShort(wait)}). ¿Empezar igual?`)) return;
      await run(() => startTrial({ key, name: food.name }, today));
    } else {
      await run(() => setStatus(key, action));
    }
  }

  return (
    <>
      <section className="card filters">
        <input
          type="search"
          className="picker-search"
          placeholder="Buscar alimento…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chip-wrap">
          <button type="button" className={`toggle-chip${!group ? " on" : ""}`} onClick={() => setGroup("")}>
            Todos los grupos
          </button>
          {GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`toggle-chip${group === g.id ? " on" : ""}`}
              style={{ "--g": g.color }}
              onClick={() => setGroup(group === g.id ? "" : g.id)}
            >
              {g.emoji} {g.name}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <label>
            Estado
            <select value={status} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_FILTERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fuente de
            <select value={nutrient} onChange={(e) => setNutrient(e.target.value)}>
              <option value="">Cualquier nutriente</option>
              {NUTRIENTS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Efecto
            <select value={effect} onChange={(e) => setEffect(e.target.value)}>
              <option value="">Todos</option>
              <option value="astringente">Astringente</option>
              <option value="laxante">Laxante</option>
              <option value="neutro">Neutro</option>
            </select>
          </label>
        </div>
        <div className="chip-wrap">
          <button
            type="button"
            className={`toggle-chip${flags.allergen ? " on" : ""}`}
            onClick={() => setFlags((f) => ({ ...f, allergen: !f.allergen, hideAllergens: false }))}
          >
            ⚑ Solo alérgenos frecuentes
          </button>
          <button
            type="button"
            className={`toggle-chip${flags.hideAllergens ? " on" : ""}`}
            onClick={() => setFlags((f) => ({ ...f, hideAllergens: !f.hideAllergens, allergen: false }))}
          >
            Sin alérgenos frecuentes
          </button>
          <button
            type="button"
            className={`toggle-chip${flags.histamina ? " on" : ""}`}
            onClick={() => setFlags((f) => ({ ...f, histamina: !f.histamina }))}
          >
            Pueden liberar histamina
          </button>
        </div>
        {nutrient && <p className="muted small">{NUTRIENT_BY_ID[nutrient].name}: {NUTRIENT_BY_ID[nutrient].info}.</p>}
        <p className="muted small">
          {foods.length} {foods.length === 1 ? "alimento" : "alimentos"}
          {anyFilter && (
            <>
              {" · "}
              <button type="button" className="btn-link small" onClick={clearFilters}>
                Limpiar filtros
              </button>
            </>
          )}
        </p>
      </section>

      {GROUPS.map((g) => {
        const list = foods.filter((f) => f.group === g.id);
        if (list.length === 0) return null;
        return (
          <section key={g.id} className="catalog-group" style={{ "--g": g.color }}>
            <h2>
              {g.emoji} {g.name}
            </h2>
            <ul className="food-list">
              {list.map((f) => (
                <FoodRow key={f.id} food={f} open={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)} busy={busy} onAct={(a) => act(f, a)} />
              ))}
            </ul>
          </section>
        );
      })}

      <details className="card glossary">
        <summary>¿Para qué sirve cada nutriente?</summary>
        <dl>
          {NUTRIENTS.map((n) => (
            <div key={n.id}>
              <dt>{n.name}</dt>
              <dd>{n.info}</dd>
            </div>
          ))}
          <div>
            <dt>Astringente / laxante</dt>
            <dd>
              {EFFECTS.astringente.info} / {EFFECTS.laxante.info.toLowerCase()}. Depende mucho de la preparación y de cada
              chico.
            </dd>
          </div>
          <div>
            <dt>Pueden liberar histamina</dt>
            <dd>Pueden dar ronchas o enrojecimiento (sobre todo alrededor de la boca) sin que sea una alergia.</dd>
          </div>
        </dl>
      </details>
    </>
  );
}

function FoodRow({ food, open, onToggle, busy, onAct }) {
  return (
    <li className={`food-row${open ? " open" : ""}`}>
      <button type="button" className="food-row-main" onClick={onToggle} aria-expanded={open}>
        <span className="food-row-name">{food.name}</span>
        <StatusBadge status={food.status} />
      </button>
      <div className="food-row-tags">
        {food.effect !== "neutro" && (
          <span className={`badge effect-${food.effect}`} title={EFFECTS[food.effect].info}>
            {EFFECTS[food.effect].name}
          </span>
        )}
        {food.allergen && <span className="badge badge-allergen">⚑ {ALLERGENS[food.allergen]}</span>}
        {food.histamina && <span className="badge badge-hist">Histamina</span>}
        {food.nutrients.map((n) => (
          <span key={n} className="nutrient-tag" title={NUTRIENT_BY_ID[n].info}>
            {NUTRIENT_BY_ID[n].name}
          </span>
        ))}
      </div>
      {food.note && <p className="food-note">{food.note}</p>}
      {open && (
        <div className="food-actions">
          {food.status !== "seguro" && food.status !== "prueba" && (
            <button type="button" className="btn-small" disabled={busy} onClick={() => onAct("seguro")}>
              ✅ Ya lo come
            </button>
          )}
          {!food.status && (
            <button type="button" className="btn-small" disabled={busy} onClick={() => onAct("trial")}>
              🧪 Empezar prueba hoy
            </button>
          )}
          {food.status !== "reaccion" && food.status !== "prueba" && (
            <button type="button" className="btn-small" disabled={busy} onClick={() => onAct("reaccion")}>
              ⚠️ Le dio reacción
            </button>
          )}
          {(food.status === "seguro" || food.status === "reaccion") && (
            <button type="button" className="btn-small" disabled={busy} onClick={() => onAct(null)}>
              Quitar marca
            </button>
          )}
          {food.status === "prueba" && <span className="muted small">En prueba: se cierra desde «Alimentos nuevos».</span>}
        </div>
      )}
    </li>
  );
}
