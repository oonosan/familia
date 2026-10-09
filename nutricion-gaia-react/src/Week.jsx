import { useEffect, useMemo, useRef, useState } from "react";
import { GROUPS } from "./foods";
import {
  SLOTS,
  TRIAL_DAYS,
  addDays,
  analyzeDays,
  foodInfo,
  groupsOfDay,
  safeFoodsWith,
  statusOf,
  suggestNewFoods,
  weekDays,
  weekLabel,
  weekStart,
  weekdayShort,
  formatShort,
} from "./logic";
import { FoodChip } from "./ui";
import MealEditor from "./MealEditor";

export default function Week({ state, run, busy, today }) {
  const [start, setStart] = useState(() => weekStart(today));
  const [editing, setEditing] = useState(null); // { date, slot }
  const days = weekDays(start);
  const scrollRef = useRef(null);

  // En el celu la grilla scrollea de costado: arrancar mostrando hoy.
  useEffect(() => {
    const el = scrollRef.current?.querySelector(".is-today");
    if (el) scrollRef.current.scrollLeft = Math.max(0, el.offsetLeft - 90);
  }, [start]);

  const cells = useMemo(() => {
    const map = new Map();
    for (const item of state.items) {
      const k = `${item.date}|${item.slot}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(item);
    }
    return map;
  }, [state.items]);

  const analysis = useMemo(() => analyzeDays(state, days), [state, days.join()]);

  return (
    <>
      <div className="week-nav">
        <button type="button" className="round-btn" aria-label="Semana anterior" onClick={() => setStart(addDays(start, -7))}>
          ‹
        </button>
        <div className="week-label">
          <strong>Semana del {weekLabel(start)}</strong>
          {start !== weekStart(today) && (
            <button type="button" className="btn-link small" onClick={() => setStart(weekStart(today))}>
              Ir a esta semana
            </button>
          )}
        </div>
        <button type="button" className="round-btn" aria-label="Semana siguiente" onClick={() => setStart(addDays(start, 7))}>
          ›
        </button>
      </div>

      <div className="week-scroll" ref={scrollRef}>
        <table className="week-grid">
          <thead>
            <tr>
              <th className="slot-col" />
              {days.map((d) => {
                const covered = groupsOfDay(state, d);
                return (
                  <th key={d} className={d === today ? "is-today" : ""}>
                    <div className="day-name">
                      {weekdayShort(d)} <span>{formatShort(d)}</span>
                    </div>
                    <div className="day-dots" title="Grupos de alimentos del día">
                      {GROUPS.map((g) => (
                        <i
                          key={g.id}
                          className={covered.has(g.id) ? "on" : ""}
                          style={{ "--g": g.color }}
                          title={`${g.name}${covered.has(g.id) ? "" : " (no comió)"}`}
                        />
                      ))}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot) => (
              <tr key={slot.id}>
                <th className="slot-col">{slot.name}</th>
                {days.map((d) => {
                  const items = cells.get(`${d}|${slot.id}`) || [];
                  const note = state.notes[`${d}|${slot.id}`];
                  return (
                    <td key={d} className={d === today ? "is-today" : ""}>
                      <button
                        type="button"
                        className="cell"
                        onClick={() => setEditing({ date: d, slot: slot.id })}
                        aria-label={`${slot.name} del ${formatShort(d)}`}
                      >
                        {items.map((i) => {
                          const info = foodInfo(i.food, i);
                          return <FoodChip key={i.id} name={info.name} group={info.group} status={statusOf(state, i.food)} />;
                        })}
                        {note && <span className="cell-note">{note}</span>}
                        {items.length === 0 && !note && <span className="cell-add">+</span>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="legend">
        <FoodChip name="Introducido" status="seguro" /> <FoodChip name="En prueba" status="prueba" />{" "}
        <FoodChip name="No introducido" status={null} /> <FoodChip name="Dio reacción" status="reaccion" />
      </p>

      <WeekAnalysis state={state} analysis={analysis} />

      {editing && (
        <MealEditor
          state={state}
          run={run}
          busy={busy}
          date={editing.date}
          slot={editing.slot}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function WeekAnalysis({ state, analysis }) {
  const { recordedDays, groups, nutrients, distinct } = analysis;

  if (recordedDays === 0) {
    return (
      <section className="card">
        <h2>¿Qué le puede estar faltando?</h2>
        <p className="muted">Todavía no hay comidas registradas esta semana. Tocá un casillero del calendario para cargar lo que comió.</p>
      </section>
    );
  }

  const missingGroups = groups.filter((g) => g.level !== "ok").map((g) => g.group.id);
  const missingNutrients = nutrients.filter((n) => n.level !== "ok").map((n) => n.nutrient.id);
  const toIntroduce = suggestNewFoods(state, { groups: missingGroups, nutrients: missingNutrients }, 6);

  return (
    <section className="card">
      <h2>¿Qué le puede estar faltando?</h2>
      <p className="muted">
        {recordedDays} {recordedDays === 1 ? "día registrado" : "días registrados"} · {distinct.length} alimentos distintos
      </p>

      <h3>Grupos de alimentos</h3>
      <ul className="meter-list">
        {groups.map(({ group, days, level }) => {
          const safe = level !== "ok" ? safeFoodsWith(state, { group: group.id }) : [];
          return (
            <li key={group.id} className={`level-${level}`}>
              <div className="meter-row">
                <span className="meter-name">
                  {group.emoji} {group.name}
                </span>
                <span className="meter-bar" style={{ "--g": group.color }}>
                  <i style={{ width: `${(days / recordedDays) * 100}%` }} />
                </span>
                <span className="meter-count">
                  {days}/{recordedDays}
                </span>
              </div>
              {level !== "ok" && (
                <p className="meter-hint">
                  {level === "falta" ? "No comió en la semana." : "Apareció pocos días."}{" "}
                  {safe.length > 0
                    ? `Ya come: ${safe.map((f) => f.name).join(", ")}.`
                    : "Todavía no introdujo ninguno de este grupo."}
                  {group.id === "lacteos" && " Si toma teta o mamadera, cargalo en la fila Teta / mamadera."}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <h3>Nutrientes clave</h3>
      <ul className="nutrient-list">
        {nutrients.map(({ nutrient, days, foods, level }) => {
          const others =
            level !== "ok" ? safeFoodsWith(state, { nutrient: nutrient.id }).filter((f) => !foods.includes(f.name)) : [];
          return (
            <li key={nutrient.id} className={`level-${level}`}>
              <div>
                <strong>
                  {level === "ok" ? "✅" : level === "poco" ? "🟡" : "🔴"} {nutrient.name}
                </strong>{" "}
                <span className="muted">
                  {days === 0 ? "ningún día" : `${days} ${days === 1 ? "día" : "días"}`}
                </span>
              </div>
              <div className="muted small">
                {foods.length > 0 ? `De: ${foods.join(", ")}` : nutrient.info}
              </div>
              {others.length > 0 && <div className="small">Ya come: {others.map((f) => f.name).join(", ")}</div>}
            </li>
          );
        })}
      </ul>

      {toIntroduce.length > 0 && (missingGroups.length > 0 || missingNutrients.length > 0) && (
        <>
          <h3>Para ir sumando (de a uno, cada {TRIAL_DAYS} días)</h3>
          <div className="chip-wrap">
            {toIntroduce.map((f) => (
              <FoodChip key={f.id} name={f.name} group={f.group} status={null} />
            ))}
          </div>
        </>
      )}

      <p className="disclaimer">
        Es orientativo, calculado con lo que cargaron en el calendario: no reemplaza lo que indique la nutricionista. La
        vitamina D viene sobre todo del sol y no se cuenta acá.
      </p>
    </section>
  );
}
