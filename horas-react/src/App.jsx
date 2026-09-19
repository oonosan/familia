import { useCallback, useEffect, useMemo, useState } from "react";
import { WORKER_NAME, HOURLY_RATE } from "./config";
import { fetchState, checkIn, checkOut, togglePaid } from "./api";

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

export default function App() {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState(null);

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
      .sort((a, b) => (a.date + a.in).localeCompare(b.date + b.in));
  }, [state, currentMonth]);

  const monthTotal = rows.reduce((sum, r) => sum + r.amount, 0);

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

      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Ingreso</th>
            <th>Salida</th>
            <th>Horas</th>
            <th>Total</th>
            <th>Pagado</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="empty">
                Sin registros este mes
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.date + r.in}>
              <td>{formatDate(r.date)}</td>
              <td>{r.in}</td>
              <td>{r.out}</td>
              <td>{r.hours.toFixed(2)}</td>
              <td>{currency.format(r.amount)}</td>
              <td className="paid-cell">
                <input
                  type="checkbox"
                  checked={r.paid}
                  onChange={() => run(() => togglePaid(r.date, r.in))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
