import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Esta app se buildea dos veces (una por trabajadora) desde
// scripts/build.mjs, pasando VITE_BASE, VITE_WORKER, VITE_WORKER_NAME y
// VITE_WORKER_RATE como env vars distintas en cada build.
export default defineConfig(({ command }) => ({
  base: command === "build" ? process.env.VITE_BASE || "/" : "/",
  plugins: [react()],
}));
