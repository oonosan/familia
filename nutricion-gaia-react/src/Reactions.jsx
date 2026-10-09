import { useEffect, useMemo, useState } from "react";
import { addReaction, deleteReaction } from "./api";
import { addDays, eatenAround, foodInfo, formatDate, formatShort, statusOf } from "./logic";
import { FoodChip, FoodPicker, StatusBadge } from "./ui";

const SYMPTOMS = [
  "Ronchas / urticaria",
  "Enrojecimiento",
  "Picazón",
  "Hinchazón de labios u ojos",
  "Eccema / piel áspera",
  "Vómitos",
  "Diarrea",
  "Dolor de panza",
  "Mocos / estornudos",
  "Tos o silbido al respirar",
];

const DAYS_BEFORE = 2; // días previos a revisar en el calendario

export default function Reactions({ state, run, busy, today, draft, clearDraft }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (draft) {
      setForm({ date: draft.date, symptoms: [], other: "", note: "", suspects: new Set(draft.suspects), extra: [] });
      clearDraft();
    }
  }, [draft, clearDraft]);

  const reactions = [...state.reactions].sort((a, b) => b.date.localeCompare(a.date));

  // Alimentos que aparecen en más de una reacción.
  const repeated = useMemo(() => {
    const count = new Map();
    for (const r of state.reactions) for (const k of r.suspects) count.set(k, (count.get(k) || 0) + 1);
    return [...count.entries()]
      .filter(([, n]) => n > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([key, n]) => ({ ...foodInfo(key), n }));
  }, [state.reactions]);

  function openForm() {
    setForm({ date: today, symptoms: [], other: "", note: "", suspects: new Set(), extra: [] });
  }

  async function submit(e) {
    e.preventDefault();
    const symptoms = [...form.symptoms, form.other.trim()].filter(Boolean).join(", ");
    if (!symptoms) {
      setForm((f) => ({ ...f, error: "Contá qué síntomas tuvo." }));
      return;
    }
    const ok = await run(() => addReaction(form.date, symptoms, [...form.suspects], form.note));
    if (ok) setForm(null);
  }

  function remove(r) {
    if (!window.confirm(`¿Eliminar la reacción del ${formatDate(r.date)}?`)) return;
    run(() => deleteReaction(r.id));
  }

  return (
    <>
      <p className="urgent">
        🚑 Si le cuesta respirar, se le hinchan los labios o la lengua, vomita mucho o está decaída: es una urgencia. Llamar al{" "}
        <a href="tel:107">107</a> o ir a la guardia.
      </p>

      {form ? (
        <ReactionForm state={state} form={form} setForm={setForm} busy={busy} onSubmit={submit} onCancel={() => setForm(null)} />
      ) : (
        <button type="button" className="btn danger full" onClick={openForm}>
          + Registrar una reacción
        </button>
      )}

      {repeated.length > 0 && (
        <section className="card">
          <h2>Se repiten en varias reacciones</h2>
          <div className="chip-wrap">
            {repeated.map((f) => (
              <FoodChip key={f.key} name={`${f.name} (${f.n})`} group={f.group} status={statusOf(state, f.key)} />
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2>Historial de reacciones</h2>
        {reactions.length === 0 ? (
          <p className="muted">Todavía no hay reacciones registradas. Pueden cargar la de la semana pasada con la fecha en que pasó.</p>
        ) : (
          <ul className="reaction-list">
            {reactions.map((r) => (
              <li key={r.id}>
                <div className="reaction-head">
                  <strong>{formatDate(r.date)}</strong>
                  <button type="button" className="icon-btn" title="Eliminar" onClick={() => remove(r)}>
                    🗑️
                  </button>
                </div>
                <p>{r.symptoms}</p>
                {r.suspects.length > 0 && (
                  <div className="chip-wrap">
                    <span className="muted small">Sospechosos:</span>
                    {r.suspects.map((k) => {
                      const info = foodInfo(k);
                      return <FoodChip key={k} name={info.name} group={info.group} status={statusOf(state, k)} />;
                    })}
                  </div>
                )}
                {r.note && <p className="muted small">{r.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ReactionForm({ state, form, setForm, busy, onSubmit, onCancel }) {
  const [addingOther, setAddingOther] = useState(false);
  const eaten = eatenAround(state, form.date, DAYS_BEFORE);
  const eatenKeys = new Set(eaten.map((e) => e.key));
  const extra = [...form.suspects].filter((k) => !eatenKeys.has(k)).map((k) => ({ ...foodInfo(k, form.extra.find((x) => x.key === k)), status: statusOf(state, k) }));

  function toggleSymptom(s) {
    setForm((f) => ({
      ...f,
      error: null,
      symptoms: f.symptoms.includes(s) ? f.symptoms.filter((x) => x !== s) : [...f.symptoms, s],
    }));
  }

  function toggleSuspect(key) {
    setForm((f) => {
      const suspects = new Set(f.suspects);
      if (suspects.has(key)) suspects.delete(key);
      else suspects.add(key);
      return { ...f, suspects };
    });
  }

  // No introducidos o en prueba primero: son los más sospechosos.
  const ordered = [...eaten].sort((a, b) => (a.status === "seguro") - (b.status === "seguro"));

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h2>Registrar reacción</h2>
      <label className="field">
        Fecha
        <input type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
      </label>

      <div className="field">
        Síntomas
        <div className="chip-wrap">
          {SYMPTOMS.map((s) => (
            <button
              key={s}
              type="button"
              className={`toggle-chip${form.symptoms.includes(s) ? " on" : ""}`}
              onClick={() => toggleSymptom(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Otro / detalle (ej. en todo el cuerpo, empezó 2 hs después de almorzar)"
          value={form.other}
          maxLength={300}
          onChange={(e) => setForm((f) => ({ ...f, other: e.target.value, error: null }))}
        />
      </div>

      <div className="field">
        Alimentos sospechosos
        {eaten.length === 0 ? (
          <span className="small">No hay comidas cargadas en el calendario entre el {formatShort(addDays(form.date, -DAYS_BEFORE))} y ese día.</span>
        ) : (
          <span className="small">Lo que comió ese día y los {DAYS_BEFORE} anteriores, según el calendario:</span>
        )}
        <ul className="suspect-list">
          {ordered.map((e) => (
            <li key={e.key}>
              <label>
                <input type="checkbox" checked={form.suspects.has(e.key)} onChange={() => toggleSuspect(e.key)} />
                <span>{e.name}</span>
                <span className="muted small">{e.dates.map(formatShort).join(", ")}</span>
                {e.status !== "seguro" && <StatusBadge status={e.status} />}
              </label>
            </li>
          ))}
          {extra.map((e) => (
            <li key={e.key}>
              <label>
                <input type="checkbox" checked onChange={() => toggleSuspect(e.key)} />
                <span>{e.name}</span>
                <StatusBadge status={e.status} />
              </label>
            </li>
          ))}
        </ul>
        {addingOther ? (
          <div className="nested-picker">
            <FoodPicker
              state={state}
              exclude={form.suspects}
              onPick={(food) => {
                setForm((f) => ({ ...f, suspects: new Set([...f.suspects, food.key]), extra: [...f.extra, food] }));
                setAddingOther(false);
              }}
            />
            <button type="button" className="btn-link" onClick={() => setAddingOther(false)}>
              Listo
            </button>
          </div>
        ) : (
          <button type="button" className="btn-link" onClick={() => setAddingOther(true)}>
            + Agregar otro sospechoso
          </button>
        )}
      </div>

      <label className="field">
        Notas
        <textarea
          rows={3}
          maxLength={1000}
          placeholder="Qué hicieron, si la vio un médico, medicación, cuánto duró…"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
        />
      </label>

      {form.error && <p className="form-error">{form.error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn danger" disabled={busy}>
          Guardar
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
