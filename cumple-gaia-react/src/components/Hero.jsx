import { useEffect, useState } from "react";
import { countdownTexto } from "../logic";
import heroImg from "../assets/hero-selva.png";

export default function Hero({ onScrollHint }) {
  const [countdown, setCountdown] = useState("18 de octubre");

  useEffect(() => {
    setCountdown(countdownTexto());
  }, []);

  return (
    <header className="hero">
      <img
        className="hero-bg"
        src={heroImg}
        alt="Ilustración de selva con una ardilla perezosa y un mono colgados de lianas, un sol sonriente, un tucán, una serpiente, un tapir y leopardos dorados entre hibiscos, orquídeas, flores de la pasión y cactus, sobre fondo verde agua"
      />
      <div className="hero-txt">
        <span className="eyebrow">Domingo 18 de octubre · 2026</span>
        <h1 className="hero-name">Gaia</h1>
        <p className="hero-sub">Un solo día, doble fiesta: el cumpleaños y el bautismo, en plena selva.</p>
        <div className="chips">
          <span className="chip c-cumple"><span className="dot"></span>Cumpleaños</span>
          <span className="chip c-bautismo"><span className="dot"></span>Bautismo</span>
          <span className="chip c-fecha">{countdown}</span>
        </div>
      </div>
      <button type="button" className="scroll-hint" onClick={onScrollHint}>
        Deslizá para ver a los invitados <span aria-hidden="true">↓</span>
      </button>
    </header>
  );
}
