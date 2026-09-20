import { findFacilities } from "./facilities.js";

/**
 * POST /api/facilities/nearby
 *
 * Standalone drop-off lookup for the Facilities page. The same
 * findFacilities() already backs the disposal-advice flow, but that path only
 * runs when the user has scanned something and asked for advice; browsing
 * "where can I take things near me" shouldn't require a scan first.
 *
 * Everything returned comes from OpenStreetMap - see facilities.js. No API key
 * is involved, and no language model is asked for places.
 */

const MAX_LIMIT = 12;
// Longer than findFacilities' own default: this is a dedicated "browse
// nearby centres" action with nothing else competing for the user's wait,
// so the widest search radius (see facilities.js RADII_M) gets a real chance
// to run instead of being cut off before it starts.
const BUDGET_MS = Number(process.env.OVERPASS_BROWSE_BUDGET_MS ?? 15000);

function badRequest(message) {
  return { status: 400, body: { error: message } };
}

export async function handleFacilities(rawBody, { signal } = {}) {
  if (!rawBody || typeof rawBody !== "object") return badRequest("Expected a JSON body");

  const lat = Number(rawBody.lat);
  const lon = Number(rawBody.lon);
  const hasCoords =
    Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  if (!hasCoords) return badRequest("`lat` and `lon` are required");

  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(rawBody.limit) || 8));
  const material = typeof rawBody.material === "string" ? rawBody.material : undefined;
  const hazardous = rawBody.hazardous === true;

  try {
    const result = await findFacilities({ lat, lon }, { material, hazardous, limit, signal, budgetMs: BUDGET_MS });
    return {
      status: 200,
      body: {
        facilities: result.facilities,
        source: result.source,
        // Same field name the advice payload uses, so FacilityList renders
        // either one without a second set of props.
        facilityNote: result.error ?? null,
        searchRadiusKm: result.searchRadiusKm ?? null,
      },
    };
  } catch (err) {
    console.error("[facilities] lookup failed:", err?.message ?? err);
    // A failed lookup is a normal outcome for a free shared service, not a
    // 500: the UI says "couldn't reach the database" and stays usable.
    return {
      status: 200,
      body: { facilities: [], source: "OpenStreetMap", facilityNote: "lookup_failed", searchRadiusKm: null },
    };
  }
}
