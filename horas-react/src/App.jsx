import { useCallback, useEffect, useMemo, useState } from "react";
import { WORKER_NAME, HOURLY_RATE } from "./config";
import TimePicker from "./TimePicker";
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

function pad(n) {
  return String(n).padStart(2, "0");
}

function monthKey(dateStr) {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function shiftMonth(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
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

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const emptyForm = { id: null, date: "", in: "", out: "", absence: false, error: null };

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
    keys.add(monthKey(todayISO()));
    return [...keys].sort().reverse();
  }, [state]);

  const currentMonth = month || monthKey(todayISO());
  const newestMonth = months[0];
  const oldestMonth = months[months.length - 1];

  const rows = useMemo(() => {
    if (!state) return [];
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

  const history = useMemo(() => {
    if (!state) return [];
    const byMonth = new Map();
    for (const r of state.records) {
      const key = monthKey(r.date);
      const entry = byMonth.get(key) || { key, days: 0, absences: 0, hours: 0, total: 0, pending: 0 };
      if (r.absence) {
        entry.absences += 1;
      } else {
        entry.days += 1;
        entry.hours += r.hours;
        entry.total += r.amount;
        if (!r.paid) entry.pending += r.amount;
      }
      byMonth.set(key, entry);
    }
    return [...byMonth.values()].sort((a, b) => b.key.localeCompare(a.key));
  }, [state]);

  const historyTotal = history.reduce((sum, h) => sum + h.total, 0);

  async function run(action) {
    setBusy(true);
    setError(null);
    try {
      const data = await action();
      setState(data);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function openAddForm() {
    setForm({ ...emptyForm, date: todayISO() });
  }

  function openEditForm(r) {
    setForm({ ...emptyForm, id: r.id, date: r.date, in: r.in, out: r.out });
  }

  async function submitForm(e) {
    e.preventDefault();
    const { id, date, in: inTime, out, absence } = form;
    if (!absence && (!inTime || !out)) {
      setForm((f) => ({ ...f, error: "Elegí la hora de ingreso y de salida." }));
      return;
    }
    if (!absence && out <= inTime) {
      setForm((f) => ({ ...f, error: "La salida tiene que ser después del ingreso." }));
      return;
    }
    const ok = await run(() => {
      if (absence) return addAbsence(date);
      return id ? editRecord(id, date, inTime, out) : addManualRecord(date, inTime, out);
    });
    if (ok) {
      setMonth(monthKey(date));
      setForm(null);
    }
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
        <button className="btn checkin" disabled={busy || !!active} onClick={() => run(checkIn)}>
          Check in
        </button>
        <button className="btn checkout" disabled={busy || !active} onClick={() => run(checkOut)}>
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

      <div className="month-nav">
        <button
          type="button"
          className="month-arrow"
          aria-label="Mes anterior"
          disabled={currentMonth <= oldestMonth}
          onClick={() => setMonth(shiftMonth(currentMonth, -1))}
        >
          ‹
        </button>
        <span className="month-label">{monthLabel(currentMonth)}</span>
        <button
          type="button"
          className="month-arrow"
          aria-label="Mes siguiente"
          disabled={currentMonth >= newestMonth}
          onClick={() => setMonth(shiftMonth(currentMonth, 1))}
        >
          ›
        </button>
      </div>
      <p className="month-total">Total del mes: {currency.format(monthTotal)}</p>

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
                onChange={(e) => setForm((f) => ({ ...f, absence: e.target.checked, error: null }))}
              />
              Faltó (no trabajó ese día)
            </label>
          )}

          {!form.absence && (
            <div className="time-row">
              <TimePicker
                label="Ingreso"
                value={form.in}
                onChange={(v) => setForm((f) => ({ ...f, in: v, error: null }))}
              />
              <TimePicker
                label="Salida"
                value={form.out}
                onChange={(v) => setForm((f) => ({ ...f, out: v, error: null }))}
              />
            </div>
          )}

          {form.error && <p className="form-error">{form.error}</p>}

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

      <div className="table-scroll">
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
                  <input type="checkbox" checked={r.paid} onChange={() => run(() => togglePaid(r.id))} />
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
      </div>

      <section className="history">
        <h2>Historial mensual</h2>
        {history.length === 0 ? (
          <p className="empty">Todavía no hay registros.</p>
        ) : (
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Días</th>
                <th>Horas</th>
                <th>Total</th>
                <th>Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr
                  key={h.key}
                  className={`history-row${h.key === currentMonth ? " current" : ""}`}
                  onClick={() => setMonth(h.key)}
                >
                  <td>{monthLabel(h.key)}</td>
                  <td>
                    {h.days}
                    {h.absences > 0 && (
                      <span className="history-absences">
                        {" "}
                        ({h.absences} {h.absences === 1 ? "falta" : "faltas"})
                      </span>
                    )}
                  </td>
                  <td>{h.hours.toFixed(2)}</td>
                  <td>{currency.format(h.total)}</td>
                  <td className={h.pending > 0 ? "pending" : ""}>
                    {h.pending > 0 ? currency.format(h.pending) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total</td>
                <td colSpan={2}>{currency.format(historyTotal)}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        )}
      </section>
    </main>
  );
}
