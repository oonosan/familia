import { useState } from "react";
import { CATS, calcular, dominio, fmt, fmtU, normalizarUrl, personasConfirmadas, singular, uid } from "../logic";
import ZonaBorrar from "./ZonaBorrar";
import EditorGasto from "./EditorGasto";

function iconoLapiz() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

const FORM_INICIAL = {
  concepto: "", categoria: "lugar", monto: "", estado: "pendiente", link: "",
  modo: "fijo", cantidad: 1, porPersona: 1, porPaquete: 1, unidad: "",
};

export default function Gastos({ invitados, gastos, addGasto, patchGasto, borrarGasto }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [editando, setEditando] = useState(null);
  const personas = personasConfirmadas(invitados);

  function setCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function onSubmit(ev) {
    ev.preventDefault();
    const concepto = form.concepto.trim();
    if (!concepto) return;
    addGasto({
      id: uid(),
      concepto,
      categoria: form.categoria,
      monto: Math.max(0, Number(form.monto) || 0),
      estado: form.estado,
      link: normalizarUrl(form.link),
      modo: form.modo,
      cantidad: Math.max(1, Math.round(Number(form.cantidad) || 1)),
      porPersona: Math.max(0, Number(form.porPersona) || 0),
      porPaquete: Math.max(1, Math.round(Number(form.porPaquete) || 1)),
      unidad: form.unidad.trim().slice(0, 24),
      creado: Date.now(),
    });
    setForm(FORM_INICIAL);
  }

  let total = 0, pagado = 0;
  const porCat = {};
  gastos.forEach((g) => {
    const m = calcular(g, personas).total;
    total += m;
    if (g.estado === "pagado") pagado += m;
    porCat[g.categoria] = (porCat[g.categoria] || 0) + m;
  });

  return (
    <section id="gastos">
      <div className="sec-head">
        <h2>Gastos de la fiesta</h2>
        <p>Tocá <strong>Editar</strong> en cualquier gasto para cambiar nombre, categoría, precio, link o cómo se calcula la cantidad.</p>
      </div>

      <div className="tiles">
        <div className="tile t-total"><span className="n">{fmt(total)}</span><span className="l">Presupuesto total</span></div>
        <div className="tile t-adultos"><span className="n">{fmt(pagado)}</span><span className="l">Ya pagado</span></div>
        <div className="tile t-ninos"><span className="n">{fmt(total - pagado)}</span><span className="l">Falta pagar</span></div>
        <div className="tile t-pend"><span className="n">{personas ? fmt(total / personas) : "—"}</span><span className="l">Por persona</span></div>
      </div>

      <form className="card gastos-form" onSubmit={onSubmit} autoComplete="off">
        <div className="field wide f-concepto">
          <label htmlFor="gas-concepto">Gasto</label>
          <input id="gas-concepto" type="text" placeholder="Alquiler del salón" required maxLength={60}
            value={form.concepto} onChange={(e) => setCampo("concepto", e.target.value)} />
        </div>
        <div className="field f-cat">
          <label htmlFor="gas-cat">Categoría</label>
          <select id="gas-cat" value={form.categoria} onChange={(e) => setCampo("categoria", e.target.value)}>
            {Object.keys(CATS).map((k) => <option key={k} value={k}>{CATS[k].n}</option>)}
          </select>
        </div>
        <div className="field f-monto">
          <label htmlFor="gas-monto">Precio c/u</label>
          <input id="gas-monto" type="number" min="0" step="1" inputMode="decimal" placeholder="0"
            value={form.monto} onChange={(e) => setCampo("monto", e.target.value)} />
        </div>
        <div className="field f-estado">
          <label htmlFor="gas-estado">Estado</label>
          <select id="gas-estado" value={form.estado} onChange={(e) => setCampo("estado", e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>
        <div className="field f-link">
          <label htmlFor="gas-link">Link para comprarlo (opcional)</label>
          <input id="gas-link" type="url" inputMode="url" placeholder="https://tienda.com/servilletas-selva"
            value={form.link} onChange={(e) => setCampo("link", e.target.value)} />
        </div>

        <div className="f-cant">
          <div className="seg" role="group" aria-label="Cómo calcular la cantidad">
            <button type="button" aria-pressed={form.modo === "fijo"} onClick={() => setCampo("modo", "fijo")}>Cantidad fija</button>
            <button type="button" aria-pressed={form.modo === "persona"} onClick={() => setCampo("modo", "persona")}>Según invitados</button>
          </div>
          <div className="mini-fields">
            {form.modo === "fijo" ? (
              <div className="mini">
                <label htmlFor="gas-cantidad">Cuántos comprás</label>
                <input id="gas-cantidad" type="number" min="1" step="1"
                  value={form.cantidad} onChange={(e) => setCampo("cantidad", e.target.value)} />
              </div>
            ) : (
              <div className="mini">
                <label htmlFor="gas-porpersona">Por persona</label>
                <input id="gas-porpersona" type="number" min="0" step="0.5"
                  value={form.porPersona} onChange={(e) => setCampo("porPersona", e.target.value)} />
              </div>
            )}
            <div className="mini">
              <label htmlFor="gas-porpaquete">Trae c/u</label>
              <input id="gas-porpaquete" type="number" min="1" step="1" placeholder="1"
                value={form.porPaquete} onChange={(e) => setCampo("porPaquete", e.target.value)} />
            </div>
            <div className="mini">
              <label htmlFor="gas-unidad">Unidad</label>
              <input id="gas-unidad" type="text" maxLength={24} placeholder="servilletas"
                value={form.unidad} onChange={(e) => setCampo("unidad", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="field full f-btn"><button className="btn btn-selva" type="submit">Agregar</button></div>
      </form>

      <div className="list">
        {gastos.length === 0 && (
          <div className="empty">Sin gastos cargados. Empezá por el alquiler del lugar o la torta.</div>
        )}
        {gastos.map((g) => {
          const cat = CATS[g.categoria] || CATS.otros;
          const c = calcular(g, personas);
          const partes = [];
          if (g.link) partes.push(dominio(g.link));
          if (c.detalle) partes.push(c.detalle);
          return (
            <div key={g.id} className="row">
              <span className="cat" style={{ background: cat.c }}>{cat.n}</span>
              <div className="nombre">
                {g.link ? (
                  <a className="link-a" href={g.link} target="_blank" rel="noopener noreferrer">{g.concepto || "Sin nombre"}</a>
                ) : (
                  g.concepto || "Sin nombre"
                )}
                {(partes.length > 0 || !!c.unitario) && (
                  <span className="nota">
                    {partes.join(" · ")}
                    {c.unitario ? (partes.length ? " · " : "") + fmtU(c.unitario) + " por " + (c.unidad ? singular(c.unidad) : "unidad") : ""}
                  </span>
                )}
              </div>
              <span className={"cant-btn" + (c.auto ? " auto" : "")} title={c.auto ? "Cantidad calculada según los invitados confirmados" : "Cantidad a comprar"}>
                {c.etiqueta}
              </span>
              <button
                type="button"
                className={"pagado-btn " + (g.estado === "pagado" ? "p-si" : "p-no")}
                title={"Marcar como " + (g.estado === "pagado" ? "pendiente" : "pagado")}
                onClick={() => patchGasto(g.id, { estado: g.estado === "pagado" ? "pendiente" : "pagado" })}
              >
                {g.estado === "pagado" ? "Pagado" : "Pendiente"}
              </button>
              <span className={"monto" + (Number(g.monto) > 0 ? "" : " sin")}>
                {Number(g.monto) > 0 ? fmt(c.total) : "sin precio"}
              </span>
              <button
                type="button" className="icon-btn" title="Editar este gasto"
                aria-label={"Editar " + (g.concepto || "este gasto")}
                onClick={() => setEditando(editando === g.id ? null : g.id)}
              >
                {iconoLapiz()} Editar
              </button>
              <ZonaBorrar nombre={g.concepto} onBorrar={() => borrarGasto(g.id)} />

              {editando === g.id && (
                <EditorGasto
                  gasto={g}
                  personas={personas}
                  onCancelar={() => setEditando(null)}
                  onGuardar={(cambios) => { patchGasto(g.id, cambios); setEditando(null); }}
                />
              )}
            </div>
          );
        })}
      </div>

      {total > 0 && (
        <div className="bars">
          {Object.keys(CATS).map((k) => {
            const v = porCat[k] || 0;
            if (!v) return null;
            return (
              <div className="bar-row" key={k}>
                <span>{CATS[k].n}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: Math.max(3, (v / total) * 100) + "%", background: CATS[k].c }} />
                </div>
                <span className="bar-val">{fmt(v)}</span>
              </div>
            );
          })}
        </div>
      )}

      <p className="note">
        {personas
          ? "Por persona = presupuesto total dividido las " + personas + " personas confirmadas."
          : "Cuando confirmes invitados vas a ver cuánto sale por persona."}
      </p>
    </section>
  );
}
