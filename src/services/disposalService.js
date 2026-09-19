import { USE_MOCK } from "../config/env";
import { request } from "./http";
import { MOCK_HUB, mockToken, wait } from "./mockData";

/**
 * POST /api/v1/disposal-tokens  { class_name, bin }  ->  { token: "ECO-..." }
 * @returns {Promise<string>}
 */
export async function createDisposalToken(detection, { signal } = {}) {
  if (USE_MOCK) {
    await wait(400, signal);
    return mockToken(detection);
  }
  const data = await request("/api/v1/disposal-tokens", {
    method: "POST",
    json: {
      class_name: detection.rawClass ?? detection.className,
      bin: detection.bin ?? detection.category,
    },
    signal,
  });
  return data.token;
}

/**
 * GET /api/v1/hubs/nearest  ->  { name, distance_km, hours, lat, lng }
 * Pass user coordinates as query params once you add geolocation.
 * @returns {Promise<import("../types/contracts").DropoffHub>}
 */
export async function getNearestHub({ signal } = {}) {
  if (USE_MOCK) {
    await wait(300, signal);
    return MOCK_HUB;
  }
  const raw = await request("/api/v1/hubs/nearest", { signal });
  return { name: raw.name, distanceKm: raw.distance_km, hours: raw.hours, lat: raw.lat, lng: raw.lng };
}
