// Everything here is placeholder data used while VITE_USE_MOCK=true.
// Delete this file once every service talks to the real backend.

export function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

// Already in the UI's Detection shape (see src/types/contracts.js): the mock
// path bypasses the backend adapter. Two items, in different bins, so the
// multi-box overlay and the "separate before disposal" notice both show up.
export const MOCK_DETECTION = {
  className: "Plastic Bottle",
  rawClass: "plastic_bottle",
  bin: "Dry / Recyclable",
  category: "Dry / Recyclable",
  color: "#3B82F6",
  tip: "Empty liquids and crush before discarding.",
  isHazardous: false,
  confidence: 0.964,
  steps: ["Empty liquids and crush before discarding."],
  box: { x: 0.34, y: 0.22, w: 0.26, h: 0.56 },
};

const MOCK_SECONDARY = {
  className: "Battery",
  rawClass: "battery",
  bin: "Hazardous / E-Waste",
  category: "Hazardous / E-Waste",
  color: "#EF4444",
  tip: "Fire hazard! Do NOT throw in normal bins. Take to nearest battery drop-off.",
  isHazardous: true,
  confidence: 0.781,
  steps: ["Fire hazard! Do NOT throw in normal bins. Take to nearest battery drop-off."],
  box: { x: 0.68, y: 0.54, w: 0.11, h: 0.19 },
};

export async function mockDetect(signal) {
  await wait(12 + Math.random() * 6, signal);
  const jitter = () => (Math.random() - 0.5) * 0.016;
  const drift = (item) => ({
    ...item,
    box: { ...item.box, x: item.box.x + jitter(), y: item.box.y + jitter() },
  });

  const items = [drift(MOCK_DETECTION), drift(MOCK_SECONDARY)];
  return { ...items[0], totalItems: items.length, detections: items };
}

export const MOCK_LEDGER = {
  points: 340,
  streakDays: 5,
  itemsScanned: 28,
  accuracyPct: 98.2,
  co2OffsetKg: 4.2,
  weekly: [
    { day: "Mon", items: 3 },
    { day: "Tue", items: 5 },
    { day: "Wed", items: 2 },
    { day: "Thu", items: 6 },
    { day: "Fri", items: 4 },
    { day: "Sat", items: 7 },
    { day: "Sun", items: 1 },
  ],
};

// Mirrors the shape of GET /api/v1/waste-rules for the no-backend demo path.
// Keep in step with backend/bin_mapping.json (the 22-class taxonomy).
const RULE = (displayName, bin, color, hazardous = false) => ({
  display_name: displayName,
  bin,
  color,
  tip: "",
  is_hazardous: hazardous,
});

const RECYCLABLE = "#3B82F6";
const PAPER = "#10B981";
const GENERAL = "#6B7280";
const HAZARD = "#DC2626";

export const MOCK_WASTE_RULES = {
  classes: [
    "battery", "can", "cardboard_bowl", "cardboard_box", "chemical_plastic_bottle",
    "chemical_plastic_gallon", "chemical_spray_can", "light_bulb", "paint_bucket",
    "plastic_bag", "plastic_bottle", "plastic_bottle_cap", "plastic_box",
    "plastic_cultery", "plastic_cup", "plastic_cup_lid", "reuseable_paper",
    "scrap_paper", "scrap_plastic", "snack_bag", "stick", "straw",
  ],
  rules: {
    battery: RULE("Battery", "Hazardous / E-Waste", "#EF4444", true),
    can: RULE("Can", "Dry / Metal", "#6366F1"),
    cardboard_bowl: RULE("Cardboard Bowl", "Dry / Paper", PAPER),
    cardboard_box: RULE("Cardboard Box", "Dry / Paper", PAPER),
    chemical_plastic_bottle: RULE("Chemical Plastic Bottle", "Hazardous", HAZARD, true),
    chemical_plastic_gallon: RULE("Chemical Plastic Gallon", "Hazardous", HAZARD, true),
    chemical_spray_can: RULE("Chemical Spray Can", "Hazardous", HAZARD, true),
    light_bulb: RULE("Light Bulb", "Hazardous / E-Waste", "#F59E0B", true),
    paint_bucket: RULE("Paint Bucket", "Hazardous", HAZARD, true),
    plastic_bag: RULE("Plastic Bag", "Dry / Soft Plastic", RECYCLABLE),
    plastic_bottle: RULE("Plastic Bottle", "Dry / Recyclable", RECYCLABLE),
    plastic_bottle_cap: RULE("Plastic Bottle Cap", "Dry / Recyclable", RECYCLABLE),
    plastic_box: RULE("Plastic Box", "Dry / Recyclable", RECYCLABLE),
    plastic_cultery: RULE("Plastic Cultery", "General / Non-Recyclable", GENERAL),
    plastic_cup: RULE("Plastic Cup", "Dry / Recyclable", RECYCLABLE),
    plastic_cup_lid: RULE("Plastic Cup Lid", "Dry / Recyclable", RECYCLABLE),
    reuseable_paper: RULE("Reuseable Paper", "Dry / Paper", PAPER),
    scrap_paper: RULE("Scrap Paper", "Dry / Paper", PAPER),
    scrap_plastic: RULE("Scrap Plastic", "Dry / Recyclable", RECYCLABLE),
    snack_bag: RULE("Snack Bag", "General / Landfill", GENERAL),
    stick: RULE("Stick", "Wet / Organic", "#22C55E"),
    straw: RULE("Straw", "General / Landfill", GENERAL),
  },
};


export const MOCK_LEADERBOARD = [
  { id: "1", name: "Aarav M.", points: 1280, streakDays: 21 },
  { id: "2", name: "Ishita R.", points: 1104, streakDays: 14 },
  { id: "3", name: "You", points: 340, streakDays: 5, isYou: true },
  { id: "4", name: "Kabir S.", points: 322, streakDays: 3 },
  { id: "5", name: "Meera T.", points: 298, streakDays: 6 },
];

export function mockToken(detection) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const code = (detection.rawClass ?? "GEN").toUpperCase().replace(/[^A-Z0-9]+/g, "-");
  return `ECO-${code}-${rand}`;
}
