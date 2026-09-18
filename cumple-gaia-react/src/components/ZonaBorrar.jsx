import { useState } from "react";

export default function ZonaBorrar({ nombre, onBorrar }) {
  const [confirmando, setConfirmando] = useState(false);

  if (confirmando) {
    return (
      <div className="confirm">
        <span>¿Borrar?</span>
        <button type="button" className="si" onClick={onBorrar}>Sí</button>
        <button type="button" className="no" onClick={() => setConfirmando(false)}>No</button>
      </div>
    );
  }
  return (
    <button
      type="button"
      className="del"
      aria-label={"Borrar " + (nombre || "")}
      onClick={() => setConfirmando(true)}
    >
      ✕
    </button>
  );
}
