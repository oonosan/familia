export const WORKER_ID = import.meta.env.VITE_WORKER || "sil";
export const WORKER_NAME = import.meta.env.VITE_WORKER_NAME || "Sil";
export const HOURLY_RATE = Number(import.meta.env.VITE_WORKER_RATE || 5000);
