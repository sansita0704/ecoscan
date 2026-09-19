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
import { createClassVoter } from "../utils/classVoter";

function smooth(prev, next, alpha) {
  return prev + (next - prev) * alpha;
}

function smoothBox(prev, next, alpha) {
  if (!prev) return next;
  return {
    x: smooth(prev.x, next.x, alpha),
    y: smooth(prev.y, next.y, alpha),
    w: smooth(prev.w, next.w, alpha),
    h: smooth(prev.h, next.h, alpha),
  };
}

/**
 * Sends frames from the <video> to detectionService on a fixed cadence and
 * runs the result through a rolling-window vote (see utils/classVoter) so a
 * single flickered misclassification can't swap the whole detail panel.
 * Once a class wins, its box and confidence are smoothed frame to frame so the
 * overlay glides instead of jittering.
 *
 * - Requests never overlap (next tick is scheduled after the previous finishes).
 * - `latencyMs` is the real round-trip of the last successful call.
 * - Cleans up (abort + clear) when disabled or unmounted.
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
    const voter = createClassVoter({
      windowSize: DETECTION_VOTE_WINDOW,
      adoptVotes: DETECTION_ADOPT_VOTES,
      keepVotes: DETECTION_KEEP_VOTES,
      maxMisses: DETECTION_MAX_MISSES,
    });
    // Freshest full Detection seen for each class name, so once a class wins
    // the vote we have its latest box/confidence/steps ready to show.
    const lastSeen = new Map();
    let shown = null;
    const controller = new AbortController();

    const clear = () => {
      voter.reset();
      lastSeen.clear();
      shown = null;
      setDetection(null);
    };

    const tick = async () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const startedAt = performance.now();
        try {
          const result = await detect(video, { signal: controller.signal });
          if (cancelled) return;

          if (result) lastSeen.set(result.className, result);
          const winner = voter.push(result?.className ?? null);

          if (winner) {
            const fresh = lastSeen.get(winner);
            const continuing = shown?.className === winner;
            shown = {
              ...fresh,
              className: winner,
              box: continuing ? smoothBox(shown.box, fresh.box, BOX_SMOOTHING) : fresh.box,
              confidence: continuing
                ? smooth(shown.confidence, fresh.confidence, CONFIDENCE_SMOOTHING)
                : fresh.confidence,
            };
          } else {
            shown = null;
          }
          setDetection(shown);

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
