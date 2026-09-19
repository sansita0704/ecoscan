import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { aiDevRoutes } from "./server/devMiddleware.js";

// Server-only secrets. Deliberately NOT prefixed with VITE_, so Vite will never
// inline them into the browser bundle; they are lifted into process.env purely
// so the dev-server middleware can read them the same way the deployed
// serverless function does.
const SERVER_ONLY = [
  "GROQ_API_KEY",
  "ADVICE_MODEL",
  "ADVICE_MIN_CONFIDENCE",
  "OVERPASS_USER_AGENT",
  "OVERPASS_BUDGET_MS",
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const key of SERVER_ONLY) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }

  return {
    plugins: [react(), aiDevRoutes()],
    server: {
      proxy: {
        // Only the Python backend's own namespace is proxied. /api/ai/* is
        // served in-process by aiDevRoutes (and by api/ai/* once deployed).
        "/api/v1": { target: env.VITE_API_PROXY ?? "http://localhost:8000", changeOrigin: true },
      },
    },
  };
});
