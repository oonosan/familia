import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  // En el monorepo "familia" esta app se sirve bajo /cumple-gaia/.
  // En dev standalone (npm run dev acá adentro) sigue en la raíz.
  base: command === "build" ? "/cumple-gaia/" : "/",
  plugins: [react()],
}));
