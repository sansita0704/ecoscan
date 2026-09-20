import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

/**
 * POST /api/ai/chat  { messages: [{role, content}, ...] } -> { status, reply, model }
 *
 * General-purpose assistant for the app, separate from the disposal-advice
 * flow (server/lib/adviceHandler.js): that one only runs against a real
 * detection and stays strictly on facts the pipeline actually has (class,
 * confidence, the rule table). This one is a free-form conversation - "how
 * do I dispose of a battery", "what's wet vs dry waste" - and the system
 * prompt below is what keeps it from blurring into the other flow's job of
 * inventing real facilities or a specific item's condition.
 *
 * Reuses the same Groq key and default model as the advice flow (GROQ_API_KEY,
 * ADVICE_MODEL) so there's nothing new to configure; CHAT_MODEL overrides it
 * independently if you want a different model for free-form chat later.
 */

const MODEL_ID = process.env.CHAT_MODEL ?? process.env.ADVICE_MODEL ?? "openai/gpt-oss-120b";

// A person, not a paragraph, is on the other end of this - keep it short
// enough to read in one glance on a phone screen.
const SYSTEM_PROMPT = `You are the EcoScan assistant, built into a waste-sorting app.

Ground rules:
- Answer general questions about waste sorting, recycling, composting and disposal.
- You can explain the app's own features: the camera/photo scanner (Scan Waste), the Waste Guide, Nearby Facilities (real OpenStreetMap listings), and Schedule a Pickup.
- You have NO access to real facility names, addresses, phone numbers or hours, and no access to this user's scan history, account or location. Never invent any of these - if asked, say you don't have that and point to the Facilities page (for locations) or My Impact (for their own history).
- Be concise and practical: a few short sentences or a short list, not an essay. No markdown tables.
- If a question is unrelated to waste, recycling or the app, answer briefly if you can, but steer back to what you're actually useful for.`;

const MAX_HISTORY = 20;
const MAX_MESSAGE_CHARS = 4000;

function badRequest(message) {
  return { status: 400, body: { error: message } };
}

/** Keep only well-formed turns, most recent MAX_HISTORY, each capped in length. */
function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const cleaned = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_CHARS) }))
    .slice(-MAX_HISTORY);
  return cleaned;
}

export async function handleChat(rawBody, { signal } = {}) {
  if (!rawBody || typeof rawBody !== "object") return badRequest("Expected a JSON body");

  const messages = sanitizeMessages(rawBody.messages);
  if (!messages || messages.length === 0) return badRequest("`messages` (a non-empty array) is required");
  if (messages.at(-1).role !== "user") return badRequest("The last message must be from the user");

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // Unconfigured is a normal state (same policy as the advice flow), not
    // an error - the UI says so rather than showing a scary failure.
    return {
      status: 200,
      body: {
        status: "unconfigured",
        reply: null,
        message: "The assistant isn't set up yet - ask whoever runs this to add a GROQ_API_KEY.",
      },
    };
  }

  try {
    const groq = createGroq({ apiKey });
    const { text } = await generateText({
      model: groq(MODEL_ID),
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.4,
      abortSignal: signal,
    });
    return { status: 200, body: { status: "ok", reply: text, model: MODEL_ID } };
  } catch (err) {
    console.error("[chat] model failed:", err?.message ?? err);
    return {
      status: 200,
      body: { status: "error", reply: null, message: "The assistant didn't respond just now. Try again." },
    };
  }
}
