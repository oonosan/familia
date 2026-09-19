import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { THEME } from "./theme";
import "./App.css";

for (const [key, value] of Object.entries(THEME.colors)) {
  document.documentElement.style.setProperty(`--color-${key}`, value);
}

// Vela el fondo con el color del tema para que la imagen no le gane
// legibilidad al texto y las tarjetas.
document.body.style.backgroundImage = `linear-gradient(${hexToRgba(THEME.colors.bg, 0.85)}, ${hexToRgba(
  THEME.colors.bg,
  0.85
)}), url(${THEME.image})`;
document.body.style.backgroundSize = "cover";
document.body.style.backgroundPosition = THEME.bgPosition || "center";
document.body.style.backgroundRepeat = "no-repeat";
document.body.style.backgroundAttachment = "fixed";

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
