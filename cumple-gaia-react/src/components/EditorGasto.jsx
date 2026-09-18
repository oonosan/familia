import { useEffect, useRef, useState } from "react";
import { CATS, calcular, fmt, fmtU, normalizarUrl, singular } from "../logic";

export default function EditorGasto({ gasto, personas, onGuardar, onCancelar }) {
  const [tmp, setTmp] = useState({
    concepto: gasto.concepto || "",
    categoria: gasto.categoria || "otros",
    monto: Number(gasto.monto) || 0,
    link: gasto.link || "",
    estado: gasto.estado === "pagado" ? "pagado" : "pendiente",
    modo: gasto.modo === "persona" ? "persona" : "fijo",
    cantidad: Number(gasto.cantidad) > 0 ? Math.round(Number(gasto.cantidad)) : 1,
    porPersona: Number(gasto.porPersona) > 0 ? Number(gasto.porPersona) : 1,
    porPaquete: Number(gasto.porPaquete) > 0 ? Number(gasto.porPaquete) : 1,
    unidad: gasto.unidad || "",
  });
  const conceptoRef = useRef(null);

  useEffect(() => {
    if (conceptoRef.current) {
      conceptoRef.current.focus();
      conceptoRef.current.select();
    }
  }, []);

  function set(campo, valor) {
    setTmp((t) => ({ ...t, [campo]: valor }));
  }

  function guardar() {
    const concepto = (tmp.concepto || "").trim();
    if (!concepto) return;
    onGuardar({
      concepto: concepto.slice(0, 60),
      categoria: tmp.categoria,
      monto: Math.max(0, Number(tmp.monto) || 0),
      link: normalizarUrl(tmp.link),
      estado: tmp.estado,
      modo: tmp.modo,
      cantidad: Math.max(1, Math.round(Number(tmp.cantidad) || 1)),
      porPersona: Math.max(0, Number(tmp.porPersona) || 0),
      porPaquete: Math.max(1, Math.round(Number(tmp.porPaquete) || 1)),
      unidad: (tmp.unidad || "").trim().slice(0, 24),
    });
  }

  function onEnter(ev) {
    if (ev.key === "Enter" && ev.target.tagName !== "SELECT") { ev.preventDefault(); guardar(); }
    if (ev.key === "Escape") { ev.preventDefault(); onCancelar(); }
  }

  const c = calcular(
    { monto: tmp.monto, modo: tmp.modo, cantidad: tmp.cantidad, porPersona: tmp.porPersona, porPaquete: tmp.porPaquete, unidad: tmp.unidad },
    personas
  );
  let preview = c.detalle || "Se compra una sola vez.";
  if (c.unitario) preview += " · sale " + fmtU(c.unitario) + " por " + (c.unidad ? singular(c.unidad) : "unidad");
  if (c.total) preview += " · total " + fmt(c.total);

  return (
    <div className="row-edit panel">
      <div className="mini-fields">
        <div className="mini wide">
          <label htmlFor={"eg-concepto-" + gasto.id}>Gasto</label>
          <input
            id={"eg-concepto-" + gasto.id} ref={conceptoRef} type="text" maxLength={60} placeholder="Alquiler del salón"
            value={tmp.concepto} onChange={(e) => set("concepto", e.target.value)} onKeyDown={onEnter}
          />
        </div>
        <div className="mini">
          <label htmlFor={"eg-categoria-" + gasto.id}>Categoría</label>
          <select id={"eg-categoria-" + gasto.id} value={tmp.categoria} onChange={(e) => set("categoria", e.target.value)}>
            {Object.keys(CATS).map((k) => <option key={k} value={k}>{CATS[k].n}</option>)}
          </select>
        </div>
        <div className="mini">
          <label htmlFor={"eg-monto-" + gasto.id}>Precio c/u</label>
          <input
            id={"eg-monto-" + gasto.id} type="number" min="0" step="1" inputMode="decimal"
            value={tmp.monto} onChange={(e) => set("monto", Number(e.target.value))} onKeyDown={onEnter}
          />
        </div>
        <div className="mini">
          <label htmlFor={"eg-estado-" + gasto.id}>Estado</label>
          <select id={"eg-estado-" + gasto.id} value={tmp.estado} onChange={(e) => set("estado", e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>
        <div className="mini wide">
          <label htmlFor={"eg-link-" + gasto.id}>Link para comprarlo</label>
          <input
            id={"eg-link-" + gasto.id} type="url" inputMode="url" placeholder="https://tienda.com/servilletas-selva"
            value={tmp.link} onChange={(e) => set("link", e.target.value)} onKeyDown={onEnter}
          />
        </div>
      </div>

      <div className="seg" role="group" aria-label="Cómo calcular la cantidad">
        <button type="button" aria-pressed={tmp.modo === "fijo"} onClick={() => set("modo", "fijo")}>Cantidad fija</button>
        <button type="button" aria-pressed={tmp.modo === "persona"} onClick={() => set("modo", "persona")}>Según invitados</button>
      </div>

      <div className="mini-fields">
        {tmp.modo === "fijo" ? (
          <div className="mini">
            <label htmlFor={"eg-cantidad-" + gasto.id}>Cuántos comprás</label>
            <input id={"eg-cantidad-" + gasto.id} type="number" min="1" step="1"
              value={tmp.cantidad} onChange={(e) => set("cantidad", Number(e.target.value))} onKeyDown={onEnter} />
          </div>
        ) : (
          <div className="mini">
            <label htmlFor={"eg-porpersona-" + gasto.id}>Por persona</label>
            <input id={"eg-porpersona-" + gasto.id} type="number" min="0" step="0.5"
              value={tmp.porPersona} onChange={(e) => set("porPersona", Number(e.target.value))} onKeyDown={onEnter} />
          </div>
        )}
        <div className="mini">
          <label htmlFor={"eg-porpaquete-" + gasto.id}>Trae c/u</label>
          <input id={"eg-porpaquete-" + gasto.id} type="number" min="1" step="1" placeholder="1"
            value={tmp.porPaquete} onChange={(e) => set("porPaquete", Number(e.target.value))} onKeyDown={onEnter} />
        </div>
        <div className="mini">
          <label htmlFor={"eg-unidad-" + gasto.id}>Unidad</label>
          <input id={"eg-unidad-" + gasto.id} type="text" maxLength={24} placeholder="servilletas"
            value={tmp.unidad} onChange={(e) => set("unidad", e.target.value)} onKeyDown={onEnter} />
        </div>
      </div>

      <div className="row-edit" style={{ border: "none", padding: 0, margin: 0, flex: "0 0 auto" }}>
        <button type="button" className="btn" onClick={guardar}>Guardar</button>
        <button type="button" className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
      </div>

      <span className="preview">{preview}</span>
    </div>
  );
}
