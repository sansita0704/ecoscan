import { useCallback, useEffect, useRef, useState } from "react";
import { getDisposalAdvice } from "../services/adviceService";

const IDLE = { status: "idle", advice: null, error: null, subject: null };

/**
 * Holds disposal advice for one item the user asked about.
 *
 * Deliberately NOT keyed to the live detection. Advice is a snapshot of the
 * moment it was requested: the camera keeps running, the detected class comes
 * and goes, and none of that should wipe a result the user is still reading.
 * `subject` records which item it was generated for so the UI can say so, and
 * the only ways to lose it are `clear()` or asking about something else.
 *
 * Requests are manual (`request(detection)`), so a model call happens once per
 * item the user actually asks about rather than on every camera frame.
 *
 * status: idle | loading | ready | error
 */
export function useDisposalAdvice() {
  const [state, setState] = useState(IDLE);
  const controllerRef = useRef(null);

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  useEffect(() => abort, [abort]);

  /**
   * @param {import("../types/contracts").Detection} detection item to advise on
   * @param {{material?: string|null, location?: object}} [context]
   */
  const request = useCallback(
    async (detection, { material, location } = {}) => {
      if (!detection) return;
      abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      // Snapshot the subject now: `detection` is a live object that will have
      // moved on by the time the response lands.
      const subject = {
        className: detection.className,
        rawClass: detection.rawClass,
        category: detection.category,
        confidence: detection.confidence,
      };
      setState({ status: "loading", advice: null, error: null, subject });

      try {
        const advice = await getDisposalAdvice(
          detection,
          { material, location },
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        setState({ status: "ready", advice, error: null, subject });
      } catch (error) {
        if (controller.signal.aborted || error.name === "AbortError") return;
        setState({ status: "error", advice: null, error, subject });
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [abort]
  );

  const clear = useCallback(() => {
    abort();
    setState(IDLE);
  }, [abort]);

  return { ...state, request, clear };
}
