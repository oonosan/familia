import { useMemo, useState } from "react";
import { addItem, removeItem, setNote, setStatus, startTrial } from "./api";
import { ALLERGENS, FOOD_BY_ID } from "./foods";
import { SLOT_BY_ID, TRIAL_DAYS, activeTrials, addDays, foodInfo, formatShort, nextNewFoodDate, statusOf, weekdayLong } from "./logic";
import { FoodChip, FoodPicker, Modal } from "./ui";

// Accesos rápidos de la fila "Teta / mamadera".
const MILKS = [
  { id: "leche_materna", emoji: "🤱", label: "Teta" },
  { id: "leche_formula", emoji: "🍼", label: "Mamadera de fórmula" },
  { id: "leche_vaca", emoji: "🍼", label: "Mamadera de leche de vaca" },
];

export default function MealEditor({ state, run, busy, date, slot, onClose }) {
  const [note, setNoteText] = useState(state.notes[`${date}|${slot}`] || "");
  const [pending, setPending] = useState(null); // alimento no introducido esperando decisión

  const items = state.items.filter((i) => i.date === date && i.slot === slot);
  const savedNote = state.notes[`${date}|${slot}`] || "";
  const inMeal = useMemo(() => new Set(items.map((i) => i.food)), [items]);

  function pick(food) {
    const status = statusOf(state, food.key);
    if (status === "seguro" || status === "prueba") {
      run(() => addItem(date, slot, food));
    } else {
      setPending({ ...food, status });
    }
  }

  async function confirmPending(mode) {
    const food = pending;
    const ok = await run(async () => {
      if (mode === "trial") await startTrial(food, date);
      if (mode === "safe") await setStatus(food.key, "seguro");
      return addItem(date, slot, food);
    });
    if (ok) setPending(null);
  }

  const title = `${SLOT_BY_ID[slot].name} · ${weekdayLong(date)}`;
  const quickMilk = slot === "mamadera" ? MILKS.filter((m) => !inMeal.has(m.id)) : [];

  return (
    <Modal title={title} onClose={onClose}>
      <div className="meal-items">
        {items.length === 0 ? (
          <p className="muted">Todavía no hay nada cargado.</p>
        ) : (
          <div className="chip-wrap">
            {items.map((i) => {
              const info = foodInfo(i.food, i);
              return (
                <FoodChip key={i.id} name={info.name} group={info.group} status={statusOf(state, i.food)}>
                  <button
                    type="button"
                    className="chip-x"
                    aria-label={`Quitar ${info.name}`}
                    disabled={busy}
                    onClick={() => run(() => removeItem(i.id))}
                  >
                    ×
                  </button>
                </FoodChip>
              );
            })}
          </div>
        )}
      </div>

      <form
        className="note-row"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => setNote(date, slot, note));
        }}
      >
        <input
          type="text"
          placeholder={slot === "mamadera" ? "Nota (ej. teta a la mañana, 2 mamaderas de 200 ml)" : "Nota (ej. comió poco, la preparación)"}
          value={note}
          maxLength={300}
          onChange={(e) => setNoteText(e.target.value)}
        />
        {note.trim() !== savedNote && (
          <button type="submit" className="btn-small" disabled={busy}>
            Guardar nota
          </button>
        )}
      </form>

      {!pending && quickMilk.length > 0 && (
        <div className="quick-milk">
          {quickMilk.map((m) => (
            <button
              key={m.id}
              type="button"
              className="quick-milk-btn"
              disabled={busy}
              onClick={() => pick({ ...FOOD_BY_ID[m.id], key: m.id })}
            >
              <span aria-hidden="true">{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>
      )}

      {pending ? (
        <PendingDecision state={state} date={date} food={pending} busy={busy} onDecide={confirmPending} onCancel={() => setPending(null)} />
      ) : (
        <FoodPicker state={state} onPick={pick} exclude={inMeal} />
      )}
    </Modal>
  );
}

function PendingDecision({ state, date, food, busy, onDecide, onCancel }) {
  const info = foodInfo(food.key, food);
  const trials = activeTrials(state);
  const waitUntil = nextNewFoodDate(state, date);
  const lastTrial = trials[trials.length - 1];

  if (food.status === "reaccion") {
    return (
      <div className="decision warn">
        <p>
          ⚠️ <strong>{info.name}</strong> está marcado como que <strong>le dio reacción</strong>. ¿Lo agregás igual?
        </p>
        <div className="form-actions">
          <button type="button" className="btn danger" disabled={busy} onClick={() => onDecide("plain")}>
            Agregar igual
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="decision">
      <p>
        <strong>{info.name}</strong> todavía no está introducido.
        {info.allergen && (
          <>
            {" "}
            Es un <strong>alérgeno frecuente</strong> ({ALLERGENS[info.allergen]}).
          </>
        )}
      </p>
      {waitUntil && lastTrial && (
        <p className="warn-text">
          Ojo: está probando <strong>{foodInfo(lastTrial.food, lastTrial).name}</strong> desde el {formatShort(lastTrial.start)}.
          Para no mezclar, lo ideal es esperar hasta el {formatShort(waitUntil)}.
        </p>
      )}
      <div className="decision-actions">
        <button type="button" className="btn primary" disabled={busy} onClick={() => onDecide("trial")}>
          🧪 Empezar prueba de {TRIAL_DAYS} días (hasta el {formatShort(addDays(date, TRIAL_DAYS - 1))})
        </button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={() => onDecide("safe")}>
          ✅ Ya lo come: marcar como introducido
        </button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={() => onDecide("plain")}>
          Agregar sin marcar
        </button>
        <button type="button" className="btn-link" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
