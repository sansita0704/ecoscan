/**
 * Vite dev plugin that serves the Node-side API routes in-process (AI advice,
 * facility lookup).
 *
 * In production these live as serverless functions under api/. In dev this
 * mounts the same handlers so there's no third process to run and no second
 * code path to keep in step. Server-only keys are read from the Vite dev
 * server's own environment and never reach the browser bundle.
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
  "/api/facilities/nearby": { module: "/server/lib/facilitiesHandler.js", fn: "handleFacilities" },
  "/api/facilities/geocode": { module: "/server/lib/geocodeHandler.js", fn: "handleGeocode" },
};

// A fresh Node process's first HTTPS connection to a given host has
// repeatedly measured several seconds to tens of seconds slower than every
// connection after it on this kind of network (TLS/DNS cold-start) -
// observed independently against Overpass and Nominatim, not one host's
// problem. A HEAD request costs neither service anything meaningful and
// pays that one-time cost at server startup instead of during a user's
// first real search.
const WARM_UP_HOSTS = ["https://overpass-api.de/", "https://nominatim.openstreetmap.org/"];

export function aiDevRoutes() {
  return {
    name: "ecoscan-ai-dev-routes",
    configureServer(server) {
      // Vite transforms an SSR module the first time anything asks for it,
      // and that compile cost is paid inline with whatever request triggered
      // it. For a route whose handler starts an outbound fetch with its own
      // timeout (Overpass, Nominatim), that first real request can burn
      // through the timeout budget before the network call even starts,
      // making a user's very first click fail for a reason that has nothing
      // to do with the network. Loading every route once up front, before
      // any request arrives, moves that cost to server startup instead.
      for (const route of Object.values(ROUTES)) {
        server.ssrLoadModule(route.module).catch(() => {});
      }
      for (const host of WARM_UP_HOSTS) {
        fetch(host, { method: "HEAD", signal: AbortSignal.timeout(6000) }).catch(() => {});
      }

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
          server.config.logger.error(`[${path}] ${err?.message ?? err}`);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Request failed" }));
        }
      });
    },
  };
}
