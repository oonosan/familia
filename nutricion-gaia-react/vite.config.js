import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En el monorepo "familia" esta app se sirve bajo /nutricion-gaia/.
// En dev standalone (npm run dev acá adentro) sigue en la raíz.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/nutricion-gaia/" : "/",
  plugins: [react()],
}));
