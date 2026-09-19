// Single place where environment variables are read.
export const API_URL = import.meta.env.VITE_API_URL ?? "";
// Real backend by default; set VITE_USE_MOCK=true to demo without one running.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
