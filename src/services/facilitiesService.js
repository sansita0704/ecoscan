import { request } from "./http";

/**
 * POST /api/facilities/nearby  { lat, lon, material?, hazardous?, limit? }
 *   -> { facilities, source, facilityNote, searchRadiusKm }
 *
 * Real drop-off points from OpenStreetMap, in the same shape the disposal
 * advice payload uses, so FacilityList renders either without a second set
 * of props. Served by the Node side (server/lib/facilitiesHandler.js), not
 * the Python model backend - no VITE_USE_MOCK branch here, because a made-up
 * list of places someone might drive to is exactly the kind of thing this
 * app never fabricates.
 *
 * @returns {Promise<{facilities: import("../types/contracts").DropoffFacility[], source: string, facilityNote: string|null, searchRadiusKm: number|null}>}
 */
export async function getNearbyFacilities({ lat, lon, material, hazardous, limit, signal } = {}) {
  const raw = await request("/api/facilities/nearby", {
    method: "POST",
    json: { lat, lon, material: material ?? null, hazardous: !!hazardous, limit: limit ?? 8 },
    signal,
  });

  return {
    facilities: raw.facilities ?? [],
    source: raw.source ?? "OpenStreetMap",
    facilityNote: raw.facilityNote ?? null,
    searchRadiusKm: raw.searchRadiusKm ?? null,
  };
}

/**
 * POST /api/facilities/geocode  { query }  ->  { results: [{label, lat, lon}] }
 *
 * Turns a typed place name into coordinates via Nominatim (OpenStreetMap's
 * geocoder), for searching a location other than "wherever the browser says
 * I am right now" - a different town, an address to double-check, or a
 * fallback when live GPS isn't cooperating.
 *
 * @returns {Promise<{label: string, lat: number, lon: number}[]>}
 */
export async function geocodeLocation(query, { signal } = {}) {
  const raw = await request("/api/facilities/geocode", {
    method: "POST",
    json: { query },
    signal,
  });
  return raw.results ?? [];
}
