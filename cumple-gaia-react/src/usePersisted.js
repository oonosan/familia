import { useEffect, useRef, useState } from "react";
import { seedInvitados, seedGastos, seedConfig } from "./seedData";

const LS = "cumple-gaia-v1";
const API = "/.netlify/functions/gaia-data";

function loadInicial() {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) {
      const d = JSON.parse(raw);
      return {
        invitados: d.invitados || [],
        gastos: d.gastos || [],
        config: Object.assign({}, seedConfig, d.config || {}),
      };
    }
  } catch (e) {}
  // Primera vez en este navegador: arrancamos con los datos reales de la fiesta.
  return { invitados: seedInvitados, gastos: seedGastos, config: { ...seedConfig } };
}

// Estado de invitados/gastos/config. Se guarda en localStorage (cache
// instantánea del navegador, para que la app arranque sin esperar red) y en
// Netlify Blobs (fuente compartida entre todos los que entran con el PIN,
// vía netlify/functions/gaia-data.mjs) — el último que guarda, gana.
export function usePersisted() {
  const [state, setState] = useState(loadInicial);
  const stateRef = useRef(state);
  const hydrated = useRef(false);

  useEffect(() => {
    stateRef.current = state;
    try {
      localStorage.setItem(LS, JSON.stringify(state));
    } catch (e) {}
    if (!hydrated.current) return; // todavía no trajimos lo compartido, no lo pisemos
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    }).catch(() => {});
  }, [state]);

  // Al montar: trae lo último guardado por cualquiera y lo adopta. Si todavía
  // no hay nada guardado en el server, publica lo local/seed como punto de partida.
  useEffect(() => {
    fetch(API)
      .then((r) => (r.ok ? r.json() : null))
      .then((remote) => {
        const tieneDatos =
          remote && ((remote.invitados && remote.invitados.length) || (remote.gastos && remote.gastos.length));
        if (tieneDatos) {
          setState({
            invitados: remote.invitados || [],
            gastos: remote.gastos || [],
            config: Object.assign({}, seedConfig, remote.config || {}),
          });
        } else {
          fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stateRef.current),
          }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => {
        hydrated.current = true;
      });
  }, []);

  function addInvitado(data) {
    setState((s) => ({ ...s, invitados: [...s.invitados, data] }));
  }
  function patchInvitado(id, cambios) {
    setState((s) => ({
      ...s,
      invitados: s.invitados.map((i) => (i.id === id ? { ...i, ...cambios } : i)),
    }));
  }
  function borrarInvitado(id) {
    setState((s) => ({ ...s, invitados: s.invitados.filter((i) => i.id !== id) }));
  }

  function addGasto(data) {
    setState((s) => ({ ...s, gastos: [...s.gastos, data] }));
  }
  function patchGasto(id, cambios) {
    setState((s) => ({
      ...s,
      gastos: s.gastos.map((g) => (g.id === id ? { ...g, ...cambios } : g)),
    }));
  }
  function borrarGasto(id) {
    setState((s) => ({ ...s, gastos: s.gastos.filter((g) => g.id !== id) }));
  }

  function guardarConfig(cambios) {
    setState((s) => ({ ...s, config: { ...s.config, ...cambios } }));
  }

  return {
    invitados: state.invitados,
    gastos: state.gastos,
    config: state.config,
    addInvitado,
    patchInvitado,
    borrarInvitado,
    addGasto,
    patchGasto,
    borrarGasto,
    guardarConfig,
  };
}
