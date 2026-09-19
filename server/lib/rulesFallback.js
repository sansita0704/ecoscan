/**
 * Rules-only advice, used when the language model is unavailable, unconfigured
 * or fails.
 *
 * Produces the same shape as the model path so the UI needs no special case.
 * It says strictly what the existing rule table already says - it does not try
 * to imitate the richer reasoning, and the response is tagged `source: "rules"`
 * so the UI can be honest about which path produced it.
 */

function binFor(category = "") {
  const c = String(category).toLowerCase();
  if (c.includes("hazard")) {
    return { bin: "Designated hazardous drop-off", stream: "Hazardous", hazardous: true };
  }
  if (c.includes("recyclable") && !c.includes("non-recyclable")) {
    return { bin: "Dry recyclables bin", stream: "Dry recyclable", hazardous: false };
  }
  if (c.includes("landfill") || c.includes("general") || c.includes("mixed")) {
    return { bin: "General waste bin", stream: "General waste", hazardous: false };
  }
  return { bin: "Check local guidance", stream: "Unknown", hazardous: false };
}

export function rulesAdvice({ detection, material }) {
  const { bin, stream, hazardous } = binFor(detection.category);
  const risk = detection.contamination;
  const highRisk = hazardous || (risk && (risk.score >= 0.6 || String(risk.level).toLowerCase() === "high"));

  const actions = [];
  if (hazardous) {
    actions.push({
      type: "special_disposal",
      title: "Take to a hazardous drop-off",
      detail: "This class is flagged for special handling in the disposal rules.",
      suitability: "recommended",
    });
  } else if (stream === "Dry recyclable") {
    actions.push({
      type: "recycle",
      title: "Put it in dry recycling",
      detail: `The rules classify this as ${detection.category}.`,
      suitability: "recommended",
    });
    actions.push({
      type: "clean",
      title: "Rinse first",
      detail: "Recyclers reject loads contaminated with food or liquid residue.",
      suitability: "possible",
    });
  } else {
    actions.push({
      type: "general_disposal",
      title: "Put it in general waste",
      detail: `The rules classify this as ${detection.category}.`,
      suitability: "recommended",
    });
    actions.push({
      type: "recycle",
      title: "Kerbside recycling",
      detail: "Not accepted for this class under the configured rules.",
      suitability: "not_advised",
    });
  }

  return {
    source: "rules",
    summary: `${detection.label} is classified as ${detection.category} by the configured disposal rules.`,
    segregation: {
      bin,
      stream,
      tips: detection.steps?.slice(0, 3) ?? ["Follow your local council's guidance."],
    },
    actions,
    preparation: detection.steps?.length ? [...detection.steps] : ["Check the item before disposal."],
    safety: highRisk && risk ? `${risk.level} risk: ${risk.label}. Handle with care.` : null,
    finalAction: {
      type: hazardous ? "special_disposal" : stream === "Dry recyclable" ? "recycle" : "general_disposal",
      why: `Based on the configured disposal rule for ${detection.className}.`,
    },
    material,
    hazardous,
  };
}
