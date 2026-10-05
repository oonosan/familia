import { VJ_ETIQUETA, VJ_TIP, personasConfirmadas, tipoVajilla, unidadesCompradas } from "../logic";

export default function Alcanza({ invitados, gastos, config, guardarConfig, patchGasto }) {
  const personas = personasConfirmadas(invitados);
  const totales = {};
  const items = {};
  Object.keys(VJ_ETIQUETA).forEach((k) => { totales[k] = 0; items[k] = []; });

  gastos.forEach((g) => {
    const tipo = tipoVajilla(g);
    if (!tipo) return;
    const u = unidadesCompradas(g, personas);
    totales[tipo] += u;
    items[tipo].push({ g, u });
  });

  return (
    <section id="alcanza">
      <div className="sec-head">
        <h2>¿Alcanza lo que compraste?</h2>
        <p>
          Suma platos, servilletas, cubiertos y vasos de los gastos cargados (por nombre) y los compara contra los
          invitados confirmados. Los platos se separan en almuerzo y torta: movelos de un cuadro al otro con el botón
          de cada uno.
        </p>
      </div>
      <div className="vajilla-resumen">
        {Object.keys(VJ_ETIQUETA).map((tipo) => {
          const esPlato = tipo === "platosAlmuerzo" || tipo === "platosTorta";
          const comprado = totales[tipo];
          const ratio = Number(config[tipo]) || 0;
          const sugerido = Math.ceil(personas * ratio);
          return (
            <div className="vj-card" key={tipo}>
              <div className="vj-top">
                <div>
                  <div className="vj-nombre">{VJ_ETIQUETA[tipo]}</div>
                  <div className="vj-comprado">{comprado}</div>
                </div>
              </div>

              {esPlato ? (
                items[tipo].length ? (
                  <ul className="vj-items">
                    {items[tipo].map(({ g, u }) => {
                      const destino = tipo === "platosTorta" ? "almuerzo" : "torta";
                      const texto = destino === "torta" ? "la torta" : "el almuerzo";
                      return (
                        <li key={g.id}>
                          <span>{g.concepto} · <b>{u}</b></span>
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label={"Mover " + g.concepto + " a platos " + (destino === "torta" ? "de torta" : "del almuerzo")}
                            onClick={() => patchGasto(g.id, { usoPlato: destino })}
                          >
                            Usar para {texto}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="vj-sub">
                    {tipo === "platosTorta"
                      ? "Ningún plato marcado para la torta. Cargá un gasto con “torta” o “postre” en el nombre, o mové uno desde el almuerzo."
                      : "No cargaste platos para el almuerzo todavía."}
                  </div>
                )
              ) : (
                <div className="vj-sub">
                  {items[tipo].length
                    ? "comprados, de: " + items[tipo].map((it) => it.g.concepto).join(", ")
                    : "comprados (no cargaste ningún gasto de " + VJ_ETIQUETA[tipo].toLowerCase() + " todavía)"}
                </div>
              )}

              <div className="vj-ratio">
                <span>Sugerido:</span>
                <input
                  type="number" min="0" step={esPlato ? "0.1" : "0.5"} value={ratio}
                  aria-label={"Unidades de " + VJ_ETIQUETA[tipo].toLowerCase() + " por persona"}
                  onChange={(e) => guardarConfig({ [tipo]: Math.max(0, Number(e.target.value) || 0) })}
                />
                <span>por persona</span>
              </div>

              {VJ_TIP[tipo] && <div className="vj-tip">{VJ_TIP[tipo]}</div>}

              {!personas ? (
                <span className="vj-estado vj-sub" style={{ border: "none" }}>Confirmá invitados para comparar</span>
              ) : comprado >= sugerido ? (
                <span className="vj-estado vj-ok">Alcanza (sugerido {sugerido}, te sobran {comprado - sugerido})</span>
              ) : (
                <span className="vj-estado vj-falta">Comprá {sugerido - comprado} más (sugerido {sugerido} para {personas} personas)</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
