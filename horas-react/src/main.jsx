import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { THEME } from "./theme";
import "./App.css";

for (const [key, value] of Object.entries(THEME.colors)) {
  document.documentElement.style.setProperty(`--color-${key}`, value);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
