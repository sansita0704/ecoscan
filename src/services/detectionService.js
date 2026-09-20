import { USE_MOCK } from "../config/env";
import { grabFrame } from "../utils/frame";
import { request } from "./http";
import { mockDetect } from "./mockData";

/**
 * ADAPTER: convert your model/API response into the UI's Detection shape
 * (see src/types/contracts.js). This is the only place that needs to change
 * if your response format differs.
 *
 * Expected backend response for POST /api/v1/detect:
 * {
 *   "total_items": 2,
 *   "detections": [
 *     {
 *       "label": "plastic_bottle", "display_name": "Plastic Bottle",
 *       "confidence": 0.88, "bbox": [112.5, 45.0, 320.0, 410.5],
 *       "bin": "Dry / Recyclable", "color": "#3B82F6",
 *       "tip": "Empty liquids and crush before discarding.",
 *       "is_hazardous": false
 *     }
 *   ],
 *   "frame": { "w": 960, "h": 720 }
 * }
 *
 * `bbox` is pixel-space [x1, y1, x2, y2] against `frame`; the overlay works in
 * normalised 0..1 coordinates, so it is converted here. Detections arrive
 * most-prominent-first, and detections[0] becomes the panel's headline item.
 */

/** Pixel-space [x1, y1, x2, y2] -> normalised {x, y, w, h}. */
function toNormalisedBox(bbox, frame) {
  if (!Array.isArray(bbox) || bbox.length !== 4) return null;
  const fw = frame?.w;
  const fh = frame?.h;
  if (!fw || !fh) return null;
  const [x1, y1, x2, y2] = bbox;
  return {
    x: x1 / fw,
    y: y1 / fh,
    w: Math.max(0, x2 - x1) / fw,
    h: Math.max(0, y2 - y1) / fh,
  };
}

function toDetectionItem(d, frame) {
  return {
    // Human label for display, e.g. "Plastic Bottle".
    className: d.display_name ?? d.label,
    // The model's own class id (e.g. "plastic_bottle"). Anything keyed by the
    // model's taxonomy must use this rather than `className`.
    rawClass: d.label,
    // Bin routing from backend/bin_mapping.json. `category` is kept as an alias
    // so the advice/logging paths that already read it keep working.
    bin: d.bin,
    category: d.bin,
    color: d.color,
    tip: d.tip,
    isHazardous: !!d.is_hazardous,
    confidence: d.confidence,
    steps: d.tip ? [d.tip] : [],
    box: toNormalisedBox(d.bbox, frame),
  };
}

function toDetection(raw) {
  const items = (raw?.detections ?? [])
    .map((d) => toDetectionItem(d, raw.frame))
    .filter((d) => d.box);
  if (!items.length) return null;

  // Every box in the frame rides on `detections` so the overlay can draw them
  // all; the most prominent one is also spread across the top level, which is
  // what the result panel reads.
  return { ...items[0], totalItems: raw.total_items ?? items.length, detections: items };
}

/**
 * Run detection on the current video frame.
 *
 * To run the model in the browser instead of over HTTP (ONNX Runtime Web /
 * TensorFlow.js), replace the body of the non-mock branch: pass `video`
 * straight to the model and map its output through `toDetection`.
 *
 * @param {HTMLVideoElement} video
 * @param {{signal?: AbortSignal, augment?: boolean}} [opts]
 * @returns {Promise<import("../types/contracts").Detection | null>}
 */
export async function detect(video, { signal, augment = false } = {}) {
  if (USE_MOCK) return mockDetect(signal);

  // Un-mirrored, downscaled frame: the mirror toggle is display-only.
  // Capped at the backend's inference size (imgsz=960) rather than below it:
  // sending a 640px frame would make the model upscale, which is exactly what
  // costs you the small items (caps, batteries, scrap paper) in a busy frame.
  const frame = await grabFrame(video, { maxWidth: 960, quality: 0.75 });
  if (!frame) return null;

  const body = new FormData();
  body.append("frame", frame, "frame.jpg");
  // Deep Scan mode: opts into the same tiled + test-time-augmentation pass
  // Upload Image always uses. Slower (the backend runs several passes under
  // one lock), but since the caller only schedules its next tick after this
  // one resolves (see hooks/useDetection), turning it on naturally slows the
  // live loop to match rather than needing a second timer or tracker.
  if (augment) body.append("augment", "true");
  return toDetection(await request("/api/v1/detect", { method: "POST", body, signal }));
}

/**
 * Run detection on a single uploaded image file (e.g. a photo of everything
 * pulled out of a poly bag) rather than a live camera frame.
 *
 * Sent at full resolution rather than downscaled - unlike the live loop this
 * runs once, not every 150ms, and a poly bag full of small mixed items is
 * exactly the case that benefits most from not throwing detail away before
 * the model (which already resizes internally to ECOSCAN_IMGSZ) sees it.
 *
 * Also opts into the backend's test-time augmentation (`augment` form field)
 * for the same reason: it measurably raises confidence on real detections
 * (~2x on a reflective poly-bag photo, verified) at a latency cost that's
 * fine for a one-off request but would be wrong for the live loop, which
 * never sets it.
 *
 * @param {File|Blob} file
 * @param {{signal?: AbortSignal}} [opts]
 * @returns {Promise<import("../types/contracts").Detection | null>}
 */
export async function detectImage(file, { signal } = {}) {
  if (!file) return null;
  if (USE_MOCK) return mockDetect(signal);

  const body = new FormData();
  body.append("frame", file, file.name || "upload.jpg");
  body.append("augment", "true");
  return toDetection(await request("/api/v1/detect", { method: "POST", body, signal }));
}
