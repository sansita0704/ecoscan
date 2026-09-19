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
 *   "label": "PET Plastic Bottle", "category": "Dry / Recyclable",
 *   "confidence": 0.964, "weight_g": 28.5, "material_grade": "PET-01",
 *   "contamination": { "level": "Low", "label": "Clean", "score": 0.14 },
 *   "steps": ["..."],
 *   "bbox": { "x": 0.34, "y": 0.22, "w": 0.26, "h": 0.56 },
 *   "detections": [ { "label": "...", "confidence": 0.9, "bbox": {...} }, ... ]
 * }
 * The top level describes the most prominent item; `detections` lists every box
 * (that item first). `label` is absent when nothing is detected.
 */
function toDetection(raw) {
  if (!raw || !raw.label) return null;
  return {
    className: raw.label,
    // The model's own class id (e.g. "plastic_bottle"). `className` above is the
    // human label from the rule table; anything keyed by the model's taxonomy
    // must use this instead.
    rawClass: raw.class_name,
    category: raw.category,
    confidence: raw.confidence,
    weightG: raw.weight_g,
    grade: raw.material_grade,
    contamination: raw.contamination,
    steps: raw.steps ?? [],
    box: raw.bbox,
    detections: (raw.detections ?? []).map((d) => ({
      className: d.label,
      rawClass: d.class_name,
      category: d.category,
      confidence: d.confidence,
      box: d.bbox,
    })),
  };
}

/**
 * Run detection on the current video frame.
 *
 * To run the model in the browser instead of over HTTP (ONNX Runtime Web /
 * TensorFlow.js), replace the body of the non-mock branch: pass `video`
 * straight to the model and map its output through `toDetection`.
 *
 * @param {HTMLVideoElement} video
 * @param {{signal?: AbortSignal}} [opts]
 * @returns {Promise<import("../types/contracts").Detection | null>}
 */
export async function detect(video, { signal } = {}) {
  if (USE_MOCK) return mockDetect(signal);

  // Un-mirrored, downscaled frame: the mirror toggle is display-only.
  const frame = await grabFrame(video, { maxWidth: 640, quality: 0.7 });
  if (!frame) return null;

  const body = new FormData();
  body.append("frame", frame, "frame.jpg");
  return toDetection(await request("/api/v1/detect", { method: "POST", body, signal }));
}
