import { useCallback, useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../services/chatService";

let seq = 0;
const nextId = () => `msg-${(seq += 1)}`;

/**
 * Owns one conversation with the assistant. Kept as a plain array of
 * {id, role, content, error?} turns - `error: true` marks a turn that
 * couldn't be answered, so the bubble renders differently without needing a
 * separate error channel the way the single-shot advice/pickup flows do.
 *
 * `messagesRef` mirrors `messages` so `sendMessage` (a stable callback) can
 * read the latest history when building the request, rather than closing
 * over a stale render's state.
 *
 * status: idle | sending
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("idle");
  const messagesRef = useRef(messages);
  const controllerRef = useRef(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const userTurn = { id: nextId(), role: "user", content: trimmed };
    const history = [...messagesRef.current, userTurn];
    setMessages(history);
    setStatus("sending");

    try {
      const wire = history.map(({ role, content }) => ({ role, content }));
      const result = await sendChatMessage(wire, { signal: controller.signal });
      if (controller.signal.aborted) return;

      if (result.status === "ok" && result.reply) {
        setMessages((prev) => [...prev, { id: nextId(), role: "assistant", content: result.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            content: result.message ?? "Sorry, I couldn't answer that just now.",
            error: true,
          },
        ]);
      }
    } catch (err) {
      if (controller.signal.aborted || err.name === "AbortError") return;
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: "Something went wrong reaching the assistant.", error: true },
      ]);
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setStatus("idle");
      }
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setMessages([]);
    setStatus("idle");
  }, []);

  return { messages, status, sendMessage, reset };
}
