import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Voice-to-text via the browser's own Web Speech API (SpeechRecognition).
 *
 * Deliberately not "record audio and send it to a server" - the browser
 * already does speech-to-text locally/via the OS, for free, with no audio
 * ever leaving the device to a third party this app doesn't already use.
 * The transcript comes back as plain text and is handed to the same
 * send-a-chat-message path as typing, so nothing downstream needs to know
 * voice was involved at all.
 *
 * Support is real but not universal: Chrome and Edge implement it (as the
 * vendor-prefixed `webkitSpeechRecognition`), Firefox and Safari largely
 * don't. `supported` says which case you're in - check it before showing a
 * mic button at all, since there is no server-side fallback here.
 */
export function useVoiceInput({ onResult, lang = "en-US" } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  // Kept current without re-subscribing the recognizer's event handlers on
  // every render (the handlers are attached once, in the effect below).
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const SpeechRecognitionCtor =
    typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const supported = !!SpeechRecognitionCtor;

  useEffect(() => {
    if (!SpeechRecognitionCtor) return undefined;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) onResultRef.current?.(transcript);
    };
    recognition.onerror = (event) => {
      setError(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone access was denied. Allow it in your browser's site settings, or type instead."
          : event.error === "no-speech"
            ? "Didn't catch that - try again, or type instead."
            : "Voice input failed. Try typing instead."
      );
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SpeechRecognitionCtor is stable per browser; only `lang` should re-create the recognizer.
  }, [SpeechRecognitionCtor, lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setError(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // start() throws if a recognition session is already active; the
      // isListening guard above prevents the common case, this catches races.
    }
  }, [isListening]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { supported, isListening, error, start, stop };
}
