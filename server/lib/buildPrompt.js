/**
 * Builds the advice prompt from ONLY what the pipeline genuinely knows.
 *
 * The provenance split is spelled out to the model on purpose: the vision model
 * contributes a class name and a confidence, and everything else is a static
 * lookup table. Without that framing the model happily writes things like "the
 * scan shows residue inside", which nothing in this system can actually observe.
 */

export const SYSTEM_PROMPT = `You advise people on what to do with a single item of waste they have just scanned.

Ground rules:
- The vision model reports ONLY an object class and a confidence score. It cannot see condition, contents, residue, damage, brand, age or material thickness. Never imply it did.
- Fields labelled RULE come from a fixed lookup table keyed by the class name. They are generic defaults for that class, not observations of this particular item. Treat them as defaults you may qualify (e.g. "if it held a sugary drink, rinse it").
- Never mention specific facilities, shops, addresses, phone numbers, distances or opening hours. Real nearby locations are attached separately from a maps database.
- Be concrete and practical. Prefer short imperative sentences over hedging.
- Write for a general adult audience. No emoji.
- Cover the full range of options in "actions": reuse, clean, repair, repurpose, recycle and disposal. If an option genuinely does not suit this item, still include it with suitability "not_advised" and say why in one clause.
- Set "safety" only when there is a real hazard (sharp edges, chemical residue, pressurised container). Otherwise return an empty string.`;

export function buildPrompt(input) {
  const { detection, material, location } = input;
  const c = detection.contamination;

  const lines = [
    "VISION MODEL OUTPUT (the only machine perception available):",
    `- detected class: ${detection.className}`,
    `- confidence: ${(detection.confidence * 100).toFixed(1)}%`,
    "",
    "RULE TABLE VALUES for that class (static defaults, not observations):",
    `- RULE display label: ${detection.label}`,
    `- RULE bin routing: ${detection.category}`,
  ];

  if (detection.isHazardous) {
    lines.push("- RULE hazard flag: this class is flagged for hazardous / special handling.");
  }
  // The 22-class bin mapping carries no grade or weight; older payloads may.
  if (detection.materialGrade && detection.materialGrade !== "unknown") {
    lines.push(`- RULE material grade: ${detection.materialGrade}`);
  }
  if (detection.weightG != null) {
    lines.push(`- RULE typical weight for this class: ${detection.weightG} g`);
  }

  if (c) {
    lines.push(
      `- RULE preparation risk for this class: ${c.level} (${c.label}). This is a fixed per-class default and was NOT measured on this item.`
    );
  }
  if (detection.steps?.length) {
    lines.push("- RULE existing preparation steps:");
    for (const s of detection.steps) lines.push(`    * ${s}`);
  }
  if (material) {
    lines.push(`- APP RULE material family: ${material}`);
  }

  lines.push("");
  lines.push(
    location?.label || location?.lat != null
      ? `USER LOCATION: ${location.label ?? "unnamed"}${
          location.lat != null ? ` (${location.lat.toFixed(3)}, ${location.lon.toFixed(3)})` : ""
        }. Tailor conventions and terminology to this region, but do not name any specific facility.`
      : "USER LOCATION: unknown. Keep guidance general and avoid region-specific bin colours."
  );
  lines.push("");
  lines.push(
    "Give segregation guidance, a spread of practical actions, ordered preparation steps, any genuine safety warning, and a single best final action."
  );

  return lines.join("\n");
}
