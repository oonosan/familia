import { useRef, useState } from "react";

const SIZE = 240;
const C = SIZE / 2;
const OUTER_R = 96;
const INNER_R = 62;

function pad(n) {
  return String(n).padStart(2, "0");
}

function polar(angleDeg, r) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

// Anillo exterior 1–12 (12 arriba), interior 13–23 y 00 (00 arriba).
const HOUR_LABELS = [
  ...Array.from({ length: 12 }, (_, i) => ({ value: i === 0 ? 12 : i, angle: i * 30, r: OUTER_R, inner: false })),
  ...Array.from({ length: 12 }, (_, i) => ({ value: i === 0 ? 0 : i + 12, angle: i * 30, r: INNER_R, inner: true })),
];

const MINUTE_LABELS = Array.from({ length: 12 }, (_, i) => ({ value: i * 5, angle: i * 30, r: OUTER_R }));

export default function TimePicker({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("hour");
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const dialRef = useRef(null);
  const dragging = useRef(false);

  function openPicker() {
    const [h, m] = value ? value.split(":").map(Number) : [9, 0];
    setHour(h);
    setMinute(m);
    setMode("hour");
    setOpen(true);
  }

  function pickFromPointer(e, release) {
    const rect = dialRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * SIZE - C;
    const y = ((e.clientY - rect.top) / rect.height) * SIZE - C;
    let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;

    if (mode === "hour") {
      const pos = Math.round(angle / 30) % 12;
      const inner = Math.hypot(x, y) < (OUTER_R + INNER_R) / 2;
      if (inner) setHour(pos === 0 ? 0 : pos + 12);
      else setHour(pos === 0 ? 12 : pos);
      if (release) setMode("minute");
    } else {
      setMinute(Math.round(angle / 6) % 60);
    }
  }

  function handlePointerDown(e) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    pickFromPointer(e, false);
  }

  function handlePointerMove(e) {
    if (dragging.current) pickFromPointer(e, false);
  }

  function handlePointerUp(e) {
    if (!dragging.current) return;
    dragging.current = false;
    pickFromPointer(e, true);
  }

  function accept() {
    onChange(`${pad(hour)}:${pad(minute)}`);
    setOpen(false);
  }

  const isInnerHour = hour === 0 || hour > 12;
  const hand =
    mode === "hour"
      ? polar((hour % 12) * 30, isInnerHour ? INNER_R : OUTER_R)
      : polar(minute * 6, OUTER_R);
  const labels = mode === "hour" ? HOUR_LABELS : MINUTE_LABELS;
  const selectedValue = mode === "hour" ? hour : minute;

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <button type="button" className={`time-trigger${value ? "" : " empty"}`} onClick={openPicker}>
        <span aria-hidden="true">🕐</span> {value || "--:--"}
      </button>

      {open && (
        <div className="clock-overlay" onClick={() => setOpen(false)}>
          <div className="clock-popup" role="dialog" aria-label={label} onClick={(e) => e.stopPropagation()}>
            <div className="clock-title">{label}</div>
            <div className="clock-readout">
              <button
                type="button"
                className={mode === "hour" ? "active" : ""}
                onClick={() => setMode("hour")}
              >
                {pad(hour)}
              </button>
              <span>:</span>
              <button
                type="button"
                className={mode === "minute" ? "active" : ""}
                onClick={() => setMode("minute")}
              >
                {pad(minute)}
              </button>
            </div>

            <svg
              ref={dialRef}
              className="clock-dial"
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <circle className="clock-face" cx={C} cy={C} r={C - 4} />
              <line className="clock-hand" x1={C} y1={C} x2={hand.x} y2={hand.y} />
              <circle className="clock-knob" cx={hand.x} cy={hand.y} r={16} />
              <circle className="clock-center" cx={C} cy={C} r={4} />
              {labels.map((l) => {
                const p = polar(l.angle, l.r);
                return (
                  <text
                    key={`${l.inner ? "i" : "o"}${l.value}`}
                    x={p.x}
                    y={p.y}
                    className={`clock-num${l.inner ? " inner" : ""}${l.value === selectedValue ? " selected" : ""}`}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {pad(l.value)}
                  </text>
                );
              })}
            </svg>

            <div className="clock-actions">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="btn checkin" onClick={accept}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
