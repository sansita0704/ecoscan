import { createClassVoter } from "./classVoter";

/**
 * Multi-object version of classVoter's hysteresis.
 *
 * The backend already returns every item it sees each tick (see
 * services/detectionService). Before this existed, hooks/useDetection ran a
 * single global class vote across the whole frame, so only ONE item could ever
 * be "confirmed" and shown - everything else in a cluttered scene was thrown
 * away even though the model found it.
 *
 * This tracks each physical object across ticks (matched by box position, not
 * class) and runs its own independent classVoter, so:
 *  - Several items in frame at once are each confirmed and shown independently.
 *  - Each one still gets the same flicker resistance as before: a label has to
 *    win a majority of recent sightings before it's trusted, so a single
 *    misread frame can't swap what's on screen.
 *
 * This does NOT fix the model calling the wrong class outright (that's a
 * training-data problem, not a tracking one) - it only stops a transient
 * misread from being displayed as if it were a stable reading.
 */

const MATCH_IOU = 0.2;
const MAX_TRACKS = 24;

function iou(a, b) {
  const ax2 = a.x + a.w;
  const ay2 = a.y + a.h;
  const bx2 = b.x + b.w;
  const by2 = b.y + b.h;
  const interW = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
  const interH = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
  const inter = interW * interH;
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}

/** Mirrors backend/main.py's _prominence(): confidence, favouring large centred boxes. */
function prominence(confidence, box) {
  const area = Math.max(0, box.w) * Math.max(0, box.h);
  const size = Math.sqrt(Math.min(1, area));
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const offset = Math.hypot(cx - 0.5, cy - 0.5) / Math.sqrt(0.5);
  const centrality = 1 - Math.min(1, offset);
  return confidence * (0.55 + 0.45 * size) * (0.78 + 0.22 * centrality);
}

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

export function createObjectTracker({
  windowSize,
  adoptVotes,
  keepVotes,
  maxMisses,
  boxSmoothing,
  confidenceSmoothing,
}) {
  let tracks = [];
  let nextId = 1;
  let primaryId = null;

  function makeTrack() {
    return {
      id: nextId++,
      box: null,
      smoothedBox: null,
      smoothedConfidence: 0,
      misses: 0,
      voter: createClassVoter({ windowSize, adoptVotes, keepVotes, maxMisses }),
      lastSeenByClass: new Map(),
      shownClass: null,
    };
  }

  function applyMatch(track, item) {
    track.misses = 0;
    track.lastSeenByClass.set(item.rawClass, item);
    track.shownClass = track.voter.push(item.rawClass);
    const continuing = track.box != null;
    track.box = item.box;
    track.smoothedBox = continuing ? smoothBox(track.smoothedBox, item.box, boxSmoothing) : item.box;
    track.smoothedConfidence = continuing
      ? smooth(track.smoothedConfidence, item.confidence, confidenceSmoothing)
      : item.confidence;
  }

  /**
   * @param {object[]} items this tick's detections (rawClass, box, confidence, ...), [] if none.
   * @returns {{ primary: object|null, all: object[] }} confirmed items only, most prominent first.
   */
  function push(items) {
    const usedTrackIds = new Set();

    // Greedy nearest-box match: each item claims the closest unclaimed track.
    // Matching on position (not class) is what lets a label flicker
    // bottle -> cup -> bottle on the SAME object without it being treated as
    // three different objects.
    for (const item of items) {
      let best = null;
      let bestIoU = 0;
      for (const t of tracks) {
        if (usedTrackIds.has(t.id) || !t.box) continue;
        const v = iou(t.box, item.box);
        if (v > bestIoU) {
          bestIoU = v;
          best = t;
        }
      }
      if (best && bestIoU >= MATCH_IOU) {
        usedTrackIds.add(best.id);
        applyMatch(best, item);
      } else if (tracks.length < MAX_TRACKS) {
        const t = makeTrack();
        applyMatch(t, item);
        tracks.push(t);
        usedTrackIds.add(t.id);
      }
      // Beyond MAX_TRACKS, an unmatched item is dropped for this tick rather
      // than growing the track list without bound in a very noisy scene.
    }

    // Anything not claimed this tick genuinely wasn't seen.
    for (const t of tracks) {
      if (usedTrackIds.has(t.id)) continue;
      t.misses += 1;
      t.voter.push(null);
    }
    tracks = tracks.filter((t) => t.misses < maxMisses);

    const confirmed = [];
    for (const t of tracks) {
      if (!t.shownClass) continue;
      const item = t.lastSeenByClass.get(t.shownClass);
      if (!item) continue;
      confirmed.push({
        ...item,
        box: t.smoothedBox,
        confidence: t.smoothedConfidence,
        trackId: t.id,
        prominenceScore: prominence(t.smoothedConfidence, t.smoothedBox),
      });
    }
    confirmed.sort((a, b) => b.prominenceScore - a.prominenceScore);

    // The headline item (what the result panel describes) keeps hysteresis
    // too: don't let it swap to a marginally more prominent item every tick.
    let primary = confirmed.find((c) => c.trackId === primaryId) ?? null;
    const top = confirmed[0] ?? null;
    if (!primary) {
      primary = top;
    } else if (top && top.trackId !== primaryId && top.prominenceScore > primary.prominenceScore * 1.15) {
      primary = top;
    }
    primaryId = primary?.trackId ?? null;

    return { primary, all: confirmed };
  }

  function reset() {
    tracks = [];
    primaryId = null;
  }

  return { push, reset };
}
