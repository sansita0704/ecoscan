import { request } from "./http";

/**
 * Waste collection requests, served by the Python backend and persisted
 * there as JSON so a scheduled pickup survives a restart.
 *
 * Worth being clear about what this is: it records and tracks the request.
 * There is no courier/collection-service integration behind it, so the UI
 * says a coordinator will confirm rather than implying a van is dispatched.
 */

/**
 * POST /api/v1/pickups -> the created pickup
 * @param {{name: string, phone: string, address: string, preferredDate: string,
 *   timeWindow: string, wasteTypes?: string[], notes?: string,
 *   lat?: number|null, lon?: number|null, facilityName?: string|null}} input
 * @returns {Promise<import("../types/contracts").Pickup>}
 */
export async function createPickup(input, { signal } = {}) {
  const raw = await request("/api/v1/pickups", {
    method: "POST",
    json: {
      name: input.name,
      phone: input.phone,
      address: input.address,
      preferred_date: input.preferredDate,
      time_window: input.timeWindow,
      waste_types: input.wasteTypes ?? [],
      notes: input.notes || null,
      lat: input.lat ?? null,
      lon: input.lon ?? null,
      facility_name: input.facilityName ?? null,
    },
    signal,
  });
  return toPickup(raw);
}

/**
 * GET /api/v1/pickups -> every pickup this install has scheduled, newest first
 * @returns {Promise<import("../types/contracts").Pickup[]>}
 */
export async function getPickups({ signal } = {}) {
  const raw = await request("/api/v1/pickups", { signal });
  return (raw.pickups ?? []).map(toPickup);
}

/**
 * POST /api/v1/pickups/{id}/cancel -> the cancelled pickup
 * @returns {Promise<import("../types/contracts").Pickup>}
 */
export async function cancelPickup(id, { signal } = {}) {
  return toPickup(await request(`/api/v1/pickups/${encodeURIComponent(id)}/cancel`, { method: "POST", signal }));
}

/** snake_case wire shape -> the camelCase the UI uses everywhere else. */
function toPickup(raw) {
  return {
    id: raw.id,
    status: raw.status,
    createdAt: raw.created_at,
    cancelledAt: raw.cancelled_at ?? null,
    name: raw.name,
    phone: raw.phone,
    address: raw.address,
    preferredDate: raw.preferred_date,
    timeWindow: raw.time_window,
    wasteTypes: raw.waste_types ?? [],
    notes: raw.notes ?? null,
    lat: raw.lat ?? null,
    lon: raw.lon ?? null,
    facilityName: raw.facility_name ?? null,
  };
}
