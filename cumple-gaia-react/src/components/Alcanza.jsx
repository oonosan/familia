import { VJ_ETIQUETA, personasConfirmadas, tipoVajilla, unidadesCompradas } from "../logic";

export default function Alcanza({ invitados, gastos, config, guardarConfig }) {
  const personas = personasConfirmadas(invitados);
  const totales = { servilletas: 0, cubiertos: 0, vasos: 0 };
  const items = { servilletas: [], cubiertos: [], vasos: [] };

  gastos.forEach((g) => {
    const tipo = tipoVajilla(g.concepto);
    if (!tipo) return;
    totales[tipo] += unidadesCompradas(g, personas);
    items[tipo].push(g.concepto);
  });

  return (
    <section id="alcanza">
      <div className="sec-head">
        <h2>¿Alcanza lo que compraste?</h2>
        <p>Suma las servilletas, cubiertos y vasos de todos los gastos cargados (por nombre) y los compara contra los invitados confirmados.</p>
      </div>
      <div className="vajilla-resumen">
        {Object.keys(VJ_ETIQUETA).map((tipo) => {
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
              <div className="vj-sub">
                {items[tipo].length
                  ? "comprados, de: " + items[tipo].join(", ")
                  : "comprados (no cargaste ningún gasto de " + VJ_ETIQUETA[tipo].toLowerCase() + " todavía)"}
              </div>
              <div className="vj-ratio">
                <span>Sugerido:</span>
                <input
                  type="number" min="0" step="0.5" value={ratio}
                  aria-label={"Unidades de " + VJ_ETIQUETA[tipo].toLowerCase() + " por persona"}
                  onChange={(e) => guardarConfig({ [tipo]: Math.max(0, Number(e.target.value) || 0) })}
                />
                <span>por persona</span>
              </div>
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
