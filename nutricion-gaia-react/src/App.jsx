import { useCallback, useEffect, useState } from "react";
import { fetchState } from "./api";
import { TRIAL_DAYS, activeTrials, foodInfo, formatShort, todayISO, trialDay } from "./logic";
import Week from "./Week";
import NewFoods from "./NewFoods";
import Reactions from "./Reactions";
import Catalog from "./Catalog";

const POLL_MS = 20000;

const TABS = [
  { id: "semana", label: "Semana", emoji: "📅" },
  { id: "nuevos", label: "Alimentos nuevos", emoji: "🧪" },
  { id: "reacciones", label: "Reacciones", emoji: "⚠️" },
  { id: "catalogo", label: "Catálogo", emoji: "📖" },
];

function tabFromHash() {
  const id = window.location.hash.slice(1);
  return TABS.some((t) => t.id === id) ? id : "semana";
}

export default function App() {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(tabFromHash);
  const [reactionDraft, setReactionDraft] = useState(null);
  const today = todayISO();

  const load = useCallback(async () => {
    try {
      setState(await fetchState());
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

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function goTo(id) {
    window.location.hash = id;
    setTab(id);
    window.scrollTo({ top: 0 });
  }

  // Corre una acción contra el servidor y reemplaza el estado con la
  // respuesta. Devuelve true si salió bien.
  async function run(action) {
    setBusy(true);
    setError(null);
    try {
      setState(await action());
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function reportReaction(draft) {
    setReactionDraft(draft);
    goTo("reacciones");
  }

  if (!state) {
    return (
      <main className="wrap">
        <p>Cargando…</p>
        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  const trials = activeTrials(state);
  const shared = { state, run, busy, today };

  return (
    <>
      <header className="top">
        <div className="top-inner">
          <a className="back" href="/">
            ← Familia
          </a>
          <h1>🍓 Nutrición de Gaia</h1>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab${tab === t.id ? " active" : ""}`}
              onClick={() => goTo(t.id)}
            >
              <span aria-hidden="true">{t.emoji}</span> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="wrap">
        {error && <p className="error">{error}</p>}

        {trials.length > 0 && tab !== "nuevos" && (
          <button type="button" className="trial-banner" onClick={() => goTo("nuevos")}>
            {trials.map((t) => {
              const day = trialDay(t, today);
              return (
                <span key={t.id}>
                  🧪 Probando <strong>{foodInfo(t.food, t).name}</strong>{" "}
                  {day <= TRIAL_DAYS ? `· día ${day} de ${TRIAL_DAYS}` : `desde el ${formatShort(t.start)} · ¿cómo le fue?`}
                </span>
              );
            })}
          </button>
        )}

        {tab === "semana" && <Week {...shared} />}
        {tab === "nuevos" && <NewFoods {...shared} onReaction={reportReaction} />}
        {tab === "reacciones" && (
          <Reactions {...shared} draft={reactionDraft} clearDraft={() => setReactionDraft(null)} />
        )}
        {tab === "catalogo" && <Catalog {...shared} />}
      </main>
    </>
  );
}
