import { useCallback, useEffect, useMemo, useState } from "react";
import { WORKER_NAME, HOURLY_RATE } from "./config";
import {
  fetchState,
  checkIn,
  checkOut,
  togglePaid,
  addManualRecord,
  editRecord,
  addAbsence,
  deleteRecord,
} from "./api";

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

const POLL_MS = 20000;

function monthKey(dateStr) {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function todayKey() {
  return monthKey(new Date().toISOString().slice(0, 10));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = { id: null, date: "", in: "", out: "", absence: false };

export default function App() {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState(null);
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchState();
      setState(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const months = useMemo(() => {
    if (!state) return [];
    const keys = new Set(state.records.map((r) => monthKey(r.date)));
    keys.add(todayKey());
    return [...keys].sort().reverse();
  }, [state]);

  const currentMonth = month && months.includes(month) ? month : months[0];

  const rows = useMemo(() => {
    if (!state || !currentMonth) return [];
    return state.records
      .filter((r) => monthKey(r.date) === currentMonth)
      .sort((a, b) => (b.date + (b.in || "")).localeCompare(a.date + (a.in || "")));
  }, [state, currentMonth]);

  const monthTotal = rows.reduce((sum, r) => sum + r.amount, 0);

  const unpaid = useMemo(() => {
    if (!state) return { count: 0, total: 0 };
    const pending = state.records.filter((r) => !r.absence && !r.paid);
    return { count: pending.length, total: pending.reduce((sum, r) => sum + r.amount, 0) };
  }, [state]);

  async function run(action) {
    setBusy(true);
    setError(null);
    try {
      const data = await action();
      setState(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function openAddForm() {
    setForm({ ...emptyForm, date: todayISO() });
  }

  function openEditForm(r) {
    setForm({ id: r.id, date: r.date, in: r.in, out: r.out, absence: false });
  }

  async function submitForm(e) {
    e.preventDefault();
    const { id, date, in: inTime, out, absence } = form;
    await run(() => {
      if (absence) return addAbsence(date);
      return id ? editRecord(id, date, inTime, out) : addManualRecord(date, inTime, out);
    });
    setForm(null);
  }

  function handleDelete(r) {
    const label = r.absence ? `la falta del ${formatDate(r.date)}` : `el registro del ${formatDate(r.date)}`;
    if (!window.confirm(`¿Eliminar ${label}?`)) return;
    run(() => deleteRecord(r.id));
  }

  if (!state) {
    return (
      <main className="wrap">
        <p>Cargando...</p>
        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  const active = state.activeCheckIn;

  return (
    <main className="wrap">
      <h1>{WORKER_NAME}</h1>
      <p className="rate">Hora: {currency.format(HOURLY_RATE)}</p>

      {error && <p className="error">{error}</p>}

      <div className="checkbar">
        <button
          className="btn checkin"
          disabled={busy || !!active}
          onClick={() => run(checkIn)}
        >
          Check in
        </button>
        <button
          className="btn checkout"
          disabled={busy || !active}
          onClick={() => run(checkOut)}
        >
          Check out
        </button>
      </div>

      {active && (
        <p className="active-note">
          Ingresó el {formatDate(active.date)} a las {active.time}
        </p>
      )}

      {unpaid.count > 1 && (
        <p className="unpaid-note">
          Adeudado ({unpaid.count} registros sin pagar): {currency.format(unpaid.total)}
        </p>
      )}

      <div className="month-row">
        <select value={currentMonth || ""} onChange={(e) => setMonth(e.target.value)}>
          {months.map((k) => (
            <option key={k} value={k}>
              {monthLabel(k)}
            </option>
          ))}
        </select>
        <span className="month-total">Total del mes: {currency.format(monthTotal)}</span>
      </div>

      <div className="actions-row">
        <button type="button" className="btn-link" onClick={openAddForm}>
          + Agregar registro
        </button>
      </div>

      {form && (
        <form className="record-form" onSubmit={submitForm}>
          <h2>{form.id ? "Editar registro" : "Agregar registro"}</h2>
          <label>
            Fecha
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </label>

          {!form.id && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.absence}
                onChange={(e) => setForm((f) => ({ ...f, absence: e.target.checked }))}
              />
              Faltó (no trabajó ese día)
            </label>
          )}

          {!form.absence && (
            <>
              <label>
                Ingreso
                <input
                  type="time"
                  required
                  value={form.in}
                  onChange={(e) => setForm((f) => ({ ...f, in: e.target.value }))}
                />
              </label>
              <label>
                Salida
                <input
                  type="time"
                  required
                  value={form.out}
                  onChange={(e) => setForm((f) => ({ ...f, out: e.target.value }))}
                />
              </label>
            </>
          )}

          <div className="form-actions">
            <button type="submit" className="btn checkin" disabled={busy}>
              Guardar
            </button>
            <button type="button" className="btn-secondary" onClick={() => setForm(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Ingreso</th>
            <th>Salida</th>
            <th>Horas</th>
            <th>Total</th>
            <th>Pagado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="empty">
                Sin registros este mes
              </td>
            </tr>
          )}
          {rows.map((r) =>
            r.absence ? (
              <tr key={r.id} className="absence-row">
                <td>{formatDate(r.date)}</td>
                <td colSpan={3} className="absence-label">
                  Faltó
                </td>
                <td>—</td>
                <td className="paid-cell">—</td>
                <td className="actions-cell">
                  <button type="button" className="icon-btn" title="Eliminar" onClick={() => handleDelete(r)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ) : (
              <tr key={r.id}>
                <td>{formatDate(r.date)}</td>
                <td>{r.in}</td>
                <td>{r.out}</td>
                <td>{r.hours.toFixed(2)}</td>
                <td>{currency.format(r.amount)}</td>
                <td className="paid-cell">
                  <input
                    type="checkbox"
                    checked={r.paid}
                    onChange={() => run(() => togglePaid(r.id))}
                  />
                </td>
                <td className="actions-cell">
                  <button type="button" className="icon-btn" title="Editar" onClick={() => openEditForm(r)}>
                    ✏️
                  </button>
                  <button type="button" className="icon-btn" title="Eliminar" onClick={() => handleDelete(r)}>
                    🗑️
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </main>
  );
}
