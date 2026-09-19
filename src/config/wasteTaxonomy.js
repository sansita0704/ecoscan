import {
  AlertTriangle,
  Battery,
  Disc,
  HelpCircle,
  Leaf,
  Newspaper,
  Recycle,
  ShoppingBag,
  Trash2,
} from "lucide-react";

/**
 * FRONTEND RULE LOGIC - not model output.
 *
 * The vision model only ever returns a class name, a confidence and a box. This
 * file groups those class names for presentation, and maps the backend's
 * rule-derived bin string onto a bin presentation. Nothing here is a detection,
 * and no component should present it as one.
 *
 * Keep MATERIAL_BY_CLASS in step with backend/bin_mapping.json - the keys are
 * the model's real class names, and there are exactly these twenty-two.
 */

/** Material families, used by the Waste Guide. Derived from the class name. */
export const MATERIAL_BY_CLASS = {
  plastic_bag: "plastic",
  plastic_bottle: "plastic",
  plastic_bottle_cap: "plastic",
  plastic_box: "plastic",
  plastic_cultery: "plastic",
  plastic_cup: "plastic",
  plastic_cup_lid: "plastic",
  scrap_plastic: "plastic",
  snack_bag: "plastic",
  straw: "plastic",
  cardboard_bowl: "paper",
  cardboard_box: "paper",
  reuseable_paper: "paper",
  scrap_paper: "paper",
  can: "metal",
  battery: "hazardous",
  light_bulb: "hazardous",
  chemical_plastic_bottle: "hazardous",
  chemical_plastic_gallon: "hazardous",
  chemical_spray_can: "hazardous",
  paint_bucket: "hazardous",
  stick: "organic",
};

export const MATERIALS = {
  plastic: {
    id: "plastic",
    name: "Plastic",
    blurb: "Bottles, caps, cups, cutlery, bags and film.",
    tint: "#8B5CF6",
    classes: [
      "plastic_bottle", "plastic_bottle_cap", "plastic_cup", "plastic_cup_lid",
      "plastic_box", "plastic_cultery", "plastic_bag", "scrap_plastic", "snack_bag", "straw",
    ],
  },
  paper: {
    id: "paper",
    name: "Paper & Card",
    blurb: "Cardboard boxes, bowls and loose paper.",
    tint: "#3B82F6",
    classes: ["cardboard_box", "cardboard_bowl", "reuseable_paper", "scrap_paper"],
  },
  metal: {
    id: "metal",
    name: "Metal",
    blurb: "Aluminium and steel cans.",
    tint: "#EC4899",
    classes: ["can"],
  },
  hazardous: {
    id: "hazardous",
    name: "Hazardous & E-Waste",
    blurb: "Batteries, bulbs, chemical containers and paint.",
    tint: "#EF4444",
    classes: [
      "battery", "light_bulb", "chemical_plastic_bottle", "chemical_plastic_gallon",
      "chemical_spray_can", "paint_bucket",
    ],
  },
  organic: {
    id: "organic",
    name: "Organic",
    blurb: "Wood and garden waste.",
    tint: "#22C55E",
    classes: ["stick"],
  },
};

export const MATERIAL_LIST = Object.values(MATERIALS);

/**
 * Bins.
 *
 * These four are the scoring/statistics buckets - `id` is what the scan log
 * counts and awards points by (see services/scanHistory.js), so the set of ids
 * must stay exactly these four.
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

/**
 * Presentation for each bin string the backend can return, keyed exactly as
 * backend/bin_mapping.json writes it. Each one inherits the styling of one of
 * the four scoring buckets above but keeps its own label, icon and colour, so
 * "Dry / Metal" doesn't have to masquerade as a generic recyclable.
 *
 * Composting is a diversion route, not disposal, so "Wet / Organic" scores in
 * the `recyclable` bucket rather than as landfill.
 */
export const BIN_BY_CATEGORY = {
  "Dry / Recyclable": {
    ...BINS.recyclable,
    bin: "Blue dry-waste bin",
    note: "Clean, dry materials that can be reprocessed.",
    icon: Recycle,
    hex: "#3B82F6",
  },
  "Dry / Paper": {
    ...BINS.recyclable,
    label: "Dry / Paper",
    bin: "Paper & card recycling",
    note: "Keep it dry and flattened. Grease-stained card doesn't qualify.",
    icon: Newspaper,
    hex: "#10B981",
  },
  "Dry / Metal": {
    ...BINS.recyclable,
    label: "Dry / Metal",
    bin: "Metal recycling bin",
    note: "Rinse before binning. Metal can be reprocessed indefinitely.",
    icon: Disc,
    hex: "#6366F1",
  },
  "Dry / Soft Plastic": {
    ...BINS.recyclable,
    label: "Dry / Soft Plastic",
    bin: "Soft-plastic drop-off",
    note: "Rarely accepted kerbside. Bundle it and use a collection point.",
    icon: ShoppingBag,
    hex: "#3B82F6",
  },
  "Wet / Organic": {
    ...BINS.recyclable,
    label: "Wet / Organic",
    bin: "Green wet-waste / compost bin",
    note: "Compostable organic matter.",
    icon: Leaf,
    hex: "#22C55E",
  },
  "General / Landfill": {
    ...BINS.landfill,
    label: "General / Landfill",
    bin: "Grey general-waste bin",
    note: "Not recoverable through kerbside recycling.",
    icon: Trash2,
    hex: "#6B7280",
  },
  "General / Non-Recyclable": {
    ...BINS.landfill,
    label: "General / Non-Recyclable",
    bin: "Grey general-waste bin",
    note: "No mechanical recycling route for this material.",
    icon: Trash2,
    hex: "#6B7280",
  },
  Hazardous: {
    ...BINS.hazardous,
    label: "Hazardous",
    bin: "Designated hazardous drop-off",
    note: "Chemical residue. Never place in kerbside bins.",
    icon: AlertTriangle,
    hex: "#DC2626",
  },
  "Hazardous / E-Waste": {
    ...BINS.hazardous,
    label: "Hazardous / E-Waste",
    bin: "E-waste / battery drop-off",
    note: "Fire and contamination risk. Take it to an e-waste collection point.",
    icon: Battery,
    hex: "#EF4444",
  },
};

/** Map the backend's bin string onto a bin presentation. */
export function getBin(category = "") {
  const exact = BIN_BY_CATEGORY[String(category).trim()];
  if (exact) return exact;

  // Fallback for anything not in bin_mapping.json (an unmapped class, or an
  // older cached scan log entry).
  const c = String(category).toLowerCase();
  if (c.includes("hazard")) return BINS.hazardous;
  if (c.includes("recyclable") && !c.includes("non-recyclable")) return BINS.recyclable;
  if (c.includes("organic") || c.includes("compost")) return BINS.recyclable;
  if (c.includes("landfill") || c.includes("general")) return BINS.landfill;
  return BINS.unknown;
}

export function getMaterial(className) {
  return MATERIALS[MATERIAL_BY_CLASS[className]] ?? null;
}

/**
 * Confidence banding. HIGH/MEDIUM are presentation only; LOW is never seen in
 * practice because the backend already discards anything under its own
 * threshold (ECOSCAN_CONF, default 0.25) before responding.
 */
export const CONFIDENCE_FLOOR = 0.25;

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
