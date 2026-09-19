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
 * Like the original single-item hook, an item's advice outlives it leaving
 * the frame: the Advice pane lists every item ever asked about this session,
 * not just the ones currently in view (that's why `request()` snapshots the
 * detection it was called with - a retry from the Advice pane has to work
 * even after the object has left the camera).
 *
 * status per item: idle | loading | ready | error
 */
export function useMultiDisposalAdvice() {
  const [byTrack, setByTrack] = useState({});
  // One in-flight AbortController per track, so asking again about the same
  // item cancels its own previous request without touching anyone else's.
  const controllersRef = useRef(new Map());
  // `trackId` isn't always a clean sortable number (upload-sourced items use
  // string ids - see hooks/useImageDetection), so "most recently asked about
  // first" in AdviceList is ordered by this instead of by parsing the id.
  const seqRef = useRef(0);

  // `trackId` may be a number (live items - see utils/objectTracker) or a
  // string (upload items - see hooks/useImageDetection). Normalised to a
  // string for the Map key so it always matches what Object.entries(byTrack)
  // hands back to callers like AdviceList, regardless of which kind it is.
  const abortOne = useCallback((trackId) => {
    const key = String(trackId);
    controllersRef.current.get(key)?.abort();
    controllersRef.current.delete(key);
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
    async (trackId, detection, context = {}) => {
      if (trackId == null || !detection) return;
      abortOne(trackId);
      const controller = new AbortController();
      controllersRef.current.set(String(trackId), controller);
      const seq = ++seqRef.current;

      // Snapshot the subject now: `detection` is a live object that will have
      // moved on (or vanished) by the time the response lands. `detection` and
      // `context` are kept too, purely so `retry()` can re-ask without a live
      // item to read from.
      const subject = {
        className: detection.className,
        rawClass: detection.rawClass,
        category: detection.category,
        confidence: detection.confidence,
      };
      setByTrack((prev) => ({
        ...prev,
        [trackId]: { status: "loading", advice: null, error: null, subject, detection, context, seq },
      }));

      try {
        const advice = await getDisposalAdvice(detection, context, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setByTrack((prev) => ({
          ...prev,
          [trackId]: { status: "ready", advice, error: null, subject, detection, context, seq },
        }));
      } catch (error) {
        if (controller.signal.aborted || error.name === "AbortError") return;
        setByTrack((prev) => ({
          ...prev,
          [trackId]: { status: "error", advice: null, error, subject, detection, context, seq },
        }));
      } finally {
        if (controllersRef.current.get(String(trackId)) === controller) controllersRef.current.delete(String(trackId));
      }
    },
    [abortOne]
  );

  /** Re-ask using the same detection/context the last request for this item used. */
  const retry = useCallback(
    (trackId) => {
      const entry = byTrack[trackId];
      if (entry?.detection) request(trackId, entry.detection, entry.context);
    },
    [byTrack, request]
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

  return { byTrack, get, request, retry, clear };
}
