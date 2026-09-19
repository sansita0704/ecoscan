import { getBin, MATERIAL_BY_CLASS } from "../config/wasteTaxonomy";

/**
 * Local scan log. This is the real record of what THIS browser has scanned -
 * it is written only when the detection loop confirms a new item, so the impact
 * figures respond to actual use rather than being decorative.
 *
 * Stored per-browser in localStorage: it never syncs, and clearing site data
 * resets it. Every read is defensive because storage throws in private mode.
 */
const KEY = "ecoscan.scans.v1";
const LIMIT = 500;

/** Points per item by bin. Frontend scoring rule, not a backend or model value. */
const POINTS_BY_BIN = { recyclable: 10, landfill: 3, hazardous: 15, unknown: 1 };

const dayKey = (ts) => new Date(ts).toISOString().slice(0, 10);

export function loadScans() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(scans) {
  try {
    localStorage.setItem(KEY, JSON.stringify(scans.slice(-LIMIT)));
  } catch {
    /* storage unavailable - the session still works, it just won't persist */
  }
}

/** Append one confirmed detection. Returns the new list. */
export function recordScan(detection, scans = loadScans()) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    className: detection.className,
    rawClass: detection.rawClass,
    category: detection.category,
    weightG: typeof detection.weightG === "number" ? detection.weightG : 0,
    confidence: detection.confidence,
  };
  const next = [...scans, entry].slice(-LIMIT);
  save(next);
  return next;
}

export function clearScans() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
  return [];
}

/** Consecutive days with at least one scan, counting back from today. */
function streakFrom(days) {
  if (!days.size) return 0;
  const cursor = new Date();
  // A streak is still alive if you scanned yesterday but not yet today.
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Derive every figure the impact UI shows from the raw log. */
export function summarise(scans) {
  const byBin = { recyclable: 0, landfill: 0, hazardous: 0, unknown: 0 };
  const byMaterial = {};
  const days = new Set();
  let points = 0;
  let grams = 0;

  for (const s of scans) {
    const bin = getBin(s.category);
    byBin[bin.id] += 1;
    points += POINTS_BY_BIN[bin.id] ?? 1;
    grams += s.weightG || 0;
    days.add(dayKey(s.at));
    const material = MATERIAL_BY_CLASS[s.rawClass];
    if (material) byMaterial[material] = (byMaterial[material] ?? 0) + 1;
  }

  // Last 7 days, oldest first - matches the weekly chart's contract.
  const weekly = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    weekly.push({
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      items: scans.filter((s) => dayKey(s.at) === key).length,
    });
  }

  const diverted = byBin.recyclable + byBin.hazardous;

  return {
    total: scans.length,
    points,
    grams: Math.round(grams),
    diverted,
    divertedPct: scans.length ? Math.round((diverted / scans.length) * 100) : 0,
    byBin,
    byMaterial,
    weekly,
    streakDays: streakFrom(days),
    recent: [...scans].reverse().slice(0, 8),
  };
}
