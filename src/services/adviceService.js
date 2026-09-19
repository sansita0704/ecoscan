import { request } from "./http";

/**
 * POST /api/ai/advice
 *
 * Called ONLY when the user asks for advice on a confirmed detection - never
 * from the detection loop. Sends just what the pipeline genuinely knows about
 * the item; the server adds real facilities and calls the language model on our
 * behalf, so no API key is ever present in the browser.
 *
 * @param {import("../types/contracts").Detection} detection
 * @param {{material?: string|null, location?: {label?: string, lat?: number, lon?: number}}} context
 * @returns {Promise<import("../types/contracts").DisposalAdvice>}
 */
export async function getDisposalAdvice(detection, { material, location } = {}, { signal } = {}) {
  const raw = await request("/api/ai/advice", {
    method: "POST",
    signal,
    json: {
      detection: {
        // Real model output
        className: detection.rawClass ?? detection.className,
        confidence: detection.confidence,
        // Rule-table values, passed through so the model can build on them
        label: detection.className,
        category: detection.category,
        materialGrade: detection.grade,
        weightG: detection.weightG,
        contamination: detection.contamination,
        steps: detection.steps,
      },
      material: material ?? null,
      location: location ?? null,
    },
  });

  return {
    status: raw.status,
    source: raw.source,
    degraded: !!raw.degraded,
    model: raw.model ?? null,
    message: raw.message ?? null,
    threshold: raw.threshold ?? null,
    summary: raw.summary ?? null,
    segregation: raw.segregation ?? null,
    actions: raw.actions ?? [],
    preparation: raw.preparation ?? [],
    safety: raw.safety ?? null,
    finalAction: raw.finalAction ?? null,
    facilities: raw.facilities ?? [],
    facilitySource: raw.facilitySource ?? null,
    facilityNote: raw.facilityNote ?? null,
    searchRadiusKm: raw.searchRadiusKm ?? null,
  };
}
