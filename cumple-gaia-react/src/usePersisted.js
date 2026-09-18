import { useEffect, useState } from "react";
import { seedInvitados, seedGastos, seedConfig } from "./seedData";

const LS = "cumple-gaia-v1";

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

// Estado de invitados/gastos/config, persistido en localStorage (igual que el
// modo "sin conexión" del artefacto original: todo vive en este navegador).
export function usePersisted() {
  const [state, setState] = useState(loadInicial);

  useEffect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify(state));
    } catch (e) {}
  }, [state]);

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
