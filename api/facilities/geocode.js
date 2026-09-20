import { handleGeocode } from "../../server/lib/geocodeHandler.js";

/**
 * Vercel serverless entry point -> POST /api/facilities/geocode
 *
 * The identical handler runs in dev through the Vite middleware in
 * server/devMiddleware.js, so there is only one code path to reason about.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { status, body: payload } = await handleGeocode(body);
    return res.status(status).json(payload);
  } catch (err) {
    console.error("[geocode] unhandled:", err);
    return res.status(500).json({ error: "Location search failed" });
  }
}
