import adriImage from "./assets/adri-theme.webp";
import silImage from "./assets/sil-theme.webp";
import { WORKER_ID } from "./config";

// Paletas sacadas de las ilustraciones de cada una: tonos de limpieza
// (verde salvia / durazno) para Adri, colores de crayón sobre rosa para Sil.
const THEMES = {
  sil: {
    image: silImage,
    bgPosition: "center top",
    colors: {
      bg: "#fdeaf0",
      card: "#ffffff",
      border: "#f6d3e0",
      text: "#4a2f3d",
      muted: "#9c7a89",
      header: "#8a5fc7",
      headerText: "#ffffff",
      checkin: "#4fae8f",
      checkout: "#e2637f",
      link: "#8a5fc7",
    },
  },
  adri: {
    image: adriImage,
    bgPosition: "center 40%",
    colors: {
      bg: "#f8e1cd",
      card: "#ffffff",
      border: "#edcda9",
      text: "#4a3524",
      muted: "#93765a",
      header: "#6f8f5b",
      headerText: "#ffffff",
      checkin: "#6f8f5b",
      checkout: "#c96650",
      link: "#6f8f5b",
    },
  },
};

export const THEME = THEMES[WORKER_ID] || THEMES.sil;
