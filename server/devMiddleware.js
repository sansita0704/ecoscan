/**
 * Vite dev plugin that serves the AI routes in-process.
 *
 * In production these live as serverless functions under api/. In dev this
 * mounts the same handler so there's no third process to run and no second
 * code path to keep in step. The Gemini key is read from the Vite dev server's
 * own environment and never reaches the browser bundle.
 */

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) reject(new Error("Body too large"));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

// Loaded through Vite's SSR module graph rather than a bare `import()`, so
// editing anything under server/ takes effect on the next request. A plain
// dynamic import is cached by Node for the life of the process, which silently
// serves stale handler code after every edit.
const ROUTES = {
  "/api/ai/advice": { module: "/server/lib/adviceHandler.js", fn: "handleAdvice" },
};

export function aiDevRoutes() {
  return {
    name: "ecoscan-ai-dev-routes",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? "").split("?")[0];
        const route = ROUTES[path];
        if (!route) return next();

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Allow", "POST");
          return res.end(JSON.stringify({ error: "Method not allowed" }));
        }

        try {
          const mod = await server.ssrLoadModule(route.module);
          const handle = mod[route.fn];
          const body = await readJson(req);
          const { status, body: payload } = await handle(body);
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(payload));
        } catch (err) {
          server.config.logger.error(`[advice] ${err?.message ?? err}`);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Advice service failed" }));
        }
      });
    },
  };
}
