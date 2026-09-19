import { handleAdvice } from "../../server/lib/adviceHandler.js";

/**
 * Vercel serverless entry point -> POST /api/ai/advice
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
    const { status, body: payload } = await handleAdvice(body);
    return res.status(status).json(payload);
  } catch (err) {
    console.error("[advice] unhandled:", err);
    return res.status(500).json({ error: "Advice service failed" });
  }
}
