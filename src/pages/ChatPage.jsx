import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Bot, Loader2, Mic, RotateCcw, Send, Sparkles, User } from "lucide-react";
import Markdown from "react-markdown";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { useChat } from "../hooks/useChat";
import { useVoiceInput } from "../hooks/useVoiceInput";

// The model answers in markdown (**bold**, numbered steps, etc.) - shown raw,
// that's asterisks and literal "1." "2." on screen instead of actual
// formatting. These map each markdown element to the bubble's own type
// scale rather than pulling in a full prose stylesheet for one small box.
const MARKDOWN_COMPONENTS = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-brand-600">
      {children}
    </a>
  ),
  code: ({ children }) => <code className="rounded bg-slate-200/70 px-1 py-0.5 font-mono text-[0.8em]">{children}</code>,
  // A heading inside a small chat bubble should read as emphasis, not a
  // page-level title - demoted to the same weight as **bold** rather than
  // rendering an actual (oversized) h1/h2/h3.
  h1: ({ children }) => <p className="mb-1.5 font-semibold text-slate-800">{children}</p>,
  h2: ({ children }) => <p className="mb-1.5 font-semibold text-slate-800">{children}</p>,
  h3: ({ children }) => <p className="mb-1.5 font-semibold text-slate-800">{children}</p>,
};

const SUGGESTIONS = [
  "Is a pizza box recyclable?",
  "How do I dispose of a battery?",
  "What's the difference between dry and wet waste?",
];

const inputClass =
  "flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

function Bubble({ message }) {
  const isUser = message.role === "user";
  // The model's own replies are markdown; what the user typed and our own
  // error copy are plain strings that happen to be shown the same way, so
  // only the assistant's real answers go through the markdown renderer.
  const isMarkdown = !isUser && !message.error;
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-brand-600 text-white"
            : message.error
              ? "bg-danger-50 text-danger-500"
              : "bg-brand-50 text-brand-600"
        }`}
      >
        {isUser ? (
          <User size={15} aria-hidden="true" />
        ) : message.error ? (
          <AlertTriangle size={15} aria-hidden="true" />
        ) : (
          <Bot size={15} aria-hidden="true" />
        )}
      </span>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isMarkdown ? "" : "whitespace-pre-wrap"
        } ${
          isUser
            ? "bg-brand-600 text-white"
            : message.error
              ? "border border-danger-200 bg-danger-50 text-slate-700"
              : "border border-slate-200 bg-slate-50 text-slate-700"
        }`}
      >
        {isMarkdown ? <Markdown components={MARKDOWN_COMPONENTS}>{message.content}</Markdown> : message.content}
      </div>
    </div>
  );
}

/**
 * Free-form assistant chat: type or speak a question, get an AI answer.
 *
 * Separate from the per-item disposal advice on the Scanner page (that one
 * is scoped to a real detection and never leaves the facts the pipeline
 * actually has). This is general conversation - server/lib/chatHandler.js's
 * system prompt is what keeps it from pretending to know real facility
 * details or this device's own scan history, which it genuinely doesn't
 * have access to.
 */
export default function ChatPage() {
  const { messages, status, sendMessage, reset } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const handleVoiceResult = useCallback((transcript) => {
    setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    inputRef.current?.focus();
  }, []);
  const voice = useVoiceInput({ onResult: handleVoiceResult });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = (e) => {
    e.preventDefault();
    if (!input.trim() || status === "sending") return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  const ask = (text) => {
    if (status === "sending") return;
    sendMessage(text);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        eyebrow="Assistant"
        title="Ask EcoScan"
        subtitle="Ask about sorting, recycling or disposal - type or speak, and an AI model answers."
        actions={
          messages.length > 0 && (
            <Button onClick={reset} icon={RotateCcw} variant="ghost" size="sm">
              New chat
            </Button>
          )
        }
      />

      <Card className="flex h-[32rem] flex-col overflow-hidden p-0">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              tone="brand"
              title="Ask me anything about waste sorting"
              body='Try "Is a pizza box recyclable?" or "How do I dispose of a battery?"'
            >
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </EmptyState>
          ) : (
            messages.map((m) => <Bubble key={m.id} message={m} />)
          )}

          {status === "sending" && (
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Bot size={15} aria-hidden="true" />
              </span>
              <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                <Loader2 size={14} className="animate-spin text-slate-400" aria-hidden="true" />
                <span className="text-xs text-slate-400">Thinking…</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-2">
            {voice.supported && (
              <button
                type="button"
                onClick={voice.isListening ? voice.stop : voice.start}
                aria-pressed={voice.isListening}
                aria-label={voice.isListening ? "Stop recording" : "Record a voice question"}
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                  voice.isListening
                    ? "border-danger-300 bg-danger-50 text-danger-500"
                    : "border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600"
                }`}
              >
                {voice.isListening && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 animate-pulse-ring rounded-xl bg-danger-400/40"
                  />
                )}
                <Mic size={17} className="relative" aria-hidden="true" />
              </button>
            )}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={voice.isListening ? "Listening…" : "Type your question…"}
              className={inputClass}
            />
            <Button
              type="submit"
              icon={Send}
              disabled={!input.trim() || status === "sending"}
              size="md"
              className="!px-3.5"
            >
              <span className="sr-only">Send</span>
            </Button>
          </div>
          {voice.error && <p className="mt-2 text-xs text-danger-500">{voice.error}</p>}
        </form>
      </Card>

      <p className="text-xs leading-relaxed text-slate-400">
        Answers come from an AI model, not a search of real facilities - it doesn't know your scan
        history or your location, and it won't invent a specific centre's name or address. For real
        nearby drop-off points, use the Facilities page.
      </p>
    </div>
  );
}
