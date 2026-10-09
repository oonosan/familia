import { useMemo, useState } from "react";
import { deleteTrial, endTrial, setStatus, startTrial } from "./api";
import { ALLERGENS, GROUPS } from "./foods";
import {
  TRIAL_DAYS,
  activeTrials,
  addDays,
  analyzeDays,
  foodInfo,
  formatDate,
  formatShort,
  nextNewFoodDate,
  suggestNewFoods,
  trialDay,
  weekDays,
} from "./logic";
import { FoodChip, FoodPicker, Modal } from "./ui";

export default function NewFoods({ state, run, busy, today, onReaction }) {
  const [picking, setPicking] = useState(false);
  const [startDate, setStartDate] = useState(today);

  const trials = activeTrials(state);
  const waitUntil = nextNewFoodDate(state, today);

  // Sugerencias según lo que viene faltando en los últimos 7 días.
  const suggestions = useMemo(() => {
    const last7 = weekDays(addDays(today, -6));
    const a = analyzeDays(state, last7);
    return suggestNewFoods(
      state,
      {
        groups: a.groups.filter((g) => g.level !== "ok").map((g) => g.group.id),
        nutrients: a.nutrients.filter((n) => n.level !== "ok").map((n) => n.nutrient.id),
      },
      8
    );
  }, [state, today]);

  const known = useMemo(() => {
    const keys = new Set([...Object.keys(state.status), ...state.trials.map((t) => t.food)]);
    return [...keys].map((k) => {
      const trial = state.trials.find((t) => t.food === k);
      return { ...foodInfo(k, trial || {}), status: state.status[k] };
    });
  }, [state]);

  const safe = known.filter((f) => f.status === "seguro");
  const reacted = known.filter((f) => f.status === "reaccion");
  const history = [...state.trials].sort((a, b) => b.start.localeCompare(a.start));

  async function begin(food) {
    const ok = await run(() => startTrial(food, startDate));
    if (ok) setPicking(false);
  }

  function beginSuggested(food) {
    const extra = waitUntil ? `

Ojo: todavía hay otro alimento en prueba (lo ideal es esperar hasta el ${formatShort(waitUntil)}).` : "";
    if (!window.confirm(`¿Empezar hoy la prueba de ${food.name}?${extra}`)) return;
    run(() => startTrial({ key: food.id, name: food.name }, today));
  }

  function finish(trial, result) {
    const name = foodInfo(trial.food, trial).name;
    if (result === "tolerado") {
      if (!window.confirm(`¿Marcar ${name} como introducido (sin reacción)?`)) return;
      run(() => endTrial(trial.id, "tolerado", today));
    } else {
      run(() => endTrial(trial.id, "reaccion", today)).then((ok) => {
        if (ok) onReaction({ date: today, suspects: [trial.food] });
      });
    }
  }

  function remove(trial) {
    if (!window.confirm(`¿Eliminar la prueba de ${foodInfo(trial.food, trial).name}?`)) return;
    run(() => deleteTrial(trial.id));
  }

  function unmark(food) {
    if (!window.confirm(`¿Sacar ${food.name} de la lista de introducidos?`)) return;
    run(() => setStatus(food.key, null));
  }

  return (
    <>
      <section className="card intro-card">
        <h2>Un alimento nuevo cada {TRIAL_DAYS} días</h2>
        <p className="muted">
          Se ofrece el alimento nuevo durante {TRIAL_DAYS} días seguidos, junto con cosas que ya come, y se observa si
          aparece alguna reacción (ronchas, enrojecimiento, hinchazón, vómitos, diarrea, mocos o tos). Si no pasa nada, queda
          introducido y se puede sumar el siguiente.
        </p>

        {trials.length === 0 ? (
          <p className="ready">✅ No hay ningún alimento en prueba: se puede empezar uno nuevo hoy.</p>
        ) : (
          trials.map((t) => {
            const info = foodInfo(t.food, t);
            const day = trialDay(t, today);
            const done = day > TRIAL_DAYS;
            return (
              <div key={t.id} className="trial">
                <div className="trial-head">
                  <span className="trial-name">🧪 {info.name}</span>
                  {info.allergen && <span className="badge badge-allergen">Alérgeno: {ALLERGENS[info.allergen]}</span>}
                </div>
                <div className="trial-days">
                  {Array.from({ length: TRIAL_DAYS }, (_, i) => (
                    <span key={i} className={i < day ? "on" : ""}>
                      Día {i + 1}
                      <small>{formatShort(addDays(t.start, i))}</small>
                    </span>
                  ))}
                </div>
                <p className="muted small">
                  {done
                    ? `Ya pasaron los ${TRIAL_DAYS} días. ¿Tuvo alguna reacción?`
                    : day < 1
                      ? `Empieza el ${formatDate(t.start)}.`
                      : `Día ${day} de ${TRIAL_DAYS}. Si todo va bien, el ${formatShort(addDays(t.start, TRIAL_DAYS))} queda introducido.`}
                </p>
                <div className="form-actions wrap-actions">
                  <button type="button" className="btn primary" disabled={busy} onClick={() => finish(t, "tolerado")}>
                    ✅ Sin reacción
                  </button>
                  <button type="button" className="btn danger" disabled={busy} onClick={() => finish(t, "reaccion")}>
                    ⚠️ Tuvo reacción
                  </button>
                  <button type="button" className="btn-link" disabled={busy} onClick={() => remove(t)}>
                    Eliminar prueba
                  </button>
                </div>
              </div>
            );
          })
        )}

        {waitUntil && (
          <p className="warn-text">
            El próximo alimento nuevo, a partir del <strong>{formatShort(waitUntil)}</strong>.
          </p>
        )}

        <button type="button" className="btn primary full" onClick={() => setPicking(true)}>
          + Empezar a probar un alimento
        </button>
      </section>

      {suggestions.length > 0 && (
        <section className="card">
          <h2>Ideas para sumar variedad</h2>
          <p className="muted small">
            Según lo que faltó en los últimos 7 días. Primero los que no son alérgenos frecuentes; los marcados con ⚑ conviene
            hablarlos con la nutricionista. Tocá uno para empezar a probarlo.
          </p>
          <div className="chip-wrap">
            {suggestions.map((f) => (
              <FoodChip key={f.id} name={f.name} group={f.group} status={null} onClick={() => beginSuggested(f)}>
                {f.allergen && <span className="chip-allergen"> ⚑</span>}
              </FoodChip>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2>Ya introducidos ({safe.length})</h2>
        {GROUPS.map((g) => {
          const foods = safe.filter((f) => f.group === g.id);
          if (foods.length === 0) return null;
          return (
            <div key={g.id} className="group-line">
              <span className="group-line-name">
                {g.emoji} {g.name}
              </span>
              <div className="chip-wrap">
                {foods.map((f) => (
                  <FoodChip key={f.key} name={f.name} group={f.group} status="seguro">
                    <button type="button" className="chip-x" aria-label={`Sacar ${f.name}`} onClick={() => unmark(f)}>
                      ×
                    </button>
                  </FoodChip>
                ))}
              </div>
            </div>
          );
        })}
        {safe.some((f) => !f.group) && (
          <div className="group-line">
            <span className="group-line-name">Otros</span>
            <div className="chip-wrap">
              {safe
                .filter((f) => !f.group)
                .map((f) => (
                  <FoodChip key={f.key} name={f.name} status="seguro" />
                ))}
            </div>
          </div>
        )}
        <p className="muted small">Para sumar algo que ya come (ej. la leche de fórmula), buscalo en el Catálogo.</p>
      </section>

      {reacted.length > 0 && (
        <section className="card">
          <h2>Le dieron reacción</h2>
          <div className="chip-wrap">
            {reacted.map((f) => (
              <FoodChip key={f.key} name={f.name} group={f.group} status="reaccion" />
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="card">
          <h2>Historial de pruebas</h2>
          <div className="table-scroll">
            <table className="simple">
              <thead>
                <tr>
                  <th>Alimento</th>
                  <th>Desde</th>
                  <th>Resultado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {history.map((t) => (
                  <tr key={t.id}>
                    <td>{foodInfo(t.food, t).name}</td>
                    <td>{formatDate(t.start)}</td>
                    <td>
                      {!t.result && <span className="badge badge-prueba">En prueba</span>}
                      {t.result === "tolerado" && <span className="badge badge-seguro">Sin reacción</span>}
                      {t.result === "reaccion" && <span className="badge badge-reaccion">Reacción</span>}
                      {t.end && <span className="muted small"> {formatShort(t.end)}</span>}
                    </td>
                    <td>
                      <button type="button" className="icon-btn" title="Eliminar" onClick={() => remove(t)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {picking && (
        <Modal title="Empezar a probar un alimento" onClose={() => setPicking(false)}>
          <label className="field">
            Primer día
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value || today)} />
          </label>
          {nextNewFoodDate(state, startDate) && (
            <p className="warn-text">
              Ojo: todavía hay un alimento en prueba. Lo ideal es esperar hasta el{" "}
              {formatShort(nextNewFoodDate(state, startDate))}.
            </p>
          )}
          <FoodPicker state={state} onPick={begin} onlyNew />
        </Modal>
      )}
    </>
  );
}
