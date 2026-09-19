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

export const MOCK_DETECTION = {
  className: "PET Plastic Bottle",
  rawClass: "plastic_bottle",
  category: "Dry / Recyclable",
  confidence: 0.964,
  weightG: 28.5,
  grade: "PET-01",
  contamination: { level: "Low", label: "Clean", score: 0.14 },
  steps: [
    "Unscrew cap & separate collar.",
    "Rinse container of left-over liquid.",
    "Place bottle in Blue Dry-Waste Bin.",
  ],
  box: { x: 0.34, y: 0.22, w: 0.26, h: 0.56 },
};

export async function mockDetect(signal) {
  await wait(12 + Math.random() * 6, signal);
  const jitter = () => (Math.random() - 0.5) * 0.016;
  const box = {
    ...MOCK_DETECTION.box,
    x: MOCK_DETECTION.box.x + jitter(),
    y: MOCK_DETECTION.box.y + jitter(),
  };
  return {
    ...MOCK_DETECTION,
    box,
    detections: [
      {
        className: MOCK_DETECTION.className,
        rawClass: MOCK_DETECTION.rawClass,
        category: MOCK_DETECTION.category,
        confidence: MOCK_DETECTION.confidence,
        box,
      },
    ],
  };
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
const RULE = (label, category, grade) => ({
  label,
  category,
  material_grade: grade,
  weight_g: 0,
  contamination: { level: "Low", label: "Unknown", score: 0.1 },
  steps: [],
});

export const MOCK_WASTE_RULES = {
  classes: [
    "plastic_bottle", "wrapper", "can", "carton", "cup",
    "bottle_cap", "glass_bottle", "straw", "broken_glass", "styrofoam", "pop_tab",
  ],
  rules: {
    plastic_bottle: RULE("PET Plastic Bottle", "Dry / Recyclable", "PET-01"),
    wrapper: RULE("Food Wrapper / Film", "Non-Recyclable / Landfill", "Multi-layer Plastic"),
    can: RULE("Aluminum Beverage Can", "Dry / Recyclable", "ALU-41"),
    carton: RULE("Beverage / Liquid Carton", "Dry / Recyclable", "TetraPak / PAP-21"),
    cup: RULE("Disposable Coffee / Drink Cup", "Mixed / Landfill", "PAP-PE Composite"),
    bottle_cap: RULE("Plastic Bottle Cap", "Dry / Recyclable", "HDPE-02"),
    glass_bottle: RULE("Glass Bottle / Jar", "Dry / Recyclable", "GL-70"),
    straw: RULE("Plastic Straw", "Non-Recyclable / Landfill", "PP-05 Single-Use"),
    broken_glass: RULE("Broken Glass Shards", "Hazardous / Safe Disposal", "GL-Hazardous"),
    styrofoam: RULE("Styrofoam Container / EPS", "Non-Recyclable / Landfill", "PS-06"),
    pop_tab: RULE("Aluminum Can Pop Tab", "Dry / Recyclable", "ALU-41"),
  },
};

export const MOCK_HUB = {
  name: "GreenLoop Recycling Hub",
  distanceKm: 0.8,
  hours: "Open until 8:00 PM",
  lat: 26.9124,
  lng: 75.7873,
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
  return `ECO-${detection.grade}-${rand}`;
}
