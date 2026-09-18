import { useState } from "react";
import { ESTADOS, ETIQ, uid } from "../logic";
import ZonaBorrar from "./ZonaBorrar";

function Stepper({ label, item, campo, onChange }) {
  const val = Number(item[campo]) || 0;
  return (
    <div className="stepper">
      <button
        type="button"
        className="sbtn"
        aria-label={"Quitar un " + label + " de " + (item.nombre || "")}
        onClick={() => onChange(Math.max(0, val - 1))}
      >
        −
      </button>
      <b>{val}</b>
      <span>{label}</span>
      <button
        type="button"
        className="sbtn"
        aria-label={"Sumar un " + label + " a " + (item.nombre || "")}
        onClick={() => onChange(Math.min(50, val + 1))}
      >
        +
      </button>
    </div>
  );
}

export default function Invitados({ invitados, addInvitado, patchInvitado, borrarInvitado }) {
  const [nombre, setNombre] = useState("");
  const [adultos, setAdultos] = useState(2);
  const [ninos, setNinos] = useState(0);
  const [estado, setEstado] = useState("pendiente");

  let totalAdultos = 0, totalNinos = 0, pend = 0;
  invitados.forEach((i) => {
    const a = Number(i.adultos) || 0, n = Number(i.ninos) || 0;
    if (i.estado === "confirmado") { totalAdultos += a; totalNinos += n; }
    else if (i.estado === "pendiente") pend += a + n;
  });

  function onSubmit(ev) {
    ev.preventDefault();
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    addInvitado({
      id: uid(),
      nombre: nombreLimpio,
      adultos: Math.max(0, Number(adultos) || 0),
      ninos: Math.max(0, Number(ninos) || 0),
      estado,
      nota: "",
      creado: Date.now(),
    });
    setNombre(""); setAdultos(2); setNinos(0); setEstado("pendiente");
  }

  return (
    <section id="invitados">
      <div className="sec-head">
        <h2>Invitados</h2>
        <p>Cargá cada familia o grupo con cuánta gente viene. El total se actualiza solo con los confirmados.</p>
      </div>

      <div className="tiles">
        <div className="tile t-adultos"><span className="n">{totalAdultos}</span><span className="l">Adultos confirmados</span></div>
        <div className="tile t-ninos"><span className="n">{totalNinos}</span><span className="l">Niños confirmados</span></div>
        <div className="tile t-total"><span className="n">{totalAdultos + totalNinos}</span><span className="l">Total en la fiesta</span></div>
        <div className="tile t-pend"><span className="n">{pend}</span><span className="l">Personas sin responder</span></div>
      </div>

      <form className="card" onSubmit={onSubmit} autoComplete="off">
        <div className="field wide">
          <label htmlFor="inv-nombre">Quién viene</label>
          <input
            id="inv-nombre" type="text" placeholder="Familia Gómez" required maxLength={60}
            value={nombre} onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="inv-adultos">Adultos</label>
          <input id="inv-adultos" type="number" min="0" max="50" required
            value={adultos} onChange={(e) => setAdultos(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="inv-ninos">Niños</label>
          <input id="inv-ninos" type="number" min="0" max="50" required
            value={ninos} onChange={(e) => setNinos(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="inv-estado">Estado</label>
          <select id="inv-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="confirmado">Confirmado</option>
            <option value="pendiente">Pendiente</option>
            <option value="no">No viene</option>
          </select>
        </div>
        <div className="field full"><button className="btn" type="submit">Agregar</button></div>
      </form>

      <div className="list">
        {invitados.length === 0 && (
          <div className="empty">Todavía no hay nadie en la lista. Agregá la primera familia arriba.</div>
        )}
        {invitados.map((i) => (
          <div key={i.id} className={"row" + (i.estado === "no" ? " no-viene" : "")}>
            <div className="nombre">
              {i.nombre || "Sin nombre"}
              {i.nota && <span className="nota">{i.nota}</span>}
            </div>
            <button
              type="button"
              className={"estado e-" + (i.estado === "no" ? "no" : i.estado)}
              title="Cambiar estado"
              onClick={() => {
                const idx = ESTADOS.indexOf(i.estado);
                patchInvitado(i.id, { estado: ESTADOS[(idx + 1) % ESTADOS.length] });
              }}
            >
              {ETIQ[i.estado] || "Pendiente"}
            </button>
            <div className="steppers">
              <Stepper label="adultos" item={i} campo="adultos" onChange={(v) => patchInvitado(i.id, { adultos: v })} />
              <Stepper label="niños" item={i} campo="ninos" onChange={(v) => patchInvitado(i.id, { ninos: v })} />
            </div>
            <ZonaBorrar nombre={i.nombre} onBorrar={() => borrarInvitado(i.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}
