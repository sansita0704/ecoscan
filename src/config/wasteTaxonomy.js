import { AlertTriangle, HelpCircle, Recycle, Trash2 } from "lucide-react";

/**
 * FRONTEND RULE LOGIC - not model output.
 *
 * The vision model only ever returns a class name, a confidence and a box. This
 * file groups those class names for presentation, and maps the backend's
 * rule-derived `category` string onto a bin. Nothing here is a detection, and
 * no component should present it as one.
 *
 * Keep MATERIAL_BY_CLASS in step with backend/waste_rules.py - the keys are the
 * model's real class names, and there are exactly these eleven.
 */

/** Material families, used by the Waste Guide. Derived from the class name. */
export const MATERIAL_BY_CLASS = {
  plastic_bottle: "plastic",
  bottle_cap: "plastic",
  straw: "plastic",
  styrofoam: "plastic",
  wrapper: "plastic",
  carton: "paper",
  cup: "paper",
  glass_bottle: "glass",
  broken_glass: "glass",
  can: "metal",
  pop_tab: "metal",
};

export const MATERIALS = {
  plastic: {
    id: "plastic",
    name: "Plastic",
    blurb: "Bottles, caps, film and foam.",
    tint: "#8B5CF6",
    classes: ["plastic_bottle", "bottle_cap", "straw", "styrofoam", "wrapper"],
  },
  paper: {
    id: "paper",
    name: "Paper & Card",
    blurb: "Cartons and poly-coated cups.",
    tint: "#3B82F6",
    classes: ["carton", "cup"],
  },
  glass: {
    id: "glass",
    name: "Glass",
    blurb: "Bottles, jars and broken shards.",
    tint: "#22D3EE",
    classes: ["glass_bottle", "broken_glass"],
  },
  metal: {
    id: "metal",
    name: "Metal",
    blurb: "Aluminium cans and pull tabs.",
    tint: "#EC4899",
    classes: ["can", "pop_tab"],
  },
};

export const MATERIAL_LIST = Object.values(MATERIALS);

/**
 * Bins. `match` tests the backend's rule-derived category string, so a change
 * to waste_rules.py surfaces here rather than being silently miscoloured.
 */
export const BINS = {
  recyclable: {
    id: "recyclable",
    label: "Dry / Recyclable",
    bin: "Blue dry-waste bin",
    note: "Clean, dry materials that can be reprocessed.",
    icon: Recycle,
    hex: "#22C55E",
    ring: "ring-success-500/40",
    text: "text-success-400",
    surface: "bg-success-500/10",
    border: "border-success-500/35",
    bar: "bg-success-500",
  },
  landfill: {
    id: "landfill",
    label: "General / Landfill",
    bin: "Grey general-waste bin",
    note: "Not recoverable through kerbside recycling.",
    icon: Trash2,
    hex: "#F59E0B",
    ring: "ring-warn-500/40",
    text: "text-warn-400",
    surface: "bg-warn-500/10",
    border: "border-warn-500/35",
    bar: "bg-warn-500",
  },
  hazardous: {
    id: "hazardous",
    label: "Hazardous / Special",
    bin: "Designated hazardous drop-off",
    note: "Handle with care. Never place in kerbside bins.",
    icon: AlertTriangle,
    hex: "#EF4444",
    ring: "ring-danger-500/40",
    text: "text-danger-400",
    surface: "bg-danger-500/10",
    border: "border-danger-500/35",
    bar: "bg-danger-500",
  },
  unknown: {
    id: "unknown",
    label: "Check locally",
    bin: "Council guidance",
    note: "No rule matched this item.",
    icon: HelpCircle,
    hex: "#94A3B8",
    ring: "ring-white/20",
    text: "text-slate-300",
    surface: "bg-white/5",
    border: "border-white/15",
    bar: "bg-slate-400",
  },
};

/** Map the backend's category string onto a bin. */
export function getBin(category = "") {
  const c = String(category).toLowerCase();
  if (c.includes("hazard")) return BINS.hazardous;
  if (c.includes("recyclable") && !c.includes("non-recyclable")) return BINS.recyclable;
  if (c.includes("landfill") || c.includes("general")) return BINS.landfill;
  return BINS.unknown;
}

export function getMaterial(className) {
  return MATERIALS[MATERIAL_BY_CLASS[className]] ?? null;
}

/**
 * Confidence banding. HIGH/MEDIUM are presentation only; LOW is never seen in
 * practice because the backend already discards anything under its own
 * threshold (ECOSCAN_CONF, default 0.35) before responding.
 */
export const CONFIDENCE_FLOOR = 0.35;

export function getConfidenceBand(confidence) {
  if (confidence >= 0.75) {
    return { id: "high", label: "High confidence", hint: null, hex: "#22C55E", text: "text-success-400" };
  }
  if (confidence >= 0.5) {
    return {
      id: "medium",
      label: "Medium confidence",
      hint: "Hold the item steady, closer to the camera.",
      hex: "#F59E0B",
      text: "text-warn-400",
    };
  }
  return {
    id: "low",
    label: "Low confidence",
    hint: "Try another angle or better lighting.",
    hex: "#EF4444",
    text: "text-danger-400",
  };
}
