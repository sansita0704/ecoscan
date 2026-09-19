import { useCallback, useEffect, useRef, useState } from "react";
import { getDisposalAdvice } from "../services/adviceService";

const IDLE = { status: "idle", advice: null, error: null, subject: null };

/**
 * Holds disposal advice for several items at once, one independent request per
 * item (keyed by `detection.trackId` - see utils/objectTracker).
 *
 * This is the multi-item sibling of useDisposalAdvice: when several products
 * are in frame together (e.g. everything pulled out of one poly bag), each
 * gets its own "Get advice" button and its own answer, so asking about the
 * battery doesn't clear what you already learned about the bottle.
 *
 * An item's advice is only reachable while its card is on screen, so unlike
 * the single-item hook it does NOT outlive the item leaving the frame - once
 * an item's track is gone there's nowhere left to show its answer.
 *
 * status per item: idle | loading | ready | error
 */
export function useMultiDisposalAdvice() {
  const [byTrack, setByTrack] = useState({});
  // One in-flight AbortController per track, so asking again about the same
  // item cancels its own previous request without touching anyone else's.
  const controllersRef = useRef(new Map());

  const abortOne = useCallback((trackId) => {
    controllersRef.current.get(trackId)?.abort();
    controllersRef.current.delete(trackId);
  }, []);

  useEffect(
    () => () => {
      for (const controller of controllersRef.current.values()) controller.abort();
      controllersRef.current.clear();
    },
    []
  );

  /**
   * @param {number} trackId
   * @param {import("../types/contracts").Detection} detection item to advise on
   * @param {{material?: string|null, location?: object}} [context]
   */
  const request = useCallback(
    async (trackId, detection, { material, location } = {}) => {
      if (trackId == null || !detection) return;
      abortOne(trackId);
      const controller = new AbortController();
      controllersRef.current.set(trackId, controller);

      // Snapshot the subject now: `detection` is a live object that will have
      // moved on (or vanished) by the time the response lands.
      const subject = {
        className: detection.className,
        rawClass: detection.rawClass,
        category: detection.category,
        confidence: detection.confidence,
      };
      setByTrack((prev) => ({ ...prev, [trackId]: { status: "loading", advice: null, error: null, subject } }));

      try {
        const advice = await getDisposalAdvice(
          detection,
          { material, location },
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        setByTrack((prev) => ({ ...prev, [trackId]: { status: "ready", advice, error: null, subject } }));
      } catch (error) {
        if (controller.signal.aborted || error.name === "AbortError") return;
        setByTrack((prev) => ({ ...prev, [trackId]: { status: "error", advice: null, error, subject } }));
      } finally {
        if (controllersRef.current.get(trackId) === controller) controllersRef.current.delete(trackId);
      }
    },
    [abortOne]
  );

  const clear = useCallback(
    (trackId) => {
      abortOne(trackId);
      setByTrack((prev) => {
        if (!(trackId in prev)) return prev;
        const next = { ...prev };
        delete next[trackId];
        return next;
      });
    },
    [abortOne]
  );

  /** @returns this item's advice state, or the idle default if it's never been asked about. */
  const get = useCallback((trackId) => byTrack[trackId] ?? IDLE, [byTrack]);

  return { byTrack, get, request, clear };
}
