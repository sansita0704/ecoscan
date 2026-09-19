import { useEffect, useState } from "react";
import {
  BOX_SMOOTHING,
  CONFIDENCE_SMOOTHING,
  DETECTION_ADOPT_VOTES,
  DETECTION_INTERVAL_MS,
  DETECTION_KEEP_VOTES,
  DETECTION_MAX_MISSES,
  DETECTION_VOTE_WINDOW,
  MAX_CONSECUTIVE_ERRORS,
} from "../config/constants";
import { detect } from "../services/detectionService";
import { createObjectTracker } from "../utils/objectTracker";

/**
 * Sends frames from the <video> to detectionService on a fixed cadence and
 * runs every item the backend returns through utils/objectTracker, so several
 * items in frame at once are each tracked and confirmed independently rather
 * than the whole panel collapsing onto a single winner. Each tracked object
 * still needs to win a majority of its own recent sightings before it's
 * trusted (see utils/classVoter) - that's what stops one flickered
 * misclassification from swapping what's on screen - and its box/confidence
 * are smoothed frame to frame so the overlay glides instead of jittering.
 *
 * - Requests never overlap (next tick is scheduled after the previous finishes).
 * - `latencyMs` is the real round-trip of the last successful call.
 * - Cleans up (abort + clear) when disabled or unmounted.
 *
 * @returns {{ detection: import("../types/contracts").Detection|null, latencyMs: number|null, error: Error|null }}
 *   `detection` is the most prominent confirmed item, spread with `detections`
 *   holding every confirmed item in the frame (that one first) - same contract
 *   as before, just no longer limited to one item.
 */
export function useDetection(videoRef, enabled) {
  const [detection, setDetection] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setDetection(null);
      setLatencyMs(null);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    let timer;
    let failures = 0;
    const tracker = createObjectTracker({
      windowSize: DETECTION_VOTE_WINDOW,
      adoptVotes: DETECTION_ADOPT_VOTES,
      keepVotes: DETECTION_KEEP_VOTES,
      maxMisses: DETECTION_MAX_MISSES,
      boxSmoothing: BOX_SMOOTHING,
      confidenceSmoothing: CONFIDENCE_SMOOTHING,
    });
    const controller = new AbortController();

    const clear = () => {
      tracker.reset();
      setDetection(null);
    };

    const tick = async () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const startedAt = performance.now();
        try {
          const result = await detect(video, { signal: controller.signal });
          if (cancelled) return;

          const { primary, all } = tracker.push(result?.detections ?? []);
          setDetection(primary ? { ...primary, totalItems: all.length, detections: all } : null);

          setLatencyMs(Math.round(performance.now() - startedAt));
          failures = 0;
          setError(null);
        } catch (err) {
          if (cancelled || err.name === "AbortError") return;
          failures += 1;
          setError(err);
          // Don't leave a stale reading pinned over the feed once the model is gone.
          if (failures >= MAX_CONSECUTIVE_ERRORS) clear();
        }
      }
      if (!cancelled) timer = setTimeout(tick, DETECTION_INTERVAL_MS);
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [videoRef, enabled]);

  return { detection, latencyMs, error };
}
