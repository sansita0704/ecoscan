import { request } from "./http";

/**
 * POST /api/ai/chat  { messages: [{role, content}] }  ->  { status, reply, model }
 *
 * Free-form assistant chat, served by the Node side (server/lib/chatHandler.js)
 * on the same Groq key as the disposal-advice flow. No VITE_USE_MOCK branch:
 * mock mode is for demoing the detection pipeline without a model backend,
 * not for faking a conversation.
 *
 * @param {{role: "user"|"assistant", content: string}[]} messages full running history, oldest first
 * @returns {Promise<{status: "ok"|"unconfigured"|"error", reply: string|null, message: string|null}>}
 */
export async function sendChatMessage(messages, { signal } = {}) {
  const raw = await request("/api/ai/chat", {
    method: "POST",
    json: { messages },
    signal,
  });
  return {
    status: raw.status ?? "error",
    reply: raw.reply ?? null,
    message: raw.message ?? null,
  };
}
